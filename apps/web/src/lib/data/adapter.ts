import {
  CAMPUS_SCHOOL_ID,
  type CreateMoveGroupInput,
  type CreateOrUpdateEventInput,
  type EventFilterCriteria,
  type EventRecord,
  type EventResponse,
  type EventResponseType,
  type EventView,
  type Invitation,
  type MoveGroupRecord,
  type MoveGroupView,
  type PublicEventMetadata,
  type UpdateMoveGroupInput,
  type User,
  type ViewerSession,
} from "@/types/domain";
import {
  createSeedDataset,
  SEED_USERS,
  STATIC_FALLBACK_ANCHOR_ISO,
} from "@/lib/mock/seed";
import {
  projectEventForViewer,
  projectMoveGroupForViewer,
  projectPublicEventMetadata,
} from "@/lib/permissions/policies";
import { filterEvents } from "@/lib/events-filter";

export const SESH_STORAGE_KEY = "sesh.m1.demo-store.v1";
export const SESH_SESSION_STORAGE_KEY = "sesh.m1.demo-viewer.v1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface PersistedOverlayState {
  schemaVersion: 1;
  anchorIso: string;
  nextSequence: number;
  /** Locally created or edited events keyed by ID */
  localEvents: EventRecord[];
  /** Seed event overrides when a demo host edits a seeded event */
  editedSeedEvents: Record<string, EventRecord>;
  /** Full response table (initialized from seed + local updates) */
  responses: EventResponse[];
  /** Locally created Move Groups + mutated seed Move Groups */
  moveGroups: MoveGroupRecord[];
  invitations: Invitation[];
}

export class SeshAdapterError extends Error {
  readonly code:
    | "UNAUTHENTICATED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "VALIDATION_ERROR"
    | "CONFLICT"
    | "CAPACITY_FULL";

  constructor(
    code: SeshAdapterError["code"],
    message: string
  ) {
    super(message);
    this.name = "SeshAdapterError";
    this.code = code;
  }
}

export type EventLookupResult =
  | { status: "OK"; event: EventView }
  | { status: "RESTRICTED"; reason: string }
  | { status: "NOT_FOUND" };

export type MoveGroupLookupResult =
  | { status: "OK"; group: MoveGroupView }
  | { status: "RESTRICTED"; reason: string }
  | { status: "DISBANDED" }
  | { status: "NOT_FOUND" };

/**
 * Centralized frontend data access contract for Sesh Milestone 1.
 *
 * Designed so Milestone 2+ can swap `LocalMockSeshAdapter` with an authenticated
 * REST API adapter without rewriting forms or route components.
 */
export interface SeshDataAdapter {
  listEvents(
    viewer: ViewerSession,
    criteria?: EventFilterCriteria,
    nowIso?: string
  ): EventView[];
  getEvent(eventId: string, viewer: ViewerSession): EventLookupResult;
  createEvent(
    input: CreateOrUpdateEventInput,
    viewer: ViewerSession,
    nowIso: string
  ): EventView;
  updateEvent(
    eventId: string,
    input: CreateOrUpdateEventInput,
    viewer: ViewerSession,
    nowIso: string
  ): EventView;
  listMoveGroups(viewer: ViewerSession, eventId?: string): MoveGroupView[];
  getMoveGroup(groupId: string, viewer: ViewerSession): MoveGroupLookupResult;
  createMoveGroup(
    input: CreateMoveGroupInput,
    viewer: ViewerSession,
    nowIso: string
  ): MoveGroupView;
  requestJoin(
    groupId: string,
    viewer: ViewerSession,
    options?: { note?: string; nowIso?: string }
  ): MoveGroupView;
  approveJoin(
    groupId: string,
    requestId: string,
    viewer: ViewerSession,
    nowIso?: string
  ): MoveGroupView;
  declineJoin(
    groupId: string,
    requestId: string,
    viewer: ViewerSession,
    nowIso?: string
  ): MoveGroupView;
  leaveMoveGroup(groupId: string, viewer: ViewerSession): MoveGroupView | null;
  removeMember(
    groupId: string,
    memberUserId: string,
    viewer: ViewerSession
  ): MoveGroupView;
  disbandMoveGroup(groupId: string, viewer: ViewerSession): void;
  updateMoveGroup(
    groupId: string,
    input: UpdateMoveGroupInput,
    viewer: ViewerSession,
    nowIso?: string
  ): MoveGroupView;
  getEventResponses(
    eventId: string,
    viewer: ViewerSession
  ): {
    goingCount: number;
    interestedCount: number;
    savedCount: number;
    viewerResponse: EventResponseType | null;
  };
  setEventResponse(
    eventId: string,
    response: EventResponseType | null,
    viewer: ViewerSession,
    nowIso?: string
  ): EventView;
  resetDemoData(anchorIso: string): void;
  subscribe(listener: () => void): () => void;
  getAnchorIso(): string;
}

function cloneDeep<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export class LocalMockSeshAdapter implements SeshDataAdapter {
  private storage: StorageLike | null = null;
  private state: PersistedOverlayState;
  private readonly usersById: Map<string, User>;
  private readonly listeners = new Set<() => void>();

  constructor(options?: { anchorIso?: string; storage?: StorageLike | null }) {
    const initialAnchor = options?.anchorIso ?? STATIC_FALLBACK_ANCHOR_ISO;
    this.usersById = new Map(SEED_USERS.map((u) => [u.id, u]));
    this.storage = options?.storage ?? null;
    this.state = this.loadOrCreateState(initialAnchor);
  }

  /**
   * Attaches browser `localStorage` after client mount so server-rendered code
   * never accesses browser storage.
   */
  attachBrowserStorage(storage: StorageLike, runtimeNowIso: string): void {
    this.storage = storage;
    this.state = this.loadOrCreateState(runtimeNowIso);
    this.emit();
  }

  private loadOrCreateState(anchorIso: string): PersistedOverlayState {
    if (this.storage) {
      try {
        const raw = this.storage.getItem(SESH_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PersistedOverlayState>;
          if (
            parsed.schemaVersion === 1 &&
            typeof parsed.anchorIso === "string" &&
            Array.isArray(parsed.localEvents) &&
            Array.isArray(parsed.responses) &&
            Array.isArray(parsed.moveGroups)
          ) {
            return {
              schemaVersion: 1,
              anchorIso: parsed.anchorIso,
              nextSequence: parsed.nextSequence ?? 100,
              localEvents: parsed.localEvents,
              editedSeedEvents: parsed.editedSeedEvents ?? {},
              responses: parsed.responses,
              moveGroups: parsed.moveGroups,
              invitations: parsed.invitations ?? [],
            };
          }
        }
      } catch {
        // Ignore corrupt browser demo state and fall back cleanly to seed state
      }
    }

    const seed = createSeedDataset(anchorIso);
    const fresh: PersistedOverlayState = {
      schemaVersion: 1,
      anchorIso,
      nextSequence: 100,
      localEvents: [],
      editedSeedEvents: {},
      responses: cloneDeep(seed.responses),
      moveGroups: cloneDeep(seed.moveGroups),
      invitations: cloneDeep(seed.invitations),
    };
    this.persist(fresh);
    return fresh;
  }

  private persist(nextState: PersistedOverlayState = this.state): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(SESH_STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // Ignore quota errors in private browsing modes
    }
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getAnchorIso(): string {
    return this.state.anchorIso;
  }

  private allocateId(prefix: string): string {
    this.state.nextSequence += 1;
    return `${prefix}-local-${this.state.nextSequence}`;
  }

  private getAllEventRecords(): EventRecord[] {
    const seed = createSeedDataset(this.state.anchorIso);
    const mergedSeed = seed.events.map(
      (evt) => this.state.editedSeedEvents[evt.id] ?? evt
    );
    return [...mergedSeed, ...this.state.localEvents];
  }

  private findEventRecord(eventId: string): EventRecord | undefined {
    return this.getAllEventRecords().find((e) => e.id === eventId);
  }

  private requireMember(viewer: ViewerSession, action: string): User {
    if (viewer.mode !== "MEMBER") {
      throw new SeshAdapterError(
        "UNAUTHENTICATED",
        `Switch to a Demo Member identity to ${action}.`
      );
    }
    return viewer.user;
  }

  listEvents(
    viewer: ViewerSession,
    criteria: EventFilterCriteria = {},
    nowIso?: string
  ): EventView[] {
    const effectiveNow = nowIso ?? this.state.anchorIso;
    const records = this.getAllEventRecords();

    const projected = records
      .map((event) =>
        projectEventForViewer({
          event,
          viewer,
          usersById: this.usersById,
          responses: this.state.responses,
          eventMoveGroups: this.state.moveGroups.filter(
            (g) => g.eventId === event.id
          ),
        })
      )
      .filter((v): v is EventView => Boolean(v));

    return filterEvents(projected, criteria, effectiveNow);
  }

  getEvent(eventId: string, viewer: ViewerSession): EventLookupResult {
    const record = this.findEventRecord(eventId);
    if (!record || record.status === "CANCELLED") {
      return { status: "NOT_FOUND" };
    }

    const projected = projectEventForViewer({
      event: record,
      viewer,
      usersById: this.usersById,
      responses: this.state.responses,
      eventMoveGroups: this.state.moveGroups.filter(
        (g) => g.eventId === record.id
      ),
    });

    if (!projected) {
      return {
        status: "RESTRICTED",
        reason:
          record.status === "DRAFT"
            ? "This Move is currently saved as a private draft by its host."
            : "This Move has restricted audience permissions (Friends or Invite-Only).",
      };
    }

    return { status: "OK", event: projected };
  }

  createEvent(
    input: CreateOrUpdateEventInput,
    viewer: ViewerSession,
    nowIso: string
  ): EventView {
    const user = this.requireMember(viewer, "create a Move");

    const startMs = new Date(input.startAt).getTime();
    const endMs = new Date(input.endAt).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
      throw new SeshAdapterError(
        "VALIDATION_ERROR",
        "End date/time must occur after start date/time."
      );
    }

    if (
      input.capacity !== undefined &&
      input.capacity !== null &&
      (!Number.isInteger(input.capacity) || input.capacity < 1)
    ) {
      throw new SeshAdapterError(
        "VALIDATION_ERROR",
        "Capacity must be a positive integer."
      );
    }

    const newId = this.allocateId("evt");
    const publicLoc =
      input.publicDisplayLocation?.trim() || input.venue.trim();

    const newRecord: EventRecord = {
      id: newId,
      schoolId: user.schoolId || CAMPUS_SCHOOL_ID,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      startAt: input.startAt,
      endAt: input.endAt,
      venue: input.venue.trim(),
      publicDisplayLocation: publicLoc,
      privateAddress: input.privateAddress?.trim() || undefined,
      addressPrivacy: input.addressPrivacy,
      visibility: input.visibility,
      customAllowedUserIds: input.customAllowedUserIds ?? [],
      status: input.status,
      hostId: user.id,
      coverImage: input.coverImage?.trim() || undefined,
      capacity:
        input.capacity !== undefined && input.capacity !== null
          ? input.capacity
          : undefined,
      admission: {
        isFree: input.isFree,
        priceLabel: input.isFree
          ? input.priceLabel?.trim() || "Free"
          : input.priceLabel?.trim() || "Paid entry",
        amountUsd:
          !input.isFree && input.amountUsd !== null && input.amountUsd !== undefined
            ? input.amountUsd
            : undefined,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
      source: "LOCAL_DEMO",
    };

    this.state.localEvents.push(newRecord);

    // Host automatically marks GOING when publishing a Move
    if (input.status === "PUBLISHED") {
      this.state.responses.push({
        userId: user.id,
        eventId: newId,
        response: "GOING",
        updatedAt: nowIso,
      });
    }

    this.persist();
    this.emit();

    const lookup = this.getEvent(newId, viewer);
    if (lookup.status !== "OK") {
      throw new SeshAdapterError("NOT_FOUND", "Failed to load newly created Move.");
    }
    return lookup.event;
  }

  updateEvent(
    eventId: string,
    input: CreateOrUpdateEventInput,
    viewer: ViewerSession,
    nowIso: string
  ): EventView {
    const user = this.requireMember(viewer, "edit this Move");
    const existing = this.findEventRecord(eventId);
    if (!existing) {
      throw new SeshAdapterError("NOT_FOUND", "Move not found.");
    }
    if (existing.hostId !== user.id) {
      throw new SeshAdapterError(
        "FORBIDDEN",
        "Only the host who created this Move can edit it."
      );
    }

    const startMs = new Date(input.startAt).getTime();
    const endMs = new Date(input.endAt).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
      throw new SeshAdapterError(
        "VALIDATION_ERROR",
        "End date/time must occur after start date/time."
      );
    }

    const updated: EventRecord = {
      ...existing,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      startAt: input.startAt,
      endAt: input.endAt,
      venue: input.venue.trim(),
      publicDisplayLocation:
        input.publicDisplayLocation?.trim() || input.venue.trim(),
      privateAddress: input.privateAddress?.trim() || undefined,
      addressPrivacy: input.addressPrivacy,
      visibility: input.visibility,
      customAllowedUserIds:
        input.customAllowedUserIds ?? existing.customAllowedUserIds,
      status: input.status,
      coverImage: input.coverImage?.trim() || undefined,
      capacity:
        input.capacity !== undefined && input.capacity !== null
          ? input.capacity
          : undefined,
      admission: {
        isFree: input.isFree,
        priceLabel: input.isFree
          ? input.priceLabel?.trim() || "Free"
          : input.priceLabel?.trim() || "Paid entry",
        amountUsd:
          !input.isFree && input.amountUsd !== null && input.amountUsd !== undefined
            ? input.amountUsd
            : undefined,
      },
      updatedAt: nowIso,
    };

    const localIdx = this.state.localEvents.findIndex((e) => e.id === eventId);
    if (localIdx >= 0) {
      this.state.localEvents[localIdx] = updated;
    } else {
      this.state.editedSeedEvents[eventId] = updated;
    }

    this.persist();
    this.emit();

    const lookup = this.getEvent(eventId, viewer);
    if (lookup.status !== "OK") {
      throw new SeshAdapterError("NOT_FOUND", "Failed to load updated Move.");
    }
    return lookup.event;
  }

  listMoveGroups(viewer: ViewerSession, eventId?: string): MoveGroupView[] {
    const eventsById = new Map(
      this.getAllEventRecords().map((e) => [e.id, e])
    );

    return this.state.moveGroups
      .filter((g) => !g.disbanded && (!eventId || g.eventId === eventId))
      .map((group) =>
        projectMoveGroupForViewer({
          group,
          event: eventsById.get(group.eventId),
          viewer,
          usersById: this.usersById,
        })
      )
      .filter((v): v is MoveGroupView => Boolean(v))
      .toSorted(
        (a, b) =>
          new Date(a.meetupTime).getTime() - new Date(b.meetupTime).getTime()
      );
  }

  getMoveGroup(groupId: string, viewer: ViewerSession): MoveGroupLookupResult {
    const group = this.state.moveGroups.find((g) => g.id === groupId);
    if (!group) {
      return { status: "NOT_FOUND" };
    }
    if (group.disbanded) {
      return { status: "DISBANDED" };
    }

    const event = this.findEventRecord(group.eventId);
    const projected = projectMoveGroupForViewer({
      group,
      event,
      viewer,
      usersById: this.usersById,
    });

    if (!projected) {
      return {
        status: "RESTRICTED",
        reason:
          group.discoverability === "INVITE_ONLY"
            ? "This Move Group is Invite-Only and visible only to invited or accepted members."
            : "This Move Group is visible only within the host's campus friend network.",
      };
    }

    return { status: "OK", group: projected };
  }

  createMoveGroup(
    input: CreateMoveGroupInput,
    viewer: ViewerSession,
    nowIso: string
  ): MoveGroupView {
    const user = this.requireMember(viewer, "create a Move Group");
    const event = this.findEventRecord(input.eventId);
    if (!event || event.status !== "PUBLISHED") {
      throw new SeshAdapterError(
        "NOT_FOUND",
        "Choose a published event before creating a Move Group."
      );
    }

    if (!Number.isInteger(input.capacity) || input.capacity < 2) {
      throw new SeshAdapterError(
        "VALIDATION_ERROR",
        "Move Group capacity must be at least 2."
      );
    }

    const newId = this.allocateId("mg");
    const newGroup: MoveGroupRecord = {
      id: newId,
      eventId: input.eventId,
      creatorId: user.id,
      name: input.name.trim(),
      note: input.note.trim(),
      capacity: input.capacity,
      discoverability: input.discoverability,
      joinMode: input.joinMode,
      meetupTime: input.meetupTime,
      meetupSpot: input.meetupSpot.trim(),
      externalChatLink: input.externalChatLink?.trim() || undefined,
      members: [
        {
          userId: user.id,
          role: "CREATOR",
          joinedAt: nowIso,
        },
      ],
      joinRequests: [],
      invitedUserIds: [],
      createdAt: nowIso,
      updatedAt: nowIso,
      source: "LOCAL_DEMO",
    };

    this.state.moveGroups.push(newGroup);

    // Ensure creator is also marked GOING on the parent event
    const existingRespIdx = this.state.responses.findIndex(
      (r) => r.eventId === input.eventId && r.userId === user.id
    );
    if (existingRespIdx >= 0) {
      this.state.responses[existingRespIdx] = {
        userId: user.id,
        eventId: input.eventId,
        response: "GOING",
        updatedAt: nowIso,
      };
    } else {
      this.state.responses.push({
        userId: user.id,
        eventId: input.eventId,
        response: "GOING",
        updatedAt: nowIso,
      });
    }

    this.persist();
    this.emit();

    const lookup = this.getMoveGroup(newId, viewer);
    if (lookup.status !== "OK") {
      throw new SeshAdapterError("NOT_FOUND", "Failed to load created Move Group.");
    }
    return lookup.group;
  }

  requestJoin(
    groupId: string,
    viewer: ViewerSession,
    options?: { note?: string; nowIso?: string }
  ): MoveGroupView {
    const user = this.requireMember(viewer, "join or request a Move Group");
    const nowIso = options?.nowIso ?? this.state.anchorIso;

    const group = this.state.moveGroups.find(
      (g) => g.id === groupId && !g.disbanded
    );
    if (!group) {
      throw new SeshAdapterError("NOT_FOUND", "Move Group not found.");
    }

    // Prevent duplicate membership
    if (group.members.some((m) => m.userId === user.id)) {
      throw new SeshAdapterError(
        "CONFLICT",
        "You are already a member of this Move Group."
      );
    }

    // Prevent duplicate pending request
    if (
      group.joinRequests.some(
        (r) => r.userId === user.id && r.status === "PENDING"
      )
    ) {
      throw new SeshAdapterError(
        "CONFLICT",
        "You already have a pending join request for this Move Group."
      );
    }

    // Block re-requesting after decline
    if (
      group.joinRequests.some(
        (r) => r.userId === user.id && r.status === "DECLINED"
      )
    ) {
      throw new SeshAdapterError(
        "FORBIDDEN",
        "Your previous request to join this Move Group was declined."
      );
    }

    // Enforce invite-only restriction
    if (
      group.joinMode === "INVITE_ONLY" &&
      !group.invitedUserIds?.includes(user.id)
    ) {
      throw new SeshAdapterError(
        "FORBIDDEN",
        "This Move Group is Invite-Only."
      );
    }

    // Enforce group capacity
    if (group.members.length >= group.capacity) {
      throw new SeshAdapterError(
        "CAPACITY_FULL",
        "This Move Group has reached its maximum capacity."
      );
    }

    if (group.joinMode === "OPEN_JOIN") {
      group.members.push({
        userId: user.id,
        role: "MEMBER",
        joinedAt: nowIso,
      });
    } else {
      group.joinRequests.push({
        id: this.allocateId("jr"),
        userId: user.id,
        status: "PENDING",
        note: options?.note?.trim() || undefined,
        createdAt: nowIso,
      });
    }

    group.updatedAt = nowIso;
    this.persist();
    this.emit();

    const lookup = this.getMoveGroup(groupId, viewer);
    if (lookup.status !== "OK") {
      throw new SeshAdapterError("FORBIDDEN", "Unable to view Move Group.");
    }
    return lookup.group;
  }

  approveJoin(
    groupId: string,
    requestId: string,
    viewer: ViewerSession,
    nowIso?: string
  ): MoveGroupView {
    const user = this.requireMember(viewer, "manage join requests");
    const effectiveNow = nowIso ?? this.state.anchorIso;

    const group = this.state.moveGroups.find(
      (g) => g.id === groupId && !g.disbanded
    );
    if (!group) {
      throw new SeshAdapterError("NOT_FOUND", "Move Group not found.");
    }
    if (group.creatorId !== user.id) {
      throw new SeshAdapterError(
        "FORBIDDEN",
        "Only the Move Group creator can approve join requests."
      );
    }

    const request = group.joinRequests.find((r) => r.id === requestId);
    if (!request || request.status !== "PENDING") {
      throw new SeshAdapterError(
        "NOT_FOUND",
        "Pending join request not found."
      );
    }

    if (group.members.length >= group.capacity) {
      throw new SeshAdapterError(
        "CAPACITY_FULL",
        "Cannot approve — this Move Group is already at full capacity."
      );
    }

    request.status = "APPROVED";
    request.decidedAt = effectiveNow;

    if (!group.members.some((m) => m.userId === request.userId)) {
      group.members.push({
        userId: request.userId,
        role: "MEMBER",
        joinedAt: effectiveNow,
      });
    }

    group.updatedAt = effectiveNow;
    this.persist();
    this.emit();

    const lookup = this.getMoveGroup(groupId, viewer);
    if (lookup.status !== "OK") {
      throw new SeshAdapterError("NOT_FOUND", "Move Group unavailable.");
    }
    return lookup.group;
  }

  declineJoin(
    groupId: string,
    requestId: string,
    viewer: ViewerSession,
    nowIso?: string
  ): MoveGroupView {
    const user = this.requireMember(viewer, "manage join requests");
    const effectiveNow = nowIso ?? this.state.anchorIso;

    const group = this.state.moveGroups.find(
      (g) => g.id === groupId && !g.disbanded
    );
    if (!group) {
      throw new SeshAdapterError("NOT_FOUND", "Move Group not found.");
    }
    if (group.creatorId !== user.id) {
      throw new SeshAdapterError(
        "FORBIDDEN",
        "Only the Move Group creator can decline join requests."
      );
    }

    const request = group.joinRequests.find((r) => r.id === requestId);
    if (!request || request.status !== "PENDING") {
      throw new SeshAdapterError(
        "NOT_FOUND",
        "Pending join request not found."
      );
    }

    request.status = "DECLINED";
    request.decidedAt = effectiveNow;
    group.updatedAt = effectiveNow;

    this.persist();
    this.emit();

    const lookup = this.getMoveGroup(groupId, viewer);
    if (lookup.status !== "OK") {
      throw new SeshAdapterError("NOT_FOUND", "Move Group unavailable.");
    }
    return lookup.group;
  }

  leaveMoveGroup(
    groupId: string,
    viewer: ViewerSession
  ): MoveGroupView | null {
    const user = this.requireMember(viewer, "leave a Move Group");
    const group = this.state.moveGroups.find(
      (g) => g.id === groupId && !g.disbanded
    );
    if (!group) {
      throw new SeshAdapterError("NOT_FOUND", "Move Group not found.");
    }
    if (group.creatorId === user.id) {
      throw new SeshAdapterError(
        "VALIDATION_ERROR",
        "As the creator, disband the group from Manage Group instead of leaving."
      );
    }

    const beforeCount = group.members.length;
    group.members = group.members.filter((m) => m.userId !== user.id);
    if (group.members.length === beforeCount) {
      throw new SeshAdapterError(
        "NOT_FOUND",
        "You are not currently a member of this Move Group."
      );
    }

    // Clear prior approved request records so member could request again if permitted
    group.joinRequests = group.joinRequests.filter(
      (r) => !(r.userId === user.id && r.status === "APPROVED")
    );

    this.persist();
    this.emit();

    const lookup = this.getMoveGroup(groupId, viewer);
    return lookup.status === "OK" ? lookup.group : null;
  }

  removeMember(
    groupId: string,
    memberUserId: string,
    viewer: ViewerSession
  ): MoveGroupView {
    const user = this.requireMember(viewer, "remove a member");
    const group = this.state.moveGroups.find(
      (g) => g.id === groupId && !g.disbanded
    );
    if (!group) {
      throw new SeshAdapterError("NOT_FOUND", "Move Group not found.");
    }
    if (group.creatorId !== user.id) {
      throw new SeshAdapterError(
        "FORBIDDEN",
        "Only the Move Group creator can remove members."
      );
    }
    if (memberUserId === group.creatorId) {
      throw new SeshAdapterError(
        "VALIDATION_ERROR",
        "The Move Group creator cannot remove themselves."
      );
    }

    group.members = group.members.filter((m) => m.userId !== memberUserId);
    group.joinRequests = group.joinRequests.filter(
      (r) => !(r.userId === memberUserId && r.status === "APPROVED")
    );

    this.persist();
    this.emit();

    const lookup = this.getMoveGroup(groupId, viewer);
    if (lookup.status !== "OK") {
      throw new SeshAdapterError("NOT_FOUND", "Move Group unavailable.");
    }
    return lookup.group;
  }

  disbandMoveGroup(groupId: string, viewer: ViewerSession): void {
    const user = this.requireMember(viewer, "disband this Move Group");
    const group = this.state.moveGroups.find(
      (g) => g.id === groupId && !g.disbanded
    );
    if (!group) {
      throw new SeshAdapterError("NOT_FOUND", "Move Group not found.");
    }
    if (group.creatorId !== user.id) {
      throw new SeshAdapterError(
        "FORBIDDEN",
        "Only the Move Group creator can disband the group."
      );
    }

    group.disbanded = true;
    this.persist();
    this.emit();
  }

  updateMoveGroup(
    groupId: string,
    input: UpdateMoveGroupInput,
    viewer: ViewerSession,
    nowIso?: string
  ): MoveGroupView {
    const user = this.requireMember(viewer, "update Move Group settings");
    const group = this.state.moveGroups.find(
      (g) => g.id === groupId && !g.disbanded
    );
    if (!group) {
      throw new SeshAdapterError("NOT_FOUND", "Move Group not found.");
    }
    if (group.creatorId !== user.id) {
      throw new SeshAdapterError(
        "FORBIDDEN",
        "Only the Move Group creator can edit group settings."
      );
    }
    if (input.capacity < group.members.length) {
      throw new SeshAdapterError(
        "VALIDATION_ERROR",
        `Capacity cannot be smaller than current member count (${group.members.length}).`
      );
    }

    group.name = input.name.trim();
    group.note = input.note.trim();
    group.capacity = input.capacity;
    group.discoverability = input.discoverability;
    group.joinMode = input.joinMode;
    group.meetupTime = input.meetupTime;
    group.meetupSpot = input.meetupSpot.trim();
    group.externalChatLink = input.externalChatLink?.trim() || undefined;
    group.updatedAt = nowIso ?? this.state.anchorIso;

    this.persist();
    this.emit();

    const lookup = this.getMoveGroup(groupId, viewer);
    if (lookup.status !== "OK") {
      throw new SeshAdapterError("NOT_FOUND", "Move Group unavailable.");
    }
    return lookup.group;
  }

  getEventResponses(
    eventId: string,
    viewer: ViewerSession
  ): {
    goingCount: number;
    interestedCount: number;
    savedCount: number;
    viewerResponse: EventResponseType | null;
  } {
    const eventResponses = this.state.responses.filter(
      (r) => r.eventId === eventId
    );
    const viewerId = viewer.mode === "MEMBER" ? viewer.user.id : null;
    const viewerRow = viewerId
      ? eventResponses.find((r) => r.userId === viewerId)
      : undefined;

    return {
      goingCount: eventResponses.filter((r) => r.response === "GOING").length,
      interestedCount: eventResponses.filter((r) => r.response === "INTERESTED")
        .length,
      savedCount: eventResponses.filter((r) => r.response === "SAVED").length,
      viewerResponse: viewerRow?.response ?? null,
    };
  }

  setEventResponse(
    eventId: string,
    response: EventResponseType | null,
    viewer: ViewerSession,
    nowIso?: string
  ): EventView {
    const user = this.requireMember(viewer, "RSVP or save an event");
    const effectiveNow = nowIso ?? this.state.anchorIso;

    const record = this.findEventRecord(eventId);
    if (!record) {
      throw new SeshAdapterError("NOT_FOUND", "Event not found.");
    }

    const idx = this.state.responses.findIndex(
      (r) => r.eventId === eventId && r.userId === user.id
    );

    if (response === null) {
      if (idx >= 0) {
        this.state.responses.splice(idx, 1);
      }
    } else if (idx >= 0) {
      this.state.responses[idx] = {
        userId: user.id,
        eventId,
        response,
        updatedAt: effectiveNow,
      };
    } else {
      this.state.responses.push({
        userId: user.id,
        eventId,
        response,
        updatedAt: effectiveNow,
      });
    }

    this.persist();
    this.emit();

    const lookup = this.getEvent(eventId, viewer);
    if (lookup.status !== "OK") {
      throw new SeshAdapterError("FORBIDDEN", "Event is restricted.");
    }
    return lookup.event;
  }

  resetDemoData(anchorIso: string): void {
    if (this.storage) {
      this.storage.removeItem(SESH_STORAGE_KEY);
    }
    this.state = this.loadOrCreateState(anchorIso);
    this.emit();
  }
}

/**
 * Pure server-safe lookup of public seed metadata for OpenGraph / `<head>` tags.
 * Never accesses browser storage and never exposes restricted events or private addresses.
 */
export function getServerSafePublicEventMetadata(
  eventId: string,
  anchorIso: string = STATIC_FALLBACK_ANCHOR_ISO
): PublicEventMetadata | null {
  const seed = createSeedDataset(anchorIso);
  const record = seed.events.find((e) => e.id === eventId);
  return projectPublicEventMetadata(record);
}
