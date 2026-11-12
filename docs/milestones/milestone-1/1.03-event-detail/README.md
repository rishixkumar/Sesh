[Root README](../../../../README.md) · [Milestone 1 Index](../README.md) · **1.03 Event Detail (`/events/[id]`)**

---

# Milestone 1 · Agent 03 (`1.03`) — Event Detail Technical Reference & Sub-Iteration Manual

```ts
/**
 * @module       @sesh/web/features/1.03-event-detail
 * @milestone    Milestone 1 — Frontend-Only Campus Social Coordination Prototype (Georgia Tech)
 * @agent        Feature Agent 03 ("Event Detail")
 * @iterations   1.03.1, 1.03.2, 1.03.3, 1.03.4
 * @owner        apps/web/src/app/events/[id]/*, apps/web/src/components/events/*
 * @status       SHIPPED (Zero TypeScript / ESLint errors; Next.js 16.4.6 Cache Components verified)
 * @runtime      Next.js 16.4.6 App Router (`cacheComponents: true`, `partialPrefetching: true`), React 19.3.0
 * @timezone     America/New_York (Georgia Tech & Midtown Atlanta campus wall-clock standard)
 * @see          apps/web/src/types/domain.ts
 * @see          apps/web/src/lib/data/adapter.ts
 * @see          apps/web/src/lib/permissions/policies.ts
 * @see          apps/web/src/lib/context/sesh-provider.tsx
 * @see          apps/web/src/lib/dates.ts
 */
```

---

## Table of Contents

1. [Executive Scope & Owned File Manifest](#1-executive-scope--owned-file-manifest)
2. [Architecture, RSC/PPR Streaming & Privacy Projection Pipeline](#2-architecture-rscppr-streaming--privacy-projection-pipeline)
   - [2.1 End-to-End Request, Streaming & Hydration Diagram](#21-end-to-end-request-streaming--hydration-diagram)
   - [2.2 Next.js 16 `cacheComponents` & Async `params` Mechanics](#22-nextjs-16-cachecomponents--async-params-mechanics)
   - [2.3 Browser-Local `evt-local-*` Resolution & Hydration Gate](#23-browser-local-evt-local--resolution--hydration-gate)
   - [2.4 Multi-Tier Event Visibility & Address Privacy Matrix](#24-multi-tier-event-visibility--address-privacy-matrix)
3. [Detailed Sub-Iteration Changelogs (`1.03.1` – `1.03.4`)](#3-detailed-sub-iteration-changelogs-1031--1034)
   - [3.1 Sub-Iteration `1.03.1` — Domain, Adapter & Privacy Policy Audit](#31-sub-iteration-1031--domain-adapter--privacy-policy-audit)
   - [3.2 Sub-Iteration `1.03.2` — Core Route & Interactive Event Modules Build](#32-sub-iteration-1032--core-route--interactive-event-modules-build)
   - [3.3 Sub-Iteration `1.03.3` — Hook Dependency Cleanup & Render Determinism Audit](#33-sub-iteration-1033--hook-dependency-cleanup--render-determinism-audit)
   - [3.4 Sub-Iteration `1.03.4` — Move Groups Section Heading Polish & Next.js 16 Cached Metadata Verification](#34-sub-iteration-1034--move-groups-section-heading-polish--nextjs-16-cached-metadata-verification)
4. [TSDoc / Javadoc API & Component Reference](#4-tsdoc--javadoc-api--component-reference)
   - [4.1 `apps/web/src/app/events/[id]/page.tsx`](#41-appswebsrcappeventsidpagetsx)
   - [4.2 `apps/web/src/app/events/[id]/not-found.tsx`](#42-appswebsrcappeventsidnot-foundtsx)
   - [4.3 `apps/web/src/components/events/event-detail-view.tsx`](#43-appswebsrccomponentseventsevent-detail-viewtsx)
   - [4.4 `apps/web/src/components/events/rsvp-controls.tsx`](#44-appswebsrccomponentseventsrsvp-controlstsx)
   - [4.5 `apps/web/src/components/events/friends-going-card.tsx`](#45-appswebsrccomponentseventsfriends-going-cardtsx)
   - [4.6 `apps/web/src/components/events/event-move-groups-section.tsx`](#46-appswebsrccomponentseventsevent-move-groups-sectiontsx)
   - [4.7 `apps/web/src/components/events/share-event-button.tsx`](#47-appswebsrccomponentseventsshare-event-buttontsx)
   - [4.8 `apps/web/src/components/events/report-event-dialog.tsx`](#48-appswebsrccomponentseventsreport-event-dialogtsx)
5. [Regression, Security & Debugging Checklist](#5-regression-security--debugging-checklist)
   - [5.1 Privacy & Information-Leakage Invariants](#51-privacy--information-leakage-invariants)
   - [5.2 OpenGraph & Server Metadata Leak Checks](#52-opengraph--server-metadata-leak-checks)
   - [5.3 Next.js 16 Cache Components & Hydration Checks](#53-nextjs-16-cache-components--hydration-checks)
   - [5.4 Symptom-to-Root-Cause Diagnostic Playbook](#54-symptom-to-root-cause-diagnostic-playbook)
   - [5.5 Milestone 2+ Backend API Migration Guide](#55-milestone-2-backend-api-migration-guide)

---

## 1. Executive Scope & Owned File Manifest

Feature Agent 03 (`1.03`) owns the **Event Detail** vertical slice (`/events/[id]`) in Sesh Milestone 1. In Sesh's Georgia Tech social coordination model, an Event ("Move") is the anchor around which students signal attendance (`GOING`, `INTERESTED`, `SAVED`), see campus friend social proof, unlock sensitive house-party or rooftop exact addresses when eligible, and form or discover pre-event **Move Groups** (crews walking or ridesharing over together).

### Strict File Ownership Manifest

All implementation work in `1.03` is strictly isolated to the 8 files below so parallel agents (`1.01` Foundation/Shell, `1.02` Events Hub, `1.04` Event Create/Edit, `1.05` Move Groups) never encounter merge conflicts:

| # | Workspace-Relative File Path | Execution Boundary | Primary Exports | Line Count |
| :- | :--- | :--- | :--- | --: |
| 1 | `apps/web/src/app/events/[id]/page.tsx` | Server Component + `"use cache"` helper | `generateMetadata`, `default EventDetailPage` (internal: `buildCachedPublicMetadata`, `EventDetailLoader`) | 61 |
| 2 | `apps/web/src/app/events/[id]/not-found.tsx` | Server Component | `default EventNotFound` | 30 |
| 3 | `apps/web/src/components/events/event-detail-view.tsx` | Client Component (`"use client"`) | `EventDetailView`, `EventDetailViewProps` | 619 |
| 4 | `apps/web/src/components/events/rsvp-controls.tsx` | Client Component (`"use client"`) | `RsvpControls`, `RsvpControlsProps` | 162 |
| 5 | `apps/web/src/components/events/friends-going-card.tsx` | Client Component (`"use client"`) | `FriendsGoingCard`, `FriendsGoingCardProps` | 130 |
| 6 | `apps/web/src/components/events/event-move-groups-section.tsx` | Client Component (`"use client"`) | `EventMoveGroupsSection`, `EventMoveGroupsSectionProps` | 372 |
| 7 | `apps/web/src/components/events/share-event-button.tsx` | Client Component (`"use client"`) | `ShareEventButton`, `ShareEventButtonProps` | 106 |
| 8 | `apps/web/src/components/events/report-event-dialog.tsx` | Client Component (`"use client"`) | `ReportEventDialog`, `ReportEventDialogProps` | 152 |

---

## 2. Architecture, RSC/PPR Streaming & Privacy Projection Pipeline

### 2.1 End-to-End Request, Streaming & Hydration Diagram

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                         BROWSER / CRAWLER REQUEST: GET /events/[id]                      │
└─────────────────────────────────────────────┬────────────────────────────────────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
┌─────────────────────────────────────────┐       ┌────────────────────────────────────────┐
│ 1. METADATA PIPELINE (RSC + use cache)  │       │ 2. UI SHELL & PPR STREAMING PIPELINE   │
│                                         │       │                                        │
│ generateMetadata({ params })            │       │ EventDetailPage({ params })            │
│   │  (Uncached dynamic scope)           │       │   │  (Synchronous static shell!)       │
│   ├─► const { id } = await params       │       │   ├─► <div className="max-w-5xl py-4"> │
│   ▼                                     │       │   └─► <Suspense fallback={             │
│ buildCachedPublicMetadata(id: string)   │       │         <DetailPageSkeleton />         │
│   │  "use cache" (Keyed ONLY by `id`)   │       │       }>                               │
│   ├─► getServerSafePublicEventMetadata  │       │         <EventDetailLoader             │
│   │     • SEED + PUBLISHED + PUBLIC?    │       │           params={params} />           │
│   │       YES ─► Safe title, category,  │       │       </Suspense>                      │
│   │              publicDisplayLocation, │       │         │                              │
│   │              admissionLabel         │       │         ├─► const { id } = await params│
│   │       NO  ─► null (DRAFT, FRIENDS,  │       │         └─► <EventDetailView           │
│   │              CUSTOM, INVITE_ONLY,   │       │               eventId={id} />          │
│   │              evt-local-*, missing)  │       └───────────────────┬────────────────────┘
│   └─► Fallback: "Campus Move"           │                           │
│       (ZERO restricted/address leaks)   │                           ▼
└─────────────────────────────────────────┘       ┌────────────────────────────────────────┐
                                                  │ 3. CLIENT HYDRATION & STORAGE GATE     │
                                                  │    (EventDetailView — "use client")    │
                                                  │                                        │
                                                  │ SeshProvider mounts:                   │
                                                  │ • Pre-hydration (`isHydrated: false`): │
                                                  │   Renders <DetailPageSkeleton /> so    │
                                                  │   SSR HTML === Initial Client Render   │
                                                  │   and `evt-local-*` never flashes 404! │
                                                  │                                        │
                                                  │ • Post-hydration (`isHydrated: true`): │
                                                  │   localStorage overlay + viewer        │
                                                  │   persona (`GUEST` | `MEMBER`) loaded  │
                                                  └───────────────────┬────────────────────┘
                                                                      │
                                                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ 4. VIEWER-SCOPED ADAPTER PROJECTION: adapter.getEvent(eventId, viewer)                   │
├──────────────────────────┬─────────────────────────────┬─────────────────────────────────┤
│ status === "NOT_FOUND"   │ status === "RESTRICTED"     │ status === "OK"                 │
│                          │                             │                                 │
│ • Unknown ID or          │ • DRAFT owned by another    │ • Receives projected EventView  │
│   CANCELLED record       │   user, OR                  │ • `unlockedPrivateAddress` ONLY │
│ • Renders dedicated      │ • FRIENDS / CUSTOM /        │   present when `canViewPrivate  │
│   EmptyState matching    │   INVITE_ONLY outside       │   Address` passes               │
│   `not-found.tsx`        │   viewer's graph            │ • `friendsGoing` filtered to    │
│ • Zero internal record   │ • Renders `lookup.reason`   │   `viewer.user.friendIds`       │
│   properties exposed     │   ONLY — NO title, host,    │   (`[]` for GUEST)              │
│                          │   description, or address!  │ • Sub-queries `listMoveGroups`  │
│                          │ • Offers Demo Sign-In CTA   │   with `MoveGroupRosterProject- │
│                          │   when `viewer === GUEST`   │   ion` masking non-friends      │
└──────────────────────────┴─────────────────────────────┴─────────────────────────────────┘
```

### 2.2 Next.js 16 `cacheComponents` & Async `params` Mechanics

`apps/web/next.config.ts` enables Next.js 16.4.6 Cache Components (`cacheComponents: true`, replacing legacy Partial Prerendering flags). Under this architecture, Next.js enforces two strict invariants on dynamic route segments such as `src/app/events/[id]/page.tsx`:

1. **No Unwrapped Runtime Reads in Page Body**: `params` is a `Promise<{ id: string }>`. Awaiting `params` at the top level of `EventDetailPage` outside a `<Suspense>` boundary blocks static shell prerendering and triggers a Next.js 16 dynamic-IO validation error. Therefore, `EventDetailPage` is a **synchronous** Server Component that immediately emits the outer layout container and `<Suspense fallback={<DetailPageSkeleton />}>`, passing the unawaited `params` Promise into the async child Server Component `EventDetailLoader`.
2. **No Runtime Promises Inside `"use cache"` Scopes**: Placing `"use cache"` directly inside `generateMetadata({ params })` causes Next.js to capture the request-time `params` Promise inside a cache scope. During build/prerender, Next.js throws or times out after 50 seconds with:
   > `Error: Filling a cache during prerender timed out, likely because request-specific arguments such as params, searchParams, cookies() or uncached data were used inside "use cache".`
   
   To satisfy Next.js 16's serialization and cache-key rules, `generateMetadata` awaits `const { id } = await params` **outside** the cache boundary, then passes the resolved primitive `id: string` into `buildCachedPublicMetadata(id)`. Because `id` is a serializable string primitive, Next.js hashes `(BuildID, FunctionID, id)` into a deterministic in-memory cache entry.

### 2.3 Browser-Local `evt-local-*` Resolution & Hydration Gate

Milestone 1 persists user-created Moves (`evt-local-101`, `evt-local-102`, ...) and edits to seeded Moves inside `window.localStorage` (`sesh.m1.demo-store.v1`), while the active demo viewer session (`GUEST`, `user-maya`, `user-jordan`, `user-tyler`) lives in `window.localStorage` (`sesh.m1.demo-viewer.v1`).

This creates a subtle client/server split:
- **On the Node.js server**, `window.localStorage` does not exist. The server only knows the 14 deterministic seed records in `SEED_EVENTS`. If `EventDetailLoader` called Next.js `notFound()` on the server whenever an ID was absent from `SEED_EVENTS`, refreshing `/events/evt-local-101` would hard-404 even though the Move exists in the user's browser!
- **During initial client render (pre-hydration)**, `SeshProvider` initializes with `STATIC_FALLBACK_ANCHOR_ISO` (`2026-11-11T21:00:00.000Z`), `storage: null`, and default persona `Maya Patel` so server HTML and initial React hydration match bit-for-bit. `isHydrated` flips to `true` inside `SeshProvider`'s mount `useEffect` immediately after `adapter.attachBrowserStorage(window.localStorage, runtimeNow)` and `SESH_SESSION_STORAGE_KEY` restoration complete.
- **Inside `EventDetailView`**, checking `if (!isHydrated) return <DetailPageSkeleton />;` guarantees:
  1. Zero hydration mismatches between server-rendered fallback HTML and client-hydrated DOM.
  2. Zero transient flashes of `"Move Not Found"` when refreshing `/events/evt-local-*`.
  3. Zero transient flashes of Maya Patel's permissions if the user's persisted `localStorage` identity is `GUEST` or `Tyler Nguyen`!
  4. Once `isHydrated === true`, genuinely invalid URLs (e.g., `/events/does-not-exist`) render a dedicated `"Move Not Found"` `<EmptyState>` identical in layout and affordances to `src/app/events/[id]/not-found.tsx`.

### 2.4 Multi-Tier Event Visibility & Address Privacy Matrix

`EventDetailView` never touches `EventRecord` or `MoveGroupRecord`. All reads flow through `adapter.getEvent(eventId, viewer)` and `adapter.listMoveGroups(viewer, event.id)`, backed by `src/lib/permissions/policies.ts`:

| Event State / Privacy Setting | `GUEST` Viewer | Non-Friend GT `MEMBER` (e.g. Tyler) | Friend GT `MEMBER` (e.g. Jordan) | Event Host `MEMBER` (e.g. Maya) | Server OpenGraph (`getServerSafePublicEventMetadata`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`status: "CANCELLED"`** | `NOT_FOUND` | `NOT_FOUND` | `NOT_FOUND` | `NOT_FOUND` | `null` → Generic `"Campus Move"` |
| **`status: "DRAFT"`** | `RESTRICTED` (draft reason) | `RESTRICTED` (draft reason) | `RESTRICTED` (draft reason) | `OK` + Amber Draft Banner + Edit CTA | `null` → Generic `"Campus Move"` |
| **`visibility: "PUBLIC"`** | `OK` (read-only; prompts on actions) | `OK` | `OK` | `OK` + `canEdit: true` | Public title, category, `publicDisplayLocation`, admission |
| **`visibility: "FRIENDS"`** | `RESTRICTED` (audience reason) | `RESTRICTED` (audience reason) | `OK` | `OK` + `canEdit: true` | `null` → Generic `"Campus Move"` |
| **`visibility: "CUSTOM" \| "INVITE_ONLY"`** | `RESTRICTED` (audience reason) | `OK` only if in `customAllowedUserIds`, else `RESTRICTED` | `OK` only if in `customAllowedUserIds`, else `RESTRICTED` | `OK` + `canEdit: true` | `null` → Generic `"Campus Move"` |
| **`addressPrivacy: "PUBLIC_VENUE"`** | Locked card (`unlockedPrivateAddress: undefined`) | Unlocked Exact Address | Unlocked Exact Address | Unlocked Exact Address | `publicDisplayLocation` only (NEVER `privateAddress`) |
| **`addressPrivacy: "RSVP_GOING_ONLY"`** | Locked card + Switch to Member CTA | Unlocked iff `GOING` or in Event Move Group | Unlocked iff `GOING` or in Event Move Group | Unlocked Exact Address | `publicDisplayLocation` only (NEVER `privateAddress`) |
| **`addressPrivacy: "APPROVED_GROUP_OR_HOST"`** | Locked card + Switch to Member CTA | Unlocked iff accepted in Event Move Group | Unlocked iff accepted in Event Move Group | Unlocked Exact Address | `publicDisplayLocation` only (NEVER `privateAddress`) |
| **`addressPrivacy: "HOST_ONLY"`** | Locked card + Switch to Member CTA | Locked card (`HOST_ONLY` hint) | Locked card (`HOST_ONLY` hint) | Unlocked Exact Address | `publicDisplayLocation` only (NEVER `privateAddress`) |

---

## 3. Detailed Sub-Iteration Changelogs (`1.03.1` – `1.03.4`)

### 3.1 Sub-Iteration `1.03.1` — Domain, Adapter & Privacy Policy Audit

- **Objective**: Audit upstream contracts in `domain.ts`, `adapter.ts`, `policies.ts`, `sesh-provider.tsx`, `dates.ts`, and `components/shared/*` before writing any component code so every privacy invariant, timestamp formatter, and state subscription mechanism is honored without duplicating business logic.
- **Files Touched**: Read-only architectural inspection across shared foundation modules (0 code files mutated; established exact design blueprint for the 8 `1.03` files).
- **Design & Security Decisions**:
  1. **Strict Separation of `publicDisplayLocation`, `venue`, and `unlockedPrivateAddress`**: Verified in `projectEventForViewer` (`policies.ts`) that `EventView` strips `EventRecord.privateAddress` unless `canViewPrivateAddress` evaluates to `true`, populating `hasPrivateAddress: boolean` and `privateAddressUnlockHint?: string` instead. UI components therefore branch strictly on `Boolean(event.unlockedPrivateAddress)` vs `event.hasPrivateAddress`.
  2. **Move Group Roster Masking Contract**: Verified `MoveGroupRosterProjection` guarantees `creator` is always visible to authorized group viewers, `visibleMembers` contains all non-creator members for accepted members (`isFullRosterVisible: true`) or **only** viewer friends for non-members (`isFullRosterVisible: false`), and `anonymousMemberCount` aggregates remaining non-friend members with zero hidden IDs or avatars.
  3. **Reactive Adapter Revision Counter**: Verified `SeshProvider` subscribes to `adapter.subscribe(...)` and increments `revision: number` on every mutation (`setEventResponse`, `createMoveGroup`, `resetDemoData`), meaning any component consuming `useSesh()` automatically re-renders with fresh adapter state when mutations occur.
  4. **Campus Timezone Standardization**: Selected `formatEventTimeRange`, `formatEventDateTime`, `formatMeetupTime`, and `classifyEventTimeWindow` from `@/lib/dates` so every rendered timestamp is anchored to `America/New_York` (`ET`) regardless of browser OS timezone.
- **Reference Upstream Contract Inspected**:

```ts
// Inspected from apps/web/src/lib/data/adapter.ts
export type EventLookupResult =
  | { status: "OK"; event: EventView }
  | { status: "RESTRICTED"; reason: string }
  | { status: "NOT_FOUND" };

export function getServerSafePublicEventMetadata(
  eventId: string,
  anchorIso: string = STATIC_FALLBACK_ANCHOR_ISO
): PublicEventMetadata | null;
```

- **Edge Cases Identified**:
  - Guests clicking RSVP or Create Move Group must not trigger uncaught `SeshAdapterError("UNAUTHENTICATED")`; components must gate actions upfront via `requireDemoMember(actionDescription)` to open the global Demo Sign-In modal.
  - Hosts viewing their own unpublished `DRAFT` Move (`evt-draft-loft-listening` when signed in as Maya) receive `status: "OK"` with `event.status === "DRAFT"`, which blocks `adapter.createMoveGroup` (`"Choose a published event before creating a Move Group"`). Thus `EventMoveGroupsSection` must disable Move Group creation when `event.status !== "PUBLISHED"`.
- **Verification Notes**: Confirmed `next.config.ts` had `cacheComponents: true` and `partialPrefetching: true`, dictating strict `<Suspense>` wrapping for dynamic `params` in `1.03.2` and `1.03.4`.

---

### 3.2 Sub-Iteration `1.03.2` — Core Route & Interactive Event Modules Build

- **Objective**: Implement all 8 owned Event Detail files covering the route entry, not-found boundary, main detail view, RSVP controls, friends-going social proof card, associated Move Groups section, share button, and simulated moderation report dialog.
- **Files Touched**:
  - `apps/web/src/app/events/[id]/page.tsx` (created)
  - `apps/web/src/app/events/[id]/not-found.tsx` (created)
  - `apps/web/src/components/events/event-detail-view.tsx` (created)
  - `apps/web/src/components/events/rsvp-controls.tsx` (created)
  - `apps/web/src/components/events/friends-going-card.tsx` (created)
  - `apps/web/src/components/events/event-move-groups-section.tsx` (created)
  - `apps/web/src/components/events/share-event-button.tsx` (created)
  - `apps/web/src/components/events/report-event-dialog.tsx` (created)
- **Design & Security Decisions**:
  1. **Three-Way Lookup Branching in `EventDetailView`**: Implemented dedicated UI trees for `!isHydrated` (`<DetailPageSkeleton />`), `NOT_FOUND` (`<EmptyState>`), `RESTRICTED` (amber shield card rendering only `lookup.reason` + Guest/Member persona guidance), and `OK` (full two-column layout + Move Groups section).
  2. **Dynamic Address Unlock Toast Feedback**: In `RsvpControls`, compared `!event.unlockedPrivateAddress && updated.unlockedPrivateAddress` immediately after `adapter.setEventResponse(event.id, "GOING", viewer, nowIso)` so users RSVPing `GOING` to an `RSVP_GOING_ONLY` house party (like `evt-home-park-vinyl`) receive an explicit toast notifying them that the exact street address just unlocked in the Location card.
  3. **Broken Cover Image Resilience**: Tracked `failedCoverUrl: string | null` state in `EventDetailView` via `<img onError={() => setFailedCoverUrl(event.coverImage ?? null)} />` rather than a boolean `imgError` flag. Keying failure state by URL ensures that if the host edits the Move's `coverImage` URL or the user navigates client-side, a new valid URL automatically renders without needing a `useEffect` reset!
  4. **Three-Tier Share Fallback**: Built `ShareEventButton` to attempt `navigator.share` first (ignoring user cancellation `DOMException` with `name === "AbortError"`), then `navigator.clipboard.writeText(url)`, then a hidden `readonly` `<textarea>` `document.execCommand("copy")` fallback, and finally an informational toast displaying the raw URL if all browser clipboard APIs are blocked.
  5. **Honest Prototype Moderation Framing**: Built `ReportEventDialog` with `<DemoNoticeBanner title="Simulated Demo Moderation Action">` inside the modal and clear toast copy confirming no network ticket was transmitted.
- **Representative Implementation Snippet (Interactive RSVP & Live Address Unlock)**:

```tsx
// apps/web/src/components/events/rsvp-controls.tsx
const handleToggleResponse = (target: EventResponseType) => {
  if (!requireDemoMember("RSVP or save this event")) {
    return;
  }

  const nextResponse = event.viewerResponse === target ? null : target;

  try {
    const updated = adapter.setEventResponse(
      event.id,
      nextResponse,
      viewer,
      nowIso
    );

    if (nextResponse === null) {
      toast.info("Cleared your response for this Move");
    } else if (nextResponse === "GOING") {
      if (
        !event.unlockedPrivateAddress &&
        updated.unlockedPrivateAddress
      ) {
        toast.success("You're marked as Going!", {
          description:
            "Exact host address is now unlocked in the Location section.",
        });
      } else {
        toast.success("You're marked as Going!");
      }
    } else if (nextResponse === "INTERESTED") {
      toast.success("Marked as Interested");
    } else if (nextResponse === "SAVED") {
      toast.success("Saved to your Moves");
    }
  } catch (err) {
    const message =
      err instanceof SeshAdapterError
        ? err.message
        : "Unable to update RSVP right now.";
    toast.error(message);
  }
};
```

- **Edge Cases Handled**:
  - Clicking an already-active RSVP button (`event.viewerResponse === target`) passes `null` to `adapter.setEventResponse`, cleanly removing the response row and re-locking `RSVP_GOING_ONLY` private addresses if the viewer isn't also in an Event Move Group.
  - Singular vs. plural grammar across every counter (`1 student` vs `2 students`, `1 spot` vs `2 spots`, `1 active crew` vs `2 active crews`, `Includes your friend ...` vs `Includes your friends ...`).
  - Move Group owner shortcut (`Manage (N)`) surfaces live pending join-request counts (`group.ownerManagement?.pendingRequests.length`) directly on the Event Detail page when `group.canManage === true`.
- **Verification Notes**: Ran ESLint across all 8 files; 0 errors, surfaced 2 `react-hooks/exhaustive-deps` warnings on `revision` inside `useMemo` arrays, which were targeted in `1.03.3`.

---

### 3.3 Sub-Iteration `1.03.3` — Hook Dependency Cleanup & Render Determinism Audit

- **Objective**: Eliminate `react-hooks/exhaustive-deps` warnings on `useMemo` in `EventDetailView` and `EventMoveGroupsSection`, and verify strict React 19 / Next.js 16 render determinism across all 8 owned files.
- **Files Touched**:
  - `apps/web/src/components/events/event-detail-view.tsx` (updated)
  - `apps/web/src/components/events/event-move-groups-section.tsx` (updated)
- **Design & Security Decisions**:
  1. **Direct Synchronous Adapter Projection over Artificial `useMemo` Cache-Busting**: In `1.03.2`, `adapter.getEvent(eventId, viewer)` and `adapter.listMoveGroups(viewer, event.id)` were wrapped in `useMemo(..., [adapter, ..., revision])`. Because `adapter` is a mutable singleton whose internal state mutates when `SeshProvider` bumps `revision`, ESLint's `react-hooks/exhaustive-deps` rule flags `revision` as an unused dependency inside the `useMemo` callback—yet removing `revision` from `useMemo` would serve stale memoized views after an RSVP! Computing `const lookup = adapter.getEvent(eventId, viewer)` and `const moveGroups = adapter.listMoveGroups(viewer, event.id)` directly during render (over an in-memory array of ~14 events and ~6 groups) executes in sub-millisecond time, always reflects the latest `SeshProvider` render triggered by `revision`, and produces zero ESLint warnings.
  2. **Zero Impure Render Calls**: Audited every component and helper in `src/app/events/[id]/*` and `src/components/events/*` to ensure `new Date()`, `Date.now()`, `Math.random()`, and `crypto.randomUUID()` are never invoked during render; time-window classification (`Happening Now`, `Tonight`, `This Weekend`, `Upcoming`, `Past Move`) uses `classifyEventTimeWindow(event.startAt, event.endAt, nowIso)` driven by `SeshProvider`'s deterministic `nowIso`.
- **Code Diff Applied**:

```tsx
// apps/web/src/components/events/event-detail-view.tsx
export function EventDetailView({ eventId }: EventDetailViewProps) {
  const { adapter, viewer, nowIso, isHydrated, requireDemoMember } =
    useSesh();
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);

  const lookup = adapter.getEvent(eventId, viewer);
  // ...
```

```tsx
// apps/web/src/components/events/event-move-groups-section.tsx
export function EventMoveGroupsSection({
  event,
  className,
}: EventMoveGroupsSectionProps) {
  const { adapter, viewer, requireDemoMember } = useSesh();

  const moveGroups = adapter.listMoveGroups(viewer, event.id);
  // ...
```

- **Edge Cases Handled**:
  - Toggling `GOING` in `RsvpControls` calls `adapter.setEventResponse(...)` → `adapter.emit()` → `SeshProvider` increments `revision` → `EventDetailView` re-renders immediately with updated `goingCount`, `viewerResponse`, `friendsGoing`, and `unlockedPrivateAddress` without stale memoization bugs.
- **Verification Notes**: Verified via `npx eslint` and ripgrep scan (`new Date\(|Date\.now\(|Math\.random\(|crypto\.randomUUID\(` → 0 matches across `src/app/events/[id]` and `src/components/events`).

---

### 3.4 Sub-Iteration `1.03.4` — Move Groups Section Heading Polish & Next.js 16 Cached Metadata Verification

- **Objective**: Polish the `EventMoveGroupsSection` accessible heading copy (`Move Groups` + visible count badge) and harden `src/app/events/[id]/page.tsx` so `generateMetadata` decouples dynamic `await params` resolution from the `"use cache"` boundary under `cacheComponents: true`.
- **Files Touched**:
  - `apps/web/src/app/events/[id]/page.tsx` (updated)
  - `apps/web/src/components/events/event-move-groups-section.tsx` (updated)
- **Design & Security Decisions**:
  1. **Decoupling `await params` from `"use cache"` in `page.tsx`**: As documented in Next.js 16's `use-cache` specification, awaiting `params: Promise<{ id: string }>` directly inside a `"use cache"` function causes prerender cache-filling timeouts because `params` is a request-specific runtime Promise created outside the cache scope. Extracting `async function buildCachedPublicMetadata(id: string): Promise<Metadata>` with `"use cache"` and awaiting `const { id } = await params;` inside `generateMetadata` outside `"use cache"` ensures:
     - `params` resolves cleanly at request/metadata-streaming time without hanging `next build`.
     - `buildCachedPublicMetadata(id)` caches the resulting `Metadata` object keyed purely by the resolved `id: string`.
     - `getServerSafePublicEventMetadata(id)` projects **only** `PUBLISHED` + `PUBLIC` seed events (`title`, `category`, `publicDisplayLocation`, `admissionLabel`), returning `null` for `DRAFT`, `FRIENDS`, `CUSTOM`, `INVITE_ONLY`, `CANCELLED`, `evt-local-*`, and nonexistent IDs.
  2. **Clean Semantic Landmark & Heading Polish in `EventMoveGroupsSection`**: Standardized the `<section aria-labelledby="move-groups-heading">` header to the crisp campus domain term `Move Groups` paired with `<Badge variant="secondary">{moveGroups.length} visible</Badge>` so screen readers and visual users get consistent terminology matching the navigation bar and Move Groups directory.
- **Final Production Code (`page.tsx` & `event-move-groups-section.tsx` Header)**:

```tsx
// apps/web/src/app/events/[id]/page.tsx
async function buildCachedPublicMetadata(id: string): Promise<Metadata> {
  "use cache";
  const publicMeta = getServerSafePublicEventMetadata(id);

  if (!publicMeta) {
    return {
      title: "Campus Move",
      description: "View event details on Sesh Georgia Tech.",
    };
  }

  const description = `${publicMeta.category} · ${publicMeta.publicDisplayLocation} · ${publicMeta.admissionLabel}`;

  return {
    title: `${publicMeta.title} | Sesh GT`,
    description,
    openGraph: {
      title: publicMeta.title,
      description,
      type: "website",
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return buildCachedPublicMetadata(id);
}
```

```tsx
// apps/web/src/components/events/event-move-groups-section.tsx
<section className={cn("space-y-4", className)} aria-labelledby="move-groups-heading">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <h2
          id="move-groups-heading"
          className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          Move Groups
        </h2>
        <Badge variant="secondary">{moveGroups.length} visible</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Pre-event crews coordinating meetup spots, walk/rideshare timing, and arrival together.
      </p>
    </div>

    <div className="shrink-0">{renderCreateButton("default")}</div>
  </div>
  {/* ... */}
</section>
```

- **Edge Cases Handled**:
  - Link-preview bots scraping `/events/evt-friends-rooftop-sesh` (`FRIENDS` visibility) or `/events/evt-draft-loft-listening` (`DRAFT` status) receive generic `{ title: "Campus Move", description: "View event details on Sesh Georgia Tech." }` — zero title, host, or address leakage in `<head>` / OpenGraph tags.
  - Link-preview bots scraping `/events/evt-home-park-vinyl` (`PUBLIC` visibility with `RSVP_GOING_ONLY` private street address) receive `Home Park String-Light Vinyl Kickback | Sesh GT` and `House Parties · Home Park (approx. near 10th & State St) · Free · BYO non-glass` — promoting public discovery while keeping `"042 Fictional Yellow Jacket Way NW, Back Gate Code #1996"` completely absent from server HTML and metadata.
- **Verification Notes**: Passed workspace diagnostics (`ReadLints`: 0 errors) and `npx eslint` (exit code 0, 0 errors, 0 warnings).

---

## 4. TSDoc / Javadoc API & Component Reference

### 4.1 `apps/web/src/app/events/[id]/page.tsx`

```ts
/**
 * @fileoverview Next.js 16 App Router dynamic route entry for `/events/[id]`.
 * Implements Partial Prerendering (Cache Components) via a synchronous static outer shell,
 * a `<Suspense>`-wrapped async `params` reader (`EventDetailLoader`), and a `"use cache"`
 * public OpenGraph metadata builder (`buildCachedPublicMetadata`).
 */

/**
 * Builds cached, strictly public OpenGraph and `<head>` metadata for a seed Move ID.
 *
 * @function buildCachedPublicMetadata
 * @directive `"use cache"`
 * @param {string} id - Resolved route segment event identifier (e.g., `"evt-home-park-vinyl"`).
 * @returns {Promise<Metadata>} Next.js `Metadata` object containing either safe public fields
 *   or generic `"Campus Move"` fallback metadata.
 * @invariants
 *   - Accepts a resolved primitive `string` (never an unawaited `Promise`) so Next.js 16
 *     serializes `id` cleanly into the cache key without prerender timeouts.
 *   - Deterministic for any given `id` via `STATIC_FALLBACK_ANCHOR_ISO`.
 * @privacy
 *   - Delegates to `getServerSafePublicEventMetadata(id)` -> `projectPublicEventMetadata(record)`.
 *   - Returns generic fallback metadata whenever `status !== "PUBLISHED"` or `visibility !== "PUBLIC"`.
 *   - NEVER accesses or emits `EventRecord.privateAddress`, `hostId`, or restricted descriptions.
 */
async function buildCachedPublicMetadata(id: string): Promise<Metadata>;

/**
 * Next.js dynamic metadata generator for `/events/[id]`.
 *
 * @function generateMetadata
 * @param {{ params: Promise<{ id: string }> }} context - Dynamic route params promise.
 * @returns {Promise<Metadata>} Resolved page metadata.
 * @example
 * // Public seed Move -> { title: "Tech Green Sunset Beats & Mocktails | Sesh GT", ... }
 * // Friends-only Move -> { title: "Campus Move", description: "View event details on Sesh Georgia Tech." }
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata>;

/**
 * Internal async Server Component that awaits `params` inside `<Suspense>` so the outer
 * `EventDetailPage` shell prerenders statically under `cacheComponents: true`.
 *
 * @component EventDetailLoader
 * @param {{ params: Promise<{ id: string }> }} props - Unawaited route params promise.
 * @returns {Promise<React.JSX.Element>} `<EventDetailView eventId={id} />`
 */
async function EventDetailLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element>;

/**
 * Synchronous Server Component route shell for `/events/[id]`.
 *
 * @component EventDetailPage
 * @param {{ params: Promise<{ id: string }> }} props - Next.js 16 async route parameters.
 * @returns {React.JSX.Element} Centered `max-w-5xl` container wrapping `<EventDetailLoader>`
 *   inside `<Suspense fallback={<DetailPageSkeleton />}>`.
 * @invariants
 *   - MUST remain synchronous and MUST NOT `await params` outside `<Suspense>`.
 */
export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element;
```

---

### 4.2 `apps/web/src/app/events/[id]/not-found.tsx`

```ts
/**
 * @fileoverview Segment-level Next.js App Router Not Found boundary for `/events/[id]`.
 * Mirrors the client-side `NOT_FOUND` state in `EventDetailView` so both server-triggered
 * `notFound()` calls (in Milestone 2+ API mode) and client-hydrated missing IDs render
 * an identical recovery experience.
 */

/**
 * Renders the "Move Not Found" empty state with navigation back to the Events Hub (`/`).
 *
 * @component EventNotFound
 * @returns {React.JSX.Element} Centered `max-w-5xl` container with breadcrumb back-link and `<EmptyState>`.
 * @sideEffects None (pure Server Component).
 */
export default function EventNotFound(): React.JSX.Element;
```

---

### 4.3 `apps/web/src/components/events/event-detail-view.tsx`

```ts
/**
 * @fileoverview Primary client orchestrator for `/events/[id]`.
 * Consumes `useSesh()` to resolve viewer-projected `EventLookupResult` after browser
 * storage hydration, enforcing `NOT_FOUND`, `RESTRICTED`, and `OK` view boundaries,
 * draft host banners, cover image error recovery, `America/New_York` time formatting,
 * and exact-address unlock vs. locked privacy cards.
 */

export interface EventDetailViewProps {
  /** Resolved route parameter from `/events/[id]`, including `evt-*` seed IDs or `evt-local-*` IDs. */
  eventId: string;
}

/**
 * Maps `EventVisibility` enum values to human-readable badge copy and lock-icon state.
 *
 * @function formatVisibilityBadge
 * @param {EventVisibility} visibility - `"PUBLIC" | "FRIENDS" | "CUSTOM" | "INVITE_ONLY"`
 * @returns {{ label: string; isRestricted: boolean }}
 */
function formatVisibilityBadge(visibility: EventVisibility): {
  label: string;
  isRestricted: boolean;
};

/**
 * Maps `EventTimeBucket` values from `classifyEventTimeWindow` to badge copy and live indicator state.
 *
 * @function formatTimeBucketBadge
 * @param {EventTimeBucket} bucket - `"HAPPENING_NOW" | "TONIGHT" | "THIS_WEEKEND" | "UPCOMING" | "PAST"`
 * @returns {{ label: string; live?: boolean }}
 */
function formatTimeBucketBadge(bucket: EventTimeBucket): {
  label: string;
  live?: boolean;
};

/**
 * Explains *why* the current viewer has unlocked `event.unlockedPrivateAddress`.
 *
 * @function formatUnlockedAddressExplanation
 * @param {EventView} event - Viewer-projected event view with `unlockedPrivateAddress` present.
 * @returns {string} Contextual explanation for host, `PUBLIC_VENUE`, `RSVP_GOING_ONLY` (via RSVP
 *   vs. accepted Move Group), or `APPROVED_GROUP_OR_HOST`.
 */
function formatUnlockedAddressExplanation(event: EventView): string;

/**
 * Renders the full Event Detail experience for `/events/[id]`.
 *
 * @component EventDetailView
 * @param {EventDetailViewProps} props
 * @returns {React.JSX.Element}
 * @state
 *   - `failedCoverUrl: string | null` — Stores the specific `coverImage` URL that failed to load
 *     so `<img onError>` gracefully falls back to `CATEGORY_BANNER_STYLES[event.category]`.
 * @context `useSesh()` -> `{ adapter, viewer, nowIso, isHydrated, requireDemoMember }`
 * @invariants
 *   - Renders `<DetailPageSkeleton />` whenever `!isHydrated` so browser-local `evt-local-*`
 *     events and persisted `localStorage` viewer identities resolve before lookup evaluation.
 *   - Host-only controls (`/events/${event.id}/edit` buttons and `"You're hosting"` badge) render
 *     iff `event.canEdit === true`.
 *   - Never calls `new Date()` or `Date.now()` directly; delegates all date math to `@/lib/dates`
 *     using `nowIso`.
 * @privacy
 *   - When `lookup.status === "RESTRICTED"`, renders ONLY `lookup.reason` and viewer session context.
 *     Zero event title, host summary, venue, description, or address data is accessible or rendered.
 *   - When `lookup.status === "OK"`, renders `event.unlockedPrivateAddress` inside an emerald
 *     `"Unlocked Exact Address"` box iff defined; otherwise, if `event.hasPrivateAddress === true`,
 *     renders a dashed `"Exact Street Address Locked"` card with `event.privateAddressUnlockHint`.
 * @example
 * <EventDetailView eventId="evt-home-park-vinyl" />
 */
export function EventDetailView({ eventId }: EventDetailViewProps): React.JSX.Element;
```

---

### 4.4 `apps/web/src/components/events/rsvp-controls.tsx`

```ts
/**
 * @fileoverview Interactive 3-way attendance & bookmark control card (`GOING`, `INTERESTED`, `SAVED`)
 * with live campus counts, toggle-to-clear semantics, Guest sign-in gating, and address-unlock feedback.
 */

export interface RsvpControlsProps {
  /** Viewer-projected event model providing counts, `viewerResponse`, and address privacy metadata. */
  event: EventView;
  /** Optional Tailwind class overrides for outer `<Card>`. */
  className?: string;
}

/**
 * Renders interactive Going, Interested, and Save buttons for a Move.
 *
 * @component RsvpControls
 * @param {RsvpControlsProps} props
 * @returns {React.JSX.Element}
 * @context `useSesh()` -> `{ adapter, viewer, nowIso, requireDemoMember }`
 * @sideEffects
 *   - In `GUEST` mode: Calls `requireDemoMember("RSVP or save this event")`, opening the global
 *     Demo Sign-In prompt without mutating adapter state.
 *   - In `MEMBER` mode: Calls `adapter.setEventResponse(event.id, nextResponse, viewer, nowIso)`,
 *     persisting to `localStorage`, notifying subscribers (`revision++`), and firing `sonner` toasts.
 * @throws Catches `SeshAdapterError` internally and surfaces `err.message` via `toast.error(...)`.
 * @invariants
 *   - Each button sets `aria-pressed={event.viewerResponse === opt.type}` for screen-reader accessibility.
 *   - Clicking the currently active `EventResponseType` transitions `nextResponse` to `null` (clearing RSVP).
 *   - Displays a contextual `<KeyRoundIcon>` unlock hint banner iff `event.hasPrivateAddress &&
 *     !event.unlockedPrivateAddress && event.addressPrivacy === "RSVP_GOING_ONLY"`.
 * @example
 * <RsvpControls event={event} />
 */
export function RsvpControls({ event, className }: RsvpControlsProps): React.JSX.Element;
```

---

### 4.5 `apps/web/src/components/events/friends-going-card.tsx`

```ts
/**
 * @fileoverview Campus friend social-proof card displaying connected Georgia Tech friends
 * marked `GOING` alongside total campus-wide attendance counts.
 */

export interface FriendsGoingCardProps {
  /** Viewer-projected event containing `friendsGoing` (`PublicUserSummary[]`) and `goingCount`. */
  event: EventView;
  /** Optional Tailwind class overrides for outer `<Card>`. */
  className?: string;
}

/**
 * Renders viewer-scoped friend attendance social proof for an event.
 *
 * @component FriendsGoingCard
 * @param {FriendsGoingCardProps} props
 * @returns {React.JSX.Element}
 * @context `useSesh()` -> `{ viewer, requireDemoMember }`
 * @privacy
 *   - In `GUEST` mode (`viewer.mode === "GUEST"`): `event.friendsGoing` is always `[]`. Renders a
 *     dashed lock card explaining that signing in as a Demo Member reveals connected GT friends,
 *     with a CTA wired to `requireDemoMember("see which campus friends are Going")`.
 *   - In `MEMBER` mode (`viewer.mode === "MEMBER"`): Lists only accepted friends from
 *     `viewer.user.friendIds` who marked `GOING` (`UserAvatar`, `displayName`, verified badge,
 *     `@username`, graduation year), plus an aggregate count of non-friend GT students (`goingCount -
 *     friendsGoing.length`) without revealing non-friend attendee identities!
 * @example
 * <FriendsGoingCard event={event} />
 */
export function FriendsGoingCard({ event, className }: FriendsGoingCardProps): React.JSX.Element;
```

---

### 4.6 `apps/web/src/components/events/event-move-groups-section.tsx`

```ts
/**
 * @fileoverview Event-scoped Move Groups coordination section. Queries visible Move Groups via
 * `adapter.listMoveGroups(viewer, event.id)`, enforces roster privacy masking, and provides
 * Guest-aware Create Move Group and owner Manage Group entry points.
 */

export interface EventMoveGroupsSectionProps {
  /** Parent viewer-projected event (`id` and `status` govern Move Group querying and creation). */
  event: EventView;
  /** Optional Tailwind class overrides for outer `<section>`. */
  className?: string;
}

/**
 * Formats `MoveGroupDiscoverability` (`"PUBLIC" | "MY_NETWORK" | "INVITE_ONLY"`) into badge labels.
 */
function formatDiscoverabilityLabel(value: MoveGroupDiscoverability): string;

/**
 * Formats `MoveGroupJoinMode` (`"OPEN_JOIN" | "REQUEST_TO_JOIN" | "INVITE_ONLY"`) into badge labels.
 */
function formatJoinModeLabel(value: MoveGroupJoinMode): string;

/**
 * Renders a contextual `<Badge>` for the viewer's membership relation (`CREATOR`, `MEMBER`,
 * `PENDING_REQUEST`, `DECLINED_REQUEST`), or `null` for `NONE`.
 */
function renderViewerRelationBadge(relation: ViewerMoveGroupRelation): React.JSX.Element | null;

/**
 * Generates privacy-safe natural-language roster copy strictly from `MoveGroupRosterProjection`.
 *
 * @function renderRosterSummaryText
 * @param {MoveGroupView} group - Viewer-projected Move Group.
 * @returns {string}
 * @privacy
 *   - When `roster.isFullRosterVisible === true` (accepted group member or creator): Lists all
 *     member display names and notes full roster unlock.
 *   - When `roster.isFullRosterVisible === false` (non-member or Guest): Names ONLY connected
 *     friends in `roster.visibleMembers` and summarizes `roster.anonymousMemberCount` as
 *     `"+N other GT student(s) (identities hidden until joined)"`.
 */
function renderRosterSummaryText(group: MoveGroupView): string;

/**
 * Renders the Move Groups section at the bottom of Event Detail.
 *
 * @component EventMoveGroupsSection
 * @param {EventMoveGroupsSectionProps} props
 * @returns {React.JSX.Element}
 * @context `useSesh()` -> `{ adapter, viewer, requireDemoMember }`
 * @invariants
 *   - Section landmark uses `aria-labelledby="move-groups-heading"` pointing to `<h2>Move Groups</h2>`.
 *   - When `event.status !== "PUBLISHED"` (host previewing a `DRAFT` Move), the Create button is
 *     disabled with `"Publish Move to Add Groups"` so users cannot hit an invalid create state.
 *   - When `viewer.mode === "MEMBER"` and published, links to `/move-groups/new?event=${encodeURIComponent(event.id)}`.
 *   - When `viewer.mode === "GUEST"` and published, invokes `requireDemoMember("create a Move Group for this event")`.
 *   - Renders owner `/move-groups/${group.id}/manage` shortcut with live pending request badge count
 *     iff `group.canManage === true`.
 * @privacy
 *   - Consumes exclusively `MoveGroupView` projected by `adapter.listMoveGroups(viewer, event.id)`.
 *   - Never accesses `MoveGroupRecord.members`, hidden user IDs, or `externalChatLink`.
 * @example
 * <EventMoveGroupsSection event={event} />
 */
export function EventMoveGroupsSection({
  event,
  className,
}: EventMoveGroupsSectionProps): React.JSX.Element;
```

---

### 4.7 `apps/web/src/components/events/share-event-button.tsx`

```ts
/**
 * @fileoverview Progressive-enhancement Share button supporting native Web Share API
 * (`navigator.share`), async Clipboard API (`navigator.clipboard.writeText`), legacy
 * `document.execCommand("copy")` fallback, and toast URL display fallback.
 */

export interface ShareEventButtonProps {
  /** Publicly visible title for the current viewer's event view. */
  eventTitle: string;
  /** Safe public neighborhood/venue label (NEVER pass `unlockedPrivateAddress`!). */
  publicLocation?: string;
  /** Optional button class overrides. */
  className?: string;
}

/**
 * Synchronous DOM textarea fallback when `navigator.clipboard` is unavailable or denied.
 *
 * @function fallbackCopyText
 * @param {string} text - URL string to copy.
 * @returns {boolean} `true` if `document.execCommand("copy")` succeeded; `false` otherwise.
 */
function fallbackCopyText(text: string): boolean;

/**
 * Renders the Share action button in the Event Detail top toolbar.
 *
 * @component ShareEventButton
 * @param {ShareEventButtonProps} props
 * @returns {React.JSX.Element}
 * @state `justCopied: boolean` — Flips to `true` for 2000ms after clipboard copy to show `<CheckIcon>` + `"Copied"`.
 * @sideEffects Invokes `navigator.share` or clipboard write + `toast.success("Event link copied to clipboard")`.
 * @privacy
 *   - Shares `window.location.href`, `eventTitle`, and `publicLocation` (`event.publicDisplayLocation`).
 *   - NEVER embeds `unlockedPrivateAddress` in shared text payloads!
 * @example
 * <ShareEventButton eventTitle={event.title} publicLocation={event.publicDisplayLocation} />
 */
export function ShareEventButton({
  eventTitle,
  publicLocation,
  className,
}: ShareEventButtonProps): React.JSX.Element;
```

---

### 4.8 `apps/web/src/components/events/report-event-dialog.tsx`

```ts
/**
 * @fileoverview Simulated campus trust & safety moderation dialog for Milestone 1.
 * Explicitly labeled with `<DemoNoticeBanner>` so testers understand no backend moderation
 * ticket or external notification is dispatched.
 */

/**
 * Enumerated moderation categories:
 * - `"INACCURATE_INFO"` — Inaccurate time, venue, or event info
 * - `"SPAM_DUPLICATE"` — Spam, commercial flyer, or duplicate Move
 * - `"PRIVACY_CONCERN"` — Unmasked private address or personal info
 * - `"SAFETY_CONCERN"` — Campus safety or community guidelines issue
 * - `"OTHER"` — Other concern
 */
const REPORT_REASONS: readonly [
  { readonly value: "INACCURATE_INFO"; readonly label: string },
  { readonly value: "SPAM_DUPLICATE"; readonly label: string },
  { readonly value: "PRIVACY_CONCERN"; readonly label: string },
  { readonly value: "SAFETY_CONCERN"; readonly label: string },
  { readonly value: "OTHER"; readonly label: string },
];

export interface ReportEventDialogProps {
  /** Event identifier displayed in monospace inside the dialog header for clarity. */
  eventId: string;
  /** Event title being flagged. */
  eventTitle: string;
  /** Optional trigger button class overrides. */
  className?: string;
}

/**
 * Renders a Radix `<Dialog>` modal triggered by a `"Report"` toolbar button.
 *
 * @component ReportEventDialog
 * @param {ReportEventDialogProps} props
 * @returns {React.JSX.Element}
 * @state
 *   - `open: boolean` — Controls modal visibility.
 *   - `reason: string` — Selected `REPORT_REASONS[number]["value"]` (defaults to `"INACCURATE_INFO"`).
 *   - `details: string` — Optional free-text context capped at `maxLength={500}`.
 * @sideEffects Resets local form state on submit, closes dialog, and fires `toast.success`
 *   explicitly stating no real moderation ticket was sent in Milestone 1.
 * @security Never transmits user input over the network or persists sensitive report text to `localStorage`.
 * @example
 * <ReportEventDialog eventId={event.id} eventTitle={event.title} />
 */
export function ReportEventDialog({
  eventId,
  eventTitle,
  className,
}: ReportEventDialogProps): React.JSX.Element;
```

---

## 5. Regression, Security & Debugging Checklist

### 5.1 Privacy & Information-Leakage Invariants

- [ ] **Restricted Event Zero-Leakage**: Switch demo identity to `Guest` or `Tyler Nguyen` (`@tylernguyen`) and navigate to `/events/evt-friends-rooftop-sesh` (`FRIENDS` visibility hosted by Maya). Confirm the page renders `"Restricted Campus Move"` with `lookup.reason` and **zero** trace of `"Friends-Only Sq5 Rooftop Pre-Link"`, `"Maya Patel"`, or `"099 Fictional Spring St Sky Lounge"` in either the visible UI or React component props.
- [ ] **Draft Event Isolation**: Navigate to `/events/evt-draft-loft-listening` as `Jordan Brooks` (Maya's friend) or `Guest`. Confirm `RESTRICTED` renders (`"This Move is currently saved as a private draft by its host."`). Switch to `Maya Patel` (host) and confirm the amber `"Unpublished Draft — Visible only to you"` banner renders and Move Group creation is disabled until published.
- [ ] **Exact Street Address Gating (`RSVP_GOING_ONLY`)**: Navigate to `/events/evt-home-park-vinyl` as `Guest`. Confirm `"Exact Street Address Locked"` renders and `"042 Fictional Yellow Jacket Way NW"` is absent from the DOM. Switch to `Tyler Nguyen` (not initially `GOING`), verify address is still locked with the `<KeyRoundIcon>` hint in `RsvpControls`, click **Going**, and verify `"Unlocked Exact Address"` immediately appears with the toast notification. Click **Going** again to clear RSVP and verify the address re-locks immediately.
- [ ] **Exact Street Address Gating (`APPROVED_GROUP_OR_HOST`)**: Navigate to `/events/evt-friends-rooftop-sesh` as `Jordan Brooks` (friend of Maya). Confirm Jordan can view the event (`FRIENDS`), and verify `unlockedPrivateAddress` behavior matches Jordan's membership in `mg-rooftop-link` vs. non-group friends.
- [ ] **Move Group Roster Masking on Event Cards**: Navigate to `/events/evt-west-midtown-neon` as `Tyler Nguyen` (only friends with `Chloe Kim`). Confirm Move Group cards show the group creator's name/avatar, show `Chloe Kim` only if she is a member, and summarize all other non-friend members as `+N other GT student(s) (identities hidden until joined)` with zero non-friend names or avatars in the DOM.
- [ ] **Share Payload Safety**: Click **Share** on an event where the viewer has unlocked `unlockedPrivateAddress`. Confirm the shared text only includes `event.title` and `event.publicDisplayLocation` — **never** `unlockedPrivateAddress`.

### 5.2 OpenGraph & Server Metadata Leak Checks

- [ ] **Public Seed Event Metadata**: Inspect `<head>` on `curl -s http://localhost:3000/events/evt-home-park-vinyl`. Confirm `<title>` is `Home Park String-Light Vinyl Kickback | Sesh GT` and `<meta name="description">` contains `Home Park (approx. near 10th & State St)` — **never** `042 Fictional Yellow Jacket Way NW`.
- [ ] **Restricted & Draft Seed Event Metadata**: Inspect `<head>` on `curl -s http://localhost:3000/events/evt-friends-rooftop-sesh` and `curl -s http://localhost:3000/events/evt-draft-loft-listening`. Confirm `<title>` is `Campus Move` and description is `View event details on Sesh Georgia Tech.`.
- [ ] **Local-Demo & Missing Event Metadata**: Inspect `<head>` on `/events/evt-local-101` and `/events/does-not-exist`. Confirm both return safe generic metadata (`Campus Move`) without throwing 500 errors.

### 5.3 Next.js 16 Cache Components & Hydration Checks

- [ ] **No Unwrapped Async `params` in `page.tsx`**: Confirm `EventDetailPage` has no `async` keyword and passes `params` directly into `<Suspense fallback={<DetailPageSkeleton />}><EventDetailLoader params={params} /></Suspense>`.
- [ ] **No `Promise` Arguments Inside `"use cache"`**: Confirm `generateMetadata` awaits `const { id } = await params` **before** calling `buildCachedPublicMetadata(id: string)`.
- [ ] **Refresh Persistence on `evt-local-*` Moves**: Create a new Move via `/events/new` (producing `/events/evt-local-101`), then perform a hard browser reload (`Cmd+Shift+R`). Confirm `<DetailPageSkeleton />` transitions smoothly into the full Move view without flashing `"Move Not Found"`.
- [ ] **Zero Hydration Mismatch Warnings**: Open browser DevTools console while refreshing `/events/evt-tech-green-sunset` in `Guest` mode, `Jordan Brooks` mode, and across non-ET system timezones. Confirm zero React hydration mismatch errors (`Text content does not match server-rendered HTML`).

### 5.4 Symptom-to-Root-Cause Diagnostic Playbook

| Observed Symptom | Probable Root Cause | Where to Inspect & Fix |
| :--- | :--- | :--- |
| `next build` hangs for 50s with `Filling a cache during prerender timed out` | `"use cache"` was placed directly inside `generateMetadata({ params })` or passed an unawaited `params` Promise. | `src/app/events/[id]/page.tsx` — Ensure `const { id } = await params` runs in `generateMetadata` **outside** `buildCachedPublicMetadata(id)`. |
| Next.js error: `Uncached data was accessed outside of <Suspense>` | `await params` was moved into `EventDetailPage` above `<Suspense>`. | `src/app/events/[id]/page.tsx` — Keep `EventDetailPage` synchronous and `await params` inside `EventDetailLoader` wrapped in `<Suspense>`. |
| Refreshing `/events/evt-local-101` flashes `"Move Not Found"` or 404s | Server called `notFound()` on non-seed ID, or `!isHydrated` guard was removed from `EventDetailView`. | `src/components/events/event-detail-view.tsx` — Keep `if (!isHydrated) return <DetailPageSkeleton />;` before `if (lookup.status === "NOT_FOUND")`. |
| Clicking **Going** updates `localStorage` on refresh, but counts/address don't update live | `adapter.getEvent` was memoized without subscribing to `SeshProvider` re-renders, or `adapter.emit()` wasn't called. | `src/components/events/event-detail-view.tsx` — Keep `const lookup = adapter.getEvent(eventId, viewer);` un-memoized (or dependent on `revision`). |
| Cover image stays stuck on fallback banner after editing event's `coverImage` URL | Boolean `imgError` state wasn't reset when `event.coverImage` changed. | `src/components/events/event-detail-view.tsx` — Keep URL-keyed `failedCoverUrl !== event.coverImage` check so any new URL renders automatically. |
| Times shift by 1–3 hours when tested on PST/UTC machines | `Date.prototype.toLocaleTimeString()` was used without `timeZone: "America/New_York"`. | Always use `formatEventTimeRange`, `formatEventDateTime`, and `formatMeetupTime` from `@/lib/dates`. |

### 5.5 Milestone 2+ Backend API Migration Guide

When transitioning Sesh from Milestone 1's `LocalMockSeshAdapter` to the Milestone 2+ authenticated backend (`HttpSeshAdapter` + GT SSO / verified `.edu` session cookies):

1. **Server-Enforced Field Projection**: Move `projectEventForViewer`, `canViewPrivateAddress`, `projectPublicEventMetadata`, and `projectMoveGroupRoster` to the backend API layer so `privateAddress`, `customAllowedUserIds`, and non-friend Move Group member identities are **never serialized over the wire** to unauthorized clients.
2. **Server-Side `notFound()` Restoration**: Once all events live in PostgreSQL rather than `window.localStorage`, `EventDetailLoader` in `src/app/events/[id]/page.tsx` can call Next.js `notFound()` when the backend returns HTTP `404`, automatically activating `src/app/events/[id]/not-found.tsx` with true HTTP 404 status codes.
3. **Cache Invalidation Tags on Public Metadata**: Add `cacheTag(\`event-public-meta-${id}\`)` and `cacheLife("minutes")` inside `buildCachedPublicMetadata(id)` in `src/app/events/[id]/page.tsx`, and invoke `updateTag(\`event-public-meta-${id}\`)` in the Event Create/Update/Cancel mutation handlers so visibility changes (e.g., `PUBLIC` → `FRIENDS`) immediately purge cached OpenGraph metadata.
4. **Real Trust & Safety Endpoint**: Wire `ReportEventDialog.handleSubmit` to `POST /api/moderation/reports` (removing `<DemoNoticeBanner>`) with rate-limiting and authenticated reporter attribution.

---

[Back to Top](#milestone-1--agent-03-103--event-detail-technical-reference--sub-iteration-manual) · [Milestone 1 Index](../README.md) · [Root README](../../../../README.md)
