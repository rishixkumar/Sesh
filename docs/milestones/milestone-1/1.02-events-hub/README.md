[Root README](../../../../README.md) · [Milestone 1 Index](../README.md) · **1.02 — Events Hub**

---

# Milestone 1 · Agent 02 (`1.02`) — Events Hub Technical Reference & Sub-Iteration Manual

```ts
/**
 * @module       @sesh/web/features/events-hub
 * @milestone    Milestone 1 — Core MVP Frontend
 * @agent        Feature Agent 02 ("Events Hub" · 1.02)
 * @iterations   1.02.1, 1.02.2, 1.02.3, 1.02.4
 * @owner        Agent 02 (Campus Discovery Feed, Filter Controls, Time-Bucketed Sections & Event Cards)
 * @status       Verified & Production-Ready (Next.js 16.4.6 Cache Components / PPR, React 19.3, TypeScript 5, ESLint 9)
 * @route        / (apps/web/src/app/page.tsx)
 * @see          ../../../../apps/web/src/app/page.tsx
 * @see          ../../../../apps/web/src/components/events/events-hub.tsx
 * @see          ../../../../apps/web/src/components/events/event-filters.tsx
 * @see          ../../../../apps/web/src/components/events/event-section.tsx
 * @see          ../../../../apps/web/src/components/events/event-card.tsx
 * @see          ../../../../apps/web/src/lib/events-filter.ts
 * @see          ../../../../apps/web/src/lib/dates.ts
 * @see          ../../../../apps/web/src/lib/context/sesh-provider.tsx
 * @see          ../../../../apps/web/src/lib/data/adapter.ts
 * @see          ../../../../apps/web/src/lib/permissions/policies.ts
 * @see          ../../../../apps/web/src/types/domain.ts
 */
```

---

## Table of Contents

1. [Executive Summary & Scope Boundaries](#1-executive-summary--scope-boundaries)
2. [Architecture & Data-Flow Overview](#2-architecture--data-flow-overview)
   - [2.1 Partial Prerendering (PPR) & Suspense Boundary Architecture](#21-partial-prerendering-ppr--suspense-boundary-architecture)
   - [2.2 End-to-End Reactive Query & Rendering Pipeline](#22-end-to-end-reactive-query--rendering-pipeline)
   - [2.3 Deterministic Clock & Hydration Lifecycle](#23-deterministic-clock--hydration-lifecycle)
   - [2.4 Viewer Projection & Zero-Leak Privacy Model](#24-viewer-projection--zero-leak-privacy-model)
3. [Detailed Sub-Iteration Changelogs (`1.02.1` – `1.02.4`)](#3-detailed-sub-iteration-changelogs-1021--1024)
   - [3.1 Sub-Iteration `1.02.1` — Context & Contract Alignment](#31-sub-iteration-1021--context--contract-alignment)
   - [3.2 Sub-Iteration `1.02.2` — Core Hub & Card Implementation](#32-sub-iteration-1022--core-hub--card-implementation)
   - [3.3 Sub-Iteration `1.02.3` — Lint, Type & Determinism Verification](#33-sub-iteration-1023--lint-type--determinism-verification)
   - [3.4 Sub-Iteration `1.02.4` — Cross-Route CTA Alignment](#34-sub-iteration-1024--cross-route-cta-alignment)
4. [Full TSDoc / Javadoc-Style API & Component Reference](#4-full-tsdoc--javadoc-style-api--component-reference)
   - [4.1 Route Entry: `HomePage` (`src/app/page.tsx`)](#41-route-entry-homepage-srcapppagetsx)
   - [4.2 Feature Orchestrator: `EventsHub` (`src/components/events/events-hub.tsx`)](#42-feature-orchestrator-eventshub-srccomponentseventsevents-hubtsx)
   - [4.3 Control Bar: `EventFilters` (`src/components/events/event-filters.tsx`)](#43-control-bar-eventfilters-srccomponentseventsevent-filterstsx)
   - [4.4 Time-Window Container: `EventSection` (`src/components/events/event-section.tsx`)](#44-time-window-container-eventsection-srccomponentseventsevent-sectiontsx)
   - [4.5 Discovery Unit: `EventCard` (`src/components/events/event-card.tsx`)](#45-discovery-unit-eventcard-srccomponentseventsevent-cardtsx)
   - [4.6 Filter & Bucketing Pipeline: `filterEvents` & `groupEventsByTimeSection` (`src/lib/events-filter.ts`)](#46-filter--bucketing-pipeline-filterevents--groupeventsbytimesection-srclibevents-filterts)
   - [4.7 Timezone & Window Engine: `classifyEventTimeWindow`, `matchesTimeWindowFilter`, `formatEventTimeRange` (`src/lib/dates.ts`)](#47-timezone--window-engine-classifyeventtimewindow-matchestimewindowfilter-formateventtimerange-srclibdatests)
5. [Regression & Error-Checking Matrix](#5-regression--error-checking-matrix)
   - [5.1 Filter & Search Invariants](#51-filter--search-invariants)
   - [5.2 Timezone (`America/New_York`) Boundary Invariants](#52-timezone-americanew_york-boundary-invariants)
   - [5.3 Privacy, Audience Visibility & Private Address Invariants](#53-privacy-audience-visibility--private-address-invariants)
   - [5.4 Guest-Mode Interception & Member RSVP Mutation Checks](#54-guest-mode-interception--member-rsvp-mutation-checks)
   - [5.5 Next.js 16 Cache Components / Hydration Diagnostics Playbook](#55-nextjs-16-cache-components--hydration-diagnostics-playbook)

---

## 1. Executive Summary & Scope Boundaries

Feature Agent 02 (`1.02` — **Events Hub**) owns the primary campus discovery feed mounted at `/` (`apps/web/src/app/page.tsx`) for **Sesh**, an 18+ social event discovery and group coordination platform launching at **Georgia Tech & Midtown Atlanta**.

During Milestone 1 parallel multi-agent execution, strict file-ownership boundaries were enforced across five concurrent feature agents (`1.01` through `1.05`). Agent 02 exclusively authored and maintained five source files while consuming shared foundational contracts (`src/types/domain.ts`, `src/lib/context/sesh-provider.tsx`, `src/lib/data/adapter.ts`, `src/lib/events-filter.ts`, `src/lib/dates.ts`, and `src/components/shared/*`).

### Owned Artifact Inventory

| File Path (relative to `apps/web/`) | Layer | Role & Responsibility |
| --- | --- | --- |
| `src/app/page.tsx` | App Router Server Entry | Exports static route `metadata` and wraps `<EventsHub />` inside `<Suspense fallback={<EventGridSkeleton count={6} />}>` for Next.js 16 Partial Prerendering (`cacheComponents: true`). |
| `src/components/events/events-hub.tsx` | Client Feature Orchestrator | Renders the `Georgia Tech` campus header, `Start a Move Group` (`/move-groups/new`) and `Create a Move` (`/events/new`) CTAs, `DemoNoticeBanner`, host-only `Your Saved Drafts` strip, `?q=` URL-synced filter state, ordered time-window sections, and filter-aware `EmptyState`. |
| `src/components/events/event-filters.tsx` | Client Controlled UI | Controlled search box, segmented `TimeWindowFilter` bar, segmented `PriceFilter` bar, 8-pill `EventCategory` selector, active results summary counter, active filter badges, and `Clear filters` reset trigger. |
| `src/components/events/event-section.tsx` | Client Section Wrapper | Accessible `<section aria-labelledby="...">` wrapper with `useId()` fallback, optional emerald live ping indicator (`isLive`), tabular count badge, subtitle, and responsive 3-column `EventCard` grid. |
| `src/components/events/event-card.tsx` | Client Discovery Card | Privacy-hardened event card featuring resilient `<img>` cover rendering with `onError` state fallback, `America/New_York` schedule formatting, approximate-area private-address lock notice, audience/source badges, verified student host row, social proof (`goingCount`, `friendsGoing`, `moveGroupCount`), and Guest-gated Save / RSVP controls with `sonner` toast feedback. |

---

## 2. Architecture & Data-Flow Overview

### 2.1 Partial Prerendering (PPR) & Suspense Boundary Architecture

`@sesh/web` runs on **Next.js 16.4.6** with `cacheComponents: true` and `partialPrefetching: true` enabled in `apps/web/next.config.ts`. Under this model:

1. **Static Route Shell Prerendering:** `HomePage` (`src/app/page.tsx`) is a pure synchronous Server Component with static `metadata`. At build time (`next build`), Next.js prerenders the outer layout shell and injects `<EventGridSkeleton count={6} />` as the instant streaming fallback.
2. **Dynamic Request-Time / Client Hook Isolation:** `EventsHub` (`"use client"`) invokes `useSearchParams()` from `next/navigation` to synchronize with `?q=` search queries originating from the global `SiteHeader` search bar or shared deep links. Because `useSearchParams()` accesses dynamic URL query parameters, Next.js 16 requires a `<Suspense>` ancestor boundary above any component reading it; otherwise static shell generation aborts with a dynamic-access prerender error.
3. **Zero Impure Render Calls:** Neither `HomePage` nor any child inside `src/components/events/*` calls `new Date()`, `Date.now()`, `Math.random()`, `crypto.randomUUID()`, `window.*`, or `localStorage.*` during render or at module initialization scope.

### 2.2 End-to-End Reactive Query & Rendering Pipeline

```text
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Route Request: GET / or GET /?q=midtown                                           │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ HomePage (Server Component — apps/web/src/app/page.tsx)                           │
│  • Exports static Metadata ("Georgia Tech Events Hub | Sesh")                     │
│  • Renders <Suspense fallback={<EventGridSkeleton count={6} />}>                  │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ EventsHub (Client Component — apps/web/src/components/events/events-hub.tsx)      │
│  • Subscribes to SeshProvider: { adapter, viewer, nowIso, revision }              │
│  • Reads URL query: urlQuery = useSearchParams().get("q") ?? ""                   │
│  • Reconciles external urlQuery changes during render via [prevUrlQuery, search]  │
│  • Holds local controlled filter state: search, category, price, timeWindow       │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Adapter Read & Viewer Projection (SeshDataAdapter.listEvents)                     │
│  adapter.listEvents(viewer, {                                                     │
│    search, category, price, timeWindow,                                           │
│    includeDraftsOwnedByViewer: viewer.mode === "MEMBER"                           │
│  }, nowIso)                                                                       │
│                                                                                   │
│  1. Merges seed events (anchored to adapter.anchorIso) + editedSeedEvents         │
│     + localEvents from browser overlay state.                                     │
│  2. Projects each EventRecord -> EventView | null via projectEventForViewer():    │
│     - Hides CANCELLED events from all viewers.                                    │
│     - Hides DRAFT events unless viewer is the host.                               │
│     - Enforces PUBLIC / FRIENDS / CUSTOM / INVITE_ONLY visibility rules.          │
│     - Strips privateAddress unless canViewPrivateAddress() passes.                │
│     - Computes goingCount, interestedCount, savedCount, friendsGoing,             │
│       viewerResponse, moveGroupCount (filtered by canViewMoveGroup), canEdit.     │
│  3. Filters & sorts chronologically via filterEvents(projected, criteria, nowIso).│
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Time-Window Bucketing (groupEventsByTimeSection(events, nowIso))                  │
│  Partitions EventView[] in America/New_York relative to nowIso into:              │
│   • drafts       (event.status === "DRAFT" && event.canEdit)                      │
│   • happeningNow (startMs <= nowMs < endMs)                                       │
│   • tonight      (same NY calendar date OR late-night < 04:00 ET within 14h)      │
│   • thisWeekend  (Fri 16:00 ET .. Sun 23:59 ET of current NY week)                │
│   • upcoming     (future events beyond current weekend window)                    │
│   • [PAST]       (endMs <= nowMs -> discarded from discovery feed)                │
└───────────────┬───────────────────────────────────────────┬───────────────────────┘
                │                                           │
                ▼                                           ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│ Host Drafts Banner (Conditional)      │   │ Published Feed Branching              │
│  • Rendered iff viewer.mode=="MEMBER" │   │  • publishedCount === 0:              │
│    && sections.drafts.length > 0      │   │      <EmptyState /> (filter-aware)    │
│  • Compact cards with category badge, │   │  • timeWindow === "ALL":              │
│    title link (/events/[id]), ET time │   │      4x <EventSection /> in order:    │
│    range, publicDisplayLocation, and  │   │      Happening Now -> Tonight ->      │
│    "Continue editing" CTA to          │   │      This Weekend -> Upcoming         │
│    /events/[id]/edit                  │   │  • Specific timeWindow:               │
└───────────────────────────────────────┘   │      Single matching <EventSection /> │
                                            └───────────────────┬───────────────────┘
                                                                ▼
                                            ┌───────────────────────────────────────┐
                                            │ EventCard (per EventView)             │
                                            │  • Cover <img> w/ onError fallback    │
                                            │    OR category gradient + icon        │
                                            │  • Public location + lock indicator   │
                                            │    (NEVER unlockedPrivateAddress)     │
                                            │  • Guest Save -> requireDemoMember()  │
                                            │  • Member Save/RSVP ->                │
                                            │    adapter.setEventResponse()         │
                                            │    -> adapter.emit() -> revision++    │
                                            │    -> EventsHub useMemo recomputes!   │
                                            └───────────────────────────────────────┘
```

### 2.3 Deterministic Clock & Hydration Lifecycle

To prevent React hydration mismatches (`Text content does not match server-rendered HTML`) while still rendering live relative time buckets (`Happening Now`, `Tonight`, `This Weekend`, `Upcoming`):

1. **Pre-Hydration Pass (Server & Initial Client Render):** `SeshProvider` initializes `nowIso` to `STATIC_FALLBACK_ANCHOR_ISO` (`"2026-11-11T21:00:00.000Z"`, which corresponds to Wednesday, Nov 11, 2026 at 4:00 PM EST) and initializes `LocalMockSeshAdapter` with `storage: null`. Both SSR HTML and the initial client render compute identical `EventView` lists and ET time labels.
2. **Post-Mount Hydration (`useEffect` inside `SeshProvider`):** Once mounted in the browser, `SeshProvider` captures `runtimeNow = new Date().toISOString()`, calls `adapter.attachBrowserStorage(window.localStorage, runtimeNow)`, restores any saved persona from `sesh.m1.demo-viewer.v1`, increments `revision`, updates `nowIso`, and starts a `60_000ms` interval timer to advance `nowIso` every minute.
3. **Memo Invalidation Guarantee:** `EventsHub` includes `adapter`, `viewer`, `search`, `category`, `price`, `timeWindow`, `nowIso`, and `revision` in its `useMemo` dependency array (`void revision;`), guaranteeing immediate synchronous re-projection whenever an RSVP is toggled on an `EventCard`, a demo persona is switched in the header, or demo data is reset on `/profile`.

### 2.4 Viewer Projection & Zero-Leak Privacy Model

`EventsHub` and `EventCard` strictly consume `EventView` DTOs projected by `projectEventForViewer` (`src/lib/permissions/policies.ts`), never internal `EventRecord` objects. Furthermore, as a defense-in-depth invariant for a public discovery surface:

- **Audience Filtering:** Events with `visibility: "FRIENDS"`, `"CUSTOM"`, or `"INVITE_ONLY"` are filtered out before reaching `EventsHub` when `viewer.mode === "GUEST"` or when the signed-in member is outside the permitted audience. For example, seed event `evt-friends-rooftop-sesh` (*Friends-Only Sq5 Rooftop Pre-Link*, hosted by `user-maya`) appears for `Maya Patel` and her friend `Jordan Brooks`, but is completely absent for `Guest` and non-friend `Tyler Nguyen`.
- **Card-Level Exact Address Suppression:** Even if `event.unlockedPrivateAddress` is populated on `EventView` (because the viewer is the host or marked `GOING`), **`EventCard` never renders `event.unlockedPrivateAddress`**. Feed cards always display `event.publicDisplayLocation` alongside the amber lock notice `"Approx. area · Exact address protected"` whenever `event.hasPrivateAddress === true`. Exact private street addresses are surfaced exclusively on the dedicated `/events/[id]` detail view (`1.03`) or host preview (`1.04`).

---

## 3. Detailed Sub-Iteration Changelogs (`1.02.1` – `1.02.4`)

---

### 3.1 Sub-Iteration `1.02.1` — Context & Contract Alignment

#### Objective
Audit all shared Milestone 1 domain types, adapter contracts, permission policies, `America/New_York` date utilities, shared UI primitives, and Next.js 16 `cacheComponents` constraints prior to authoring any Events Hub UI code.

#### Files Inspected (Read-Only Audit)
- `apps/web/src/types/domain.ts`
- `apps/web/src/lib/context/sesh-provider.tsx`
- `apps/web/src/lib/data/adapter.ts`
- `apps/web/src/lib/permissions/policies.ts`
- `apps/web/src/lib/dates.ts`
- `apps/web/src/lib/events-filter.ts`
- `apps/web/src/lib/mock/seed.ts`
- `apps/web/src/components/shared/{page-header,empty-state,demo-notice-banner,loading-skeletons,user-avatar}.tsx`
- `apps/web/next.config.ts`

#### Technical Rationale & Architectural Decisions
1. **Suspense Isolation for `useSearchParams()`:** Confirmed `next.config.ts` enables `cacheComponents: true`. Any component calling `useSearchParams()` must sit beneath a `<Suspense>` boundary in `src/app/page.tsx` using `<EventGridSkeleton count={6} />` from `loading-skeletons.tsx` so static shell prerendering succeeds without opting the route shell out of PPR.
2. **Draft Exclusion from Published Result Totals:** Inspected `filterEvents()` in `src/lib/events-filter.ts` and observed a critical subtlety:
   ```ts
   if (event.status === "DRAFT") {
     return Boolean(criteria.includeDraftsOwnedByViewer && event.canEdit);
   }
   ```
   When `includeDraftsOwnedByViewer: true` is passed to `adapter.listEvents()`, viewer-owned `DRAFT` events bypass category, price, time-window, and search filters so the host never loses sight of their unpublished drafts at the top of the hub! Consequently, `totalResultsCount` passed to `EventFilters` and the empty-feed check (`publishedCount === 0`) **must** sum only the four published buckets (`happeningNow + tonight + thisWeekend + upcoming`) rather than `events.length` — otherwise a host with 1 saved draft and 0 matching published events would see `"Showing 1 Move"` above an empty published grid.
3. **Seed Data Coverage Verification:** Verified in `src/lib/mock/seed.ts` that the 14 Georgia Tech seed events span all 7 `EVENT_CATEGORIES`, both `FREE` and `PAID` admission models, `PUBLIC` and `FRIENDS` visibilities, `PUBLIC_VENUE` / `RSVP_GOING_ONLY` / `APPROVED_GROUP_OR_HOST` address privacy modes, and all four active time buckets (`HAPPENING_NOW`: 2, `TONIGHT`: 3 including 1 `FRIENDS`-only, `THIS_WEEKEND`: 5, `UPCOMING`: 4).

#### Edge Cases Solved in Design Phase
- Prevented draft-count contamination of `publishedCount` and `EmptyState` branching.
- Mapped `SeshContextValue.revision` into `EventsHub` memo dependencies because `adapter` is a stable singleton reference (`getSharedAdapter()`) whose internal `this.state.responses` array mutates in place on `setEventResponse`. Without depending on `revision`, `useMemo` would return stale RSVP states after clicking Save/Going.

#### Verification
Confirmed all required icons in `lucide-react` and UI primitives (`Card`, `Badge`, `Button`, `Input`, `DropdownMenu`, `Avatar`) were already installed in `apps/web/package.json` without needing any `npm install` modifications.

---

### 3.2 Sub-Iteration `1.02.2` — Core Hub & Card Implementation

#### Objective
Implement all five Events Hub files (`page.tsx`, `events-hub.tsx`, `event-filters.tsx`, `event-section.tsx`, `event-card.tsx`) fulfilling campus discovery, live search, multi-axis filtering, host draft recovery, privacy-safe location rendering, and Guest-aware Save/RSVP interactions.

#### Files Created / Modified
- `apps/web/src/app/page.tsx` *(modified — replaced `create-next-app` boilerplate)*
- `apps/web/src/components/events/events-hub.tsx` *(created)*
- `apps/web/src/components/events/event-filters.tsx` *(created)*
- `apps/web/src/components/events/event-section.tsx` *(created)*
- `apps/web/src/components/events/event-card.tsx` *(created)*

#### Key Implementation Details & Code Artifacts

##### A. Render-Phase `?q=` Query Synchronization Without Cascading `useEffect` (`events-hub.tsx`)
In React 19 + Next.js 16 (`eslint-config-next` with React Hooks rules), calling `setSearch(urlQuery)` inside a `useEffect` triggers a synchronous cascading second render and violates `react-hooks/set-state-in-effect`. Instead, `EventsHub` uses React's recommended render-phase state reconciliation pattern (`[prevUrlQuery, setPrevUrlQuery]`):

```tsx
const urlQuery = searchParams.get("q") ?? "";

const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
const [search, setSearch] = useState(urlQuery);
const [category, setCategory] = useState<"ALL" | EventCategory>("ALL");
const [price, setPrice] = useState<PriceFilter>("ALL");
const [timeWindow, setTimeWindow] = useState<TimeWindowFilter>("ALL");

// Sync local search input whenever external `?q=` query param changes (e.g. header search)
if (urlQuery !== prevUrlQuery) {
  setPrevUrlQuery(urlQuery);
  setSearch(urlQuery);
}
```

When a user clears the search box or clicks **Clear filters** while `?q=` is present in the URL, `EventsHub` resets `prevUrlQuery` to `""` and calls `router.replace(pathname, { scroll: false })` so the URL bar and local input stay in lockstep without scrolling the page back to top:

```tsx
const handleSearchChange = (nextValue: string) => {
  setSearch(nextValue);
  if (nextValue === "" && urlQuery.length > 0) {
    setPrevUrlQuery("");
    router.replace(pathname, { scroll: false });
  }
};
```

##### B. Arbitrary User Cover URLs vs. `next/image` Domain Crashes (`event-card.tsx`)
Because Milestone 1 allows Demo Members to paste *any* arbitrary `https://...` image URL when creating or editing a Move (`/events/new`), using `next/image` would throw a runtime `Invalid src prop ... hostname is not configured under images in your next.config.js` crash on unallowlisted domains, and broken URLs would leave an ugly broken-image icon. `EventCard` solves both problems using a native lazy `<img>` paired with per-URL `failedCoverSrc` error state that gracefully falls back to a category-themed gradient banner:

```tsx
const [failedCoverSrc, setFailedCoverSrc] = useState<string | null>(null);

const theme = CATEGORY_THEMES[event.category] ?? CATEGORY_THEMES.Other;
const CategoryIcon = theme.icon;

const hasValidCover =
  Boolean(event.coverImage) && failedCoverSrc !== event.coverImage;
```

Notice `failedCoverSrc !== event.coverImage` rather than a boolean `hasImgError`: if a host edits an event and replaces a broken `coverImage` URL with a new valid URL, `failedCoverSrc !== event.coverImage` immediately evaluates to `true` without needing an effect to reset a boolean flag!

##### C. Two-Tier Member RSVP & Guest Gate (`event-card.tsx`)
- **Draft Card Mode (`event.status === "DRAFT"`):** Replaces RSVP controls with an outline `Continue editing` button linking to `/events/${event.id}/edit`.
- **Guest Viewer Mode (`viewer.mode === "GUEST"`):** Renders a primary `Save` button (`aria-pressed={false}`). Clicking it invokes `requireDemoMember("save events to your list")`, opening the global `DemoSignInDialog` instead of mutating state or failing silently.
- **Member Viewer — Unsaved or `SAVED`:** Renders a quick toggle `Save` / `Saved` button (`BookmarkIcon` filled when saved) plus a compact `ChevronDownIcon` dropdown trigger (`More RSVP options`) offering `Mark Going`, `Mark Interested`, and `Save Move` / `Remove Saved`.
- **Member Viewer — `GOING` or `INTERESTED`:** Promotes the current RSVP status (`Going` with `CheckCircle2Icon` or `Interested` with `StarIcon`) to the primary dropdown button so the user never accidentally overwrites a `GOING` RSVP (which might unlock a private house-party address or tie into a Move Group) with `SAVED` via a blind single click, while still allowing one-menu switching between `Going`, `Interested`, `Save for later`, and `Clear response`.

#### Edge Cases Solved in `1.02.2`
- **Redundant Free Price Labels:** Seed events carry nuanced free labels like `"Free w/ BuzzCard"` or `"No cover (food & drinks separate)"`, whereas locally created free events default to `"Free"`. `EventCard` renders `"Free"` in the top-right emerald pill for visual consistency across cards, and conditionally renders `Admission: {secondaryPriceDetail}` in the card body **only** when `isFree && priceLabel.toLowerCase() !== "free"`.
- **Duplicate Venue vs. Public Display Location:** When `event.hasPrivateAddress` is `false` and `event.venue !== event.publicDisplayLocation`, `EventCard` displays both `publicDisplayLocation` (primary line) and `venue` (muted sub-line). When `event.hasPrivateAddress` is `true`, the sub-line is replaced by the amber lock badge `"Approx. area · Exact address protected"` so house-party venue nicknames never crowd or confuse the privacy indicator.

---

### 3.3 Sub-Iteration `1.02.3` — Lint, Type & Determinism Verification

#### Objective
Verify static type safety, ESLint 9 (`eslint-config-next` 16.4.6 + React Compiler / Hooks rules), accessibility attributes, and strict render-phase determinism across all five owned files.

#### Files Verified
- `apps/web/src/app/page.tsx`
- `apps/web/src/components/events/events-hub.tsx`
- `apps/web/src/components/events/event-filters.tsx`
- `apps/web/src/components/events/event-section.tsx`
- `apps/web/src/components/events/event-card.tsx`

#### Verification Checks Executed
1. **ESLint Verification:**
   ```bash
   npx eslint src/app/page.tsx src/components/events/events-hub.tsx src/components/events/event-card.tsx src/components/events/event-filters.tsx src/components/events/event-section.tsx
   ```
   Result: **Exit code `0`** (`0 errors, 0 warnings`). Specifically confirmed that the localized `/* eslint-disable-next-line @next/next/no-img-element */` directive in `event-card.tsx` cleanly documents the intentional `<img>` usage without suppressing any other rule.
2. **TypeScript Typecheck (`tsc --noEmit`):**
   Confirmed **zero TypeScript diagnostics** in `src/app/page.tsx` and all `src/components/events/*` modules, verifying 100% structural alignment with `src/types/domain.ts`.
3. **Render-Phase Impurity & Privacy Leak Grep Audit:**
   Scanned `src/app/page.tsx` and `src/components/events/{events-hub,event-card,event-filters,event-section}.tsx` for prohibited patterns:
   ```text
   Pattern: new Date|Date\.now|Math\.random|randomUUID|localStorage|window\.|unlockedPrivateAddress
   Matches in Agent 02 files: 0
   ```
4. **Accessibility (`a11y`) Audit:**
   - Verified every `<EventSection>` binds `<section aria-labelledby={headingId}>` to `<h2 id={headingId}>` using deterministic `${id}-heading` when `id` is provided or React 19 `useId()` when omitted (hydration-safe SSR ID generation).
   - Verified filter button groups declare `role="group"` with descriptive `aria-label`s and `aria-pressed={active}` on every toggle button.
   - Verified icon-only buttons (`Clear search query`, `More RSVP options`) provide explicit `aria-label`s.

---

### 3.4 Sub-Iteration `1.02.4` — Cross-Route CTA Alignment

#### Objective
Align the secondary header CTA in `EventsHub` with Feature Agent 05's canonical Move Groups route tree (`/move-groups/new`, `/move-groups/[id]`, `/move-groups/[id]/manage`) so campus users can jump directly from the Events Hub header into creating a Move Group without hitting an unimplemented `/groups` route.

#### File Modified
- `apps/web/src/components/events/events-hub.tsx`

#### Technical Rationale
During parallel development, Agent 05 mounted Move Group creation at `/move-groups/new` (matching the domain entity `MoveGroup` and `src/app/move-groups/new/page.tsx`), while individual Move Groups are discovered contextually inside `/events/[id]` (`EventMoveGroupsSection`) or created from `/move-groups/new`. Updating the secondary `PageHeader` action button in `EventsHub` from `/groups` to `/move-groups/new` (*Start a Move Group*) eliminated a broken cross-agent link and reinforced Sesh's core product loop (*see an event -> start or join a Move Group so nobody pulls up solo*).

#### Final Code Implementation (`apps/web/src/components/events/events-hub.tsx`, lines 179–195)
```tsx
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/move-groups/new">
                <UsersIcon className="size-4" />
                Start a Move Group
              </Link>
            </Button>
            <Button asChild>
              <Link href="/events/new">
                <PlusIcon className="size-4" />
                Create a Move
              </Link>
            </Button>
          </>
        }
```

#### Post-Alignment Verification
Re-ran `npm run lint`, `npm test` (Vitest suite), and `npm run build` (`next build` with Cache Components / Partial Prerendering enabled) across `@sesh/web` — all checks and static/dynamic route builds succeeded with zero errors.

---

## 4. Full TSDoc / Javadoc-Style API & Component Reference

---

### 4.1 Route Entry: `HomePage` (`src/app/page.tsx`)

```ts
/**
 * @component    HomePage
 * @file         apps/web/src/app/page.tsx
 * @kind         Next.js App Router Server Component (Default Export)
 * @route        GET /
 *
 * @description
 * Thin server entry point for the Georgia Tech Events Hub. Exports static route
 * `metadata` for SEO / browser tab labeling and wraps the client-side `<EventsHub />`
 * orchestrator inside a React `<Suspense>` boundary backed by `<EventGridSkeleton count={6} />`.
 *
 * @param        none (Does not read `params` or `searchParams` on the server so the
 *               outer route shell remains 100% static and Partial-Prerenderable under
 *               Next.js 16 `cacheComponents: true`.)
 * @returns      {JSX.Element} Prerendered Suspense boundary streaming/hydrating `<EventsHub />`.
 *
 * @complexity   O(1) server render.
 * @state        Stateless Server Component.
 * @sideEffects  None.
 * @invariants
 *  - MUST remain a Server Component (no `"use client"` directive) so `export const metadata`
 *    is statically extracted by Next.js.
 *  - MUST keep `<EventsHub />` wrapped in `<Suspense>` because `EventsHub` calls
 *    `useSearchParams()` to sync `?q=` queries.
 *
 * @example
 * // Automatically mounted by Next.js App Router at `/`
 * // Static fallback rendered in initial HTML shell:
 * <Suspense fallback={<EventGridSkeleton count={6} />}>
 *   <EventsHub />
 * </Suspense>
 */
```

#### Exact Source (`apps/web/src/app/page.tsx`)
```tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { EventsHub } from "@/components/events/events-hub";
import { EventGridSkeleton } from "@/components/shared/loading-skeletons";

export const metadata: Metadata = {
  title: "Georgia Tech Events Hub | Sesh",
  description:
    "Discover 18+ campus events, nightlife, club nights, sports, concerts, and coordinated Move Groups around Georgia Tech and Midtown Atlanta.",
};

export default function HomePage() {
  return (
    <Suspense fallback={<EventGridSkeleton count={6} />}>
      <EventsHub />
    </Suspense>
  );
}
```

---

### 4.2 Feature Orchestrator: `EventsHub` (`src/components/events/events-hub.tsx`)

```ts
/**
 * @component    EventsHub
 * @file         apps/web/src/components/events/events-hub.tsx
 * @kind         Client Component (`"use client"`)
 *
 * @description
 * Primary interactive discovery controller for Georgia Tech & Midtown Atlanta Moves.
 * Coordinates URL search-parameter synchronization (`?q=`), multi-criteria filtering,
 * viewer-projected adapter queries, host-only draft recovery banners, and time-windowed
 * event section rendering.
 *
 * @props        None (`{}`). Reads global session/adapter context from `useSesh()` and URL
 *               state from `useSearchParams()`, `useRouter()`, and `usePathname()`.
 * @returns      {JSX.Element} Full campus discovery feed layout.
 *
 * @state
 *  - `prevUrlQuery: string` — Last observed `searchParams.get("q") ?? ""` value used for
 *    render-phase reconciliation without `useEffect` cascading renders.
 *  - `search: string` — Live controlled search text (initialized from `urlQuery`).
 *  - `category: "ALL" | EventCategory` — Selected category filter (default `"ALL"`).
 *  - `price: PriceFilter` — Selected admission filter: `"ALL" | "FREE" | "PAID"` (default `"ALL"`).
 *  - `timeWindow: TimeWindowFilter` — Selected time window:
 *    `"ALL" | "HAPPENING_NOW" | "TONIGHT" | "THIS_WEEKEND" | "UPCOMING"` (default `"ALL"`).
 *
 * @complexity
 *  - Adapter projection & filtering (`useMemo`): O(E * G + E log E) where E is total stored
 *    events (14 seed + local overlay) and G is Move Groups per event.
 *  - Section bucketing (`useMemo`): O(E_filtered) single linear pass.
 *
 * @sideEffects
 *  - Calls `router.replace(pathname, { scroll: false })` ONLY inside user event handlers
 *    (`handleSearchChange` when input is cleared to `""`, or `handleClearFilters`) if an
 *    external `?q=` query parameter was previously active in the URL.
 *
 * @invariants
 *  - `publishedCount` equals `happeningNow.length + tonight.length + thisWeekend.length + upcoming.length`
 *    and NEVER counts `sections.drafts`.
 *  - `Your Saved Drafts` banner renders if and only if `viewer.mode === "MEMBER"` AND
 *    `sections.drafts.length > 0`.
 *  - When `timeWindow === "ALL"` and `publishedCount > 0`, sections always render in strict
 *    chronological urgency order:
 *      1. Happening Now (`#happening-now`, `isLive = true`)
 *      2. Tonight (`#tonight`)
 *      3. This Weekend (`#this-weekend`)
 *      4. Upcoming (`#upcoming`)
 *    Empty buckets self-collapse cleanly (`EventSection` returns `null`).
 *
 * @privacy
 *  - Queries `adapter.listEvents(viewer, criteria, nowIso)` so unauthorized `FRIENDS`,
 *    `CUSTOM`, `INVITE_ONLY`, and non-owned `DRAFT` records are stripped prior to state
 *    derivation.
 *
 * @example
 * <Suspense fallback={<EventGridSkeleton count={6} />}>
 *   <EventsHub />
 * </Suspense>
 */
```

#### Internal Constant Table: `SECTION_META`

| Key (`Exclude<TimeWindowFilter, "ALL">`) | DOM `id` | Heading `title` | `subtitle` | `isLive` | `icon` |
| --- | --- | --- | --- | --- | --- |
| `HAPPENING_NOW` | `"happening-now"` | `"Happening Now"` | `"Active right now across Georgia Tech & Midtown (ET)"` | `true` | *(live ping dot)* |
| `TONIGHT` | `"tonight"` | `"Tonight"` | `"Starting later tonight around campus, Tech Square & West Midtown"` | `undefined` | `<MoonStarIcon className="size-4" />` |
| `THIS_WEEKEND` | `"this-weekend"` | `"This Weekend"` | `"Friday evening through Sunday night plans"` | `undefined` | `<SparklesIcon className="size-4" />` |
| `UPCOMING` | `"upcoming"` | `"Upcoming"` | `"Next week and beyond on the Georgia Tech calendar"` | `undefined` | `<CalendarDaysIcon className="size-4" />` |

---

### 4.3 Control Bar: `EventFilters` (`src/components/events/event-filters.tsx`)

```ts
/**
 * @component    EventFilters
 * @file         apps/web/src/components/events/event-filters.tsx
 * @kind         Controlled Client Component (`"use client"`)
 *
 * @description
 * Multi-row campus discovery filter toolbar providing live text search, segmented
 * time-window toggles, segmented Free/Paid admission toggles, 8 category filter pills,
 * an active results count summary bar, active filter chips, and a one-click reset action.
 *
 * @props        {EventFiltersProps}
 * @param        {string} search - Current search input string.
 * @param        {"ALL" | EventCategory} category - Active category selection (`"ALL"` or one of 7 `EVENT_CATEGORIES`).
 * @param        {PriceFilter} price - Active admission filter (`"ALL" | "FREE" | "PAID"`).
 * @param        {TimeWindowFilter} timeWindow - Active time window (`"ALL" | "HAPPENING_NOW" | "TONIGHT" | "THIS_WEEKEND" | "UPCOMING"`).
 * @param        {number} totalResultsCount - Count of matching PUBLISHED Moves (excludes drafts).
 * @param        {boolean} hasActiveFilters - True whenever `search.trim() !== ""` or any filter !== `"ALL"`.
 * @param        {(value: string) => void} onSearchChange - Invoked on search input change or inline `X` clear click.
 * @param        {(category: "ALL" | EventCategory) => void} onCategoryChange - Invoked when a category pill is clicked.
 * @param        {(price: PriceFilter) => void} onPriceChange - Invoked when a Free/Paid option is clicked.
 * @param        {(timeWindow: TimeWindowFilter) => void} onTimeWindowChange - Invoked when a time-window option is clicked.
 * @param        {() => void} onClearFilters - Resets search, category, price, timeWindow, and URL `?q=`.
 * @returns      {JSX.Element} Accessible filter control card.
 *
 * @complexity   O(C) render where C = |EVENT_CATEGORIES| + |TIME_WINDOW_OPTIONS| + |PRICE_OPTIONS| (constant: 8 + 5 + 3 = 16 buttons).
 * @state        Purely controlled via props (zero internal state).
 * @sideEffects  None directly; delegates all state transitions to parent callbacks.
 * @invariants
 *  - `CATEGORY_OPTIONS` is dynamically derived from `EVENT_CATEGORIES` (`domain.ts`), so adding
 *    a category to the domain tuple automatically surfaces its filter pill.
 *  - Pluralization in summary bar strictly renders `"1 Move"` vs `"{N} Moves"`.
 *  - Inline search clear button (`XIcon`) renders iff `search.length > 0`.
 *  - Summary filter badges and `Clear filters` button render iff `hasActiveFilters === true`.
 *
 * @example
 * <EventFilters
 *   search={search}
 *   category={category}
 *   price={price}
 *   timeWindow={timeWindow}
 *   totalResultsCount={publishedCount}
 *   hasActiveFilters={hasActiveFilters}
 *   onSearchChange={handleSearchChange}
 *   onCategoryChange={setCategory}
 *   onPriceChange={setPrice}
 *   onTimeWindowChange={setTimeWindow}
 *   onClearFilters={handleClearFilters}
 * />
 */
```

#### Exported Interface: `EventFiltersProps`
```ts
export interface EventFiltersProps {
  search: string;
  category: "ALL" | EventCategory;
  price: PriceFilter;
  timeWindow: TimeWindowFilter;
  totalResultsCount: number;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (category: "ALL" | EventCategory) => void;
  onPriceChange: (price: PriceFilter) => void;
  onTimeWindowChange: (timeWindow: TimeWindowFilter) => void;
  onClearFilters: () => void;
}
```

---

### 4.4 Time-Window Container: `EventSection` (`src/components/events/event-section.tsx`)

```ts
/**
 * @component    EventSection
 * @file         apps/web/src/components/events/event-section.tsx
 * @kind         Client Component (`"use client"`)
 *
 * @description
 * Semantic `<section>` container for a single chronological discovery bucket
 * (e.g., `Happening Now`, `Tonight`, `This Weekend`, `Upcoming`). Automatically
 * collapses (`returns null`) when `events` is empty so unpopulated buckets leave
 * zero whitespace or orphan headings in the feed.
 *
 * @props        {EventSectionProps}
 * @param        {string} [id] - Optional stable DOM anchor ID (e.g. `"happening-now"`). When provided,
 *               heading ID is deterministic `${id}-heading`; otherwise falls back to `useId()`.
 * @param        {string} title - Section heading text rendered in `<h2>`.
 * @param        {string} [subtitle] - Optional contextual subheading below title.
 * @param        {EventView[]} events - Ordered array of viewer-projected events in this bucket.
 * @param        {boolean} [isLive=false] - Renders dual-layer emerald `animate-ping` dot before title
 *               and forwards `isHappeningNow={true}` to each child `<EventCard />`.
 * @param        {React.ReactNode} [icon] - Optional icon rendered when `isLive` is false.
 * @param        {string} [className] - Optional Tailwind class overrides.
 * @returns      {JSX.Element | null} Populated responsive 3-column grid section, or `null` if `events.length === 0`.
 *
 * @complexity   O(N) where N = `events.length`.
 * @state        Stateless (uses `React.useId()` hook unconditionally before early return to obey Rules of Hooks).
 * @sideEffects  None.
 * @invariants
 *  - `useId()` MUST be called unconditionally above `if (events.length === 0) return null;`
 *    so hook call order never changes when filters empty or repopulate a section!
 *
 * @example
 * <EventSection
 *   id="happening-now"
 *   title="Happening Now"
 *   subtitle="Active right now across Georgia Tech & Midtown (ET)"
 *   events={sections.happeningNow}
 *   isLive
 * />
 */
```

#### Exported Interface: `EventSectionProps`
```ts
export interface EventSectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  events: EventView[];
  /** Shows a subtle live campus pulse indicator for "Happening Now" */
  isLive?: boolean;
  icon?: React.ReactNode;
  className?: string;
}
```

---

### 4.5 Discovery Unit: `EventCard` (`src/components/events/event-card.tsx`)

```ts
/**
 * @component    EventCard
 * @file         apps/web/src/components/events/event-card.tsx
 * @kind         Client Component (`"use client"`)
 *
 * @description
 * Reusable, privacy-preserving campus event summary card used across the Events Hub.
 * Renders either an external user-supplied `coverImage` with automatic broken-link
 * recovery or a category-themed gradient header, followed by audience/source badges,
 * linked title, `America/New_York` schedule range, approximate location with private-address
 * lock notice, verified student host summary, social attendance & Move Group counts,
 * and Guest-gated Save / RSVP quick controls.
 *
 * @props        {EventCardProps}
 * @param        {EventView} event - Viewer-projected event DTO from `SeshDataAdapter`.
 * @param        {boolean} [isHappeningNow] - Optional boolean override from parent `EventSection`;
 *               if omitted, `EventCard` computes live status via `classifyEventTimeWindow(event.startAt, event.endAt, nowIso)`.
 * @param        {string} [className] - Optional Tailwind class overrides on outer `<Card>`.
 * @returns      {JSX.Element} Interactive event discovery card.
 *
 * @state
 *  - `failedCoverSrc: string | null` — Stores the exact `event.coverImage` URL that failed
 *    to load via `<img onError>`. Comparing `failedCoverSrc !== event.coverImage` automatically
 *    recovers if the cover URL prop changes later without needing `useEffect`.
 *
 * @complexity   O(F) where F = `event.friendsGoing.length` (for `title` tooltip join; bounded by friend count).
 *
 * @sideEffects
 *  - When `viewer.mode === "GUEST"`, clicking Save invokes `requireDemoMember("save events to your list")`,
 *    opening `DemoSignInDialog` via `SeshProvider`.
 *  - When `viewer.mode === "MEMBER"`, selecting or toggling an RSVP invokes
 *    `adapter.setEventResponse(event.id, nextResponse, viewer, nowIso)`, persisting to
 *    `localStorage` (`sesh.m1.demo-store.v1`), incrementing `SeshProvider.revision`, and
 *    dispatching a `sonner` toast notification.
 *
 * @privacy
 *  - NEVER reads or renders `event.unlockedPrivateAddress`.
 *  - When `event.hasPrivateAddress === true`:
 *      1. Suppresses the secondary `event.venue` sub-line so house-party nicknames do not leak hints.
 *      2. Renders `<LockIcon /> Approx. area · Exact address protected` beneath `event.publicDisplayLocation`.
 *  - Renders explicit audience restriction badges (`Friends Only`, `Custom List`, `Invite Only`)
 *    whenever `event.visibility !== "PUBLIC"`.
 *
 * @invariants
 *  - Uses native `<img loading="lazy" onError={...} />` rather than `next/image` so arbitrary
 *    user-entered URLs in `Create/Edit a Move` never crash Next.js image domain validation.
 *  - Title and `"View details"` button both link to `/events/${event.id}`.
 *  - If `event.status === "DRAFT"`, footer replaces RSVP controls with `"Continue editing"`
 *    linking to `/events/${event.id}/edit`.
 *
 * @example
 * <EventCard event={eventView} isHappeningNow={false} />
 */
```

#### Exported Interface & Visual Theme Mapping
```ts
export interface EventCardProps {
  event: EventView;
  /** Optional override when rendered inside the "Happening Now" section */
  isHappeningNow?: boolean;
  className?: string;
}
```

| `EventCategory` | Lucide Icon | Gradient Palette (Light / Dark) | Accent Text Token |
| --- | --- | --- | --- |
| `"Bars"` | `BeerIcon` | `amber-500` -> `orange-500` -> `yellow-500` | `text-amber-700 dark:text-amber-300` |
| `"Clubs"` | `Disc3Icon` | `violet-500` -> `fuchsia-500` -> `indigo-500` | `text-violet-700 dark:text-violet-300` |
| `"House Parties"` | `HomeIcon` | `rose-500` -> `pink-500` -> `amber-500` | `text-rose-700 dark:text-rose-300` |
| `"Organization Events"` | `SparklesIcon` | `yellow-500` -> `amber-500` -> `slate-500` | `text-yellow-800 dark:text-yellow-300` |
| `"Sports"` | `TrophyIcon` | `emerald-500` -> `teal-500` -> `cyan-500` | `text-emerald-700 dark:text-emerald-300` |
| `"Concerts"` | `MusicIcon` | `sky-500` -> `indigo-500` -> `purple-500` | `text-sky-700 dark:text-sky-300` |
| `"Other"` | `CompassIcon` | `teal-500` -> `slate-500` -> `zinc-500` | `text-teal-700 dark:text-teal-300` |

---

### 4.6 Filter & Bucketing Pipeline: `filterEvents` & `groupEventsByTimeSection` (`src/lib/events-filter.ts`)

```ts
/**
 * @function     filterEvents
 * @file         apps/web/src/lib/events-filter.ts
 *
 * @description
 * Pure, immutable filtering and chronological sorting pipeline invoked inside
 * `LocalMockSeshAdapter.listEvents()`. Evaluates draft ownership rules, active
 * `America/New_York` time-window predicates, category equality, Free/Paid admission,
 * and case-insensitive substring matching across 7 event/host fields.
 *
 * @param        {EventView[]} events - Viewer-projected events permitted for the current `ViewerSession`.
 * @param        {EventFilterCriteria} criteria - Search, category, price, timeWindow, and draft inclusion flags.
 * @param        {string} nowIso - Reference UTC ISO-8601 timestamp (`useSesh().nowIso`).
 * @returns      {EventView[]} New array sorted ascending by `startAt` epoch milliseconds (`toSorted`).
 *
 * @complexity   O(N * L + N log N) where N = `events.length` and L = average haystack character length.
 * @sideEffects  None (uses ES2023 `.toSorted()` to preserve input array immutability).
 * @invariants
 *  - `PAST` published events (`endMs <= nowMs`) ALWAYS return `false` from `matchesTimeWindowFilter`
 *    even when `criteria.timeWindow === "ALL"`.
 *  - Search haystack includes ONLY safe public fields:
 *    `[title, description, venue, publicDisplayLocation, category, host.displayName, host.username]`.
 *    `privateAddress` and `unlockedPrivateAddress` are NEVER indexed in search haystacks, preventing
 *    oracle attacks where searching a street number reveals which card lives at that address!
 */

/**
 * @function     groupEventsByTimeSection
 * @file         apps/web/src/lib/events-filter.ts
 *
 * @description
 * Partitions an already-sorted `EventView[]` list into the five canonical Events Hub
 * buckets (`happeningNow`, `tonight`, `thisWeekend`, `upcoming`, `drafts`) relative
 * to `nowIso` in `America/New_York`.
 *
 * @param        {EventView[]} events - Filtered, chronologically sorted `EventView[]`.
 * @param        {string} nowIso - Reference UTC ISO-8601 timestamp.
 * @returns      {GroupedEventsHubSections} Object containing five `EventView[]` arrays, each preserving
 *               the input's ascending `startAt` order.
 *
 * @complexity   O(N) single pass.
 * @sideEffects  None.
 */
```

---

### 4.7 Timezone & Window Engine: `classifyEventTimeWindow`, `matchesTimeWindowFilter`, `formatEventTimeRange` (`src/lib/dates.ts`)

```ts
/**
 * @function     classifyEventTimeWindow
 * @file         apps/web/src/lib/dates.ts
 *
 * @description
 * Deterministically classifies an event's `[startIso, endIso)` interval into one of five
 * campus discovery buckets (`"PAST" | "HAPPENING_NOW" | "TONIGHT" | "THIS_WEEKEND" | "UPCOMING"`)
 * evaluated in `America/New_York` (`CAMPUS_TIMEZONE`) relative to `nowIso`.
 *
 * @param        {string} startIso - Event start timestamp (UTC ISO-8601).
 * @param        {string} endIso - Event end timestamp (UTC ISO-8601).
 * @param        {string} nowIso - Reference current timestamp (UTC ISO-8601).
 * @returns      {EventTimeBucket} Priority-ordered classification bucket:
 *               1. `"PAST"`          iff `endMs <= nowMs`
 *               2. `"HAPPENING_NOW"` iff `startMs <= nowMs && endMs > nowMs`
 *               3. `"TONIGHT"`       iff `startNy` shares `(year, month, day)` with `nowNy`
 *                                    OR (`nowNy.hour >= 15 && startMs <= nowMs + 14h && startNy.hour < 4`)
 *               4. `"THIS_WEEKEND"`  iff `startMs` falls within `[Friday 16:00 ET, Sunday 23:59 ET]`
 *                                    of the current `America/New_York` week
 *               5. `"UPCOMING"`      otherwise (all future events after Sunday 23:59 ET)
 *
 * @invariants
 *  - Evaluates calendar dates via `Intl.DateTimeFormat` configured with `timeZone: "America/New_York"`,
 *    so a browser running in `America/Los_Angeles` or `UTC` still classifies Georgia Tech events
 *    identically to a student standing on Tech Green in Atlanta.
 */

/**
 * @function     formatEventTimeRange
 * @file         apps/web/src/lib/dates.ts
 *
 * @description
 * Formats `[startIso, endIso]` into a compact human-readable `America/New_York` schedule string
 * suffixed with `ET`. Collapses the end date when both timestamps share the same NY calendar day.
 *
 * @param        {string} startIso - Event start UTC ISO string.
 * @param        {string} endIso - Event end UTC ISO string.
 * @returns      {string}
 *               - Same NY day: `"Wed, Nov 11 · 3:00 PM – 6:00 PM ET"`
 *               - Cross-midnight / multi-day: `"Fri, Nov 13, 9:30 PM – Sat, Nov 14, 1:30 AM ET"`
 */
```

---

## 5. Regression & Error-Checking Matrix

Use the matrices below when debugging feed discrepancies, modifying `SeshDataAdapter` in Milestone 2 (REST backend migration), or adding new filter axes.

### 5.1 Filter & Search Invariants

| Check ID | Scenario / Trigger | Expected System Behavior | Responsible Code Path | Failure Symptom if Broken |
| --- | --- | --- | --- | --- |
| `FILT-01` | Navigate to `/?q=west%20midtown` or submit header search | `EventsHub` initializes/updates `search` to `"west midtown"` during render without `useEffect` loop; summary bar shows `Query: "west midtown"`. | `events-hub.tsx:78-90` | Input lags behind URL, or React throws cascading setState warning. |
| `FILT-02` | Click inline `X` or `Clear filters` when URL is `/?q=trivia` | `search` resets to `""`, `prevUrlQuery` resets to `""`, and `router.replace(pathname, { scroll: false })` strips `?q=trivia` from address bar. | `events-hub.tsx:125-142` | Old `?q=trivia` re-hydrates into `search` on next render or page jumps to top. |
| `FILT-03` | Search for `@gt_ramblinnights` or `mayapatel` | Substring query strips `@`? Note: haystack contains `event.host.username` (`gt_ramblinnights`). Searching `gt_ramblinnights` or `Maya Patel` matches; searching a private street number (`042 Fictional Yellow Jacket`) returns **0** results. | `events-filter.ts:48-64` | Private street address searchable via search oracle (security bug). |
| `FILT-04` | Member has 1 `DRAFT` Move and types gibberish search `zzzzzz` | `sections.drafts` still displays the 1 draft in `Your Saved Drafts`, while `publishedCount === 0` renders `<EmptyState>` with `Showing 0 Moves`. | `events-hub.tsx:113-117`, `events-filter.ts:28-30` | Summary bar falsely says `Showing 1 Move` while the main grid is empty. |
| `FILT-05` | Combine `category = "Clubs"` + `price = "PAID"` + `timeWindow = "TONIGHT"` | Predicate conjunction (`AND`) returns only `evt-west-midtown-neon` (*Buzz After Dark: Warehouse House & UKG Night*) and renders single `Tonight` section. | `events-filter.ts:32-47`, `events-hub.tsx:350-359` | All 4 section headers render empty, or `OR` logic leaks free/other-day events. |

### 5.2 Timezone (`America/New_York`) Boundary Invariants

| Check ID | Scenario / Trigger | Expected System Behavior | Responsible Code Path | Failure Symptom if Broken |
| --- | --- | --- | --- | --- |
| `TIME-01` | Event has `startAt <= nowIso` and `endAt > nowIso` | Classified as `HAPPENING_NOW`; rendered in `#happening-now` with pulsing emerald dot on section header and `Live now` badge on `EventCard`. | `dates.ts:175-177`, `event-section.tsx:45-52`, `event-card.tsx:142-146` | Active campus event buried under `Tonight` or dropped as `PAST`. |
| `TIME-02` | Event has `endAt <= nowIso` | Classified as `PAST`; excluded by `matchesTimeWindowFilter` even when `timeWindow === "ALL"`. | `dates.ts:171-173`, `dates.ts:237-238` | Expired events clutter top of chronological feed. |
| `TIME-03` | Late-night afterparty starting at `01:30 AM ET` tomorrow when `nowIso` is `10:00 PM ET` (`nowNy.hour >= 15`) | Classified as `TONIGHT` (`isLateNightTonight === true` since `startNy.hour < 4` and within 14 hours). | `dates.ts:187-193` | 1 AM tonight afterparty misclassified into tomorrow / `Upcoming`. |
| `TIME-04` | Event starts at `10:00 PM ET` Friday and ends `02:00 AM ET` Saturday (`evt-poncey-latin-rooftop`) | `getNyDateKey(startAt) !== getNyDateKey(endAt)`, so `formatEventTimeRange` includes both dates: `"Sat, Nov 14, 10:00 PM – Sun, Nov 15, 2:00 AM ET"`. | `dates.ts:81-93` | Ambiguous `"Sat, Nov 14 · 10:00 PM – 2:00 AM ET"` hides next-day rollover. |
| `TIME-05` | Viewer browser OS timezone is `America/Los_Angeles` (PST) or `Europe/London` (UTC) | Every time label and bucket boundary still evaluates in `America/New_York` (`ET`) via `Intl.DateTimeFormat` with `timeZone: CAMPUS_TIMEZONE`. | `dates.ts:19-50` | SSR/client hydration mismatch or wrong `Tonight` cutoff outside US Eastern Time. |

### 5.3 Privacy, Audience Visibility & Private Address Invariants

| Check ID | Scenario / Trigger | Expected System Behavior | Responsible Code Path | Failure Symptom if Broken |
| --- | --- | --- | --- | --- |
| `PRIV-01` | Switch identity to `Guest` or `Tyler Nguyen` (non-friend of Maya) | `evt-friends-rooftop-sesh` (`visibility: "FRIENDS"`, host `user-maya`) is completely excluded from `EventsHub`. | `policies.ts:69-77`, `adapter.ts:298-310` | Unauthorized viewer sees restricted `Friends Only` event card on feed. |
| `PRIV-02` | View `EventsHub` as `Maya Patel` or `Jordan Brooks` (friend of Maya) | `evt-friends-rooftop-sesh` appears under `Tonight` with amber `<UsersIcon /> Friends Only` badge in `CardHeader`. | `event-card.tsx:113-128`, `event-card.tsx:293-304` | Permitted viewer cannot tell which feed items have restricted visibility. |
| `PRIV-03` | View `evt-home-park-vinyl` (`RSVP_GOING_ONLY`) even AFTER marking `GOING` as `Maya Patel` | `EventCard` on `/` STILL shows only `Home Park (approx. near 10th & State St)` + `Approx. area · Exact address protected`. Exact address is shown ONLY on `/events/evt-home-park-vinyl`. | `event-card.tsx:338-354` | Shoulder-surfing on main discovery feed leaks private residential addresses. |
| `PRIV-04` | View `evt-friends-rooftop-sesh` Move Group count as `Guest` vs `Maya Patel` | `mg-rooftop-invite-crew` (`discoverability: "INVITE_ONLY"`) is counted in `event.moveGroupCount` ONLY for viewers permitted by `canViewMoveGroup`. | `policies.ts:173-176`, `event-card.tsx:406-411` | Secret invite-only Move Groups leak their existence via public card counters. |
| `PRIV-05` | Switch from `Maya Patel` (who saved a `DRAFT` Move) to `Jordan Brooks` or `Guest` | `Your Saved Drafts` banner immediately disappears; `Jordan Brooks` cannot see Maya's draft via `EventsHub`. | `policies.ts:62-64`, `events-hub.tsx:205` | Private host drafts leak across demo personas. |

### 5.4 Guest-Mode Interception & Member RSVP Mutation Checks

| Check ID | Scenario / Trigger | Expected System Behavior | Responsible Code Path | Failure Symptom if Broken |
| --- | --- | --- | --- | --- |
| `RSVP-01` | In `Guest` mode, click `Save` on any `EventCard` | `requireDemoMember("save events to your list")` opens `DemoSignInDialog` (`signInPrompt.open = true`); `adapter.setEventResponse` is NOT called; no error toast shown. | `event-card.tsx:196-205`, `sesh-provider.tsx:138-150` | Uncaught `SeshAdapterError("UNAUTHENTICATED")` error toast or silent no-op. |
| `RSVP-02` | In `Member` mode (`Maya Patel`), click `Save` on an unsaved event | `adapter.setEventResponse(id, "SAVED", viewer, nowIso)` persists to `localStorage`, button flips to `Saved` (`aria-pressed="true"`, filled bookmark), toast shows `"Saved to your Moves"`. | `event-card.tsx:165-194`, `event-card.tsx:471-485` | Button UI does not update until manual page refresh (missing `revision` dep). |
| `RSVP-03` | In `Member` mode, event already has `viewerResponse === "GOING"` | Primary footer control renders `Going` dropdown trigger (`CheckCircle2Icon`) rather than `Save`, preventing accidental downgrade of `GOING` -> `SAVED` on a single click; `event.goingCount` increments/decrements live when changed. | `event-card.tsx:425-469` | Clicking `Save` accidentally strips `GOING` status and locks `RSVP_GOING_ONLY` address. |
| `RSVP-04` | Paste an invalid or 404 image URL as `coverImage` on a local Move | `<img onError>` records `failedCoverSrc = event.coverImage` and seamlessly swaps to the category gradient + icon header without crashing Next.js or showing a broken image icon. | `event-card.tsx:137`, `event-card.tsx:148-149`, `event-card.tsx:220-243` | Next.js `Invalid src prop` runtime overlay crash or broken image box. |

### 5.5 Next.js 16 Cache Components / Hydration Diagnostics Playbook

If a future milestone edit triggers a Next.js 16 build or hydration error on `/`, consult these three diagnostic rules first:

1. **`Uncached data was accessed outside of <Suspense>` / `useSearchParams() should be wrapped in a suspense boundary`:**
   - **Cause:** `<Suspense>` was removed from `src/app/page.tsx`, or `useSearchParams()` was hoisted above `HomePage`.
   - **Fix:** Keep `src/app/page.tsx` as a thin Server Component wrapping `<EventsHub />` inside `<Suspense fallback={<EventGridSkeleton count={6} />}>`.
2. **`Hydration failed because the server rendered HTML didn't match the client`:**
   - **Cause:** Calling `new Date()` or reading `window.localStorage` directly inside `EventsHub`, `EventSection`, or `EventCard` during initial render instead of reading `nowIso` and `adapter.listEvents(...)` from `useSesh()`.
   - **Fix:** Always pass `nowIso` from `useSesh()` into `adapter.listEvents`, `groupEventsByTimeSection`, and `classifyEventTimeWindow`. Let `SeshProvider` transition `nowIso` from `STATIC_FALLBACK_ANCHOR_ISO` to the live client clock inside its post-mount `useEffect`.
3. **`Rendered fewer hooks than expected` inside `EventSection`:**
   - **Cause:** Placing any React hook (`useId`, `useMemo`, etc.) *after* `if (events.length === 0) return null;`.
   - **Fix:** Keep `const generatedHeadingId = useId();` at the very top of `EventSection` before the empty-events guard (`event-section.tsx:29-34`).

---

[Back to Top](#milestone-1--agent-02-102--events-hub-technical-reference--sub-iteration-manual) · [Root README](../../../../README.md) · [Milestone 1 Index](../README.md)
