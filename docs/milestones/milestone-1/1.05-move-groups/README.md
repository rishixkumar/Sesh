[Root README](../../../../README.md) · [Milestone 1 Index](../README.md)

---

# Milestone 1 · Agent 05 (`1.05` — Move Groups) Technical Reference & Sub-Iteration Manual

```ts
/**
 * @module       @sesh/web/move-groups
 * @milestone    Milestone 1 — Frontend Prototype & Viewer-Safe Adapter Architecture
 * @agent        Feature Agent 05 ("Move Groups") — Workstream 1.05
 * @iterations   1.05.1 · 1.05.2 · 1.05.3 · 1.05.4
 * @owner        apps/web/src/app/move-groups/** & apps/web/src/components/move-groups/**
 * @status       COMPLETE — TypeScript (tsc --noEmit) & ESLint + React Compiler Clean (0 errors, 0 warnings)
 * @runtime      Next.js 16.4.6 (App Router, cacheComponents: true, partialPrefetching: true) · React 19.3.0
 * @timezone     America/New_York (Georgia Tech & Midtown Atlanta wall-clock projection)
 * @see          apps/web/src/types/domain.ts
 * @see          apps/web/src/lib/permissions/policies.ts
 * @see          apps/web/src/lib/data/adapter.ts
 * @see          apps/web/src/lib/validation/schemas.ts
 */
```

---

## Table of Contents

1. [Module Scope & Strict File Ownership Manifest](#1-module-scope--strict-file-ownership-manifest)
2. [Move Group Architecture, Membership State Machine & Roster-Masking Specification](#2-move-group-architecture-membership-state-machine--roster-masking-specification)
   - [2.1 Two-Tier Event + Crew Coordination Model](#21-two-tier-event--crew-coordination-model)
   - [2.2 Lookup & Authorization Resolution Pipeline](#22-lookup--authorization-resolution-pipeline)
   - [2.3 Viewer Relation & Membership Finite State Machine](#23-viewer-relation--membership-finite-state-machine)
   - [2.4 Critical Roster-Masking Mathematical & Privacy Specification](#24-critical-roster-masking-mathematical--privacy-specification)
   - [2.5 Members-Only External Chat Link & Parent Address Unlock Coupling](#25-members-only-external-chat-link--parent-address-unlock-coupling)
3. [Detailed Sub-Iteration Changelogs (`1.05.1` – `1.05.4`)](#3-detailed-sub-iteration-changelogs-1051--1054)
   - [3.1 Sub-Iteration `1.05.1` — Domain, Adapter & UI Scaffolding](#31-sub-iteration-1051--domain-adapter--ui-scaffolding)
   - [3.2 Sub-Iteration `1.05.2` — Static Analysis & React Compiler Hardening](#32-sub-iteration-1052--static-analysis--react-compiler-hardening)
   - [3.3 Sub-Iteration `1.05.3` — Next.js 16 Cache Components `<Suspense>` Isolation & Hydration Audit](#33-sub-iteration-1053--nextjs-16-cache-components-suspense-isolation--hydration-audit)
   - [3.4 Sub-Iteration `1.05.4` — Cross-Feature Route Alignment (`/events/new`)](#34-sub-iteration-1054--cross-feature-route-alignment-eventsnew)
4. [Full TSDoc / Javadoc-Style API & Component Reference](#4-full-tsdoc--javadoc-style-api--component-reference)
   - [4.1 Route Entrypoints (`src/app/move-groups/**`)](#41-route-entrypoints-srcappmove-groups)
   - [4.2 Feature Components (`src/components/move-groups/**`)](#42-feature-components-srccomponentsmove-groups)
   - [4.3 Shared Policy & Adapter Projection Contracts Consumed](#43-shared-policy--adapter-projection-contracts-consumed)
5. [Regression, Security & Error-Checking Matrix](#5-regression-security--error-checking-matrix)
   - [5.1 Privacy & Projection Invariants (`MG-PRIV-*`)](#51-privacy--projection-invariants-mg-priv-)
   - [5.2 Capacity & Membership State Invariants (`MG-CAP-*` & `MG-MEM-*`)](#52-capacity--membership-state-invariants-mg-cap---mg-mem-)
   - [5.3 Owner-Only Access & Next.js 16 Runtime Invariants (`MG-OWN-*` & `MG-NXT-*`)](#53-owner-only-access--nextjs-16-runtime-invariants-mg-own---mg-nxt-)
   - [5.4 Milestone 4 & Milestone 6 Server-Side Migration Checklist](#54-milestone-4--milestone-6-server-side-migration-checklist)

---

## 1. Module Scope & Strict File Ownership Manifest

In Sesh, **Move Groups** are event-attached student crews (2–50 students) that coordinate pre-meetup rally points, MARTA transit walk-overs, rideshare splits, and group walk-ins for a parent campus **Move** (`EventRecord`).

Workstream `1.05` owns **10 files** across Next.js App Router pages and client coordination components, consuming shared domain contracts (`domain.ts`), Zod 4 form schemas (`schemas.ts`), viewer-safe projection policies (`policies.ts`), and the local overlay store (`LocalMockSeshAdapter` in `adapter.ts`) without mutating any shared library files.

| # | File Path (`apps/web/...`) | Layer | Primary Export(s) | Responsibility |
| :- | :--- | :--- | :--- | :--- |
| 1 | `src/app/move-groups/new/page.tsx` | Server Route | `NewMoveGroupPage`, `metadata` | `/move-groups/new?event=ID` route shell with `<Suspense>` boundary around `useSearchParams()` |
| 2 | `src/app/move-groups/[id]/page.tsx` | Server Route | `MoveGroupDetailPage`, `metadata` | `/move-groups/[id]` route shell isolating `await params` inside an async `<Suspense>` child |
| 3 | `src/app/move-groups/[id]/not-found.tsx` | Server Route | `MoveGroupNotFound` | Segment-level 404 UI boundary with recovery CTAs back to Campus Hub and `/move-groups/new` |
| 4 | `src/app/move-groups/[id]/manage/page.tsx` | Server Route | `MoveGroupManagePage`, `metadata` | `/move-groups/[id]/manage` host dashboard shell isolating `await params` inside `<Suspense>` |
| 5 | `src/components/move-groups/move-group-card.tsx` | Client UI | `MoveGroupCard`, `DISCOVERABILITY_META`, `JOIN_MODE_META`, `VIEWER_RELATION_META` | Reusable summary card for Event Detail & Hub surfaces + canonical enum display metadata |
| 6 | `src/components/move-groups/create-move-group-form.tsx` | Client UI | `CreateMoveGroupForm` | Guest-guarded RHF + Zod creation form with `?event=ID` prefill and `-30m` meetup time default |
| 7 | `src/components/move-groups/move-group-detail-view.tsx` | Client UI | `MoveGroupDetailView` | Full Move Group coordination view, status gates, join/request/leave flows, and locked/unlocked chat card |
| 8 | `src/components/move-groups/move-group-roster.tsx` | Client UI | `MoveGroupRoster` | Privacy-preserving crew roster rendering creator, friend-badged visible members, and masked anonymous count |
| 9 | `src/components/move-groups/move-group-invite-dialog.tsx` | Client UI | `MoveGroupInviteDialog` | Direct link copier + explicit Milestone 1 non-cryptographic `Invitation` token service preview |
| 10 | `src/components/move-groups/move-group-manage-view.tsx` | Client UI | `MoveGroupManageView` | Strict Owner-Only host console: request approvals/declines, member removal, settings editor, and disband |

---

## 2. Move Group Architecture, Membership State Machine & Roster-Masking Specification

### 2.1 Two-Tier Event + Crew Coordination Model

Every `MoveGroupRecord` belongs to exactly one parent `EventRecord` (`group.eventId === event.id`) and enforces hierarchical visibility:

1. **Parent Event Gate (`canViewEvent`)**: A viewer cannot view a Move Group unless they are first authorized to view its parent event. If an event is `CANCELLED`, `DRAFT` (not owned by viewer), `FRIENDS` (viewer outside host's friend graph), or `INVITE_ONLY`/`CUSTOM` (viewer not in `customAllowedUserIds`), `canViewMoveGroup` immediately returns `false`.
2. **Group Discoverability Gate (`canViewMoveGroup`)**:
   - **Creator & Accepted Members** (`CREATOR` | `MEMBER`) always pass visibility regardless of discoverability changes.
   - `PUBLIC`: Visible to any viewer who can view the parent event (including `GUEST` sessions on `PUBLIC` events).
   - `MY_NETWORK`: Visible only to signed-in `MEMBER` sessions who are friends with `group.creatorId` OR friends with at least one current member in `group.members`.
   - `INVITE_ONLY`: Visible only to signed-in `MEMBER` sessions listed in `group.invitedUserIds` or who have a record in `group.joinRequests`.

When `adapter.createMoveGroup` executes, it atomically:
- Allocates `mg-local-${nextSequence}` and inserts the creator into `group.members` with `role: "CREATOR"`.
- Upserts `{ userId: creator.id, eventId: input.eventId, response: "GOING" }` in `state.responses` so hosting a crew guarantees an active `GOING` RSVP on the parent event.

### 2.2 Lookup & Authorization Resolution Pipeline

`adapter.getMoveGroup(groupId, viewer)` returns a discriminated union (`MoveGroupLookupResult`) that `MoveGroupDetailView` and `MoveGroupManageView` exhaustively handle **after** `isHydrated === true`:

```
adapter.getMoveGroup(groupId, viewer)
  │
  ├─► !group                                    ──► { status: "NOT_FOUND" }
  ├─► group.disbanded === true                  ──► { status: "DISBANDED" }
  ├─► !projectMoveGroupForViewer(group, viewer) ──► { status: "RESTRICTED", reason }
  └─► projected MoveGroupView                   ──► { status: "OK", group: MoveGroupView }
```

Crucially, when `{ status: "RESTRICTED", reason }` is returned, **zero fields** of `MoveGroupRecord` (no `name`, no `meetupSpot`, no `meetupTime`, no `creator`, no `members`, no `externalChatLink`) cross the adapter boundary into React props or fiber state.

### 2.3 Viewer Relation & Membership Finite State Machine

For any viewer permitted to see a Move Group, `getViewerMoveGroupRelation(group, viewer)` resolves one of five mutually exclusive states (`ViewerMoveGroupRelation`):

```
                      ┌─────────────────────────────────────────┐
                      │                 NONE                    │
                      │ (Guest or non-member with no requests)  │
                      └───────────┬─────────────────┬───────────┘
                                  │                 │
         joinMode === "OPEN_JOIN" │                 │ joinMode === "REQUEST_TO_JOIN"
           adapter.requestJoin()  │                 │   adapter.requestJoin({ note })
                                  ▼                 ▼
                      ┌───────────────────┐ ┌───────────────────┐
   adapter.removeMember│      MEMBER       │ │  PENDING_REQUEST  │
   or leaveMoveGroup() │ (Accepted Member) │◄┤ (Awaiting Host)   │
        ┌─────────────┤                   │ └─────────┬─────────┘
        │             └───────────────────┘           │
        │                 ▲                           │ adapter.declineJoin()
        ▼                 │ adapter.approveJoin()     ▼
   (Clears prior          └─────────────────┐ ┌───────────────────┐
    APPROVED req;                           │ │ DECLINED_REQUEST  │
    returns to NONE)                        │ │ (Terminal Block)  │
                                            │ └───────────────────┘
   ┌────────────────────────────────────────┴───────────────────┐
   │ CREATOR (Host; immutable role; cannot leave, only disband) │
   └────────────────────────────────────────────────────────────┘
```

#### Key State Transition & Re-Join Rules
- **Open Join (`OPEN_JOIN`)**: Calling `adapter.requestJoin(groupId, viewer, { nowIso })` bypasses `joinRequests` and appends `{ userId, role: "MEMBER", joinedAt: nowIso }` directly to `group.members`, transitioning `NONE -> MEMBER` in one synchronous step.
- **Request to Join (`REQUEST_TO_JOIN`)**: Appends `{ id: "jr-local-...", userId, status: "PENDING", note, createdAt: nowIso }` to `group.joinRequests`, transitioning `NONE -> PENDING_REQUEST`.
- **Declined Terminal Guard (`DECLINED_REQUEST`)**: If `group.joinRequests` contains a `DECLINED` entry for `viewer.user.id`, `canRequestOrJoin` is `false` (`joinBlockedReason: "Your previous request for this Move Group was declined."`) and `adapter.requestJoin` throws `SeshAdapterError("FORBIDDEN", ...)`.
- **Voluntary Leave (`MEMBER -> NONE`)**: `adapter.leaveMoveGroup` removes the user from `group.members` **and** purges prior `status === "APPROVED"` join request records for that user so they are cleanly restored to `NONE` and may re-join/re-request later if spots remain.
- **Creator Immobility (`CREATOR`)**: Creators cannot call `leaveMoveGroup` (`VALIDATION_ERROR`); instead, they manage the lifecycle via `disbandMoveGroup` (`group.disbanded = true`).

### 2.4 Critical Roster-Masking Mathematical & Privacy Specification

Move Group rosters implement Sesh's signature campus privacy guarantee via `projectMoveGroupRoster` (`src/lib/permissions/policies.ts`) and `MoveGroupRoster` (`src/components/move-groups/move-group-roster.tsx`).

Let:
- \( M \) be the set of all accepted member records in `group.members`, with creator \( c \in M \) (`c.userId === group.creatorId`).
- \( M_{\text{other}} = M \setminus \{c\} \) be all non-creator accepted members.
- \( F(v) \subseteq U \) be the set of friend user IDs of viewer \( v \) (\( F(v) = \emptyset \) when `viewer.mode === "GUEST"`).
- \( \text{isAccepted}(v) \iff \text{relation}(v) \in \{\text{"CREATOR"}, \text{"MEMBER"}\} \).

Then `projectMoveGroupRoster` partitions \( M_{\text{other}} \) into two disjoint subsets:
1. **Visible Projected Identities** (`visibleMembers: MaskedMemberEntry[]`):
   \[
   V(v) = \begin{cases}
   \{ u \in M_{\text{other}} \mid u \text{ resolves in } \text{usersById} \} & \text{if } \text{isAccepted}(v) \\
   \{ u \in M_{\text{other}} \mid u.\text{userId} \in F(v) \} & \text{if } \neg\text{isAccepted}(v)
   \end{cases}
   \]
2. **Anonymous Masked Count** (`anonymousMemberCount: number`):
   \[
   A(v) = |M_{\text{other}}| - |V(v)|
   \]

#### Exact Partition Invariant
For **every** `MoveGroupRosterProjection` instance across all viewer modes (`GUEST`, non-friend `MEMBER`, friend `MEMBER`, `CREATOR`, accepted `MEMBER`):

\[
\mathtt{roster.totalMemberCount} \equiv 1 + \mathtt{roster.visibleMembers.length} + \mathtt{roster.anonymousMemberCount}
\]

| Viewer Persona (Example on Seed Group `mg-indie-beltline-walk`: Host Chloe + Members Jordan & Tyler) | `isFullRosterVisible` | `creator` Shown | `visibleMembers` Payload | `anonymousMemberCount` | `totalMemberCount` |
| :--- | :---: | :--- | :--- | :---: | :---: |
| **Guest Visitor** (`mode: "GUEST"`) | `false` | Chloe Kim (`Host / Creator`) | `[]` (zero member objects) | `2` (`+2 other student members`) | `1 + 0 + 2 = 3` |
| **Maya Patel** (Friend of Jordan; NOT friend of Chloe or Tyler) | `false` | Chloe Kim (`Host / Creator`) | `[Jordan Brooks (isFriend: true)]` | `1` (`+1 other student member`) | `1 + 1 + 1 = 3` |
| **Priya Nair** (Friend of Jordan; NOT friend of Tyler) | `false` | Chloe Kim (`Host / Creator`) | `[Jordan Brooks (isFriend: true)]` | `1` (`+1 other student member`) | `1 + 1 + 1 = 3` |
| **Tyler Nguyen** (`MEMBER` of group) | `true` | Chloe Kim (`Host / Creator`) | `[Jordan Brooks, Tyler Nguyen]` | `0` (no masked row) | `1 + 2 + 0 = 3` |
| **Chloe Kim** (`CREATOR` of group) | `true` | Chloe Kim (`Host / Creator`) | `[Jordan Brooks, Tyler Nguyen]` | `0` (no masked row) | `1 + 2 + 0 = 3` |

**Zero-Leakage Guarantee**: Hidden members are never filtered in CSS or hidden in React component logic. `MoveGroupRosterProjection` omits their `id`, `displayName`, `username`, `avatar`, and `graduationYear` prior to returning `MoveGroupView`.

### 2.5 Members-Only External Chat Link & Parent Address Unlock Coupling

1. **External Coordination Chat Link (`externalChatLink`)**:
   - Stored on `MoveGroupRecord.externalChatLink` (optional `http:`/`https:` URL validated by `optionalHttpUrlSchema`).
   - Projected onto `MoveGroupView` as two distinct fields:
     - `hasExternalChatLink: boolean` (`Boolean(group.externalChatLink)`) — safe boolean flag for locked teasers.
     - `unlockedExternalChatLink?: string` (`isAcceptedMember ? group.externalChatLink : undefined`) — populated **exclusively** when `viewerRelation === "CREATOR" || viewerRelation === "MEMBER"`.
   - `MoveGroupDetailView` renders a green `"Group Chat Link (Members Only)"` card with external anchor + one-click clipboard copy when `unlockedExternalChatLink` is defined, or a dashed lock card (`"External group chat link unlocks once you're an accepted member"`) when `hasExternalChatLink && !unlockedExternalChatLink`.
2. **Parent Event Private Address Unlock (`canViewPrivateAddress`)**:
   - Joining or being approved into an active Move Group sets `viewerInApprovedMoveGroup = true` in `projectEventForViewer`, automatically unlocking `privateAddress` on parent events configured with `RSVP_GOING_ONLY` or `APPROVED_GROUP_OR_HOST` (such as seed event `evt-inman-supper-club`).

---

## 3. Detailed Sub-Iteration Changelogs (`1.05.1` – `1.05.4`)

### 3.1 Sub-Iteration `1.05.1` — Domain, Adapter & UI Scaffolding

#### Objective
Audit all upstream domain, validation, date, permission, and adapter modules, then scaffold all 10 Move Group routes and client components with full support for crew creation, privacy-masked detail views, non-cryptographic invite previews, and owner-only management controls.

#### Files Touched
- Created `apps/web/src/components/move-groups/move-group-card.tsx`
- Created `apps/web/src/components/move-groups/move-group-roster.tsx`
- Created `apps/web/src/components/move-groups/move-group-invite-dialog.tsx`
- Created `apps/web/src/components/move-groups/create-move-group-form.tsx`
- Created `apps/web/src/components/move-groups/move-group-detail-view.tsx`
- Created `apps/web/src/components/move-groups/move-group-manage-view.tsx`
- Created `apps/web/src/app/move-groups/new/page.tsx`
- Created `apps/web/src/app/move-groups/[id]/page.tsx`
- Created `apps/web/src/app/move-groups/[id]/not-found.tsx`
- Created `apps/web/src/app/move-groups/[id]/manage/page.tsx`

#### Design & Privacy Rationale
- **Centralized Enum Presentation Metadata**: Exported `DISCOVERABILITY_META`, `JOIN_MODE_META`, and `VIEWER_RELATION_META` from `move-group-card.tsx` so cards, detail headers, invite dialogs, creation forms, and management forms never drift in badge copy or policy descriptions.
- **Default `-30m` Meetup Calculation in America/New_York**: Implemented `computeDefaultMeetupLocal(eventStartIso)` in `create-move-group-form.tsx` to subtract `30 * 60 * 1000` ms from the chosen event's UTC `startAt` and format it via `utcIsoToNyLocalInput` for `<input type="datetime-local" />`. When a user switches events in `<Select>`, the meetup input auto-updates unless the user has manually dirtied `meetupTimeLocal`.
- **Clean `NaN`-Safe Numeric Binding for `capacity`**: HTML `<input type="number" />` emits strings and `""` when cleared. Wrapped `capacity` in `<Controller>` mapping `"" -> Number.NaN` and `Number(e.target.value)` so Zod 4's `z.number({ message: "Capacity must be a positive whole number." }).int().min(2).max(50)` validates cleanly without string coercion bugs.
- **Honest Prototype Invite Preview**: Built `MoveGroupInviteDialog` with an explicit amber `Prototype Invite Preview (Non-Cryptographic)` callout inspecting `Target Type: MOVE_GROUP`, `Permission: JOIN`, and `Token Status: Unbacked preview — awaiting backend token service` so unbacked URLs are never misrepresented as cryptographically signed tokens.

#### Key Implementation Excerpt (`computeDefaultMeetupLocal` & Event Select Sync)
```tsx
function computeDefaultMeetupLocal(eventStartIso: string): string {
  const startMs = Date.parse(eventStartIso);
  if (Number.isNaN(startMs)) return "";
  const thirtyMinutesBeforeIso = new Date(startMs - 30 * 60 * 1000).toISOString();
  return utcIsoToNyLocalInput(thirtyMinutesBeforeIso);
}

// Inside AuthenticatedCreateMoveGroupForm <Controller name="eventId">:
<Select
  value={field.value}
  onValueChange={(nextEventId) => {
    field.onChange(nextEventId);
    const chosen = publishedEvents.find((e) => e.id === nextEventId);
    if (
      chosen &&
      (!form.formState.dirtyFields.meetupTimeLocal ||
        !form.getValues("meetupTimeLocal"))
    ) {
      form.setValue(
        "meetupTimeLocal",
        computeDefaultMeetupLocal(chosen.startAt),
        { shouldValidate: true }
      );
    }
  }}
>
```

#### Edge Cases Solved & Error-Check Notes
- **Restricted Preselected Event Handling**: If `/move-groups/new?event=evt-friends-rooftop-sesh` is opened for a published event that might be filtered out of default time windows (e.g., an event that just started or has custom visibility), `AuthenticatedCreateMoveGroupForm` falls back to `adapter.getEvent(preselectedEventId, viewer)` and prepends `lookup.event` if `lookup.status === "OK" && lookup.event.status === "PUBLISHED"`.
- **`SeshAdapterError` Capacity & Validation Mapping**: In `MoveGroupManageView`, if a host attempts to shrink `capacity` below `group.roster.totalMemberCount` (or approves a pending request when `group.isFull` is true), `SeshAdapterError` (`VALIDATION_ERROR` or `CAPACITY_FULL`) is caught, surfaced via `toast.error(err.message)`, and attached to `form.setError("capacity", ...)` when applicable.

---

### 3.2 Sub-Iteration `1.05.2` — Static Analysis & React Compiler Hardening

#### Objective
Run `npx tsc --noEmit` and `npx eslint src/app/move-groups src/components/move-groups` under Next.js 16.4.6 + React 19's strict ESLint rules (`react-hooks/incompatible-library`, `react-hooks/set-state-in-effect`, `react-hooks/exhaustive-deps`) and eliminate every error and warning.

#### Files Touched
- Modified `apps/web/src/components/move-groups/move-group-invite-dialog.tsx`
- Modified `apps/web/src/components/move-groups/create-move-group-form.tsx`
- Modified `apps/web/src/components/move-groups/move-group-detail-view.tsx`
- Modified `apps/web/src/components/move-groups/move-group-manage-view.tsx`

#### Design & Compiler Rationale
1. **Eliminating `react-hooks/set-state-in-effect` in `MoveGroupInviteDialog`**:
   - *Initial Defect*: Reading `window.location.origin` inside `useEffect(() => { setOrigin(window.location.origin); }, [])` triggered an ESLint error (`Calling setState synchronously within an effect can trigger cascading renders`).
   - *Resolution*: Derived `shareUrl` purely during render gated by `isHydrated` from `useSesh()`, ensuring deterministic SSR/pre-hydration output (`sharePath`) and full origin URL post-hydration with zero effect-driven state updates:
     ```tsx
     const { isHydrated } = useSesh();
     const [open, setOpen] = useState(false);
     const [copied, setCopied] = useState(false);

     const sharePath = `/move-groups/${group.id}`;
     const shareUrl =
       isHydrated && typeof window !== "undefined"
         ? `${window.location.origin}${sharePath}`
         : sharePath;
     ```
2. **Eliminating `react-hooks/incompatible-library` (`form.watch` -> `useWatch`)**:
   - *Initial Defect*: Calling `form.watch("eventId")`, `form.watch("discoverability")`, and `form.watch("joinMode")` inside `CreateMoveGroupForm` and `MoveGroupManageView` caused React Compiler to emit `Compilation Skipped: Use of incompatible library` warnings because `useForm().watch` mutates internal subscription refs that cannot be safely memoized.
   - *Resolution*: Replaced all `form.watch(...)` calls with React Hook Form's compiler-safe `useWatch({ control: form.control, name: "..." })` hook.
3. **Eliminating Artificial `revision` `useMemo` Dependencies**:
   - *Initial Defect*: Wrapping `adapter.getMoveGroup(groupId, viewer)` in `useMemo(..., [adapter, groupId, viewer, revision])` triggered `react-hooks/exhaustive-deps` (`unnecessary dependency: 'revision'`).
   - *Resolution*: Because `SeshProvider` increments `revision` in state whenever `adapter` emits a mutation, consuming `useSesh()` already re-renders subscribed views on every mutation. Direct synchronous projection `const lookup = adapter.getMoveGroup(groupId, viewer);` is \( O(|G| + |M|) \) over small in-memory arrays and completely avoids stale memoization hazards.

#### Error-Check Verification
Re-ran `npx tsc --noEmit && npx eslint src/app/move-groups src/components/move-groups` — exited with code `0` (**0 errors, 0 warnings**).

---

### 3.3 Sub-Iteration `1.05.3` — Next.js 16 Cache Components `<Suspense>` Isolation & Hydration Audit

#### Objective
Verify strict compliance with Next.js 16.4.6 (`cacheComponents: true`, `partialPrefetching: true`) dynamic rendering rules, deterministic clock usage, and `localStorage` refresh persistence for locally created Move Groups (`mg-local-*`).

#### Files Audited
- `apps/web/src/app/move-groups/new/page.tsx`
- `apps/web/src/app/move-groups/[id]/page.tsx`
- `apps/web/src/app/move-groups/[id]/manage/page.tsx`
- All 6 client components in `apps/web/src/components/move-groups/*.tsx`

#### Architectural & Runtime Guarantees Verified
1. **Unawaited `params: Promise<{ id: string }>` in Dynamic Route Pages**:
   - Under `cacheComponents: true`, awaiting `params` at the top level of a `page.tsx` blocks static shell prerendering. Both `MoveGroupDetailPage` and `MoveGroupManagePage` keep the page component synchronous and pass the `params` Promise into an `async` child component wrapped inside `<Suspense fallback={<DetailPageSkeleton />}>`:
     ```tsx
     async function MoveGroupDetailRouteContent({
       params,
     }: {
       params: Promise<{ id: string }>;
     }) {
       const { id } = await params;
       return <MoveGroupDetailView groupId={id} />;
     }

     export default function MoveGroupDetailPage({
       params,
     }: {
       params: Promise<{ id: string }>;
     }) {
       return (
         <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
           <Suspense fallback={<DetailPageSkeleton />}>
             <MoveGroupDetailRouteContent params={params} />
           </Suspense>
         </div>
       );
     }
     ```
2. **`useSearchParams()` Boundary on `/move-groups/new`**:
   - `NewMoveGroupPage` wraps `<CreateMoveGroupForm />` inside `<Suspense fallback={<DetailPageSkeleton />}>` so `useSearchParams().get("event")` never triggers a Next.js missing-Suspense bailout during `next build`.
3. **Hydration Gate Preventing False `NOT_FOUND` Flashes on Refresh**:
   - Before client mount, `LocalMockSeshAdapter` only holds seeded records (`mg-west-midtown-rideshare`, etc.); locally created `mg-local-101` records live in `window.localStorage` (`sesh.m1.demo-store.v1`) and attach inside `SeshProvider`'s mount effect prior to `setIsHydrated(true)`.
   - `CreateMoveGroupForm`, `MoveGroupDetailView`, and `MoveGroupManageView` all check `if (!isHydrated) return <DetailPageSkeleton />;` **before** branching on `viewer.mode === "GUEST"` or `lookup.status === "NOT_FOUND"`. Refreshing `/move-groups/mg-local-101` or `/move-groups/mg-local-101/manage` transitions smoothly from skeleton to the hydrated local crew.
4. **Zero Impure Clock / Random Calls During Render**:
   - Audited via ripgrep across `src/app/move-groups` and `src/components/move-groups`: `Date.now()`, `Math.random()`, and `crypto.randomUUID()` appear **0 times**; `new Date().toISOString()` appears **only** inside user event/submit handlers (`onSubmit`, `handleJoinOrRequest`, `handleApproveRequest`, `handleDeclineRequest`, `handleUpdateSettings`). Render-time event queries exclusively consume `nowIso` from `useSesh()`.

---

### 3.4 Sub-Iteration `1.05.4` — Cross-Feature Route Alignment (`/events/new`)

#### Objective
Align cross-feature navigation between Feature 05 (Move Groups) and Feature 03 (Event Creation & Editing) so the empty-published-events fallback CTA points to the canonical `/events/new` route.

#### Files Touched
- Modified `apps/web/src/components/move-groups/create-move-group-form.tsx`

#### Code Implementation (`create-move-group-form.tsx` Empty-Published-Events State)
```tsx
if (publishedEvents.length === 0) {
  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/">
            <ArrowLeftIcon className="size-4" />
            Back to Campus Hub
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Crew Coordination"
        title="Start a Move Group"
        description="Move Groups attach to a published campus Move."
      />

      <EmptyState
        icon={<CalendarIcon className="size-6" />}
        title="No published events available yet"
        description="Publish a campus Move first or browse upcoming events on the Campus Hub before starting a Move Group."
        action={
          <Button asChild>
            <Link href="/events/new">Create a Move</Link>
          </Button>
        }
        secondaryAction={
          <Button asChild variant="outline">
            <Link href="/">Browse Campus Hub</Link>
          </Button>
        }
      />
    </div>
  );
}
```

#### Error-Check Notes
- Verified every outbound `<Link href="...">` across all 10 Move Group files resolves to an existing App Router route (`/`, `/events/new`, `/events/${eventId}`, `/move-groups/new`, `/move-groups/new?event=${eventId}`, `/move-groups/${id}`, `/move-groups/${id}/manage`) with zero broken `/moves/*` references.

---

## 4. Full TSDoc / Javadoc-Style API & Component Reference

### 4.1 Route Entrypoints (`src/app/move-groups/**`)

#### `4.1.1` `NewMoveGroupPage` — `src/app/move-groups/new/page.tsx`

```ts
/**
 * @component      NewMoveGroupPage
 * @filepath       apps/web/src/app/move-groups/new/page.tsx
 * @kind           Next.js Server Component (Static Shell + Suspense Boundary)
 * @route          GET /move-groups/new?event={optionalEventId}
 *
 * @description
 * Renders the centered `max-w-3xl` page container for creating an event-specific
 * Move Group. Wraps `<CreateMoveGroupForm />` inside `<Suspense fallback={<DetailPageSkeleton />}>`
 * so `useSearchParams()` inside the client form complies with Next.js 16 `cacheComponents: true`.
 *
 * @props          None
 * @returns        {JSX.Element} Prerenderable route shell with skeleton fallback.
 * @invariants     Must NEVER read `searchParams` at the server page level without `<Suspense>`.
 */
export default function NewMoveGroupPage(): JSX.Element;
```

---

#### `4.1.2` `MoveGroupDetailPage` — `src/app/move-groups/[id]/page.tsx`

```ts
/**
 * @component      MoveGroupDetailPage
 * @filepath       apps/web/src/app/move-groups/[id]/page.tsx
 * @kind           Next.js Server Component + Async Suspense Child (`MoveGroupDetailRouteContent`)
 * @route          GET /move-groups/[id]
 *
 * @description
 * Entry route for viewing a Move Group's coordination logistics, associated parent event,
 * members-only chat unlock status, privacy-masked roster, and viewer membership controls.
 * Passes the unawaited `params` Promise into `MoveGroupDetailRouteContent` inside `<Suspense>`.
 *
 * @param          {object} props
 * @param          {Promise<{ id: string }>} props.params - Dynamic route parameter promise.
 * @returns        {JSX.Element} `max-w-5xl` container streaming `<MoveGroupDetailView groupId={id} />`.
 * @preconditions  `params` must NOT be awaited outside `<Suspense>`.
 * @postconditions Streams `<DetailPageSkeleton />` until `params` resolves and client hydrates.
 */
export default function MoveGroupDetailPage(props: {
  params: Promise<{ id: string }>;
}): JSX.Element;
```

---

#### `4.1.3` `MoveGroupNotFound` — `src/app/move-groups/[id]/not-found.tsx`

```ts
/**
 * @component      MoveGroupNotFound
 * @filepath       apps/web/src/app/move-groups/[id]/not-found.tsx
 * @kind           Next.js Not-Found Boundary Component
 * @route          /move-groups/[id] (404 segment fallback)
 *
 * @description
 * Renders a consistent `EmptyState` recovery screen whenever Next.js `notFound()` is
 * invoked within the `/move-groups/[id]` segment, providing direct actions to return to
 * the Campus Hub (`/`) or start a new Move Group (`/move-groups/new`).
 *
 * @returns        {JSX.Element} Accessible 404 recovery layout.
 */
export default function MoveGroupNotFound(): JSX.Element;
```

---

#### `4.1.4` `MoveGroupManagePage` — `src/app/move-groups/[id]/manage/page.tsx`

```ts
/**
 * @component      MoveGroupManagePage
 * @filepath       apps/web/src/app/move-groups/[id]/manage/page.tsx
 * @kind           Next.js Server Component + Async Suspense Child (`MoveGroupManageRouteContent`)
 * @route          GET /move-groups/[id]/manage
 *
 * @description
 * Host management route shell (`max-w-4xl`) that awaits `const { id } = await params`
 * inside `<Suspense fallback={<DetailPageSkeleton />}>` and delegates authorization
 * and interactive management controls to `<MoveGroupManageView groupId={id} />`.
 *
 * @param          {object} props
 * @param          {Promise<{ id: string }>} props.params - Dynamic route parameter promise.
 * @returns        {JSX.Element} Suspense-wrapped host management page shell.
 * @security       Client view enforces strict Owner-Only rendering; Milestone 4+ backend
 *                 will additionally gate management endpoints with server JWT checks.
 */
export default function MoveGroupManagePage(props: {
  params: Promise<{ id: string }>;
}): JSX.Element;
```

---

### 4.2 Feature Components (`src/components/move-groups/**`)

#### `4.2.1` `MoveGroupCard` & Enum Metadata Maps — `src/components/move-groups/move-group-card.tsx`

```ts
/**
 * @component      MoveGroupCard
 * @filepath       apps/web/src/components/move-groups/move-group-card.tsx
 * @kind           Client Component ("use client")
 *
 * @description
 * Compact, reusable summary card rendering a viewer-projected `MoveGroupView` on Event Detail
 * crew lists and discovery surfaces. Also exports the canonical metadata lookup dictionaries
 * `DISCOVERABILITY_META`, `JOIN_MODE_META`, and `VIEWER_RELATION_META` shared across all
 * Move Group forms, dialogs, and headers.
 *
 * @props          {MoveGroupCardProps}
 * @prop           {MoveGroupView} group - Viewer-projected Move Group view from `SeshDataAdapter`.
 * @prop           {boolean} [showEventContext=true] - Renders parent event link chip (`/events/${group.eventId}`) when true.
 * @prop           {string} [className] - Optional Tailwind layout overrides.
 *
 * @returns        {JSX.Element} Card displaying badges, meetup time (`formatMeetupTime`), meetup spot,
 *                 creator avatar, chat lock/unlock indicator, friend/masked member summary, and CTAs.
 *
 * @privacy
 * - Reads `group.roster.visibleMembers.filter((m) => m.isFriend)` to surface `"Friends in crew: ..."`
 *   without ever accessing unprojected `MoveGroupRecord.members`.
 * - Displays `"Chat unlocked"` vs `"Members chat"` using `Boolean(group.unlockedExternalChatLink)`
 *   and `group.hasExternalChatLink`, never embedding the URL on summary cards.
 * - Renders the `"Manage"` button + pending request count badge ONLY when `group.canManage === true`.
 *
 * @example
 * <MoveGroupCard group={projectedGroup} showEventContext={false} />
 */
export interface MoveGroupCardProps {
  group: MoveGroupView;
  showEventContext?: boolean;
  className?: string;
}
export function MoveGroupCard(props: MoveGroupCardProps): JSX.Element;
```

---

#### `4.2.2` `CreateMoveGroupForm` — `src/components/move-groups/create-move-group-form.tsx`

```ts
/**
 * @component      CreateMoveGroupForm
 * @filepath       apps/web/src/components/move-groups/create-move-group-form.tsx
 * @kind           Client Component ("use client")
 *
 * @description
 * Two-stage client workflow (`CreateMoveGroupForm` outer hydration/guest guard +
 * `AuthenticatedCreateMoveGroupForm` inner React Hook Form + Zod 4 implementation)
 * for creating a new Move Group attached to a published campus event.
 *
 * @hooks
 * - `useSearchParams()` — reads `?event=ID` to pre-select `eventId` and contextualize Back links.
 * - `useSesh()` — reads `adapter`, `viewer`, `nowIso`, `isHydrated`, and `requireDemoMember`.
 * - `useForm<MoveGroupFormValues>({ resolver: zodResolver(moveGroupFormSchema) })`
 * - `useWatch()` — React Compiler-safe subscriptions on `eventId`, `discoverability`, and `joinMode`.
 *
 * @preconditions
 * - Waits for `isHydrated === true` (renders `<DetailPageSkeleton />` pre-hydration).
 * - If `viewer.mode === "GUEST"`, renders a dedicated `EmptyState` prompt invoking
 *   `requireDemoMember("create a Move Group")` instead of rendering disabled form inputs.
 * - If `publishedEvents.length === 0`, renders an `EmptyState` linking to `/events/new`.
 *
 * @postconditions
 * - Converts `values.meetupTimeLocal` (`America/New_York` wall clock) to UTC ISO via `nyLocalInputToUtcIso`.
 * - Calls `adapter.createMoveGroup(input, viewer, new Date().toISOString())`.
 * - Marks creator `GOING` on the parent event, persists to `localStorage`, emits toast,
 *   and navigates to `/move-groups/${created.id}`.
 *
 * @throws         Catches `SeshAdapterError` (`UNAUTHENTICATED` | `NOT_FOUND` | `VALIDATION_ERROR`)
 *                 and displays user-friendly error feedback via `toast.error`.
 *
 * @privacy        Explicitly informs hosts that `externalChatLink` is projected exclusively to
 *                 accepted Move Group members and the creator.
 */
export function CreateMoveGroupForm(): JSX.Element;
```

---

#### `4.2.3` `MoveGroupDetailView` — `src/components/move-groups/move-group-detail-view.tsx`

```ts
/**
 * @component      MoveGroupDetailView
 * @filepath       apps/web/src/components/move-groups/move-group-detail-view.tsx
 * @kind           Client Component ("use client")
 *
 * @description
 * Primary crew coordination workspace for `/move-groups/[id]`. Exhaustively resolves
 * `MoveGroupLookupResult` (`NOT_FOUND`, `DISBANDED`, `RESTRICTED`, `OK`) after client
 * hydration and renders parent event context, meetup logistics, members-only external
 * chat unlock state, `<MoveGroupRoster />`, `<MoveGroupInviteDialog />`, and role-aware
 * sidebar membership actions.
 *
 * @props          {MoveGroupDetailViewProps}
 * @prop           {string} groupId - Target Move Group ID (`mg-*` seed or `mg-local-*` overlay).
 *
 * @preconditions  Gates on `isHydrated` before evaluating `lookup.status` so `mg-local-*`
 *                 Move Groups in `localStorage` never flash `NOT_FOUND` on browser refresh.
 *
 * @postconditions
 * - `GUEST` clicking Join/Request -> opens Demo Sign-In prompt via `requireDemoMember("join or request this Move Group")`.
 * - `MEMBER` on `OPEN_JOIN` (`canRequestOrJoin === true`) -> `adapter.requestJoin(group.id, viewer, { nowIso })`
 *   immediately transitions `viewerRelation` to `"MEMBER"` and unlocks full roster + chat link.
 * - `MEMBER` on `REQUEST_TO_JOIN` (`canRequestOrJoin === true`) -> submits optional intro `note` (<= 240 chars)
 *   via `adapter.requestJoin`, transitioning `viewerRelation` to `"PENDING_REQUEST"`.
 * - `MEMBER` (`viewerRelation === "MEMBER"`) -> confirms destructive `ConfirmDialog` and calls
 *   `adapter.leaveMoveGroup(group.id, viewer)`.
 * - `CREATOR` (`group.canManage === true`) -> displays `"Manage Group"` button with live
 *   `pendingRequests.length` badge linking to `/move-groups/${group.id}/manage`.
 *
 * @privacy
 * - `RESTRICTED` branch renders ONLY `lookup.reason` without leaking group title, host, meetup spot, or roster.
 * - Non-members with `group.hasExternalChatLink === true` see a locked placeholder card;
 *   `group.unlockedExternalChatLink` is `undefined` until accepted.
 */
export interface MoveGroupDetailViewProps {
  groupId: string;
}
export function MoveGroupDetailView(props: MoveGroupDetailViewProps): JSX.Element;
```

---

#### `4.2.4` `MoveGroupRoster` — `src/components/move-groups/move-group-roster.tsx`

```ts
/**
 * @component      MoveGroupRoster
 * @filepath       apps/web/src/components/move-groups/move-group-roster.tsx
 * @kind           Client Component ("use client")
 *
 * @description
 * Pure presentation component for `MoveGroupRosterProjection`. Renders:
 * 1. `roster.creator` with `"Host / Creator"` badge and verified GT student check.
 * 2. `roster.visibleMembers` — every non-creator member when `roster.isFullRosterVisible` is true,
 *    or ONLY friends of the viewer (badged `"Friend"`) when `isFullRosterVisible` is false.
 * 3. Privacy-masked summary row (`"+N other student member(s) · Identities visible to accepted group members"`)
 *    whenever `roster.anonymousMemberCount > 0`.
 * 4. Architectural transparency footer documenting adapter-level & future server-side projection.
 *
 * @props          {MoveGroupRosterProps}
 * @prop           {MoveGroupRosterProjection} roster - Adapter-computed privacy-safe roster projection.
 * @prop           {number} capacity - Group maximum capacity (`2..50`).
 * @prop           {string} [className] - Optional container class overrides.
 *
 * @invariants
 * - `1 + roster.visibleMembers.length + roster.anonymousMemberCount === roster.totalMemberCount`
 * - Component receives ZERO hidden `User` IDs, usernames, or avatar URLs.
 */
export interface MoveGroupRosterProps {
  roster: MoveGroupRosterProjection;
  capacity: number;
  className?: string;
}
export function MoveGroupRoster(props: MoveGroupRosterProps): JSX.Element;
```

---

#### `4.2.5` `MoveGroupInviteDialog` — `src/components/move-groups/move-group-invite-dialog.tsx`

```ts
/**
 * @component      MoveGroupInviteDialog
 * @filepath       apps/web/src/components/move-groups/move-group-invite-dialog.tsx
 * @kind           Client Component ("use client")
 *
 * @description
 * Modal dialog allowing hosts and viewers to copy a direct link to `/move-groups/${group.id}`
 * while presenting an explicit **Prototype Invite Preview (Non-Cryptographic)** card explaining
 * how the `Invitation` token model (`targetType: "MOVE_GROUP"`, `permission: "JOIN"`) will be
 * cryptographically signed and enforced by the backend token service in Milestone 6.
 *
 * @props          {MoveGroupInviteDialogProps}
 * @prop           {MoveGroupView} group - Projected Move Group metadata for title, event context, and policy labels.
 * @prop           {React.ReactNode} [trigger] - Optional custom trigger button (defaults to outline `"Share / Invite"` button).
 *
 * @security
 * - Never fabricates fake HMAC/JWT strings or claims client-generated URLs bypass `INVITE_ONLY` / `MY_NETWORK` rules.
 * - Reminds senders that recipients still pass through `DISCOVERABILITY_META` and `JOIN_MODE_META` checks.
 */
export interface MoveGroupInviteDialogProps {
  group: MoveGroupView;
  trigger?: React.ReactNode;
}
export function MoveGroupInviteDialog(props: MoveGroupInviteDialogProps): JSX.Element;
```

---

#### `4.2.6` `MoveGroupManageView` — `src/components/move-groups/move-group-manage-view.tsx`

```ts
/**
 * @component      MoveGroupManageView
 * @filepath       apps/web/src/components/move-groups/move-group-manage-view.tsx
 * @kind           Client Component ("use client")
 *
 * @description
 * Host-only management console for `/move-groups/[id]/manage`. Enforces an unconditional
 * **Owner-Only Access** gate (`viewer.mode === "GUEST" || lookup.status === "RESTRICTED" || !lookup.group.canManage || !lookup.group.ownerManagement`)
 * before mounting `OwnerManageMoveGroupContent`, which provides four operational sections:
 * 1. **Pending Join Requests**: Approve (`adapter.approveJoin`) & Decline (`adapter.declineJoin`) actions,
 *    capacity-full warning badge, and collapsible/inline **Declined Requests History**.
 * 2. **Current Members**: Read-only host row + `removableMembers` list with destructive `ConfirmDialog`
 *    calling `adapter.removeMember(group.id, member.id, viewer)`.
 * 3. **Edit Group Settings**: RHF + Zod (`moveGroupFormSchema`) form updating `name`, `note`,
 *    `meetupTime`, `capacity` (enforcing `min = Math.max(2, group.roster.totalMemberCount)`),
 *    `meetupSpot`, `discoverability`, `joinMode`, and `externalChatLink` via `adapter.updateMoveGroup`.
 * 4. **Danger Zone — Disband Move Group**: Destructive `ConfirmDialog` calling
 *    `adapter.disbandMoveGroup(group.id, viewer)` and redirecting to `/events/${group.eventId}`.
 *
 * @props          {MoveGroupManageViewProps}
 * @prop           {string} groupId - Target Move Group ID.
 *
 * @preconditions  `isHydrated === true` and `viewer.mode === "MEMBER" && viewer.user.id === group.creatorId`.
 * @postconditions Every mutation persists to `localStorage`, increments `SeshProvider.revision`,
 *                 re-projects `MoveGroupView`, and resets pristine form values via `useEffect` sync.
 * @throws         Handles `SeshAdapterError` (`CAPACITY_FULL`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`)
 *                 with toast feedback and inline field error attachment on `capacity`.
 */
export interface MoveGroupManageViewProps {
  groupId: string;
}
export function MoveGroupManageView(props: MoveGroupManageViewProps): JSX.Element;
```

---

### 4.3 Shared Policy & Adapter Projection Contracts Consumed

For cross-milestone debugging, the Move Groups UI relies on three pure functions in `apps/web/src/lib/permissions/policies.ts` and six mutation methods on `SeshDataAdapter` (`apps/web/src/lib/data/adapter.ts`):

| Contract / Method | Source File | Input Signature | Output / Guarantee |
| :--- | :--- | :--- | :--- |
| `canViewMoveGroup` | `policies.ts` | `(group, event, viewer, usersById)` | `boolean` — enforces `!disbanded`, `canViewEvent`, member override, and `PUBLIC` / `MY_NETWORK` / `INVITE_ONLY` rules |
| `projectMoveGroupRoster` | `policies.ts` | `{ group, viewer, usersById }` | `MoveGroupRosterProjection` — guarantees hidden non-friend identities never enter UI memory |
| `projectMoveGroupForViewer` | `policies.ts` | `{ group, event, viewer, usersById }` | `MoveGroupView \| null` — strips `externalChatLink` for non-members and `ownerManagement` for non-creators |
| `adapter.createMoveGroup` | `adapter.ts` | `(input, viewer, nowIso)` | Creates `mg-local-*`, adds creator to `members`, marks creator `GOING` on parent event |
| `adapter.requestJoin` | `adapter.ts` | `(groupId, viewer, { note?, nowIso? })` | Enforces duplicate/declined/invite/capacity checks; joins immediately (`OPEN_JOIN`) or queues `PENDING` |
| `adapter.approveJoin` / `declineJoin` | `adapter.ts` | `(groupId, requestId, viewer, nowIso?)` | Creator-only; `approveJoin` checks `members.length < capacity` (`CAPACITY_FULL`) before appending member |
| `adapter.leaveMoveGroup` / `removeMember` | `adapter.ts` | `(groupId, ..., viewer)` | Removes member and clears prior `APPROVED` join request so future re-requests are not blocked |
| `adapter.updateMoveGroup` / `disbandMoveGroup` | `adapter.ts` | `(groupId, ..., viewer)` | Creator-only; `updateMoveGroup` prevents `capacity < members.length`; `disbandMoveGroup` sets `disbanded = true` |

---

## 5. Regression, Security & Error-Checking Matrix

Use the indexed invariants below when QA-testing Milestone 1 or migrating Move Groups to PostgreSQL + Express/Fastify endpoints in Milestones 4–6.

### 5.1 Privacy & Projection Invariants (`MG-PRIV-*`)

| Check ID | Invariant Statement | Seed Test Fixture & Persona | Expected Observable Behavior |
| :--- | :--- | :--- | :--- |
| `MG-PRIV-01` | **Anonymous Non-Friend Masking**: Non-members see ONLY the creator and accepted friends; all other members collapse into `anonymousMemberCount`. | Open `/move-groups/mg-indie-beltline-walk` as **Maya Patel** (`user-maya`) | Shows Host **Chloe Kim**, Friend **Jordan Brooks** (`Friend` badge), and **`+1 other student member`** (Tyler Nguyen's ID/name/avatar are absent from props & DOM). |
| `MG-PRIV-02` | **Guest Zero-Friend Masking**: Guests on `PUBLIC` groups see ONLY the creator; `visibleMembers` is `[]`. | Open `/move-groups/mg-indie-beltline-walk` in **Guest Mode** | Shows Host **Chloe Kim** + **`+2 other student members`**; badge reads `Privacy-Masked Roster`. |
| `MG-PRIV-03` | **Accepted Member Full Roster Unlock**: Creator and accepted members see 100% of members (`anonymousMemberCount === 0`). | Switch to **Tyler Nguyen** (`user-tyler`) on `/move-groups/mg-indie-beltline-walk` | Badge switches to `Full Roster Unlocked`; Chloe, Jordan, and Tyler all render; masked row disappears. |
| `MG-PRIV-04` | **Members-Only External Chat Link Stripping**: `unlockedExternalChatLink` is `undefined` for Guests, `NONE`, `PENDING_REQUEST`, and `DECLINED_REQUEST`. | Open `/move-groups/mg-west-midtown-rideshare` as **Tyler Nguyen** (`PENDING_REQUEST`) vs **Maya Patel** (`CREATOR`) | Tyler sees dashed lock card (`External group chat link unlocks once you're an accepted member`); Maya sees green unlocked URL + `Copy Link`. |
| `MG-PRIV-05` | **Restricted Group Zero-Metadata Leak**: `INVITE_ONLY` and `MY_NETWORK` groups return `{ status: "RESTRICTED", reason }` with no group payload to unauthorized viewers. | Open `/move-groups/mg-rooftop-invite-crew` as **Tyler Nguyen** or **Guest** | Renders `Restricted Move Group` `EmptyState` with `lookup.reason`; group name `"Sq5 Elevator Escort Group"` and spot `"Spring St Lobby Coffee Counter"` never render. |

### 5.2 Capacity & Membership State Invariants (`MG-CAP-*` & `MG-MEM-*`)

| Check ID | Invariant Statement | Reproduction / Verification Procedure | Expected Observable Behavior |
| :--- | :--- | :--- | :--- |
| `MG-CAP-01` | **Full Capacity Join Block**: Groups where `totalMemberCount >= capacity` set `isFull = true`, `spotsRemaining = 0`, and `canRequestOrJoin = false`. | Open `/move-groups/mg-home-park-walk-over` (`3/3` members) as **Maya Patel** | Shows destructive `Full` badge, `Capacity Reached` callout, and disabled `Move Group Full` button. |
| `MG-CAP-02` | **Approval Capacity Race Protection**: Approving a pending request when `members.length >= capacity` throws `SeshAdapterError("CAPACITY_FULL")`. | Lower capacity to `3` on `mg-west-midtown-rideshare` (`3/3`), then click **Approve** on Tyler's pending request | `approveJoin` throws `CAPACITY_FULL`; `MoveGroupManageView` catches it, keeps Tyler `PENDING`, displays destructive header warning, and shows `toast.error`. |
| `MG-CAP-03` | **Shrink-Below-Current-Members Prevention**: Host cannot save `capacity < group.roster.totalMemberCount`. | On `/move-groups/mg-west-midtown-rideshare/manage` (`3` members), attempt to submit capacity `2` | HTML `min={3}` + `adapter.updateMoveGroup` `VALIDATION_ERROR` guard blocks save and attaches inline error to `capacity`. |
| `MG-MEM-01` | **Open Join Immediate Promotion**: `OPEN_JOIN` skips pending queue and transitions directly to `MEMBER`. | Open `/move-groups/mg-tech-green-blanket` as **Maya Patel** and click **Join Group** | Immediately becomes `Accepted Member`, unlocks `https://chat.example.com/sesh-demo-campanile`, and increments count `2/8 -> 3/8`. |
| `MG-MEM-02` | **Declined Request Re-Application Block**: Once declined, a user's relation is `DECLINED_REQUEST` and re-requesting is forbidden. | As **Maya Patel**, click **Decline** on Tyler's request in `mg-west-midtown-rideshare/manage`, then switch to **Tyler Nguyen** | Tyler sees `Request Declined` badge and disabled `Request Declined` button; Tyler appears under `Declined Requests History` for Maya. |
| `MG-MEM-03` | **Voluntary Leave Clean Reset**: Leaving removes membership and clears prior `APPROVED` join requests so future re-joining remains possible. | Join `mg-tech-green-blanket` as **Maya Patel**, click **Leave Group** -> confirm in `ConfirmDialog` | Status returns to `Not Joined`, chat link re-locks, and `Join Group` button becomes active again. |

### 5.3 Owner-Only Access & Next.js 16 Runtime Invariants (`MG-OWN-*` & `MG-NXT-*`)

| Check ID | Invariant Statement | Verification Target | Expected Observable Behavior |
| :--- | :--- | :--- | :--- |
| `MG-OWN-01` | **Strict Non-Owner Management Block**: Guests, restricted users, and non-creator accepted members NEVER see management forms or pending request queues. | Visit `/move-groups/mg-west-midtown-rideshare/manage` as **Priya Nair** (accepted `MEMBER`) or **Guest** | Renders `Owner-Only Access` screen with link back to `/move-groups/mg-west-midtown-rideshare` and Demo Identity switcher hint. |
| `MG-OWN-02` | **Disband Lifecycle Cleanup**: Disbanding sets `disbanded: true`, hides the crew from event lists, and redirects host to parent event. | Click **Disband Move Group** in Danger Zone -> confirm | Redirects to `/events/${group.eventId}`; revisiting `/move-groups/${id}` shows `This Move Group has been disbanded`. |
| `MG-NXT-01` | **Next.js 16 `<Suspense>` Compliance**: `params` Promises and `useSearchParams()` are isolated inside `<Suspense fallback={<DetailPageSkeleton />}>`. | Run `npm run build` (`next build` with `cacheComponents: true`) | Static route shells prerender cleanly without missing-Suspense or uncached-data errors. |
| `MG-NXT-02` | **Local Overlay Refresh Survival**: Browser refresh on `/move-groups/mg-local-*` waits for `isHydrated` before rendering status branches. | Create a new Move Group (`mg-local-101`), then hard-refresh `/move-groups/mg-local-101` and `/manage` | Renders `<DetailPageSkeleton />` during hydration, then mounts full crew view without flashing `Move Group not found`. |

### 5.4 Milestone 4 & Milestone 6 Server-Side Migration Checklist

When replacing `LocalMockSeshAdapter` with Sesh's production PostgreSQL + REST/RPC backend:

- [ ] **Server-Side Roster Projection (`GET /api/move-groups/:id`)**: Port `canViewMoveGroup`, `projectMoveGroupRoster`, and `projectMoveGroupForViewer` directly into the backend service layer so HTTP JSON responses **never** serialize hidden member `userId`s, `username`s, `avatar`s, `ownerManagement` payloads, or `externalChatLink` strings over the wire to unauthorized clients.
- [ ] **Transactional Capacity Locking (`POST /api/move-groups/:id/requests/:reqId/approve` & Open Join)**: Execute `SELECT ... FOR UPDATE` on the `move_groups` row inside a database transaction before inserting into `move_group_members` so concurrent approvals/joins cannot exceed `capacity`.
- [ ] **Cryptographic Invitation Token Service (`Milestone 6`)**: Replace the non-cryptographic preview in `MoveGroupInviteDialog` with backend-minted `Invitation` records (`HMAC-SHA256` or opaque CSPRNG 256-bit tokens hashed at rest with `expiresAt`, `maxUses`, `usedCount`, and `permission: "JOIN"`), enabling one-click `INVITE_ONLY` crew onboarding via `/move-groups/[id]?invite=<token>`.
- [ ] **Atomic Parent Event `GOING` Upsert**: Preserve `createMoveGroup`'s transactional side effect upserting `event_responses(user_id, event_id, 'GOING')` when a student creates (or joins) an event Move Group.

---

[Root README](../../../../README.md) · [Milestone 1 Index](../README.md)
