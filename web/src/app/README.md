# `web/src/app/` — routes

Next.js App Router. Folders map to URLs; folders in parentheses, like `(app)`, are route groups. They share a layout without adding to the URL.

| URL | File | Notes |
| --- | --- | --- |
| `/welcome` | [`welcome/page.tsx`](./welcome/page.tsx) | Landing page; renders without the app header/nav |
| `/` | [`(app)/page.tsx`](./(app)/page.tsx) | Events Hub (first visit redirects to `/welcome`) |
| `/events/new` | [`(app)/events/new/page.tsx`](./(app)/events/new/page.tsx) | Create a Move |
| `/events/[id]` | [`(app)/events/[id]/page.tsx`](./(app)/events/[id]/page.tsx) | Event detail (+ `not-found.tsx`) |
| `/events/[id]/edit` | [`(app)/events/[id]/edit/page.tsx`](./(app)/events/[id]/edit/page.tsx) | Edit a Move |
| `/move-groups/new` | [`(app)/move-groups/new/page.tsx`](./(app)/move-groups/new/page.tsx) | Start a Move Group |
| `/move-groups/[id]` | [`(app)/move-groups/[id]/page.tsx`](./(app)/move-groups/[id]/page.tsx) | Move Group detail (+ `not-found.tsx`) |
| `/move-groups/[id]/manage` | [`(app)/move-groups/[id]/manage/page.tsx`](./(app)/move-groups/[id]/manage/page.tsx) | Owner management |
| `/map` | [`(app)/map/page.tsx`](./(app)/map/page.tsx) | Map |
| `/friends` | [`(app)/friends/page.tsx`](./(app)/friends/page.tsx) | Friends & suggestions |
| `/notifications` | [`(app)/notifications/page.tsx`](./(app)/notifications/page.tsx) | Activity feed |
| `/profile` | [`(app)/profile/page.tsx`](./(app)/profile/page.tsx) | Profile & demo settings |

## Layouts & global files

| File | Role |
| --- | --- |
| [`layout.tsx`](./layout.tsx) | Root layout: `<html>`, fonts, theme, providers, toaster |
| [`(app)/layout.tsx`](./(app)/layout.tsx) | Wraps every app page in `AppShell` (header + mobile nav) |
| [`globals.css`](./globals.css) | Tailwind v4 theme tokens and landing-page keyframes |

Pages stay thin: they set metadata and render a view from [`../components/`](../components/README.md).
