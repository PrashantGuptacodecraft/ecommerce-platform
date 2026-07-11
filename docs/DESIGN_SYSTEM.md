# Design System & Motion

The Phase 1 design-system foundation (Milestone 2). Everything here is
brand-swappable: values live in `src/config/*` and `src/app/globals.css`, not
hardcoded in feature components.

## 1. Tokens

### Source of truth

- **`src/config/design-tokens.ts`** — the canonical TypeScript token object
  (colours, type scale, spacing, radii, shadows, container widths, z-index
  layers, breakpoints). Read by non-Tailwind consumers.
- **`src/app/globals.css` `@theme`** — the Tailwind v4 projection of those
  tokens. This is what generates utility classes. **Keep the two in sync** when
  a token value changes.
- **`src/config/motion-tokens.ts`** — motion durations, easings, stagger delay.
- **`src/config/brand.ts`** — placeholder brand ("STUDIO NOIR"): name, tagline,
  contact, currency.

### Colours (utilities: `bg-*`, `text-*`, `border-*`, with `/opacity`)

| Token | Hex | Use |
|---|---|---|
| `ink` | `#141414` | primary text, dark surfaces |
| `charcoal` | `#2b2b2b` | secondary strong text |
| `slate` | `#5f5f5f` | secondary/body text |
| `mist` | `#9a9a9a` | muted/disabled text |
| `fog` | `#e4e1dc` | borders, subtle fills |
| `paper` | `#f7f6f3` | page background |
| `accent` / `accent-hover` / `accent-contrast` | `#8a6a4f` / `#75593f` / `#fff` | the single restrained accent |
| `success` / `warning` / `danger` | `#2f6f4f` / `#9a7b1f` / `#9a3324` | status |

### Typography

- Families: `font-sans` (system UI stack) and `font-serif` (system serif) —
  used for editorial headings. Web fonts are intentionally deferred to keep
  builds hermetic; swap to `next/font` later without touching components.
- Sizes/weights: Tailwind's default type scale; the token scale in
  `design-tokens.ts` documents the intended editorial steps.

### Radii, shadows, spacing, containers, z-index

- Radii: `rounded-sm|md|lg|xl` (0.25 / 0.5 / 0.75 / 1rem).
- Shadows: `shadow-sm|md|lg` (subtle, low-contrast).
- Spacing: Tailwind's 4px-based numeric scale.
- Container widths: the `Container` primitive (`max-w-6xl`, or `narrow` =
  `max-w-3xl`) with responsive gutters.
- z-index: CSS variables (`--z-dropdown|header|drawer|overlay|modal|toast`),
  used via `z-[var(--z-modal)]`. Strictly ascending so overlays never collide.

## 2. Motion (`src/components/motion/`)

Built on `motion/react`. **Every primitive respects
`prefers-reduced-motion`** via `useReducedMotion` — reduced motion collapses
travel/scale to a fade or an instant state (never fully removing feedback).
Durations/easings come from `motion-tokens.ts` (`fast` 0.15s, `standard` 0.3s,
`slowEditorial` 0.6s; `standard` + `premium` easings; stagger 0.06s). A global
CSS reduced-motion rule in `globals.css` is the backstop for anything not
wrapped in a primitive.

| Primitive | Purpose |
|---|---|
| `FadeIn` | fade in on mount |
| `SlideUp` | fade + rise on mount |
| `RevealOnScroll` | reveal once on scroll into view |
| `StaggerContainer` / `StaggerItem` | orchestrated staggered reveal |
| `ScaleOnHover` | subtle hover/press scale |
| `PageTransition` | gentle page enter |
| `AnimatedCounter` | tween a number (e.g. cart count) |
| `AnimatedModal` / `AnimatedDrawer` | presence shells for overlays |
| `AnimatedCartItem` | cart line add/remove (used in Milestone 5) |

Import from `@/components/motion`.

## 3. UI primitives (`src/components/ui/`)

Import from `@/components/ui`. Presentational primitives are Server Components;
form controls and overlays are Client Components (`'use client'`).

- **Actions/among:** `Button` (variants: primary/secondary/outline/ghost/danger;
  sizes sm/md/lg; `isLoading`, `fullWidth`), `Badge`.
- **Forms:** `Label`, `Input`, `Textarea`, `Select` (all ref-forwarded for
  react-hook-form; `invalid` toggles error ring + `aria-invalid`), `FormError`
  (`role="alert"`).
- **Surfaces/data:** `Card`, `Container`, `Price` (paise → ₹ via
  `lib/utilities/money`), `Skeleton`, `EmptyState`.
- **Overlays:** `Dialog`, `Drawer` (portalled, backdrop + Escape dismiss, body
  scroll-lock, focus-to-panel), `ToastProvider` + `useToast`.

Class merging uses `cn()` (`lib/utilities/cn`, clsx + tailwind-merge).

### Accessibility baseline (M2)

Global `:focus-visible` ring (accent); touch-friendly control heights (44px);
`aria-invalid` / `aria-describedby` wired on fields; overlays are
Escape-dismissable with scroll-lock and move focus to the panel. **Full
focus-trapping, a complete keyboard-nav audit, and contrast verification are
the Milestone 15 accessibility pass** — the primitives are built to accept it.

## 4. Layout & pages

- Storefront chrome: `AnnouncementBar`, `Header` (+ `MobileDrawerNav`),
  `Footer` (+ `NewsletterForm` foundation), composed in
  `app/(storefront)/layout.tsx`, which also hosts `ToastProvider`.
- Homepage `app/(storefront)/page.tsx`: refined foundation (hero, shop-by-
  category tiles, reassurance strip, editorial band) using tokens + motion.
  Real catalogue data lands in Milestone 4 (no mock product data here).
- Admin: `app/admin/layout.tsx` (route-group shell; `requireAdmin()` server
  guard integration point noted for Milestone 10), `AdminShell` + `AdminSidebar`
  chrome, `app/admin/login` (secure login UI shell), `app/admin` (placeholder
  dashboard demonstrating the shell — no live data/mutations).

## 5. Navigation config

`src/config/navigation.ts` — `mainNav`, `footerSections`, `adminNav`. Category
links point at seeded slugs; the pages they link to are built in later
milestones.
