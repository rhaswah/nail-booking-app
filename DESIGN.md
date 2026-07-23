# Fairy Nail Spa — Design System (v2 · Pretty Pink Fairytale)

Mobile-first (design at **390px**, scale up). A cotton-candy nail-salon
fairytale: bubblegum & cotton-candy pinks, soft lilac/lavender accents,
touches of shimmer gold, twinkling sparkles, cute fairy motifs. Playful but
tasteful and legible — **not garish**. Pastel gradients ARE welcome here.

All tokens live in `src/app/globals.css` under `@theme` — use Tailwind utility
classes (`bg-pink-500`, `text-ink-800`, `bg-cream`), **never raw hex** in
components.

## Palette

### Pink (PRIMARY) — cotton-candy → deep rose
| Token | Hex | Use |
|---|---|---|
| `pink-50` | `#FFF0F6` | Tinted section backgrounds |
| `pink-100` | `#FFE0EE` | Chip bg, selected-card tint |
| `pink-200` | `#FFC2DD` | Borders on selected/active elements |
| `pink-300` | `#FF9EC8` | Decorative accents |
| `pink-400` | `#FB77AF` | Secondary accent / soft nails |
| `pink-500` | `#F24E97` | **Primary accent** — CTAs, active states, theme color |
| `pink-600` | `#DB2F7E` | CTA hover/pressed |
| `pink-700` | `#B81F66` | Accent text on light pink backgrounds |
| `pink-800` | `#971A54` | Deep accent text |
| `pink-900` | `#7C1846` | Deepest rose |

### Lilac / lavender (SECONDARY)
| Token | Hex | Use |
|---|---|---|
| `lilac-50` | `#F8F4FF` | Alt tinted backgrounds |
| `lilac-100` | `#EFE6FF` | Secondary chip bg |
| `lilac-200` | `#E0CCFF` | Secondary borders |
| `lilac-300` | `#CBA9FB` | Fairy wings, decorative |
| `lilac-400` | `#B485F4` | Secondary accent |
| `lilac-500` | `#9D63EA` | **Secondary accent** — gradient partner, hair |
| `lilac-600` | `#854BD4` | Hover |
| `lilac-700` | `#6D3AB2` | Accent text |
| `lilac-800` | `#5A3193` | — |
| `lilac-900` | `#4A2A78` | — |

### Shimmer / gold + neutrals
| Token | Hex | Use |
|---|---|---|
| `sparkle` | `#F7C948` | Soft gold — sparkles, wand, shimmer bits |
| `sparkle-glow` | `#FFF2C2` | Light gold glow |
| `cream` | `#FFF5FA` | Page background (body default, pink-cream) |
| `ink-400` | `#A67E97` | Muted/placeholder text |
| `ink-500` | `#855F77` | Secondary text |
| `ink-800` | `#4A2A3D` | **Primary text** (body default, plum-ink) |
| `ink-100` | `#F2E7EE` | Hairline borders, dividers |
| white | `#FFFFFF` | Card surfaces |

`blush-*` tokens are kept as **aliases of `pink-*`** for back-compat — prefer
`pink-*` in new work.

**Page background** is a soft pink-cream with a very subtle two-stop pastel
radial gradient wash (baked into `body` — you get it for free). Light theme
only.

## Type & numbers

- **Body:** Geist (`font-sans`).
- **Headings:** Baloo 2, a friendly rounded display font → **`font-display`**.
  Use `font-display font-semibold` for section headers / step titles.
- **Script flourish:** Pacifico → **`font-script`**. Use **ONLY** for the salon
  name / hero wordmark. Never for body or UI labels.
- **Every price & duration:** right-aligned + `tabular-nums` (unchanged rule).
- Format ONLY via `@/lib/format`: `formatMoney`, `formatDuration`,
  `formatSlotTime`, `formatDateLabel`.

## Spacing & radius

- Page gutter `px-4` (`sm:px-6`); content `max-w-md mx-auto` (phone-shaped).
- **Cards:** `rounded-card` (20px) or `rounded-3xl` `bg-white` `border border-pink-100` `shadow-pink` `p-4`.
- **Buttons/CTAs:** `rounded-cta` (16px) minimum — pillowy, nothing sharper.
- **Chips/pills:** `rounded-full`.
- Vertical rhythm: sections `space-y-6`, in-card `space-y-3`.

## Shadows & helper utilities

- `.shadow-pink` — pillowy pink-tinted soft shadow (default card/CTA shadow).
- `.shadow-pink-lg` — larger, for hero/featured cards.
- `.shadow-lilac` — lilac-tinted variant.
- `.text-gradient-pink` — pink→lilac gradient text (great for the wordmark or a big number).

## Sparkle & shimmer animations

- `@keyframes twinkle` — opacity+scale pulse for sparkles. Utility `.animate-twinkle`.
  Stagger by setting inline `animationDelay` / `animationDuration`.
- `@keyframes shimmer` — light sweep. Use the **`.shimmer-sweep`** helper: give the
  button `relative overflow-hidden`, then drop `<span className="shimmer-sweep" />`
  as the last child. Renders a diagonal glossy sweep across the primary CTA.
- `@keyframes float-soft` — gentle vertical bob. Utility `.animate-float-soft`
  (e.g. floating fairy). Also `float` prop on `<Fairy>`.
- All three respect `prefers-reduced-motion` (auto-disabled).

## Decor component library — `@/components/decor`

Hand-authored inline SVG, themeable via props / `currentColor`. Import from the
barrel: `import { Sparkle, Fairy, NailPolishIcon } from "@/components/decor";`

### Sparkles — `sparkle.tsx`
- **`<Sparkle size? color? twinkle? className? style? />`** — a 4-point twinkle
  star with soft core. `color` defaults to `currentColor`. Pass `twinkle` for the
  pulse. Use inline beside headings, on badges, in the wordmark.
- **`<SparkleField count? color? className? />`** — absolutely-positioned scatter
  of twinkling sparkles for a section/hero background. `aria-hidden` +
  `pointer-events-none`; put inside a **`relative`** parent. `color` defaults to
  gold (`var(--color-sparkle)`). Deterministic scatter (SSR-safe).

### Fairy — `fairy.tsx`
- **`<Fairy size? color? wingColor? float? className? style? />`** — cute little
  winged fairy holding a star wand, pink dress + lilac wings. `float` adds the
  bob. Use as a hero mascot / empty-state / confirmation delight.
- **`<FairyWings size? color? className? style? />`** — standalone pair of wings;
  a flourish beside a heading or badge.

### Nail icons — `nail-icons.tsx` (24×24 viewBox, `size`/`color`/`title` props)
Pass `title` to make an icon accessible (`role="img"`), else it's decorative.
- **`<NailPolishIcon>`** — polish bottle w/ sparkle. Services / hero.
- **`<PaintedNailIcon>`** — single glossy almond nail. Bullets / section markers.
- **`<HandNailsIcon>`** — hand with painted nail tips. Empty states / feature.
- **`<WandIcon>`** — magic wand w/ star tip. "Book" / magic CTAs.
- **`<HeartIcon>`** — rounded heart. Favorites / popular / love.

All decor accepts `size` (px) and `color`; icons default `color` to
`currentColor` so they inherit text color — set `text-pink-500` on a parent to
tint.

## Section headers (pattern)

Decorate headers with a tiny nail/sparkle icon:
```tsx
<h2 className="font-display text-lg font-semibold flex items-center gap-2 text-ink-800">
  <PaintedNailIcon size={20} className="text-pink-500" />
  Choose your services
  <Sparkle size={14} color="var(--color-sparkle)" twinkle />
</h2>
```

## Components

- **Primary button:** `h-12 rounded-cta bg-pink-500 text-white font-medium
  shadow-pink active:bg-pink-600 disabled:bg-ink-200 disabled:text-ink-400
  w-full relative overflow-hidden` + `<span className="shimmer-sweep" />` for the
  shimmer. Consider `bg-gradient-to-r from-pink-500 to-lilac-500` for the hero CTA.
- **Secondary button:** `h-12 rounded-cta border border-pink-200 bg-white text-ink-800`.
- **Selection card** (service/tech/slot): white card; selected =
  `border-pink-500 bg-pink-50` + small check (or `<Sparkle>`). Whole card tappable, ≥44px.
- **Chip:** `rounded-full px-4 py-2 text-sm border border-pink-200 bg-white`;
  selected = `bg-pink-500 text-white border-pink-500`.
- **Popular badge:** `rounded-full bg-pink-100 text-pink-700 text-xs px-2 py-0.5`
  — nice with a tiny `<HeartIcon size={12}>`.
- **Sticky bottom CTA bar (mobile):** `fixed bottom-0 inset-x-0 bg-white/95
  backdrop-blur border-t border-pink-100 p-4
  pb-[calc(1rem+env(safe-area-inset-bottom))]` — left: running total
  (`formatMoney`) + duration; right/full: primary button. Give scroll content
  `pb-28` so it clears the bar.
- **Avatar:** circle with initials, `style={{ backgroundColor: staff.avatarColor }}`, white text.

## Booking flow (steps) — unchanged logic

1. **Services** — categories + service cards, multi-select, running total.
2. **Tech & time** — staff picker (incl. "Any technician"), date strip, slot chips.
3. **Details** — first/last name, phone, email, optional notes.
4. **Confirm** — summary → `createBooking`.
5. **Done** — confirmation with booking id; status `pending_sync`.

## Data rules (all agents) — DO NOT CHANGE

- Data ONLY via `getProvider()` from `@/lib/booking/provider`. Never import
  `mock-provider` directly, never hardcode services/prices.
- Provider calls are server-side only.
- Salon identity + hours from `salonConfig` (`@/lib/salon.config`) — name is
  "Fairy Nail Spa".
- Dates: use `salonDateISO()` / `addDaysISO()` from `@/lib/format`.

> **Restyle-only rule:** this makeover changes visuals ONLY. Do not touch data
> fetching, props, API calls, routing, or booking logic.
