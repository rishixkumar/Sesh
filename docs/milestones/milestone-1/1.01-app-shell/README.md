[Root README](../../../../README.md) · [Milestone 1 Index](../README.md)

---

# Milestone 1 · Agent 01 (`1.01`) — Global Application Shell, Campus Navigation & Demo Identity Runtime

```ts
/**
 * @module       @sesh/web/shell-and-navigation
 * @milestone    Milestone 1 — Core MVP Frontend
 * @agent        Agent 01 ("App Shell & Navigation" · Track 1.01)
 * @iterations   1.01.1 · 1.01.2 · 1.01.3 · 1.01.4
 * @owner        Feature Agent 01
 * @status       Verified & Merged (ESLint 0 warnings · TypeScript 0 errors · Hydration-clean under PPR)
 * @runtime      Next.js 16.4.6 App Router (`cacheComponents: true`, `partialPrefetching: true`) · React 19.3.0
 * @see          apps/web/src/lib/context/sesh-provider.tsx
 * @see          apps/web/src/lib/data/adapter.ts
 * @see          apps/web/src/types/domain.ts
 */
```

---

## Table of Contents

1. [Executive Overview & Design Philosophy](#1-executive-overview--design-philosophy)
2. [Architecture & File Ownership Matrix](#2-architecture--file-ownership-matrix)
3. [Detailed Sub-Iteration Changelogs (`1.01.1` – `1.01.4`)](#3-detailed-sub-iteration-changelogs-1011--1014)
   - [`1.01.1` — Context, Provider & Next.js 16 `cacheComponents` Audit](#31-sub-iteration-1011--context-provider--nextjs-16-cachecomponents-audit)
   - [`1.01.2` — Global Shell, Responsive Navigation & Demo Identity Runtime](#32-sub-iteration-1012--global-shell-responsive-navigation--demo-identity-runtime)
   - [`1.01.3` — Campus Shell Routes (`/map`, `/friends`, `/notifications`, `/profile`) & Static Verification](#33-sub-iteration-1013--campus-shell-routes-map-friends-notifications-profile--static-verification)
   - [`1.01.4` — Post-Merge Partial Prerender & Radix `useId()` Hydration Guard Refinement](#34-sub-iteration-1014--post-merge-partial-prerender--radix-useid-hydration-guard-refinement)
4. [Full TSDoc / Javadoc-Style Module & Component Reference](#4-full-tsdoc--javadoc-style-module--component-reference)
   - [`4.1` `RootLayout` (`src/app/layout.tsx`)](#41-rootlayout-srcapplayouttsx)
   - [`4.2` `AppShell` (`src/components/layout/app-shell.tsx`)](#42-appshell-srccomponentslayoutapp-shelltsx)
   - [`4.3` `SiteHeader` (`src/components/layout/site-header.tsx`)](#43-siteheader-srccomponentslayoutsite-headertsx)
   - [`4.4` `DesktopNav` (`src/components/layout/desktop-nav.tsx`)](#44-desktopnav-srccomponentslayoutdesktop-navtsx)
   - [`4.5` `MobileNav` (`src/components/layout/mobile-nav.tsx`)](#45-mobilenav-srccomponentslayoutmobile-navtsx)
   - [`4.6` `DemoIdentitySwitcher` (`src/components/layout/demo-identity-switcher.tsx`)](#46-demoidentityswitcher-srccomponentslayoutdemo-identity-switchertsx)
   - [`4.7` `DemoSignInDialog` (`src/components/layout/demo-sign-in-dialog.tsx`)](#47-demosignindialog-srccomponentslayoutdemo-sign-in-dialogtsx)
   - [`4.8` `CampusMapPlaceholderPage` (`src/app/map/page.tsx`)](#48-campusmapplaceholderpage-srcappmappagetsx)
   - [`4.9` `FriendsNetworkPage` (`src/app/friends/page.tsx`)](#49-friendsnetworkpage-srcappfriendspagetsx)
   - [`4.10` `NotificationsPlaceholderPage` (`src/app/notifications/page.tsx`)](#410-notificationsplaceholderpage-srcappnotificationspagetsx)
   - [`4.11` `ProfilePage` (`src/app/profile/page.tsx`)](#411-profilepage-srcappprofilepagetsx)
5. [Regression & Error-Checking Checklist (`SHELL-*`, `HYDR-*`, `AUTH-*`)](#5-regression--error-checking-checklist-shell--hydr--auth-)
6. [Diagnostic Playbook for Future Milestones](#6-diagnostic-playbook-for-future-milestones)

---

## 1. Executive Overview & Design Philosophy

Track **`1.01` ("App Shell & Navigation")** establishes the top-level document root, provider hierarchy, responsive campus navigation chrome, simulated student persona switcher, unauthenticated Guest gate dialog, and four top-level shell routes (`/map`, `/friends`, `/notifications`, `/profile`) for **Sesh** — an 18+ campus event discovery and small-group coordination platform launching at **Georgia Tech & Midtown Atlanta**.

Because five specialized feature agents executed in parallel during Milestone 1, Track `1.01` was engineered around four strict architectural guarantees:

1. **Zero Duplicate Chrome Across Child Routes**: `AppShell` owns the sticky top `SiteHeader`, skip-link accessibility anchor, constrained `<main id="main-content">` container (`max-w-6xl`), fixed mobile bottom tab bar (`MobileNav`), and global `DemoSignInDialog`. Feature routes (`/`, `/events/*`, `/move-groups/*`) render pure page-level content inside `{children}` without worrying about header duplication or mobile bottom-bar occlusion (`pb-24 md:pb-12`).
2. **Next.js 16.4.6 `cacheComponents: true` + Partial Prerendering (PPR) Determinism**: Dynamic routes such as `/events/[id]` and `/move-groups/[id]` prerender a static HTML shell at build time. Any hook reading request-specific URL state (`usePathname()`) suspends during static shell generation and MUST be isolated inside a local `<Suspense fallback={...}>` leaf with a structurally identical fallback, while avoiding Radix `useId()` calls inside suspending subtrees.
3. **Explicit Prototype Security Framing**: Milestone 1 simulates viewer sessions (`Guest`, `Maya Patel`, `Jordan Brooks`, `Tyler Nguyen`) in browser storage so reviewers can test privacy rules (Friends-Only visibility, house-party exact address unlocking, Move Group non-friend roster masking) in one click. Every identity surface explicitly labels itself **Prototype Only / Not Real Auth** so simulated personas are never mistaken for verified `@gatech.edu` sessions.
4. **Render Purity & Hydration Parity**: No component in `1.01` invokes `new Date()`, `Date.now()`, `Math.random()`, `crypto.randomUUID()`, `window`, or `localStorage` during render. Time-sensitive queries consume `nowIso` from `useSesh()`, and route-active CSS classes wait for `isHydrated === true` so prerendered HTML and initial client hydration frames match byte-for-byte.

---

## 2. Architecture & File Ownership Matrix

### 2.1 Provider & Layout Composition Tree

```text
RootLayout (RSC · src/app/layout.tsx)
 └── <html lang="en" suppressHydrationWarning className="...geist vars...">
      └── <body className="min-h-full flex flex-col">
           └── ThemeProvider (next-themes · attribute="class" defaultTheme="system")
                └── TooltipProvider (@/components/ui/tooltip · delayDuration=0)
                     └── SeshProvider (@/lib/context/sesh-provider · singleton LocalMockSeshAdapter)
                          ├── AppShell (Server-compatible structural shell · src/components/layout/app-shell.tsx)
                          │    ├── <a href="#main-content"> (Skip link)
                          │    ├── SiteHeader ("use client" · sticky top z-40)
                          │    │    ├── Brand Link ("/" · ZapIcon + "Sesh" + "Georgia Tech · 18+" Badge)
                          │    │    ├── DesktopNav ("use client" · <Suspense> around usePathname())
                          │    │    ├── HeaderQuickSearch (non-suspending inline lg+ form + <lg Dialog)
                          │    │    ├── Create a Move CTA ("/events/new" · md+)
                          │    │    ├── <Suspense> -> HeaderUtilityLinksInner ("/notifications" + "/profile")
                          │    │    └── DemoIdentitySwitcher ("use client" · Radix DropdownMenu)
                          │    ├── <main id="main-content" className="mx-auto w-full max-w-6xl ... pb-24 md:pb-12">
                          │    │    └── {children} (Active App Router page segment)
                          │    ├── MobileNav ("use client" · fixed bottom z-40 md:hidden · <Suspense>)
                          │    └── DemoSignInDialog ("use client" · controlled by signInPrompt from useSesh)
                          └── Toaster (@/components/ui/sonner · theme-synced toast notifications)
```

### 2.2 Complete 11-File Ownership Matrix

| # | Workspace-Relative File Path | Lines | Boundary | `useSesh()` Dependencies | Suspense / Hydration Strategy |
| :- | :--- | ----: | :--- | :--- | :--- |
| 1 | `apps/web/src/app/layout.tsx` | 57 | **Server Component (RSC)** | Mounts `<SeshProvider>` | `suppressHydrationWarning` on `<html>` for `next-themes` class injection |
| 2 | `apps/web/src/components/layout/app-shell.tsx` | 30 | **Server-Compatible Component** | None directly (passes `{children}` through) | Preserves RSC streaming of `{children}` while mounting client nav leaves |
| 3 | `apps/web/src/components/layout/site-header.tsx` | 263 | **Client Component** (`"use client"`) | `adapter`, `viewer`, `revision`, `isHydrated` | Non-suspending `HeaderQuickSearch`; `<Suspense>` around `HeaderUtilityLinksInner` + `isHydrated` guard |
| 4 | `apps/web/src/components/layout/desktop-nav.tsx` | 115 | **Client Component** (`"use client"`) | `isHydrated` | `<Suspense fallback={<DesktopNavFallback />}>` + `isHydrated && item.match(pathname)` |
| 5 | `apps/web/src/components/layout/mobile-nav.tsx` | 168 | **Client Component** (`"use client"`) | `isHydrated` | `<Suspense fallback={<MobileNavFallback />}>` + `isHydrated && tab.match(pathname)` |
| 6 | `apps/web/src/components/layout/demo-identity-switcher.tsx` | 246 | **Client Component** (`"use client"`) | `viewer`, `availableDemoUsers`, `setDemoIdentity` | Single mounted Radix `DropdownMenu`; deterministic initial `Maya Patel` state pre-hydration |
| 7 | `apps/web/src/components/layout/demo-sign-in-dialog.tsx` | 145 | **Client Component** (`"use client"`) | `signInPrompt`, `closeSignInPrompt`, `availableDemoUsers`, `setDemoIdentity` | Closed (`open: false`) during SSR/hydration; opens only on client `requireDemoMember()` |
| 8 | `apps/web/src/app/map/page.tsx` | 206 | **Server Component (RSC)** | None (consumes `CAMPUS_AREA_LABEL` constant) | Pure static RSC with exported `metadata`; zero map SDK payload |
| 9 | `apps/web/src/app/friends/page.tsx` | 405 | **Client Component** (`"use client"`) | `adapter`, `viewer`, `availableDemoUsers`, `setDemoIdentity`, `nowIso`, `revision` | Deterministic `STATIC_FALLBACK_ANCHOR_ISO` pre-hydration; live `nowIso` post-mount |
| 10 | `apps/web/src/app/notifications/page.tsx` | 322 | **Client Component** (`"use client"`) | `adapter`, `viewer`, `availableDemoUsers`, `setDemoIdentity`, `nowIso`, `revision` | Reactive `useMemo` keyed on `[adapter, viewer, nowIso, revision]` |
| 11 | `apps/web/src/app/profile/page.tsx` | 691 | **Client Component** (`"use client"`) | `adapter`, `viewer`, `availableDemoUsers`, `setDemoIdentity`, `nowIso`, `revision`, `resetAllDemoData` | Controlled `ConfirmDialog` for destructive `localStorage` reset |

---

## 3. Detailed Sub-Iteration Changelogs (`1.01.1` – `1.01.4`)

<details open>
<summary><strong>3.1 Sub-Iteration <code>1.01.1</code> — Context, Provider &amp; Next.js 16 <code>cacheComponents</code> Audit</strong></summary>

### Goal
Audit shared Milestone 1 contracts (`domain.ts`, `sesh-provider.tsx`, `adapter.ts`, `seed.ts`, `dates.ts`, and `components/shared/*`) and Next.js `16.4.6` configuration (`cacheComponents: true`, `partialPrefetching: true`) before writing any shell or route code so all 5 parallel agents share an unbroken layout and session contract.

### Files Audited (Read-Only)
- `apps/web/next.config.ts`
- `apps/web/src/types/domain.ts`
- `apps/web/src/lib/context/sesh-provider.tsx`
- `apps/web/src/lib/data/adapter.ts`
- `apps/web/src/lib/mock/seed.ts`
- `apps/web/src/components/shared/{page-header,empty-state,demo-notice-banner,user-avatar,confirm-dialog}.tsx`

### Key Architectural Decisions
1. **Deterministic Pre-Hydration Identity**: Verified that `SeshProvider` initializes `viewer` synchronously to `{ mode: "MEMBER", user: DEMO_SWITCHABLE_USERS[0] }` (`Maya Patel`) and `nowIso` to `STATIC_FALLBACK_ANCHOR_ISO` (`"2026-11-11T21:00:00.000Z"`), flipping `isHydrated` to `true` inside a `useEffect` after attaching `window.localStorage`. This guarantees server HTML and first client render share identical viewer state.
2. **Reactive Adapter Subscription via `revision`**: Because `LocalMockSeshAdapter` mutates an internal overlay and emits change events, any `useMemo` in `SiteHeader`, `FriendsPage`, `NotificationsPage`, or `ProfilePage` must include `revision` in its dependency array (`void revision;`) so RSVPs, Move creations, and join-request approvals update badges and lists instantaneously.
3. **Active Route Grouping Semantics**: Decided that viewing an Event Detail (`/events/[id]`) or Move Group (`/move-groups/[id]`) should highlight **Events Hub** (`/`) on desktop and **Hub** on mobile, whereas `/events/new` highlights the dedicated **Create** tab on mobile and leaves `Events Hub` inactive on desktop so the primary **Create a Move** button stands out clearly.

### Key Contract Excerpt Verified (`SeshContextValue`)
```ts
// Verified contract in apps/web/src/lib/context/sesh-provider.tsx
export interface SeshContextValue {
  adapter: SeshDataAdapter;
  viewer: ViewerSession;
  availableDemoUsers: User[];
  setDemoIdentity: (choice: DemoIdentityChoice) => void;
  nowIso: string;
  isHydrated: boolean;
  revision: number;
  requireDemoMember: (actionDescription: string) => boolean;
  signInPrompt: { open: boolean; actionDescription: string };
  closeSignInPrompt: () => void;
  resetAllDemoData: () => void;
}
```

### Edge Cases & Verification Notes
- Confirmed `AppShell` itself should **omit** `"use client"` so `{children}` passed from `RootLayout` remains a pure Server Component slot capable of streaming async/cached Server Components (such as `/map` and `/events/[id]` metadata shells).

</details>

---

<details open>
<summary><strong>3.2 Sub-Iteration <code>1.01.2</code> — Global Shell, Responsive Navigation &amp; Demo Identity Runtime</strong></summary>

### Goal
Implement the root provider stack, accessible `AppShell`, sticky `SiteHeader`, `DesktopNav`, 5-tab `MobileNav`, `DemoIdentitySwitcher`, and `DemoSignInDialog`.

### Files Touched
- Modified: `apps/web/src/app/layout.tsx`
- Created: `apps/web/src/components/layout/app-shell.tsx`
- Created: `apps/web/src/components/layout/site-header.tsx`
- Created: `apps/web/src/components/layout/desktop-nav.tsx`
- Created: `apps/web/src/components/layout/mobile-nav.tsx`
- Created: `apps/web/src/components/layout/demo-identity-switcher.tsx`
- Created: `apps/web/src/components/layout/demo-sign-in-dialog.tsx`

### Architectural Decisions
1. **Persona Role Metadata (`DEMO_PERSONA_META`)**: Exported a canonical lookup dictionary from `demo-identity-switcher.tsx` mapping `user-maya` (*Primary Host*), `user-jordan` (*Friend Tester*), and `user-tyler` (*Non-Friend GT*) to concise role badges and testing hints. Reused this dictionary across `DemoIdentitySwitcher`, `DemoSignInDialog`, `FriendsNetworkPage`, and `ProfilePage` so persona guidance never drifts.
2. **Global Guest Interception (`DemoSignInDialog`)**: Mounted `<DemoSignInDialog />` once at the root of `AppShell`. Whenever any feature agent calls `requireDemoMember("RSVP to this Move")` while `viewer.mode === "GUEST"`, `SeshProvider` sets `signInPrompt = { open: true, actionDescription }` and `DemoSignInDialog` opens with 1-click persona cards.
3. **Safe-Area & Bottom-Bar Clearance**: Styled `MobileNav` with `pb-[env(safe-area-inset-bottom)]` for iOS home-indicator clearance and gave `<main id="main-content">` `pb-24 md:pb-12` so sticky cards or form footers at the bottom of pages are never obscured on viewports `< 768px`.

### Key Code Excerpt (`DEMO_PERSONA_META` & `AppShell`)
```tsx
// apps/web/src/components/layout/demo-identity-switcher.tsx
export const DEMO_PERSONA_META: Record<string, DemoPersonaMeta> = {
  "user-maya": {
    roleBadge: "Primary Host",
    roleHint:
      "Hosts Moves & Move Groups · has pending join requests to review",
  },
  "user-jordan": {
    roleBadge: "Friend Tester",
    roleHint:
      "In Maya's GT friend network · sees Friends-Only Moves & friend rosters",
  },
  "user-tyler": {
    roleBadge: "Non-Friend GT",
    roleHint:
      "Campus student outside Maya's friends · tests roster masking & join requests",
  },
};
```

```tsx
// apps/web/src/components/layout/app-shell.tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-primary-foreground focus:shadow-md"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-12 lg:px-8"
      >
        {children}
      </main>
      <MobileNav />
      <DemoSignInDialog />
    </div>
  );
}
```

### Edge Cases Handled
- **Pending Host Alert Dot**: `SiteHeader` computes `pendingAlertCount` across `adapter.listMoveGroups(viewer)` by summing `group.ownerManagement?.pendingRequests.length ?? 0`. When switched to `Maya Patel` (who owns `mg-west-midtown-rideshare` with a seeded pending request from `Tyler Nguyen`), an amber notification dot (`bg-amber-500`) renders immediately on the header bell icon and updates `aria-label` with the exact item count.
- **Empty / Whitespace Search Submission**: Submitting an empty or whitespace-only query in `HeaderQuickSearch` routes cleanly to `"/"` instead of `"/?q="`, clearing any stale Hub query filter.

</details>

---

<details open>
<summary><strong>3.3 Sub-Iteration <code>1.01.3</code> — Campus Shell Routes (<code>/map</code>, <code>/friends</code>, <code>/notifications</code>, <code>/profile</code>) &amp; Static Verification</strong></summary>

### Goal
Build all four shell routes owned by Agent 01 — turning deferred backend surfaces into high-signal interactive prototype tools — and validate all 11 files against ESLint, TypeScript, and render-purity checks.

### Files Touched
- Created: `apps/web/src/app/map/page.tsx`
- Created: `apps/web/src/app/friends/page.tsx`
- Created: `apps/web/src/app/notifications/page.tsx`
- Created: `apps/web/src/app/profile/page.tsx`

### Architectural Decisions
1. **`/map` as Zero-JS Server Component with Corridor Deep Links**: Rather than bundling Mapbox/Leaflet in Milestone 1, `CampusMapPlaceholderPage` is a pure Server Component explaining Sesh's privacy-first geospatial model (exact pins for public venues vs. neighborhood rings like *Home Park* for private residences) and providing 6 corridor filter cards (`Tech Green`, `Tech Square`, `Home Park`, `West Midtown`, `BeltLine`, `Campus`) that deep-link to `/?q=<encoded>`.
2. **`/friends` Dual-Partition Social Graph Inspector**: Partitions `SEED_USERS` into **Accepted Georgia Tech Friends** (displaying live `hostedMoves` count, `goingMoves` count, and a direct link to their next Move) and **Other Campus Members Outside Friend Graph** (explicitly demonstrating why those students appear as `"+1 other member"` inside unjoined Move Groups).
3. **`/notifications` Actionable Prototype Activity Feed**: Derives live activity cards directly from `adapter.listMoveGroups(viewer)` and `adapter.listEvents(viewer, {}, nowIso)`:
   - **Action Needed** cards for host-owned Move Groups with `PENDING` join requests (linking straight to `/move-groups/${group.id}`).
   - **Pending Approval** cards for groups where `viewerRelation === "PENDING_REQUEST"`.
   - **RSVP Going** reminders for up to 3 upcoming events.
4. **`/profile` Full Persona Workspace & Guarded Reset**: Combines the identity summary card, 4-metric stat bar, 4-card `aria-pressed` inline persona grid, Radix `Tabs` (`Hosted Moves` including `DRAFT` events via `{ includeDraftsOwnedByViewer: true }`, `RSVPs & Saved`, and `Move Groups`), and a destructive **Reset Local Demo Data** workflow guarded by `ConfirmDialog`.

### Key Code Excerpt (`ProfilePage` Draft-Inclusive Query & Reset Handler)
```tsx
// apps/web/src/app/profile/page.tsx
const { hostedMoves, rsvpAndSavedMoves, myMoveGroups } = useMemo(() => {
  void revision;
  if (viewer.mode !== "MEMBER") {
    return { hostedMoves: [], rsvpAndSavedMoves: [], myMoveGroups: [] };
  }

  const events = adapter.listEvents(
    viewer,
    { includeDraftsOwnedByViewer: true },
    nowIso
  );
  const groups = adapter.listMoveGroups(viewer);

  return {
    hostedMoves: events.filter((evt) => evt.hostId === viewer.user.id),
    rsvpAndSavedMoves: events.filter((evt) => evt.viewerResponse !== null),
    myMoveGroups: groups.filter(
      (grp) =>
        grp.viewerRelation === "CREATOR" ||
        grp.viewerRelation === "MEMBER" ||
        grp.viewerRelation === "PENDING_REQUEST"
    ),
  };
}, [adapter, viewer, nowIso, revision]);
```

### Verification Notes
- Executed `npx eslint` on all 11 owned files -> **Exit code 0** (zero warnings/errors).
- Executed `npx tsc --noEmit` across `apps/web` -> **Exit code 0**.
- Executed regex audit across `src/components/layout/*` and route files confirming zero render-time calls to `new Date()`, `Date.now()`, `Math.random()`, `crypto.randomUUID()`, `window.*`, or `localStorage.*`.

</details>

---

<details open>
<summary><strong>3.4 Sub-Iteration <code>1.01.4</code> — Post-Merge Partial Prerender &amp; Radix <code>useId()</code> Hydration Guard Refinement</strong></summary>

### Goal
Eliminate subtle React 19 / Next.js 16 Partial Prerendering (PPR) hydration mismatches discovered during full-app integration testing across dynamic routes (`/events/[id]`, `/move-groups/[id]`) and hard refreshes on non-root routes (`/friends`, `/profile`, `/notifications`).

### Files Touched
- Refined: `apps/web/src/components/layout/site-header.tsx`
- Refined: `apps/web/src/components/layout/desktop-nav.tsx`
- Refined: `apps/web/src/components/layout/mobile-nav.tsx`

### Root-Cause Analysis (Critical Debugging Reference)
During post-merge integration across all 5 Milestone 1 agents, two subtle Next.js 16 `cacheComponents: true` + Radix UI interactions surfaced:

1. **Failure Mode A — Radix `useId()` Tree-Order Drift Across `<Suspense>` Boundaries**:
   - In the initial `1.01.2` draft of `SiteHeader`, three mechanisms generated unstable React `useId()` tree paths during static shell prerendering:
     1. `HeaderQuickSearch` called `useSearchParams()` inside a `<Suspense>` boundary **and** rendered a Radix `<Dialog>` + `<Tooltip>` inside the resolved branch, while `HeaderQuickSearchFallback` did **not** mount `<Dialog>` or `<Tooltip>`.
     2. `HeaderUtilityLinksInner` wrapped its `/notifications` and `/profile` icon buttons in Radix `<Tooltip>` components inside a `<Suspense>` boundary that suspended on `usePathname()`, while `HeaderUtilityLinksFallback` rendered plain buttons without `<Tooltip>`.
     3. `SiteHeader` mounted **two** `<DemoIdentitySwitcher />` instances side-by-side (`<div className="hidden sm:block"><DemoIdentitySwitcher /></div>` and `<div className="sm:hidden"><DemoIdentitySwitcher compact /></div>`), doubling Radix `DropdownMenu` ID allocations downstream of the suspending search/utility boundaries.
   - **Why it broke on PPR routes**: When Next.js 16 prerendered a Partial Prerender shell (e.g., `/events/[id]`), the suspending `<Suspense>` boundaries rendered their *fallbacks* on the server, shifting React's internal `useId()` tree counters relative to the client pass where `useSearchParams()` / `usePathname()` resolved immediately. Consequently, sibling Radix primitives (`Dialog` and `DropdownMenuTrigger` in `DemoIdentitySwitcher`) hydrated with mismatched `id="radix-_R_..."` and `aria-controls` attributes!

2. **Failure Mode B — Cached Static Shell `usePathname()` Active-Link Mismatch**:
   - Under `cacheComponents: true`, `<DesktopNavFallback />` and `<MobileNavFallback />` render with all links in their **inactive** visual state (`text-muted-foreground`, no `aria-current="page"`, no active top pill bar).
   - If `DesktopNavInner`, `MobileNavInner`, or `HeaderUtilityLinksInner` immediately computed `isActive = item.match(pathname)` on the very first client hydration frame (`isHydrated === false`) when resuming a cached static shell on `/map` or `/profile`, React could observe a class/attribute delta (`aria-current="page"`, `bg-secondary`, or the `<span className="absolute top-0 h-0.5 w-8 ...">` indicator element) before hydration completed.

### Exact Architectural Fixes Applied in `1.01.4`
1. **Made `HeaderQuickSearch` 100% Non-Suspending**:
   - Removed `useSearchParams()` and its `<Suspense>` wrapper from `HeaderQuickSearch`. Header quick-search is a *navigation launcher* (`router.push("/?q=...")`), while the Events Hub (`src/components/events/event-filters.tsx`) already owns synchronized `?q=` filter state on `/`.
   - Replaced Radix `<Tooltip>` on header icon triggers with native accessible `title` + `aria-label` attributes so zero Radix `useId()` hooks sit inside suspending `<Suspense>` boundaries.
   - Consolidated `<DemoIdentitySwitcher />` to a **single** mounted instance in `SiteHeader`.
   - Result: Every Radix `useId()` hook in `SiteHeader` (`HeaderQuickSearch`'s `<Dialog>` and `DemoIdentitySwitcher`'s `<DropdownMenu>`) now executes in a fixed, unconditional, non-suspending tree position on both server and client!
2. **Gated Active Route State on `isHydrated` from `useSesh()`**:
   - Updated `DesktopNavInner`, `MobileNavInner`, and `HeaderUtilityLinksInner` to compute:
     ```tsx
     const { isHydrated } = useSesh();
     const isActive = isHydrated && item.match(pathname);
     ```
   - During SSR and the initial client hydration frame (`isHydrated === false`), both the `<Suspense>` fallback and the inner component produce **identical** inactive markup. Immediately after hydration completes (`useEffect` in `SeshProvider` sets `isHydrated = true`), React cleanly commits a normal client update that illuminates `aria-current="page"`, active icon tints, and the mobile top indicator bar with zero hydration warnings.

### Key Code Excerpt (`1.01.4` Hydration-Safe Pattern)
```tsx
// apps/web/src/components/layout/desktop-nav.tsx (lines 46-83)
function DesktopNavInner() {
  const pathname = usePathname();
  const { isHydrated } = useSesh();

  return (
    <nav
      aria-label="Primary campus navigation"
      className="hidden items-center gap-1 md:flex"
    >
      {DESKTOP_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = isHydrated && item.match(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

### Verification Notes
- Verified full production build (`npm run build` with `cacheComponents: true`) prerenders static shells and Partial Prerender routes (`/`, `/map`, `/friends`, `/notifications`, `/profile`, `/events/new`, `/events/[id]`, `/move-groups/[id]`) cleanly.
- Verified browser console across hard reloads on `/`, `/events/evt-west-midtown-neon`, `/move-groups/mg-west-midtown-rideshare`, `/map`, `/friends`, `/notifications`, and `/profile` emits **zero** React hydration mismatch or Radix `aria-controls` ID warnings.

</details>

---

## 4. Full TSDoc / Javadoc-Style Module & Component Reference

---

### `4.1` `RootLayout` (`src/app/layout.tsx`)

```ts
/**
 * @component    RootLayout
 * @file         apps/web/src/app/layout.tsx
 * @kind         React Server Component (Next.js App Router Root Layout)
 * @description  Defines the top-level `<html>` and `<body>` document skeleton, registers
 *               Geist Sans and Geist Mono CSS custom properties, exports site-wide Georgia Tech
 *               18+ metadata with `%s · Sesh` title templating, and mounts the global client
 *               provider hierarchy (`ThemeProvider` -> `TooltipProvider` -> `SeshProvider` ->
 *               `AppShell` + `Toaster`).
 *
 * @props        {Readonly<{ children: React.ReactNode }>} props
 * @param        props.children - Active route segment rendered inside `AppShell`.
 * @returns      {React.JSX.Element} Full HTML document tree.
 *
 * @state        Stateless RSC.
 * @sideEffects  None on server; `ThemeProvider` injects theme class script on client;
 *               `SeshProvider` hydrates `localStorage` inside `useEffect` post-mount.
 * @invariants   - `<html>` MUST carry `suppressHydrationWarning` because `next-themes` mutates
 *                 `class="light|dark"` and `style="color-scheme: ..."` before React hydrates.
 *               - Font variables `${geistSans.variable} ${geistMono.variable}` MUST remain on `<html>`
 *                 so Tailwind v4 `@theme inline` (`--font-sans`, `--font-mono`) resolves globally.
 * @accessibility Sets `lang="en"` on `<html>` for screen-reader pronunciation rules.
 * @security     Contains no secrets or user session cookies in Milestone 1; safe for static caching.
 */
```

```tsx
export const metadata: Metadata = {
  title: {
    default: "Sesh · Georgia Tech Campus Moves & Event Coordination",
    template: "%s · Sesh",
  },
  description:
    "18+ campus event discovery and small-group Move coordination launching at Georgia Tech & Midtown Atlanta.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <SeshProvider>
              <AppShell>{children}</AppShell>
              <Toaster />
            </SeshProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

### `4.2` `AppShell` (`src/components/layout/app-shell.tsx`)

```ts
/**
 * @component    AppShell
 * @file         apps/web/src/components/layout/app-shell.tsx
 * @kind         Server-Compatible Structural Layout Component (no `"use client"` directive)
 * @description  Composes Sesh's universal application frame: an accessible keyboard skip link,
 *               sticky `SiteHeader`, centered `<main id="main-content">` container, mobile
 *               bottom tab bar (`MobileNav`), and global Guest interception modal (`DemoSignInDialog`).
 *
 * @props        {{ children: React.ReactNode }} props
 * @param        props.children - Route page content injected into `<main id="main-content">`.
 * @returns      {React.JSX.Element} Responsive flex-column shell.
 *
 * @state        Stateless structural wrapper.
 * @sideEffects  None.
 * @invariants   - MUST NOT add `"use client"` to this file so `{children}` continues to accept
 *                 streamed Server Components without forcing client serialization.
 *               - `<main>` MUST retain `pb-24 md:pb-12` so the 64px (`h-16`) fixed `MobileNav`
 *                 plus iOS `env(safe-area-inset-bottom)` never overlaps interactive page controls.
 *               - `<main>` MUST retain `max-w-6xl px-4 py-6 sm:px-6 lg:px-8` to match `SiteHeader`
 *                 horizontal alignment across all 5 Milestone 1 feature tracks.
 * @accessibility First focusable element in DOM is `<a href="#main-content">` (`sr-only focus:not-sr-only`),
 *               allowing keyboard and switch-device users to bypass 7+ header controls in one `Tab`.
 */
```

---

### `4.3` `SiteHeader` (`src/components/layout/site-header.tsx`)

```ts
/**
 * @component    SiteHeader
 * @file         apps/web/src/components/layout/site-header.tsx
 * @kind         Client Component (`"use client"`)
 * @description  Sticky top campus navigation bar (`h-16`, `z-40`, backdrop-blurred) housing:
 *               1. Brand link (`/`) with `ZapIcon`, `"Sesh"` wordmark, and `"Georgia Tech · 18+"` badge.
 *               2. `<DesktopNav />` (`md+` primary links).
 *               3. `HeaderQuickSearch` (`lg+` inline search input + `<lg` modal search trigger,
 *                  both routing to `/?q=${encodeURIComponent(trimmed)}` or `/`).
 *               4. Primary desktop CTA button (`Create a Move` -> `/events/new`, `md+`).
 *               5. `<Suspense>`-isolated `HeaderUtilityLinksInner` (`/notifications` bell with live
 *                  pending join-request indicator dot + `/profile` account icon on `md+`).
 *               6. `<DemoIdentitySwitcher />` (amber-accented persona selector).
 *
 * @props        None (`{}`).
 * @returns      {React.JSX.Element} Sticky `<header>` landmark.
 *
 * @state        Internal to `HeaderQuickSearch`:
 *               - `inlineQuery: string` — Controlled text for desktop `<Input type="search">`.
 *               - `dialogOpen: boolean` — Controlled open state for `<lg` search `<Dialog>`.
 *               - `dialogQuery: string` — Controlled text for modal `<Input type="search">`.
 *               Derived in `SiteHeader`:
 *               - `pendingAlertCount: number` — Memoized sum of `ownerManagement.pendingRequests.length`
 *                 across `adapter.listMoveGroups(viewer)`, recomputed on `[adapter, viewer, revision]`.
 *
 * @sideEffects  Calls `router.push(...)` upon search form submission.
 * @invariants   - `HeaderQuickSearch` MUST NOT call `useSearchParams()` or suspend; keeping it
 *                 unconditional preserves deterministic Radix `useId()` allocation for `<Dialog>`
 *                 and downstream `<DemoIdentitySwitcher />`.
 *               - `HeaderUtilityLinksInner` MUST gate `isNotifications` and `isProfile` on `isHydrated`
 *                 and MUST NOT mount Radix `useId()` consumers inside its `<Suspense>` boundary.
 * @accessibility - Search landmark uses `role="search"` and explicit `aria-label`.
 *               - Notification link dynamically announces pending count via `aria-label`:
 *                 `"Notifications (N prototype activity items)"` when `pendingAlertCount > 0`.
 * @security     `pendingAlertCount` reads viewer-projected `MoveGroupView` where `ownerManagement`
 *               is populated exclusively when `canManage === true` (group creator); Guest mode
 *               short-circuits to `0`.
 */
```

```tsx
// Memoized host alert counter in SiteHeader (lines 206-215)
const pendingAlertCount = useMemo(() => {
  void revision;
  if (viewer.mode !== "MEMBER") return 0;
  const groups = adapter.listMoveGroups(viewer);
  return groups.reduce(
    (sum, group) =>
      sum + (group.ownerManagement?.pendingRequests.length ?? 0),
    0
  );
}, [adapter, viewer, revision]);
```

---

### `4.4` `DesktopNav` (`src/components/layout/desktop-nav.tsx`)

```ts
/**
 * @component    DesktopNav
 * @file         apps/web/src/components/layout/desktop-nav.tsx
 * @kind         Client Component (`"use client"`)
 * @description  Horizontal primary navigation bar visible at `md` (`>= 768px`) and wider.
 *               Renders semantic links for `Events Hub` (`/`), `Map` (`/map`), and `Friends` (`/friends`),
 *               wrapping the `usePathname()` consumer (`DesktopNavInner`) in a `<Suspense>` boundary
 *               with an identical inactive `<DesktopNavFallback />`.
 *
 * @interface    NavItem
 * @property     {string} href - Canonical route target.
 * @property     {string} label - Visible link text.
 * @property     {React.ComponentType<{ className?: string }>} icon - Lucide icon component.
 * @property     {(pathname: string) => boolean} match - Predicate determining active route state.
 *
 * @props        None (`{}`).
 * @returns      {React.JSX.Element} `<Suspense>`-wrapped `<nav aria-label="Primary campus navigation">`.
 *
 * @invariants   - `Events Hub` predicate matches `/`, `/events/*` EXCEPT `/events/new`, and `/move-groups/*`.
 *               - `isActive` MUST be gated as `isHydrated && item.match(pathname)` to prevent
 *                 PPR static-shell vs. client hydration class/attribute mismatches.
 * @accessibility Sets `aria-current="page"` on the active link post-hydration.
 */
```

```tsx
const DESKTOP_NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Events Hub",
    icon: CompassIcon,
    match: (pathname) =>
      pathname === "/" ||
      (pathname.startsWith("/events/") && pathname !== "/events/new") ||
      pathname.startsWith("/move-groups/"),
  },
  {
    href: "/map",
    label: "Map",
    icon: MapPinIcon,
    match: (pathname) => pathname === "/map" || pathname.startsWith("/map/"),
  },
  {
    href: "/friends",
    label: "Friends",
    icon: UsersIcon,
    match: (pathname) =>
      pathname === "/friends" || pathname.startsWith("/friends/"),
  },
];

export function DesktopNav() {
  return (
    <Suspense fallback={<DesktopNavFallback />}>
      <DesktopNavInner />
    </Suspense>
  );
}
```

---

### `4.5` `MobileNav` (`src/components/layout/mobile-nav.tsx`)

```ts
/**
 * @component    MobileNav
 * @file         apps/web/src/components/layout/mobile-nav.tsx
 * @kind         Client Component (`"use client"`)
 * @description  Fixed 5-tab bottom navigation bar (`md:hidden`, `z-40`, `h-16` + safe-area inset)
 *               providing thumb-friendly access to `Hub` (`/`), `Map` (`/map`), `Create` (`/events/new`),
 *               `Friends` (`/friends`), and `Profile` (`/profile`).
 *
 * @interface    MobileTabItem
 * @property     {string} href - Destination route.
 * @property     {string} label - Compact single-word tab label (`11px`).
 * @property     {React.ComponentType<{ className?: string }>} icon - Lucide icon component.
 * @property     {boolean} [isCreate] - Elevates the center `/events/new` tab with a circular `bg-primary` pill.
 * @property     {(pathname: string) => boolean} match - Route-matching predicate.
 *
 * @props        None (`{}`).
 * @returns      {React.JSX.Element} `<Suspense>`-wrapped `<nav aria-label="Mobile bottom navigation">`.
 *
 * @invariants   - Center tab (`Create` -> `/events/new`) renders a `size-7 rounded-full bg-primary` badge
 *                 in both `MobileNavFallback` and `MobileNavInner` so layout geometry never shifts.
 *               - Active top pill (`<span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary" />`)
 *                 renders ONLY when `isHydrated && tab.match(pathname)` is `true`.
 * @accessibility Uses semantic `<ul>` / `<li>` list structure inside `<nav>` with `aria-current="page"`
 *               and `focus-visible:ring-2` keyboard focus outlines.
 */
```

```tsx
const MOBILE_TABS: MobileTabItem[] = [
  {
    href: "/",
    label: "Hub",
    icon: CompassIcon,
    match: (pathname) =>
      pathname === "/" ||
      (pathname.startsWith("/events/") && pathname !== "/events/new") ||
      pathname.startsWith("/move-groups/"),
  },
  {
    href: "/map",
    label: "Map",
    icon: MapPinIcon,
    match: (pathname) => pathname === "/map" || pathname.startsWith("/map/"),
  },
  {
    href: "/events/new",
    label: "Create",
    icon: PlusCircleIcon,
    isCreate: true,
    match: (pathname) => pathname === "/events/new",
  },
  {
    href: "/friends",
    label: "Friends",
    icon: UsersIcon,
    match: (pathname) =>
      pathname === "/friends" || pathname.startsWith("/friends/"),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserCircle2Icon,
    match: (pathname) =>
      pathname === "/profile" || pathname.startsWith("/profile/"),
  },
];
```

---

### `4.6` `DemoIdentitySwitcher` (`src/components/layout/demo-identity-switcher.tsx`)

```ts
/**
 * @component    DemoIdentitySwitcher
 * @file         apps/web/src/components/layout/demo-identity-switcher.tsx
 * @kind         Client Component (`"use client"`)
 * @description  Amber-tinted prototype persona dropdown clearly labeled `"Demo Identity"` /
 *               `"Prototype Only"`. Enables 1-click switching between `Guest (Unauthenticated)`
 *               and the three switchable Georgia Tech student personas (`Maya Patel`, `Jordan Brooks`,
 *               `Tyler Nguyen`), plus a quick link to `/profile` for resetting demo data.
 *
 * @exports      {interface} DemoPersonaMeta - `{ roleBadge: string; roleHint: string }`
 * @exports      {Record<string, DemoPersonaMeta>} DEMO_PERSONA_META - Canonical persona metadata map.
 * @exports      {interface} DemoIdentitySwitcherProps
 *
 * @props        {DemoIdentitySwitcherProps} props
 * @param        {boolean} [props.compact=false] - Renders condensed trigger (`"Demo ID"` + first name).
 * @param        {string} [props.className] - Optional Tailwind class overrides on trigger `<Button>`.
 * @returns      {React.JSX.Element} Radix `DropdownMenu` component tree.
 *
 * @sideEffects  - Invokes `setDemoIdentity(nextValue)` which updates `SeshProvider` state, persists
 *                 choice to `window.localStorage["sesh.m1.demo-viewer.v1"]`, and closes `signInPrompt`.
 *               - Dispatches `toast.info(...)` for Guest or `toast.success(...)` for GT Members via `sonner`.
 * @invariants   - Trigger MUST visually distinguish prototype simulation from real auth using amber
 *                 chrome (`border-amber-500/35 bg-amber-500/5`) and `FlaskConicalIcon`.
 * @accessibility Trigger carries `aria-label="Switch Demo Identity (prototype simulation)"`; radio items
 *               expose `role="menuitemradio"` and `aria-checked` via `DropdownMenuRadioGroup`.
 * @security     FRONTEND SIMULATION ONLY. Must be removed or gated behind `NODE_ENV !== "production"`
 *               once real `@gatech.edu` authentication lands in the backend milestone.
 *
 * @example
 * // Standard header usage:
 * <DemoIdentitySwitcher />
 * // Compact usage:
 * <DemoIdentitySwitcher compact className="w-full" />
 */
```

```tsx
export function DemoIdentitySwitcher({
  compact = false,
  className,
}: DemoIdentitySwitcherProps) {
  const { viewer, availableDemoUsers, setDemoIdentity } = useSesh();

  const activeValue: DemoIdentityChoice =
    viewer.mode === "GUEST" ? "GUEST" : viewer.user.id;

  const handleChange = (nextValue: string) => {
    if (nextValue === activeValue) return;
    setDemoIdentity(nextValue);
    if (nextValue === "GUEST") {
      toast.info("Switched Demo Identity to Guest (Unauthenticated)");
    } else {
      const matched = availableDemoUsers.find((u) => u.id === nextValue);
      if (matched) {
        toast.success(`Switched Demo Identity to ${matched.displayName}`);
      }
    }
  };
  // Renders DropdownMenuTrigger (amber-bordered badge button) + DropdownMenuRadioGroup
```

---

### `4.7` `DemoSignInDialog` (`src/components/layout/demo-sign-in-dialog.tsx`)

```ts
/**
 * @component    DemoSignInDialog
 * @file         apps/web/src/components/layout/demo-sign-in-dialog.tsx
 * @kind         Client Component (`"use client"`)
 * @description  Global modal dialog listening to `signInPrompt` from `useSesh()`. Whenever an
 *               unauthenticated `Guest` viewer attempts a protected campus action (RSVP, Save,
 *               Create Move, Create/Join Move Group), `requireDemoMember(actionDescription)`
 *               opens this dialog explaining why Guest mode is read-only and offering 1-click
 *               persona switching to `Maya Patel`, `Jordan Brooks`, or `Tyler Nguyen`.
 *
 * @props        None (`{}`). Controlled via `SeshContextValue.signInPrompt`.
 * @returns      {React.JSX.Element} Controlled Radix `<Dialog>`.
 *
 * @state        Reads `signInPrompt.open` and `signInPrompt.actionDescription` (fallback:
 *               `"use campus social actions"`).
 * @sideEffects  Clicking a persona invokes `setDemoIdentity(userId)` (which atomically closes
 *               `signInPrompt` inside `SeshProvider`) and fires `toast.success(...)`.
 * @accessibility Traps focus while open, supports `Escape` dismissal via `onOpenChange`, and links
 *               `DialogTitle` + `DialogDescription` via `aria-labelledby` / `aria-describedby`.
 * @security     Explicitly displays a `ShieldAlertIcon` notice clarifying that real 18+ age
 *               verification and `@gatech.edu` auth will be enforced server-side in Milestone 2+.
 */
```

```tsx
export function DemoSignInDialog() {
  const {
    signInPrompt,
    closeSignInPrompt,
    availableDemoUsers,
    setDemoIdentity,
  } = useSesh();

  const actionLabel =
    signInPrompt.actionDescription.trim() || "use campus social actions";

  const handleSelectMember = (userId: string, displayName: string) => {
    setDemoIdentity(userId);
    toast.success(`Switched Demo Identity to ${displayName}`);
  };
  // Controlled <Dialog open={signInPrompt.open} onOpenChange={...}>
```

---

### `4.8` `CampusMapPlaceholderPage` (`src/app/map/page.tsx`)

```ts
/**
 * @route        /map
 * @component    CampusMapPlaceholderPage
 * @file         apps/web/src/app/map/page.tsx
 * @kind         React Server Component (Static Route + Exported `metadata`)
 * @description  Milestone 1 Campus Map placeholder route. Explains why interactive PostGIS radius
 *               queries and map tiles are deferred to the geospatial milestone, documents Sesh's
 *               privacy-first pin projection (exact public venue pins vs. approximate neighborhood
 *               rings for student residences), and provides 6 clickable Georgia Tech / Atlanta
 *               corridor cards that deep-link into the Events Hub (`/?q=<corridor>`).
 *
 * @exports      {Metadata} metadata - `{ title: "Campus Map", description: "..." }`
 * @returns      {React.JSX.Element} Static server-rendered page content.
 *
 * @invariants   - MUST NOT import `mapbox-gl`, `maplibre-gl`, `leaflet`, or `react-map-gl` in M1.
 *               - Every corridor card MUST URL-encode its query (`/?q=${encodeURIComponent(query)}`).
 */
```

```tsx
export const metadata: Metadata = {
  title: "Campus Map",
  description:
    "Preview Georgia Tech & Midtown Atlanta campus corridors on Sesh. Interactive PostGIS geospatial map pins arrive in a later milestone.",
};
// Renders PageHeader, DemoNoticeBanner, EmptyState, 2 architecture cards, and 6 CAMPUS_CORRIDORS deep-link cards
```

---

### `4.9` `FriendsNetworkPage` (`src/app/friends/page.tsx`)

```ts
/**
 * @route        /friends
 * @component    FriendsNetworkPage
 * @file         apps/web/src/app/friends/page.tsx
 * @kind         Client Component (`"use client"`)
 * @description  Interactive Georgia Tech friend-network inspector for the active Demo Identity:
 *               - In `GUEST` mode: Renders `EmptyState` explaining why Guests have no campus friend
 *                 graph plus 3 persona preview cards for 1-click switching.
 *               - In `MEMBER` mode: Renders active network banner, **Accepted Georgia Tech Friends**
 *                 cards (with live `Hosting N Moves` / `Going to N Moves` counts, `Next Move` link,
 *                 `View Hosted Moves` Hub filter `/?q=<username>`, and `Switch to Persona` button),
 *                 followed by **Other Campus Members Outside Friend Graph** illustrating Move Group
 *                 roster masking (`"Masked in Rosters"` / `"+1 other member"`).
 *
 * @state        Memoized derivations:
 *               - `visibleEvents`: `adapter.listEvents(viewer, {}, nowIso)` keyed on `revision`.
 *               - `switchableIds`: `Set<string>` of IDs in `availableDemoUsers`.
 *               - `{ friends, nonFriendCampusUsers }`: Partition of `SEED_USERS` against `viewer.user.friendIds`.
 *
 * @sideEffects  Persona switch buttons call `setDemoIdentity(userId)` + `toast.success(...)`.
 * @security     Friend attendance counts (`goingMoves`) are computed exclusively from viewer-projected
 *               `EventView.friendsGoing`, never from raw `EventResponse` records.
 */
```

```tsx
const { friends, nonFriendCampusUsers } = useMemo(() => {
  if (viewer.mode !== "MEMBER") {
    return { friends: [], nonFriendCampusUsers: SEED_USERS };
  }
  const friendIdSet = new Set(viewer.user.friendIds);
  return {
    friends: SEED_USERS.filter((u) => friendIdSet.has(u.id)),
    nonFriendCampusUsers: SEED_USERS.filter(
      (u) => u.id !== viewer.user.id && !friendIdSet.has(u.id)
    ),
  };
}, [viewer]);
```

---

### `4.10` `NotificationsPlaceholderPage` (`src/app/notifications/page.tsx`)

```ts
/**
 * @route        /notifications
 * @component    NotificationsPlaceholderPage
 * @file         apps/web/src/app/notifications/page.tsx
 * @kind         Client Component (`"use client"`)
 * @description  Prototype Activity Center deriving actionable campus coordination items from live
 *               local adapter state while explaining that real push/SMS/background streams are
 *               deferred to the backend milestone.
 *
 * @state        Memoized activity buckets (empty arrays when `viewer.mode === "GUEST"`):
 *               1. `pendingRequestsForHost`: Flattened `{ group, request }` pairs from
 *                  `group.ownerManagement?.pendingRequests` -> links to `/move-groups/${group.id}`.
 *               2. `myPendingJoinGroups`: Groups where `group.viewerRelation === "PENDING_REQUEST"`.
 *               3. `upcomingGoingEvents`: Top 3 visible events where `evt.viewerResponse === "GOING"`.
 *
 * @invariants   `totalSimulatedItems` sum drives conditional rendering between the caught-up
 *               `EmptyState` and the `#simulated-activity-heading` feed section.
 * @security     Host join-request notes and requester identities only appear because `adapter.listMoveGroups`
 *               populates `ownerManagement` strictly when `group.creatorId === viewer.user.id`.
 */
```

```tsx
const hostRequests = groups.flatMap((group) =>
  (group.ownerManagement?.pendingRequests ?? []).map((req) => ({
    group,
    request: req,
  }))
);
const viewerPending = groups.filter(
  (group) => group.viewerRelation === "PENDING_REQUEST"
);
const going = events
  .filter((evt) => evt.viewerResponse === "GOING")
  .slice(0, 3);
```

---

### `4.11` `ProfilePage` (`src/app/profile/page.tsx`)

```ts
/**
 * @route        /profile
 * @component    ProfilePage
 * @file         apps/web/src/app/profile/page.tsx
 * @kind         Client Component (`"use client"`)
 * @description  Comprehensive Demo Identity dashboard, personal activity hub, and prototype data
 *               management console:
 *               1. Header actions: `Create a Move` (`/events/new`) + `Reset Local Demo Data`.
 *               2. Identity Summary Card: Avatar, verified GT badge, role badge, bio, `<DemoIdentitySwitcher />`,
 *                  and 4-stat summary grid (`Hosted Moves`, `RSVPs & Saved`, `Move Groups`, `GT Friends`).
 *               3. Inline 4-Card Persona Switcher Grid (`Guest`, `Maya`, `Jordan`, `Tyler`) with `aria-pressed`.
 *               4. Tabbed Member Activity (`Hosted Moves` including `DRAFT` events + `/events/${id}/edit` CTA,
 *                  `RSVPs & Saved` with `Going`/`Interested`/`Saved` badges, and `Move Groups` with spot counts
 *                  and pending request badges).
 *               5. Destructive `Reset Local Demo Data` card + `ConfirmDialog` wired to `resetAllDemoData()`.
 *
 * @state        - `resetDialogOpen: boolean` — Controls confirmation modal before wiping local edits.
 *               - `{ hostedMoves, rsvpAndSavedMoves, myMoveGroups }` — Memoized on `[adapter, viewer, nowIso, revision]`.
 *
 * @sideEffects  - `handleIdentitySelect`: Calls `setDemoIdentity(choice)` + `toast.info` / `toast.success`.
 *               - `handleConfirmReset`: Calls `resetAllDemoData()` (removes `sesh.m1.demo-store.v1` from
 *                 `localStorage`, re-anchors seed dataset to current UTC timestamp, increments `revision`)
 *                 and fires `toast.success("Local demo data reset to the initial Georgia Tech seed state.")`.
 *
 * @invariants   - `adapter.listEvents` MUST be called with `{ includeDraftsOwnedByViewer: true }` so
 *                 unpublished drafts saved in `/events/new` or `/events/[id]/edit` remain discoverable
 *                 and editable by their host on `/profile`.
 *               - Destructive reset MUST NEVER execute without user confirmation in `ConfirmDialog`.
 */
```

```tsx
const handleConfirmReset = () => {
  resetAllDemoData();
  toast.success(
    "Local demo data reset to the initial Georgia Tech seed state."
  );
};

<ConfirmDialog
  open={resetDialogOpen}
  onOpenChange={setResetDialogOpen}
  title="Reset local demo data?"
  description="This will remove all locally created Moves, edits, RSVPs, Saved items, and Move Group changes stored in this browser and restore the original Georgia Tech seed dataset."
  confirmLabel="Reset Local Demo Data"
  cancelLabel="Keep Current Data"
  variant="destructive"
  onConfirm={handleConfirmReset}
/>
```

---

## 5. Regression & Error-Checking Checklist (`SHELL-*`, `HYDR-*`, `AUTH-*`)

Use this invariant table whenever modifying `layout.tsx`, `components/layout/*`, or upgrading Sesh from Milestone 1 simulated personas to production `.edu` authentication.

### 5.1 Layout & Navigation Chrome Invariants (`SHELL-*`)

| ID | Invariant | Verification Method |
| :--- | :--- | :--- |
| **`SHELL-01`** | `AppShell` remains a Server-Compatible component (no `"use client"` at top of `app-shell.tsx`) so `{children}` supports RSC streaming and `generateMetadata`. | Inspect line 1 of `src/components/layout/app-shell.tsx`. |
| **`SHELL-02`** | `<main id="main-content">` preserves `pb-24 md:pb-12` so `MobileNav` (`h-16` + safe-area inset) never covers bottom buttons or cards on `< 768px` viewports. | Emulate iPhone 15 (`390x844`) on `/profile` and scroll to the bottom Reset card. |
| **`SHELL-03`** | Skip link `<a href="#main-content">` is the first focusable DOM node and matches `id="main-content"` on `<main>`. | Press `Tab` once after page load; verify visible primary pill in top-left corner. |
| **`SHELL-04`** | No child route (`/`, `/map`, `/friends`, `/notifications`, `/profile`, `/events/*`, `/move-groups/*`) renders a second `<SiteHeader />` or `<MobileNav />`. | Search codebase for `<SiteHeader` and `<MobileNav`; must appear ONLY in `app-shell.tsx`. |
| **`SHELL-05`** | `ProfilePage` queries `adapter.listEvents(viewer, { includeDraftsOwnedByViewer: true }, nowIso)` so host drafts remain reachable and editable. | Save a Move as Draft in `/events/new`, navigate to `/profile`, verify `"Private Draft"` badge and `Edit` link. |

### 5.2 Next.js 16 `cacheComponents` & Hydration Invariants (`HYDR-*`)

| ID | Invariant | Verification Method |
| :--- | :--- | :--- |
| **`HYDR-01`** | Every `usePathname()` or `useSearchParams()` call inside global shell chrome is isolated inside a `<Suspense fallback={...}>` leaf (`DesktopNav`, `MobileNav`, `HeaderUtilityLinksInner`). | Run `npm run build`; verify zero `Uncached data or connection was accessed outside of <Suspense>` errors. |
| **`HYDR-02`** | **Zero Radix `useId()` hooks** (`Dialog`, `DropdownMenu`, `Tooltip`, `Select`, `Tabs`, `Popover`) are mounted inside a `<Suspense>` boundary whose fallback omits those exact Radix hooks. | Inspect `HeaderQuickSearch` (non-suspending) and `HeaderUtilityLinksInner` (native `title`, no `<Tooltip>`). |
| **`HYDR-03`** | `<DemoIdentitySwitcher />` is mounted **once** in `SiteHeader` (responsive internally/via CSS rather than duplicating two `<DropdownMenu>` trees). | Inspect `SiteHeader` JSX; verify single `<DemoIdentitySwitcher />` call. |
| **`HYDR-04`** | Route-active classes, `aria-current="page"`, and active indicator elements in `DesktopNavInner`, `MobileNavInner`, and `HeaderUtilityLinksInner` are gated by `isHydrated && ...`. | Hard-refresh `/map`, `/profile`, and `/events/evt-west-midtown-neon`; verify zero console hydration warnings. |
| **`HYDR-05`** | Zero render-body calls to `new Date()`, `Date.now()`, `Math.random()`, `crypto.randomUUID()`, `window`, or `localStorage`. | Grep `src/components/layout` and shell route files; all timestamps derive from `useSesh().nowIso`. |

### 5.3 Prototype Privacy & Future Auth Migration Invariants (`AUTH-*`)

| ID | Invariant | Milestone 2 / Auth Migration Action |
| :--- | :--- | :--- |
| **`AUTH-01`** | `Guest (Unauthenticated)` never receives a synthetic `User` object (`viewer = { mode: "GUEST", user: null }`). | Preserve discriminated union `ViewerSession` when replacing `localStorage` persona state with HTTP-only session / JWT auth. |
| **`AUTH-02`** | `DemoIdentitySwitcher` and `DemoSignInDialog` clearly display `"Prototype Only"` / `"Not Real Auth"`. | Replace `DemoSignInDialog` with real `@gatech.edu` OTP / OAuth sign-in modal; gate `DemoIdentitySwitcher` behind `NEXT_PUBLIC_ENABLE_DEMO_SWITCHER === "true"` in non-prod only. |
| **`AUTH-03`** | `SiteHeader` notification dot and `/notifications` feed read only viewer-projected `MoveGroupView.ownerManagement`. | Replace client `listMoveGroups` reduction with lightweight `/api/notifications/unread-count` endpoint enforced server-side. |
| **`AUTH-04`** | `/profile` destructive reset (`resetAllDemoData`) is guarded by `ConfirmDialog` and affects only browser `localStorage`. | Remove `Reset Local Demo Data` card in production builds once backed by PostgreSQL. |

---

## 6. Diagnostic Playbook for Future Milestones

### Symptom 1: `Hydration failed because the server rendered HTML didn't match the client` on `id="radix-_R_..."`
- **Root Cause**: A new Radix UI primitive (`Tooltip`, `Popover`, `DropdownMenu`, `Dialog`) was placed inside or conditionally ahead of a `<Suspense>` boundary that suspends during Partial Prerendering (`usePathname()`, `useSearchParams()`, or async data).
- **Fix**: Move the Radix primitive outside the suspending leaf, make the leaf non-suspending (like `HeaderQuickSearch`), or replace decorative Radix `<Tooltip>` wrappers inside suspending nav leaves with native `title` + `aria-label` attributes (`HYDR-02`).

### Symptom 2: `Uncached data was accessed outside of <Suspense>` during `npm run build`
- **Root Cause**: A component imported by `RootLayout` / `AppShell` called `usePathname()`, `useSearchParams()`, `cookies()`, or `headers()` without a `<Suspense>` boundary above it.
- **Fix**: Split the component into `<ComponentInner />` (calling the hook) and `<ComponentFallback />` (matching static skeleton/inactive state), and export `<Suspense fallback={<ComponentFallback />}><ComponentInner /></Suspense>` (`HYDR-01`).

### Symptom 3: Header notification badge or `/profile` counts stay stale after creating a Move or approving a Join Request
- **Root Cause**: A `useMemo` reading from `adapter.listEvents(...)` or `adapter.listMoveGroups(...)` omitted `revision` from `useSesh()` in its dependency array.
- **Fix**: Destructure `{ adapter, viewer, nowIso, revision } = useSesh()`, include `void revision;` at the top of the `useMemo` callback, and list `[adapter, viewer, nowIso, revision]` in dependencies.

### Symptom 4: Newly saved Draft Move is missing from the host's `/profile` page
- **Root Cause**: `adapter.listEvents(viewer)` defaults `includeDraftsOwnedByViewer` to `false` so drafts never leak onto the public Hub, `/friends`, or `/notifications`.
- **Fix**: Ensure `/profile` passes `{ includeDraftsOwnedByViewer: true }` as the second argument to `adapter.listEvents` (`SHELL-05`).

---

[Root README](../../../../README.md) · [Milestone 1 Index](../README.md)
