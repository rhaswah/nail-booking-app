# Lume Nail Studio — Design System (v1)

Mobile-first (design at **390px**, scale up). Elegant, calm, no gradient kitsch.
All tokens live in `src/app/globals.css` under `@theme` — use Tailwind utility
classes (`bg-blush-500`, `text-ink-800`, `bg-cream`), never raw hex in components.

## Palette

| Token | Hex | Use |
|---|---|---|
| `cream` | `#FAF7F2` | Page background (body default) |
| `blush-50` | `#FCF5F4` | Tinted section backgrounds |
| `blush-100` | `#F9E9E8` | Chip backgrounds, selected-card tint |
| `blush-200` | `#F3D5D3` | Borders on selected/active elements |
| `blush-300` | `#EAB6B3` | Decorative accents |
| `blush-400` | `#DE908D` | Secondary accent |
| `blush-500` | `#CE6B69` | **Primary accent** — CTAs, active states, theme color |
| `blush-600` | `#B85351` | CTA hover/pressed |
| `blush-700` | `#9A4140` | Accent text on light blush backgrounds |
| `ink-400` | `#8A857E` | Muted/placeholder text |
| `ink-500` | `#6B665F` | Secondary text (descriptions, meta) |
| `ink-800` | `#2E2B27` | **Primary text** (body default) |
| `ink-100` | `#E8E6E3` | Hairline borders, dividers |
| white | `#FFFFFF` | Card surfaces |

Light theme only (no dark mode) — keeps the salon aesthetic consistent.

## Type & numbers

- Font: Geist (`font-sans`, wired in layout). Headings `font-semibold tracking-tight`.
- **Every price and duration: right-aligned + `tabular-nums`.** e.g.
  `<span className="tabular-nums text-right">…</span>`
- Format ONLY via `@/lib/format`: `formatMoney`, `formatDuration`, `formatSlotTime`, `formatDateLabel`.

## Spacing & radius

- Page gutter: `px-4` (mobile), `sm:px-6`; content max width `max-w-md mx-auto` (booking flow) — this is a phone-shaped app even on desktop.
- Cards: `rounded-2xl` (1rem) `bg-white border border-ink-100 shadow-sm p-4`.
- Buttons/CTAs: `rounded-xl` minimum (0.75rem+ everywhere; nothing sharper).
- Chips/pills: `rounded-full`.
- Vertical rhythm: sections `space-y-6`, in-card `space-y-3`.

## Components

- **Primary button:** `h-12 rounded-xl bg-blush-500 text-white font-medium active:bg-blush-600 disabled:bg-ink-200 disabled:text-ink-400 w-full`.
- **Secondary button:** `h-12 rounded-xl border border-ink-200 bg-white text-ink-800`.
- **Selection card** (service/tech/slot): white card; selected = `border-blush-500 bg-blush-50` + small check. Whole card tappable, min touch target 44px.
- **Chip** (category filter, time slot): `rounded-full px-4 py-2 text-sm border border-ink-200 bg-white`; selected = `bg-blush-500 text-white border-blush-500`.
- **Popular badge:** `rounded-full bg-blush-100 text-blush-700 text-xs px-2 py-0.5`.
- **Sticky bottom CTA bar (mobile):** fixed bottom bar on every booking step:
  `fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-ink-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]` — left: running total (`formatMoney`) + duration; right/full: primary button. Give scroll content `pb-28` so it clears the bar.
- **Avatar:** circle with initials, `style={{ backgroundColor: staff.avatarColor }}`, white text.

## Booking flow (steps)

1. **Services** — categories + service cards, multi-select, running total in sticky bar → "Choose time".
2. **Tech & time** — staff picker (incl. "Any technician"), horizontal date strip (today → +30 days), time-slot chips from `getAvailability`.
3. **Details** — first/last name, phone, email, optional notes.
4. **Confirm** — summary (services, tech, date/time, total) → `createBooking`.
5. **Done** — confirmation page with booking id; status starts `pending_sync` (byChronos picks it up later).

## Data rules (all agents)

- Get data ONLY through `getProvider()` from `@/lib/booking/provider` — never import `mock-provider` directly, never hardcode services/prices.
- Provider calls are server-side (server components / route handlers / server actions); the provider is not for client components.
- Salon identity + hours from `salonConfig` (`@/lib/salon.config`) — the name is a placeholder until byChronos connect.
- Dates: plain `"YYYY-MM-DD"` strings are salon-timezone calendar dates; instants are UTC ISO strings. Use `salonDateISO()` / `addDaysISO()` from `@/lib/format` — do not hand-roll timezone math.
