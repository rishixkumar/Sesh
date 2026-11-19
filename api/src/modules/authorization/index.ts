/**
 * Authorization policies for Phase 3.
 *
 * This module owns pure decisions only. It does not register HTTP routes.
 *
 * Ownership:
 * - Events routes: `api/src/modules/events/**`
 * - Move Group routes: `api/src/modules/move-groups/**`
 * - These policies: `api/src/modules/authorization/**`
 *
 * Feature agents register routes in `api/src/app.ts` AFTER `authPlugin`:
 *
 *   import { eventRoutes } from "./modules/events/routes.js";
 *   import { moveGroupRoutes } from "./modules/move-groups/routes.js";
 *   await app.register(eventRoutes, { prefix: "/v1" });
 *   await app.register(moveGroupRoutes, { prefix: "/v1" });
 *
 * Identity is already `request.authUser` (`{ id, schoolId } | null`), set by
 * `api/src/plugins/auth.ts`. Mutations use `requireAuth` from `api/src/lib/auth.ts`.
 * Do not read user ids from JSON bodies or from `X-Sesh-Test-School-Id`.
 * Do not copy these rules into route files.
 */
export {
  JOIN_BLOCKED_REASON,
  areAcceptedFriends,
  assessJoin,
  canEditEvent,
  canManageGroup,
  canRevealAddress,
  canViewEvent,
  canViewMoveGroup,
  isBlockedPair,
  projectRoster,
} from "./policies.js";
export type { JoinAssessment, JoinAttempt } from "./policies.js";
export type {
  AddressPrivacy,
  AuthzBlock,
  AuthzFriendship,
  AuthzJoinRequest,
  AuthzMember,
  AuthzSocialGraph,
  AuthzViewer,
  EventPolicyRecord,
  EventStatus,
  EventVisibility,
  FriendshipStatus,
  MoveGroupDiscoverability,
  MoveGroupJoinMode,
  MoveGroupPolicyRecord,
  PublicUserSummary,
  RosterMember,
  RosterProjection,
} from "./types.js";
