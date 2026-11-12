[Root README](../../../../README.md) · [Milestone 1 Index](../README.md)

---

# Milestone 1 · Agent 04 (`1.04`) — Create & Edit a Move

```ts
/**
 * @module       @sesh/web/moves/create-edit
 * @milestone    Milestone 1 — Core MVP Frontend
 * @agent        Agent 04 (1.04 — Create & Edit a Move)
 * @iterations   1.04.1, 1.04.2, 1.04.3, 1.04.4
 * @owner        Feature Agent 04 ("Create & Edit a Move")
 * @status       VERIFIED (TypeScript 5 strict `tsc --noEmit` + ESLint 9 + Vitest)
 * @runtime      Next.js 16.4.6 App Router (`cacheComponents: true`, Partial Prerendering)
 * @timezone     Stored as UTC ISO-8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`); authored & displayed in `America/New_York` (ET)
 * @see          apps/web/src/app/events/new/page.tsx
 * @see          apps/web/src/app/events/[id]/edit/page.tsx
 * @see          apps/web/src/components/moves/edit-move-view.tsx
 * @see          apps/web/src/components/moves/move-form.tsx
 * @see          apps/web/src/components/moves/move-preview.tsx
 * @see          apps/web/src/lib/validation/schemas.ts
 */
```

---

## Table of Contents

1. [Module Scope & File Ownership Inventory](#1-module-scope--file-ownership-inventory)
2. [Domain Distinction (`Move` vs. `MoveGroup`), Form Lifecycle & Persistence Architecture](#2-domain-distinction-move-vs-movegroup-form-lifecycle--persistence-architecture)
3. [Sub-Iteration Changelogs (`1.04.1` – `1.04.4`)](#3-sub-iteration-changelogs-1041--1044)
   - [`1.04.1` — Routes, `<Suspense>` `params` Isolation & Guest/Host-Only Authorization Guards](#31-sub-iteration-1041--routes-suspense-params-isolation--guesthost-only-authorization-guards)
   - [`1.04.2` — React Hook Form + Zod v4 Validation & `America/New_York` Timezone Conversion](#32-sub-iteration-1042--react-hook-form--zod-v4-validation--americanew_york-timezone-conversion)
   - [`1.04.3` — General Viewer vs. Unlocked Attendee Live Preview](#33-sub-iteration-1043--general-viewer-vs-unlocked-attendee-live-preview)
   - [`1.04.4` — Browser-Local Draft/Publish Persistence & Move Group Toast Follow-Up](#34-sub-iteration-1044--browser-local-draftpublish-persistence--move-group-toast-follow-up)
4. [TSDoc / Javadoc-Style API, Schema & Component Reference](#4-tsdoc--javadoc-style-api-schema--component-reference)
   - [`NewMovePage` (`/events/new`)](#41-newmovepage-eventsnew)
   - [`EditMovePage` & `EditMoveLoader` (`/events/[id]/edit`)](#42-editmovepage--editmoveloader-eventsidedit)
   - [`EditMoveView` (`edit-move-view.tsx`)](#43-editmoveview-edit-move-viewtsx)
   - [`MoveForm` & Internal Helpers (`move-form.tsx`)](#44-moveform--internal-helpers-move-formtsx)
   - [`MovePreview` (`move-preview.tsx`)](#45-movepreview-move-previewtsx)
   - [`moveFormSchema` & `MoveFormValues` (`schemas.ts`)](#46-moveformschema--moveformvalues-schemasts)
5. [Regression & Error-Checking Matrix](#5-regression--error-checking-matrix)
6. [Backend REST API Swap Guide (Milestone 2 / Milestone 5)](#6-backend-rest-api-swap-guide-milestone-2--milestone-5)

---

## 1. Module Scope & File Ownership Inventory

Agent `1.04` owns the authoring and editing lifecycle for **Moves** across five strictly bounded frontend files, consuming shared domain contracts (`domain.ts`), Zod v4 validation (`schemas.ts`), Eastern Time utilities (`dates.ts`), viewer permission policies (`policies.ts`), and the centralized `SeshDataAdapter` (`adapter.ts`).

| File Path | Layer | Rendering Boundary | Responsibility |
| --- | --- | --- | --- |
| `apps/web/src/app/events/new/page.tsx` | App Router Page | `"use client"` | Entry route `/events/new`; renders `PageHeader`, pre-hydration `DetailPageSkeleton`, Guest sign-in gate (`requireDemoMember`), or `<MoveForm mode="create" />` keyed by active member ID. |
| `apps/web/src/app/events/[id]/edit/page.tsx` | App Router Page | Server Component + `<Suspense>` | Entry route `/events/[id]/edit`; isolates `await params` inside async `<EditMoveLoader>` under `<Suspense fallback={<DetailPageSkeleton />}>` for Next.js 16 `cacheComponents: true`. |
| `apps/web/src/components/moves/edit-move-view.tsx` | Feature View | `"use client"` | Resolves `adapter.getEvent(eventId, viewer)` post-hydration and enforces four-state gatekeeping: Skeleton -> `NOT_FOUND` -> `RESTRICTED` -> Non-Host Unauthorized -> Authorized `<MoveForm mode="edit" />`. |
| `apps/web/src/components/moves/move-form.tsx` | Feature Form | `"use client"` | Dual-mode (`create` / `edit`) React Hook Form + Zod v4 (`zodResolver(moveFormSchema)`) form with `Controller`-bound Radix `<Select>` controls, ET wall-clock conversion, sticky/dialog `MovePreview`, and `DRAFT` vs. `PUBLISHED` submission handlers. |
| `apps/web/src/components/moves/move-preview.tsx` | Feature Preview | `"use client"` | Real-time simulated Move card with interactive `GENERAL` vs. `UNLOCKED` perspective tabs demonstrating exact-address masking (`privateAddress` vs. `publicDisplayLocation`) and audience visibility rules. |
| `apps/web/src/lib/validation/schemas.ts` *(shared)* | Validation Contract | Isomorphic TS | Defines `moveFormSchema` (Zod v4 `z.object(...).superRefine(...)`) and inferred `MoveFormValues` consumed by `MoveForm` and `MovePreview`. |

---

## 2. Domain Distinction (`Move` vs. `MoveGroup`), Form Lifecycle & Persistence Architecture

### 2.1 Core Domain Distinction: `Move` vs. `MoveGroup`

A foundational UX and data-modeling invariant in Sesh is keeping **Moves** and **Move Groups** unambiguous in every header, helper callout, and post-publish CTA:

| Concept | Internal Record / Projection | Primary Routes | Owned By | Cardinality & Purpose |
| --- | --- | --- | --- | --- |
| **Move** | `EventRecord` / `EventView` | `/events/new`, `/events/[id]`, `/events/[id]/edit` | Single student host (`hostId`) | **1 Event** — The campus event itself (e.g., Home Park DJ set, Cypress Pint & Plate social, org tailgate) with schedule, venue, admission, audience visibility, and address-privacy rules. |
| **Move Group** | `MoveGroupRecord` / `MoveGroupView` | `/move-groups/new`, `/move-groups/[id]`, `/move-groups/[id]/manage` | Group creator (`creatorId`) + accepted `members[]` | **0..N per Published Move** — A small coordination crew (2–50 students) planning a meetup spot, pre-game time, and walk-over or rideshare to attend a specific `PUBLISHED` Move together. |

> **Cross-Feature Invariant:** `SeshDataAdapter.createMoveGroup` rejects any parent `eventId` whose `status !== "PUBLISHED"`. Saving a Move as `DRAFT` keeps it private to `hostId` and intentionally blocks Move Group creation until the host publishes the Move.

### 2.2 End-to-End Form Lifecycle & Local Persistence Dataflow

```text
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 1. ROUTE & HYDRATION GATE                                                         │
│   • /events/new         -> !isHydrated ? Skeleton : GUEST ? Gate : <MoveForm />   │
│   • /events/[id]/edit   -> <Suspense> -> await params -> <EditMoveView id={id} /> │
│                         -> !isHydrated ? Skeleton : getEvent(id, viewer)          │
│                         -> NOT_FOUND | RESTRICTED | !canEdit | <MoveForm />       │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 2. DETERMINISTIC INITIALIZATION & REACTIVE PREVIEW                                │
│   • buildInitialFormValues(mode, nowIso, initialEvent)                            │
│     - Create: anchor `nowIso` -> NY 21:00–23:30 ET (today if <19:00 ET, else +1d) │
│     - Edit:   `utcIsoToNyLocalInput(startAt/endAt)`, strips synthetic "Free" note │
│   • Post-mount `useEffect`: updates untouched create times once live clock mounts │
│   • `useWatch({ control })` -> `liveValues` -> feeds <MovePreview /> in 0ms       │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 3. ZOD v4 VALIDATION (`zodResolver(moveFormSchema)`)                              │
│   • Base field rules: title (3..100), description (10..2000), venue (2..120),     │
│     enums (`category`, `addressPrivacy`, `visibility`, `pricingMode`),            │
│     optional HTTP(S) `coverImage`, optional integer `capacityText` (1..50000)     │
│   • Cross-field `.superRefine(...)`:                                              │
│     1) `nyLocalInputToUtcIso(startLocal)` & `nyLocalInputToUtcIso(endLocal)` valid│
│     2) `endMs > startMs`                                                          │
│     3) `pricingMode === "PAID"` => non-empty `priceLabel`                         │
│     4) `addressPrivacy !== "PUBLIC_VENUE"` => non-empty `publicDisplayLocation`   │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 4. SUBMIT HANDLER (`submitWithStatus(values, "DRAFT" | "PUBLISHED")`)             │
│   • Re-verifies `requireDemoMember(...)`                                          │
│   • Converts NY wall-clock strings -> UTC ISO via `nyLocalInputToUtcIso(...)`     │
│   • Parses `capacity` (`number | null`) & `amountUsd` (`parseOptionalUsdAmount`)  │
│   • Generates `submitTimestampIso = new Date().toISOString()` ONLY inside handler │
│   • Calls `adapter.createEvent(...)` or `adapter.updateEvent(...)`                │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 5. BROWSER-LOCAL ADAPTER OVERLAY (`sesh.m1.demo-store.v1` in `localStorage`)      │
│   • New Move: allocates `evt-local-${nextSequence}`, appends to `localEvents[]`,  │
│     auto-inserts `{ userId: host.id, response: "GOING" }` if `PUBLISHED`          │
│   • Edited Move: updates `localEvents[idx]` or writes `editedSeedEvents[eventId]` │
│   • Persists JSON to `window.localStorage`, emits `revision++` to `SeshProvider`  │
│   • Fires `sonner` toast (with "Create Move Group" action when `PUBLISHED`) and   │
│     routes to `/events/${saved.id}` (with `?justCreated=1` on new publish)        │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Sub-Iteration Changelogs (`1.04.1` – `1.04.4`)

### 3.1 Sub-Iteration `1.04.1` — Routes, `<Suspense>` `params` Isolation & Guest/Host-Only Authorization Guards

#### Objective
Establish Next.js 16.4.6 (`cacheComponents: true`) compliant routes for `/events/new` and `/events/[id]/edit` with deterministic SSR/PPR shells, safe hydration of `localStorage`-backed Moves (`evt-local-*`), one-click Guest persona elevation, and strict host-only edit authorization that never mounts `<MoveForm>` or leaks private fields to unauthorized viewers.

#### Files Touched
- `apps/web/src/app/events/new/page.tsx`
- `apps/web/src/app/events/[id]/edit/page.tsx`
- `apps/web/src/components/moves/edit-move-view.tsx`

#### Architectural & Security Rationale
1. **Next.js 16 Dynamic `params` Promise Isolation:** Under `cacheComponents: true`, awaiting `params: Promise<{ id: string }>` at the top level of a Server Component blocks Partial Prerendering and triggers dynamic-IO build errors unless wrapped inside `<Suspense>`. `EditMovePage` stays synchronous and delegates `const { id } = await params;` to an inner async `<EditMoveLoader>` inside `<Suspense fallback={<DetailPageSkeleton />}>`.
2. **Hydration Race Prevention on Refresh (`!isHydrated`):** Before client mount, `LocalMockSeshAdapter` runs in memory against `STATIC_FALLBACK_ANCHOR_ISO` without `window.localStorage`. Refreshing `/events/evt-local-101/edit` before `attachBrowserStorage` completes would falsely return `NOT_FOUND` if queried during initial render. `EditMoveView` short-circuits `lookup` to `null` while `!isHydrated` and renders `<DetailPageSkeleton />` until `localStorage` and session identity have both hydrated.
3. **Zero-Leak Host-Only Gatekeeping:** `EditMoveView` evaluates four ordered guard states before mounting `<MoveForm>`:
   - `NOT_FOUND` -> Missing/cancelled Move `EmptyState` with links to `/` and `/events/new`.
   - `RESTRICTED` -> Private draft or restricted-audience Move (`FRIENDS`, `CUSTOM`, `INVITE_ONLY`) hidden from the current viewer; prompts `GUEST` viewers with `requireDemoMember` or instructs signed-in members to switch personas.
   - `!isAuthorizedHost` (`viewer.mode !== "MEMBER" || !event.canEdit || event.hostId !== viewer.user.id`) -> Publicly visible Move opened at `/edit` by a Guest or non-host student; displays the host's public handle (`@{event.host.username}`) and links back to `/events/${event.id}` without ever mounting `<MoveForm>` or exposing `unlockedPrivateAddress`.
   - `isAuthorizedHost === true` -> Renders `<MoveForm mode="edit" initialEvent={event} />` keyed by `${event.id}-${viewer.user.id}-${event.updatedAt}`.

#### Implementation Excerpts

```tsx
// apps/web/src/app/events/[id]/edit/page.tsx
async function EditMoveLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditMoveView eventId={id} />;
}

export default function EditMovePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <DetailPageSkeleton />
        </div>
      }
    >
      <EditMoveLoader params={params} />
    </Suspense>
  );
}
```

```tsx
// apps/web/src/components/moves/edit-move-view.tsx (Hydration & Host Authorization Guards)
const lookup = useMemo(() => {
  if (!isHydrated) return null;
  // Touch revision so edits/resets re-run projection cleanly
  void revision;
  return adapter.getEvent(eventId, viewer);
}, [adapter, eventId, viewer, isHydrated, revision]);

if (!isHydrated || !lookup) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <DetailPageSkeleton />
    </div>
  );
}
// ... NOT_FOUND and RESTRICTED branches ...
const { event } = lookup;
const isAuthorizedHost =
  viewer.mode === "MEMBER" &&
  event.canEdit &&
  event.hostId === viewer.user.id;
```

#### Edge Cases Solved & Error-Check Notes
- **Persona Switching Mid-Session:** On both `/events/new` (`key={viewer.user.id}`) and `/events/[id]/edit` (`key={`${event.id}-${viewer.user.id}-${event.updatedAt}`}`), switching demo personas in the global header cleanly remounts `MoveForm` or transitions immediately into the Guest/Non-Host guard state without stale form values bleeding across users.
- **Demo Data Reset Reactivity:** Subscribing `useMemo` to `revision` ensures clicking "Reset Demo Data" immediately re-evaluates `adapter.getEvent(eventId, viewer)`.

---

### 3.2 Sub-Iteration `1.04.2` — React Hook Form + Zod v4 Validation & `America/New_York` Timezone Conversion

#### Objective
Build the reusable `MoveForm` (`mode: "create" | "edit"`) backed by `useForm<MoveFormValues>({ resolver: zodResolver(moveFormSchema), mode: "onBlur" })`, wiring controlled Radix/shadcn `<Select>` fields, deterministic Eastern Time (`America/New_York`) datetime-local defaults, and inline field-level error alerts.

#### Files Touched
- `apps/web/src/components/moves/move-form.tsx`
- `apps/web/src/lib/validation/schemas.ts` *(verified & integrated against `@hookform/resolvers/zod` v7 + `zod` v4.6.7)*

#### Architectural & Validation Rationale
1. **Zod v4 + `@hookform/resolvers` v7 Type Alignment:** `moveFormSchema` uses strictly typed primitives and `z.enum(...)` tuples without `.transform(...)` mutations that diverge input vs. output types, ensuring `z.infer<typeof moveFormSchema>` (`MoveFormValues`) matches both `z4.input<T>` and `z4.output<T>` in `zodResolver(moveFormSchema)` with zero `as any` casts.
2. **Controlled Radix `<Select>` Integration:** Native `<select>` ref registration (`register(...)`) does not bind to Radix UI's portal-rendered `<SelectPrimitive.Root>`. All four enum dropdowns (`category`, `addressPrivacy`, `visibility`, `pricingMode`) use React Hook Form's `<Controller>` passing `value={field.value}` and `onValueChange={(val) => field.onChange(val)}` with `aria-invalid={Boolean(errors[name])}` on `<SelectTrigger>`.
3. **Deterministic Clock & Timezone Conversion (`America/New_York`):**
   - HTML `<input type="datetime-local" />` emits timezone-less strings (`YYYY-MM-DDTHH:mm`). Interpreting them via `new Date(localStr)` would silently use the visitor's OS timezone instead of Georgia Tech campus time.
   - `MoveForm` converts stored UTC ISO strings into NY wall-clock strings via `utcIsoToNyLocalInput(iso)` on load, and converts NY wall-clock strings back into UTC ISO via iterative DST-safe `nyLocalInputToUtcIso(localValue)` during validation and submission.
   - Never calling `new Date()` during render: `computeDefaultTimesFromAnchor(nowIso)` derives default create-mode times from `useSesh().nowIso` (`21:00`–`23:30` ET today if `nyParts.hour < 19`, otherwise tomorrow). Once `isHydrated` flips to `true` on the client, a `useEffect` updates `startLocal` / `endLocal` to the live `nowIso` anchor **only if** `!dirtyFields.startLocal` / `!dirtyFields.endLocal`.
4. **Edit-Mode Round-Trip Fidelity:** When `LocalMockSeshAdapter.createEvent` saves a free event with no note, it stores `admission.priceLabel = "Free"` and defaults `publicDisplayLocation` to `venue`. `buildInitialFormValues` strips synthetic `"Free"` back to `""` and clears redundant `publicDisplayLocation` when `addressPrivacy === "PUBLIC_VENUE"` so re-editing a Move presents clean optional inputs.

#### Implementation Excerpts

```tsx
// apps/web/src/components/moves/move-form.tsx (Deterministic ET Defaults & Hydration Sync)
function computeDefaultTimesFromAnchor(anchorIso: string): {
  startLocal: string;
  endLocal: string;
} {
  const nyParts = getNyParts(anchorIso);
  const dayOffset = nyParts.hour < 19 ? 0 : 1;
  const startIso = buildRelativeNyIso(anchorIso, dayOffset, "21:00");
  const endIso = buildRelativeNyIso(anchorIso, dayOffset, "23:30");
  return {
    startLocal: utcIsoToNyLocalInput(startIso),
    endLocal: utcIsoToNyLocalInput(endIso),
  };
}

// Inside MoveForm:
const {
  register,
  control,
  handleSubmit,
  setValue,
  formState: { errors, dirtyFields },
} = useForm<MoveFormValues>({
  resolver: zodResolver(moveFormSchema),
  defaultValues: initialValues,
  mode: "onBlur",
});

useEffect(() => {
  if (mode !== "create" || !isHydrated) return;
  const freshDefaults = computeDefaultTimesFromAnchor(nowIso);
  if (!dirtyFields.startLocal) {
    setValue("startLocal", freshDefaults.startLocal, { shouldDirty: false });
  }
  if (!dirtyFields.endLocal) {
    setValue("endLocal", freshDefaults.endLocal, { shouldDirty: false });
  }
}, [
  mode,
  isHydrated,
  nowIso,
  dirtyFields.startLocal,
  dirtyFields.endLocal,
  setValue,
]);
```

```ts
// apps/web/src/lib/validation/schemas.ts (Cross-Field superRefine Invariants)
  .superRefine((values, ctx) => {
    const startIso = nyLocalInputToUtcIso(values.startLocal);
    const endIso = nyLocalInputToUtcIso(values.endLocal);
    // ... startIso / endIso validity checks ...
    if (startIso && endIso) {
      const startMs = new Date(startIso).getTime();
      const endMs = new Date(endIso).getTime();
      if (endMs <= startMs) {
        ctx.addIssue({
          code: "custom",
          path: ["endLocal"],
          message: "End time must occur after the start time.",
        });
      }
    }

    if (
      values.pricingMode === "PAID" &&
      (!values.priceLabel || values.priceLabel.trim().length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["priceLabel"],
        message: "Specify cover/ticket info for paid events (e.g. \"$10 cover\").",
      });
    }

    if (
      values.addressPrivacy !== "PUBLIC_VENUE" &&
      (!values.publicDisplayLocation ||
        values.publicDisplayLocation.trim().length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["publicDisplayLocation"],
        message:
          "Provide a safe public approximate area (e.g. \"Home Park near 10th St\") when exact address is private.",
      });
    }
  });
```

#### Edge Cases Solved & Error-Check Notes
- **React Compiler Safe Form Subscription:** Rather than calling `watch()` during render (which returns mutable proxy references flagged by React Compiler / ESLint hooks rules), `MoveForm` subscribes via `useWatch({ control })` and merges partial values over `initialValues` in `useMemo`.
- **Native Browser Validation Suppression:** `<form noValidate>` disables inconsistent browser-native tooltips on `type="url"` and `type="datetime-local"` inputs so all validation errors surface uniformly through `<FieldError>` (`role="alert"`).

---

### 3.3 Sub-Iteration `1.04.3` — General Viewer vs. Unlocked Attendee Live Preview

#### Objective
Give hosts immediate, high-confidence visual feedback on how their Move card, audience visibility, and address-privacy rules behave before publishing—rendered simultaneously as a sticky desktop sidebar (`lg:sticky lg:top-20 lg:col-span-5`) and an on-demand `<Dialog>` ("Preview Move") for mobile/tablet viewports.

#### Files Touched
- `apps/web/src/components/moves/move-preview.tsx`
- `apps/web/src/components/moves/move-form.tsx`

#### Architectural & Privacy Rationale
Hosts creating off-campus or house-party Moves frequently worry about whether their exact street address is exposed on the public campus feed. `MovePreview` provides a two-tab `<Tabs>` toggle (`"GENERAL"` vs. `"UNLOCKED"`):
1. **`GENERAL` Tab (General Campus Viewer):**
   - Displays a warning banner whenever `visibility !== "PUBLIC"` explaining whether Guests and non-friends (`FRIENDS`) or uninvited students (`CUSTOM` / `INVITE_ONLY`) are blocked from feed discovery.
   - When `addressPrivacy !== "PUBLIC_VENUE"`, renders `publicDisplayLocation` as the headline location and shows an **Exact Address Masked** lock box confirming that `privateAddress` is withheld from general viewers.
2. **`UNLOCKED` Tab (Unlocked Attendee):**
   - Simulates an authenticated GT student who has satisfied attendee unlock criteria (`RSVP_GOING_ONLY` or `APPROVED_GROUP_OR_HOST`): reveals the emerald **Unlocked Exact Address** banner when `privateAddress` is present.
   - Accurately models `HOST_ONLY`: even in the `UNLOCKED` tab, `addressPrivacy === "HOST_ONLY"` keeps the exact address locked (**Host-Only Exact Address**) and shows that RSVP'd attendees still only see `publicLocation` until the host shares the address directly.

#### Implementation Excerpts

```tsx
// apps/web/src/components/moves/move-preview.tsx (Address Unlocking Simulation Matrix)
const isGeneralView = perspective === "GENERAL";
const canAttendeeUnlockExact =
  values.addressPrivacy === "PUBLIC_VENUE" ||
  values.addressPrivacy === "RSVP_GOING_ONLY" ||
  values.addressPrivacy === "APPROVED_GROUP_OR_HOST";

const showExactAddressInCurrentTab =
  hasPrivateAddress &&
  (values.addressPrivacy === "PUBLIC_VENUE" ||
    (!isGeneralView && canAttendeeUnlockExact));
```

#### Edge Cases Solved & Error-Check Notes
- **Malformed Live URL Protection:** While the host is mid-typing a `coverImage` URL (e.g., `"https://"`), `isValidHttpUrl(values.coverImage)` catches `new URL(...)` parse errors so broken `<img>` tags do not flicker; instead, category-specific Tailwind gradients (`CATEGORY_GRADIENTS[values.category]`) render smoothly underneath.
- **Form Submission Isolation Inside Tabs/Dialog:** `<TabsTrigger type="button">` and `<Button type="button">` prevent accidental form submission when switching preview tabs or opening the preview modal.

---

### 3.4 Sub-Iteration `1.04.4` — Browser-Local Draft/Publish Persistence & Move Group Toast Follow-Up

#### Objective
Wire distinct **Save Draft** (`status: "DRAFT"`) and **Publish Move** (`status: "PUBLISHED"`) workflows into `SeshDataAdapter` (`localStorage`), surface clear prototype persistence notices, extract numeric USD metadata when present, and bridge newly published Moves directly into **Create Move Group** (`/move-groups/new?event=${saved.id}`).

#### Files Touched
- `apps/web/src/components/moves/move-form.tsx`

#### Architectural & Persistence Rationale
1. **Dual Submit Intent Sharing Full Schema Validation:** Both **Save Draft** (`onClick={handleSubmit((vals) => submitWithStatus(vals, "DRAFT"))}`) and **Publish Move** (`type="submit"` -> `handleSubmit((vals) => submitWithStatus(vals, "PUBLISHED"))`) validate against `moveFormSchema` so drafts saved in `localStorage` never contain corrupt dates or broken privacy configurations.
2. **Event-Handler-Only Timestamping:** `const submitTimestampIso = new Date().toISOString();` runs exclusively inside `submitWithStatus`, satisfying Next.js 16 `cacheComponents` purity rules while stamping accurate `createdAt` / `updatedAt` ISO strings on `EventRecord`.
3. **USD Price Extraction for Price Filters:** `parseOptionalUsdAmount(values.priceLabel)` extracts the leading dollar figure (e.g. `"$10 cover"` -> `10`, `"$15.50 presale"` -> `15.5`) into `CreateOrUpdateEventInput.amountUsd` when `pricingMode === "PAID"`, keeping `AdmissionPrice` structured for downstream analytics/sorting while preserving the human-readable `priceLabel`.
4. **Move -> Move Group Continuity:** Publishing a Move triggers a `sonner` toast containing an interactive `"Create Move Group"` action button (`router.push(\`/move-groups/new?event=${saved.id}\`)`) and routes new Moves to `/events/${saved.id}?justCreated=1` (where Event Detail also highlights Move Group creation).

#### Implementation Excerpts

```tsx
// apps/web/src/components/moves/move-form.tsx (Draft vs. Publish Persistence & Navigation)
const submitTimestampIso = new Date().toISOString();
const saved =
  mode === "edit" && initialEvent
    ? adapter.updateEvent(
        initialEvent.id,
        payload,
        viewer,
        submitTimestampIso
      )
    : adapter.createEvent(payload, viewer, submitTimestampIso);

if (targetStatus === "DRAFT") {
  toast.success("Draft saved locally in your browser", {
    description:
      "Only you can view or edit this draft until you publish it.",
  });
  router.push(`/events/${saved.id}`);
} else {
  toast.success(
    mode === "edit"
      ? "Move updated and published!"
      : "Move published to Georgia Tech!",
    {
      description:
        "Want a small crew to head over together? Start a Move Group for this Move.",
      action: {
        label: "Create Move Group",
        onClick: () => router.push(`/move-groups/new?event=${saved.id}`),
      },
    }
  );
  router.push(
    mode === "create"
      ? `/events/${saved.id}?justCreated=1`
      : `/events/${saved.id}`
  );
}
```

#### Edge Cases Solved & Error-Check Notes
- **Double-Click / Concurrent Submit Lock:** `submittingIntent` (`"DRAFT" | "PUBLISHED" | null`) derives `isBusy = submittingIntent !== null`, disabling both submit buttons immediately on click so duplicate `evt-local-*` records cannot be allocated, and resets `setSubmittingIntent(null)` inside `catch` if an adapter error occurs.
- **Draft-to-Published Promotion & Demotion:** Editing an existing `DRAFT` and clicking **Publish Move** promotes `status` to `"PUBLISHED"`; conversely, clicking **Save Draft** on an existing Move updates `status` to `"DRAFT"`, immediately hiding it from non-host campus feeds via `canViewEvent` in `policies.ts`.

---

## 4. TSDoc / Javadoc-Style API, Schema & Component Reference

### 4.1 `NewMovePage` (`/events/new`)

```ts
/**
 * @component   NewMovePage
 * @filepath    apps/web/src/app/events/new/page.tsx
 * @directive   "use client"
 * @route       GET /events/new
 *
 * @description
 * Client route entry for authoring a new campus Move. Renders the canonical
 * Move vs. Move Group distinction in `PageHeader`, guards against pre-hydration
 * layout flash with `DetailPageSkeleton`, blocks unauthenticated `GUEST` sessions
 * behind an actionable `EmptyState` card wired to `requireDemoMember`, and mounts
 * `<MoveForm key={viewer.user.id} mode="create" />` for authenticated Demo Members.
 *
 * @props       None (reads session & hydration state from `useSesh()`).
 * @returns     {JSX.Element} Responsive `max-w-6xl` page container.
 *
 * @state
 * - Consumes `{ viewer, isHydrated, requireDemoMember }` from `SeshContext`.
 *
 * @invariants
 * - NEVER mounts `<MoveForm>` while `!isHydrated` or `viewer.mode === "GUEST"`.
 * - Keys `<MoveForm>` by `viewer.user.id` so switching between Demo Member personas
 *   resets dirty form state cleanly.
 *
 * @sideEffects
 * - Clicking "Switch to Demo Member" invokes `requireDemoMember("publish or draft a Move")`,
 *   opening the global `DemoSignInDialog` managed by `SeshProvider`.
 */
export default function NewMovePage(): JSX.Element;
```

---

### 4.2 `EditMovePage` & `EditMoveLoader` (`/events/[id]/edit`)

```ts
/**
 * @component   EditMovePage
 * @filepath    apps/web/src/app/events/[id]/edit/page.tsx
 * @directive   Server Component (default)
 * @route       GET /events/[id]/edit
 *
 * @description
 * Next.js 16.4.6 (`cacheComponents: true`) Server Component wrapper for editing an
 * existing Move. Keeps the outer route shell synchronous for Partial Prerendering
 * and delegates dynamic `await params` resolution to `EditMoveLoader` inside a
 * `<Suspense>` boundary.
 *
 * @param       {object} props
 * @param       {Promise<{ id: string }>} props.params - Dynamic route segment promise.
 * @returns     {JSX.Element} `<Suspense>` boundary wrapping `<EditMoveLoader />`.
 *
 * @invariants
 * - `params` MUST NOT be awaited outside `<Suspense>`; doing so breaks Next.js 16
 *   `cacheComponents` static shell prerendering.
 */
export default function EditMovePage(props: {
  params: Promise<{ id: string }>;
}): JSX.Element;

/**
 * @component   EditMoveLoader (internal async Server Component)
 * @description Awaits `params` inside `<Suspense>` and forwards `eventId={id}` to
 *              the client `<EditMoveView />` boundary.
 * @param       {{ params: Promise<{ id: string }> }} props
 * @returns     {Promise<JSX.Element>}
 */
async function EditMoveLoader(props: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element>;
```

---

### 4.3 `EditMoveView` (`edit-move-view.tsx`)

```ts
/**
 * @component   EditMoveView
 * @filepath    apps/web/src/components/moves/edit-move-view.tsx
 * @directive   "use client"
 *
 * @description
 * Client authorization and hydration controller for `/events/[id]/edit`. Queries
 * `adapter.getEvent(eventId, viewer)` only after `isHydrated === true` so browser-local
 * Moves (`evt-local-*`) and seed overrides (`editedSeedEvents`) are loaded from
 * `window.localStorage` before evaluating existence and host ownership.
 *
 * @props       {EditMoveViewProps}
 * @param       {string} props.eventId - Target Move identifier (e.g., `"evt-seed-1"` or `"evt-local-101"`).
 * @returns     {JSX.Element} Skeleton, EmptyState guard (`NOT_FOUND` / `RESTRICTED` / Unauthorized),
 *              or authorized `PageHeader` + `<MoveForm mode="edit" initialEvent={event} />`.
 *
 * @state
 * - `lookup: EventLookupResult | null` — Memoized over `[adapter, eventId, viewer, isHydrated, revision]`.
 *
 * @privacy
 * - Non-hosts (`viewer.mode === "GUEST"` or `event.hostId !== viewer.user.id` or `!event.canEdit`)
 *   NEVER mount `<MoveForm>` and NEVER receive host-unlocked fields; `projectEventForViewer` in
 *   `policies.ts` also strips `unlockedPrivateAddress` prior to returning `EventView` when unauthorized.
 * - Restricted Moves (`DRAFT` owned by another user, `FRIENDS` for non-friends, `INVITE_ONLY`)
 *   return `{ status: "RESTRICTED", reason }` without leaking even `event.title` or `event.host`.
 *
 * @example
 * <EditMoveView eventId="evt-local-101" />
 */
export interface EditMoveViewProps {
  eventId: string;
}
export function EditMoveView({ eventId }: EditMoveViewProps): JSX.Element;
```

---

### 4.4 `MoveForm` & Internal Helpers (`move-form.tsx`)

```ts
/**
 * @component   MoveForm
 * @filepath    apps/web/src/components/moves/move-form.tsx
 * @directive   "use client"
 *
 * @description
 * Dual-mode (`"create"` | `"edit"`) Move authoring form powered by React Hook Form
 * (`useForm<MoveFormValues>`) and Zod v4 (`zodResolver(moveFormSchema)`). Organizes
 * Move configuration into four structured cards (Move Basics, Schedule in ET,
 * Location & Address Privacy, Audience/Admission/Cover), pairs with a live
 * sticky `MovePreview` sidebar (desktop) + modal `<Dialog>` (mobile/all viewports),
 * and dispatches either `DRAFT` or `PUBLISHED` mutations through `SeshDataAdapter`.
 *
 * @props       {MoveFormProps}
 * @param       {"create" | "edit"} props.mode - Determines default initialization, adapter method
 *              (`createEvent` vs `updateEvent`), button copy, and post-publish `?justCreated=1` query.
 * @param       {EventView} [props.initialEvent] - Required when `mode === "edit"`; projected Move
 *              owned by the signed-in host.
 * @returns     {JSX.Element}
 *
 * @validation
 * - Resolver: `zodResolver(moveFormSchema)` with `mode: "onBlur"` (re-validates live after blur/submit).
 * - Controlled Selects: `Controller` wraps `category`, `addressPrivacy`, `visibility`, `pricingMode`.
 * - Accessibility: Every input/trigger sets `aria-invalid={Boolean(errors[field])}` and renders
 *   `<FieldError>` with `role="alert"`.
 *
 * @state
 * - `submittingIntent: "DRAFT" | "PUBLISHED" | null` — Tracks active submit button and locks form (`isBusy`).
 * - `previewDialogOpen: boolean` — Controls the responsive "Preview Move" `<Dialog>`.
 * - `watched` / `liveValues: MoveFormValues` — Derived via `useWatch({ control })` for zero-lag previewing.
 *
 * @sideEffects
 * - Post-hydration `useEffect` (create mode only): refreshes untouched `startLocal`/`endLocal`
 *   fields to match live client `nowIso` in `America/New_York` without marking fields dirty.
 * - Submit handler (`submitWithStatus`):
 *   1. Invokes `requireDemoMember(...)` as defense-in-depth.
 *   2. Calls `new Date().toISOString()` (strictly inside event handler) for `createdAt`/`updatedAt`.
 *   3. Persists to `adapter.createEvent` or `adapter.updateEvent` (`window.localStorage`).
 *   4. Emits `sonner` `toast.success` (including `"Create Move Group"` action on publish) or `toast.error`.
 *   5. Navigates via `router.push` to `/events/${saved.id}` (or `?justCreated=1` on new publish).
 *
 * @throws
 * - Catches synchronous `SeshAdapterError` (`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`,
 *   `VALIDATION_ERROR`), displays `err.message` via `toast.error`, and unlocks `submittingIntent`.
 *
 * @example
 * // Create mode
 * <MoveForm key={viewer.user.id} mode="create" />
 *
 * // Edit mode
 * <MoveForm key={`${event.id}-${viewer.user.id}-${event.updatedAt}`} mode="edit" initialEvent={event} />
 */
export interface MoveFormProps {
  mode: "create" | "edit";
  initialEvent?: EventView;
}
export function MoveForm({ mode, initialEvent }: MoveFormProps): JSX.Element;
```

#### Internal Helper Functions (`move-form.tsx`)

```ts
/**
 * @function    computeDefaultTimesFromAnchor
 * @description Computes deterministic default NY `datetime-local` strings (`21:00` to `23:30` ET)
 *              anchored to `anchorIso`. Uses same-day (`dayOffset = 0`) when current NY hour < 19,
 *              or next-day (`dayOffset = 1`) at/after 7:00 PM ET.
 * @param       {string} anchorIso - Reference UTC ISO timestamp (`useSesh().nowIso`).
 * @returns     {{ startLocal: string; endLocal: string }} `YYYY-MM-DDTHH:mm` wall-clock strings.
 */
function computeDefaultTimesFromAnchor(anchorIso: string): {
  startLocal: string;
  endLocal: string;
};

/**
 * @function    buildInitialFormValues
 * @description Produces a complete `MoveFormValues` object for `useForm({ defaultValues })`.
 *              In `"edit"` mode, maps `EventView` UTC timestamps via `utcIsoToNyLocalInput`,
 *              normalizes synthetic `"Free"` `priceLabel` to `""`, and clears redundant
 *              `publicDisplayLocation` when equal to `venue` under `PUBLIC_VENUE`.
 * @param       {"create" | "edit"} mode
 * @param       {string} nowIso
 * @param       {EventView} [initialEvent]
 * @returns     {MoveFormValues}
 */
function buildInitialFormValues(
  mode: "create" | "edit",
  nowIso: string,
  initialEvent?: EventView
): MoveFormValues;

/**
 * @function    parseOptionalUsdAmount
 * @description Extracts the first non-negative decimal/integer amount (up to 2 decimal places)
 *              from freeform paid admission text (e.g. `"$10 cover"` -> `10`, `"Door TBA"` -> `null`).
 * @param       {string} [priceLabel]
 * @returns     {number | null}
 */
function parseOptionalUsdAmount(priceLabel?: string): number | null;
```

---

### 4.5 `MovePreview` (`move-preview.tsx`)

```ts
/**
 * @component   MovePreview
 * @filepath    apps/web/src/components/moves/move-preview.tsx
 * @directive   "use client"
 *
 * @description
 * Live interactive Move card previewer rendered both in the sticky right-hand desktop
 * column and inside the mobile-accessible "Preview Move" `<Dialog>`. Provides a two-tab
 * perspective switcher (`"GENERAL"` vs. `"UNLOCKED"`) so hosts can inspect how audience
 * restrictions (`visibility`) and location privacy (`addressPrivacy`) affect what general
 * Georgia Tech browsers see compared to verified/unlocked attendees.
 *
 * @props       {MovePreviewProps}
 * @param       {MoveFormValues} props.values - Live watched form state from `MoveForm`.
 * @param       {PublicUserSummary} props.host - Public summary of the authoring host.
 * @param       {EventStatus} [props.currentStatus] - Optional `"DRAFT" | "PUBLISHED" | "CANCELLED"`
 *              badge indicator when editing an existing Move; defaults to `"Live Preview"` badge.
 * @param       {string} [props.className] - Optional Tailwind class overrides (e.g. `"ring-0"` in Dialog).
 * @returns     {JSX.Element}
 *
 * @state
 * - `perspective: "GENERAL" | "UNLOCKED"` — Controlled state for the `<Tabs>` viewer toggle.
 *
 * @privacy
 * - `PUBLIC_VENUE`: Shows `venue`, optional `publicDisplayLocation`, and `privateAddress` in both tabs.
 * - `RSVP_GOING_ONLY` / `APPROVED_GROUP_OR_HOST`: Masks `privateAddress` in `"GENERAL"` tab
 *   (showing only `publicLocation` + `venue`), and reveals `Unlocked Exact Address` in `"UNLOCKED"` tab.
 * - `HOST_ONLY`: Masks `privateAddress` in BOTH `"GENERAL"` and `"UNLOCKED"` tabs, explicitly
 *   explaining that even RSVP'd attendees only see `publicLocation` until shared directly by the host.
 */
export interface MovePreviewProps {
  values: MoveFormValues;
  host: PublicUserSummary;
  currentStatus?: EventStatus;
  className?: string;
}
export function MovePreview(props: MovePreviewProps): JSX.Element;
```

---

### 4.6 `moveFormSchema` & `MoveFormValues` (`schemas.ts`)

```ts
/**
 * @schema      moveFormSchema
 * @filepath    apps/web/src/lib/validation/schemas.ts
 * @library     Zod v4 (`zod@^4.6.7`)
 *
 * @description
 * Canonical client-and-test validation schema for creating or editing a Move. Combines
 * synchronous field-level string/enum refinements with a five-rule `.superRefine(...)`
 * pass enforcing Eastern Time timestamp parsability, chronological ordering, paid cover
 * labeling, and safe public approximate locations whenever an exact address is private.
 *
 * @fields
 * - `title`:                 `string` trimmed, `3..100` chars.
 * - `description`:           `string` trimmed, `10..2000` chars.
 * - `category`:              `EventCategory` (`"Bars" | "Clubs" | "House Parties" | "Organization Events" | "Sports" | "Concerts" | "Other"`).
 * - `startLocal`:            `string` trimmed, non-empty `YYYY-MM-DDTHH:mm` (NY wall clock) or ISO string.
 * - `endLocal`:              `string` trimmed, non-empty `YYYY-MM-DDTHH:mm` (NY wall clock) or ISO string; must be > `startLocal`.
 * - `venue`:                 `string` trimmed, `2..120` chars.
 * - `publicDisplayLocation`: `string | undefined` trimmed, max `120` chars; REQUIRED when `addressPrivacy !== "PUBLIC_VENUE"`.
 * - `privateAddress`:        `string | undefined` trimmed, max `180` chars (demo-only exact street address).
 * - `addressPrivacy`:        `AddressPrivacy` (`"PUBLIC_VENUE" | "RSVP_GOING_ONLY" | "APPROVED_GROUP_OR_HOST" | "HOST_ONLY"`).
 * - `visibility`:            `EventVisibility` (`"PUBLIC" | "FRIENDS" | "CUSTOM" | "INVITE_ONLY"`).
 * - `capacityText`:          `string | undefined` trimmed; if non-empty, integer in `1..50000`.
 * - `pricingMode`:           `"FREE" | "PAID"`.
 * - `priceLabel`:            `string | undefined` trimmed, max `60` chars; REQUIRED when `pricingMode === "PAID"`.
 * - `coverImage`:            `string | undefined` trimmed; if non-empty, valid `http:` or `https:` URL.
 */
export const moveFormSchema: z.ZodType<MoveFormValues>;
export type MoveFormValues = z.infer<typeof moveFormSchema>;
```

---

## 5. Regression & Error-Checking Matrix

Use these indexed invariants when debugging regressions, writing Vitest/Playwright suites, or auditing backend parity in future milestones.

### 5.1 Form Validation Invariants (`FORM-*`)

| Check ID | Field(s) | Invalid Input Probe | Expected Validation Error / Behavior |
| --- | --- | --- | --- |
| `FORM-01` | `title` | `"Hi"` (2 chars) or `""` | `"Move title must be at least 3 characters."` (`aria-invalid="true"` on `#move-title`). |
| `FORM-02` | `description` | `"Too short"` (9 chars) | `"Include a short description (at least 10 characters)."` |
| `FORM-03` | `venue` | `"A"` (1 char) | `"Venue or location text is required."` |
| `FORM-04` | `startLocal`, `endLocal` | `startLocal = "2026-11-14T22:00"`, `endLocal = "2026-11-14T21:00"` (or equal) | `superRefine` attaches `"End time must occur after the start time."` to `endLocal`. |
| `FORM-05` | `pricingMode`, `priceLabel` | `pricingMode = "PAID"`, `priceLabel = "   "` | `superRefine` attaches `"Specify cover/ticket info for paid events (e.g. \"$10 cover\")."` to `priceLabel`. |
| `FORM-06` | `addressPrivacy`, `publicDisplayLocation` | `addressPrivacy = "RSVP_GOING_ONLY"`, `publicDisplayLocation = ""` | `superRefine` attaches `"Provide a safe public approximate area (e.g. \"Home Park near 10th St\") when exact address is private."` to `publicDisplayLocation`. |
| `FORM-07` | `capacityText` | `"0"`, `"-5"`, `"12.5"`, `"abc"`, `"60000"` | `"Capacity must be a positive whole number."` (`""` and `undefined` pass as open capacity). |
| `FORM-08` | `coverImage` | `"ftp://files.gt.edu/a.png"` or `"not-a-url"` | `"Enter a valid http:// or https:// URL."` (`javascript:` URLs are rejected). |

### 5.2 Authorization & Privacy Invariants (`AUTHZ-*`)

| Check ID | Scenario | Route | Expected Guard / Projection Behavior |
| --- | --- | --- | --- |
| `AUTHZ-01` | Viewer is `GUEST` | `/events/new` | Renders `DemoNoticeBanner` + locked `EmptyState` ("Student session required to create a Move") with `Switch to Demo Member` button; `<MoveForm>` is NOT mounted. |
| `AUTHZ-02` | Viewer is `GUEST` | `/events/[id]/edit` (Public Move) | `lookup.status === "OK"`, `isAuthorizedHost === false`; renders "Only the Move host can edit this event" + `Switch to Demo Member` CTA; `<MoveForm>` is NOT mounted. |
| `AUTHZ-03` | Signed-in Member B (`u-jordan`) opens Member A's (`u-maya`) Public Move | `/events/[id]/edit` | `event.canEdit === false` & `event.hostId !== viewer.user.id`; renders host-only `EmptyState` naming `@maya_gt` with link to `/events/${event.id}`; `privateAddress` is never exposed. |
| `AUTHZ-04` | Non-host or `GUEST` opens another user's `DRAFT` or `INVITE_ONLY` Move | `/events/[id]/edit` | `adapter.getEvent` returns `{ status: "RESTRICTED" }`; renders "Host-only Move access" without revealing title, description, host, or address. |
| `AUTHZ-05` | Unknown or cancelled `eventId` | `/events/evt-missing-999/edit` | Post-hydration `lookup.status === "NOT_FOUND"`; renders "Move not found" `EmptyState` with links to `/` and `/events/new`. |

### 5.3 Timezone, DST & Next.js 16 Determinism Invariants (`TZ-*`)

| Check ID | Edge Case | Mechanism | Verification Rule |
| --- | --- | --- | --- |
| `TZ-01` | Visitor browser is in `America/Los_Angeles` (PT) or `UTC`, authoring a `21:00` Move | `nyLocalInputToUtcIso` & `utcIsoToNyLocalInput` (`dates.ts`) | `"2026-11-14T21:00"` (EST, UTC-5) always serializes to `"2026-11-15T02:00:00.000Z"`, regardless of client OS timezone. |
| `TZ-02` | US Eastern Daylight Saving transitions (Spring Forward EDT UTC-4 / Fall Back EST UTC-5) | 3-pass iterative UTC alignment loop in `nyLocalInputToUtcIso` | Summer dates (e.g., `"2026-09-04T21:00"` -> `01:00Z`) and November dates (`"2026-11-14T21:00"` -> `02:00Z`) align to exact `America/New_York` wall-clock minutes. |
| `TZ-03` | Late-night Move crossing midnight (e.g., `Fri 10:30 PM` to `Sat 2:00 AM ET`) | `endMs > startMs` check + `formatEventTimeRange` | Validated cleanly because `endLocal` carries the next calendar date; preview formats both dates (`Fri, Nov 13, 10:30 PM – Sat, Nov 14, 2:00 AM ET`). |
| `TZ-04` | Next.js 16 `cacheComponents: true` render purity | Zero `new Date()`, `Date.now()`, `window`, or `localStorage` during render | `tsc --noEmit` & `next build` succeed without dynamic-data-in-prerender errors; `new Date().toISOString()` executes strictly inside `submitWithStatus`. |

### 5.4 Browser-Local Persistence Invariants (`PERSIST-*`)

| Check ID | Workflow | Storage Key (`sesh.m1.demo-store.v1`) | Expected Outcome |
| --- | --- | --- | --- |
| `PERSIST-01` | Create Move via **Save Draft** | Appends `EventRecord` (`status: "DRAFT"`, `id: "evt-local-*"`) to `localEvents[]` | Survives hard browser refresh on `/events/evt-local-*` and `/events/evt-local-*/edit` (for host only); excluded from Guest/non-host Events Hub feeds; no auto-`GOING` RSVP inserted yet. |
| `PERSIST-02` | Create Move via **Publish Move** | Appends `EventRecord` (`status: "PUBLISHED"`) + auto-inserts `{ userId: host.id, response: "GOING" }` | Host `goingCount` starts at `1` (`viewerResponse: "GOING"`); redirects to `/events/${saved.id}?justCreated=1`; toast offers `"Create Move Group"` -> `/move-groups/new?event=${saved.id}`. |
| `PERSIST-03` | Host edits a seeded event (`evt-seed-*`) | Writes updated `EventRecord` to `editedSeedEvents[eventId]` | Overrides seed record across Hub, Detail, and Edit views across page refreshes until "Reset Demo Data" clears `sesh.m1.demo-store.v1`. |

---

## 6. Backend REST API Swap Guide (Milestone 2 / Milestone 5)

`MoveForm` and `EditMoveView` were intentionally architected against `SeshDataAdapter` (`CreateOrUpdateEventInput` -> `EventView`) so migrating from `LocalMockSeshAdapter` to authenticated PostgreSQL/REST endpoints requires **minimal, localized updates**:

1. **Async Adapter Signatures (`Promise<EventView>`):**
   - Update `SeshDataAdapter.createEvent`, `updateEvent`, and `getEvent` to return `Promise<...>` backed by `fetch("/api/v1/events", ...)` and `PATCH /api/v1/events/:id`.
   - In `MoveForm.submitWithStatus`, `await adapter.createEvent(...)` / `await adapter.updateEvent(...)` — `submittingIntent` (`isBusy`) and `try / catch` error toast handling are already structured for async network latency!
2. **Server-Enforced Host & Field Projection:**
   - Re-run `moveFormSchema` server-side inside `POST /api/v1/events` and `PATCH /api/v1/events/:id` so malformed API payloads cannot bypass client Zod checks.
   - Enforce `event.hostId === session.userId` on the server before returning host-editable payloads or accepting `PATCH` mutations, and store `privateAddress` in a protected column projected only when server-side `canViewPrivateAddress` passes.
3. **Cover Image Uploads & Real Notifications:**
   - Replace the optional `coverImage` URL text input with pre-signed object-storage uploads (e.g., S3 / Cloudflare R2 / Vercel Blob) returning an `https://` CDN URL into the existing `coverImage` field.
   - Remove the Milestone 1 `DemoNoticeBanner` once `.edu` session cookies and real `FRIENDS` / `INVITE_ONLY` invitation dispatch land.

### 6.1 Planned REST Endpoint & Payload Mapping

| Adapter Call in `1.04` | Planned REST Endpoint | Request Body / Params | Auth & Server Invariants |
| --- | --- | --- | --- |
| `adapter.createEvent(payload, viewer, nowIso)` | `POST /api/v1/events` | `CreateOrUpdateEventInput` JSON (`startAt`/`endAt` UTC ISO, `status: "DRAFT" \| "PUBLISHED"`) | Requires verified `.edu` session (`401` if guest); sets `hostId = session.userId`; inserts host `GOING` RSVP atomically in DB transaction when `status === "PUBLISHED"`. |
| `adapter.updateEvent(eventId, payload, viewer, nowIso)` | `PATCH /api/v1/events/:id` | `CreateOrUpdateEventInput` JSON | `401` if unauthenticated; `404` if missing/cancelled; `403 FORBIDDEN` if `event.hostId !== session.userId`. |
| `adapter.getEvent(eventId, viewer)` (in `EditMoveView`) | `GET /api/v1/events/:id` | Path `:id` + session cookie | Projects `EventView` server-side; strips `privateAddress` (`unlockedPrivateAddress: undefined`) unless `canViewPrivateAddress` passes; returns `403` (`RESTRICTED`) for unauthorized drafts/audiences. |

### 6.2 CLI Verification Commands

Run from the monorepo root (`/Users/rishikumar/Desktop/sesh`) or `apps/web` to validate all `1.04` contracts after any future schema or adapter refactor:

```bash
# 1. Full TypeScript strict check (verifies RHF + Zod v4 resolver types)
npm --workspace @sesh/web exec tsc -- --noEmit

# 2. Targeted ESLint check across all 5 owned 1.04 files
npx --prefix apps/web eslint \
  apps/web/src/app/events/new/page.tsx \
  "apps/web/src/app/events/[id]/edit/page.tsx" \
  apps/web/src/components/moves/move-form.tsx \
  apps/web/src/components/moves/move-preview.tsx \
  apps/web/src/components/moves/edit-move-view.tsx

# 3. Vitest unit suite (validates moveFormSchema, dates.ts DST math, and adapter persistence)
npm test

# 4. Next.js 16 production build (verifies cacheComponents + <Suspense> params boundary)
npm run build
```

---

[Root README](../../../../README.md) · [Milestone 1 Index](../README.md)
