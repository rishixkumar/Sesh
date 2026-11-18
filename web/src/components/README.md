# `web/src/components/` — UI

Components are grouped by feature. Each page in [`../app/`](../app/README.md) renders a view component from here.

| Folder | What's inside | Used by |
| --- | --- | --- |
| [`events/`](./events/) | Events Hub feed, filters, event cards and sections, event detail view, RSVP controls, share, report dialog | `/`, `/events/[id]` |
| [`moves/`](./moves/) | Create/edit Move form, live preview, edit view | `/events/new`, `/events/[id]/edit` |
| [`move-groups/`](./move-groups/) | Move Group cards, create form, detail, roster, invite dialog, owner management | `/move-groups/*`, event detail |
| [`landing/`](./landing/) | `/welcome` scroll story: logo loader, hook text, pinned phone + [`screens/`](./landing/screens/), guardrails, waitlist, final CTA | `/welcome` |
| [`layout/`](./layout/) | App shell, site header, desktop & mobile nav, demo identity switcher, demo sign-in dialog | every `(app)` page |
| [`shared/`](./shared/) | Cross-feature pieces: page header, empty state, skeletons, confirm dialog, avatar, demo banner | many |
| [`ui/`](./ui/) | shadcn/ui primitives (button, card, dialog, select, tabs, …). Add more with `npx shadcn@latest add <name>` | everything |

Domain logic doesn't belong here; it lives in [`../lib/`](../lib/README.md).
