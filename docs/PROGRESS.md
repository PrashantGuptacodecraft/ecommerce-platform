# Progress Log

Update this file after every milestone from
`docs/phases/PHASE_1_IMPLEMENTATION_CHECKLIST.md`. Do not mark a milestone
complete unless it has actually been implemented and verified — no
speculative completion.

Template for each entry:

```
## Milestone <N> — <name> — <date>

### Completed
-

### Verification performed
- Commands run:
- Manual checks:
- Tests added/passing:

### Known limitations
-

### Remaining Phase 1 tasks
-
```

---

## Milestone 0 — Project init — 2026-07-11

Built inside the existing scaffold — no folders under `src/`, `supabase/`,
`tests/`, or `docs/` were moved or removed; all pre-existing `_PURPOSE.md`
notes and `.gitkeep` files are untouched.

### Completed
- **Next.js app initialised manually** inside the existing tree (App Router,
  TypeScript strict, Tailwind, ESLint). Manual scaffold rather than
  `create-next-app`, which refuses to run in a populated directory and would
  have risked overwriting the docs/scaffold. Files added at repo root:
  `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`,
  `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `next-env.d.ts`.
- **App shell:** `src/app/layout.tsx` (root layout, metadata + viewport from
  brand config), `src/app/page.tsx` (temporary placeholder — see Decision
  #13; real homepage is M4 in the `(storefront)` group), `src/app/globals.css`
  (Tailwind 4 `@import`, reduced-motion safety net).
- **`tsconfig.json` path alias** `@/* → ./src/*`, plus stricter-than-default
  flags (`noUncheckedIndexedAccess`, `noImplicitOverride`,
  `verbatimModuleSyntax`) in the spirit of the security model's "strict, no
  `any`, no shortcuts" rule. (Next.js auto-set `jsx: react-jsx` and added its
  `.next/*/types` include globs during build — kept as-is.)
- **Runtime dependencies installed:** `zod`, `react-hook-form`,
  `@hookform/resolvers`, `@supabase/ssr`, `@supabase/supabase-js`, `motion`,
  `razorpay` (plus `next`, `react`, `react-dom`).
- **Dev dependencies installed:** `vitest` (+ `@vitejs/plugin-react`, `jsdom`,
  `@testing-library/react`, `@testing-library/jest-dom`),
  `@playwright/test`, `prettier`, `eslint` + `eslint-config-next`,
  `typescript`, `@types/*`, `tailwindcss` + `@tailwindcss/postcss`.
- **`package-lock.json` generated** and present at repo root (see Known
  limitations re: committing it).
- **Config tokens wired up** (`src/config/`): `design-tokens.ts` (colours,
  type scale, spacing, radii, shadows, container widths, z-index layers,
  breakpoints), `motion-tokens.ts` (`fast`/`standard`/`slowEditorial`
  durations; `standard`/`premium` cubic-bézier easings; stagger delay),
  plus `brand.ts` (STUDIO NOIR placeholder — Decision #1) and `site.ts`
  (upload limits, seed-product cap, low-stock threshold, pagination). All
  typed with `as const`, no `any`.
- **Test tooling scaffolded:** `vitest.config.ts` (jsdom, `@/*` alias,
  unit+integration globs), `tests/setup.ts` (jest-dom matchers),
  `playwright.config.ts` (mobile-first + desktop projects, e2e specs deferred
  to M14). One real sanity test (`tests/unit/config.test.ts`, 5 assertions)
  proving the toolchain + path alias resolve and guarding config invariants.
- **Security housekeeping:** the single `npm audit` finding
  (transitive `postcss` < 8.5.10, GHSA-qx2v-qp2m-jg93, moderate) was triaged
  and fixed with a same-major `overrides` pin instead of the destructive
  `audit fix --force` Next downgrade — see Decision #12. `npm audit` now
  reports **0 vulnerabilities**.
- **`.env.example` verified** against what code references so far — no
  changes needed. M0 code references no secrets; `playwright.config.ts` reads
  only `SITE_URL`/`CI`, both already present. Brand/site config are compile-
  time constants, not env-derived, so no client-exposed secrets exist yet.

### Verification performed
- Commands run (all exit 0):
  - `npm install` → 481 packages, **0 vulnerabilities** (after postcss override)
  - `npm run lint` → clean (ESLint 9 flat config via `eslint-config-next` v16)
  - `npm run type-check` → `tsc --noEmit`, no errors
  - `npm run test` → Vitest: 1 file, **5 tests passed**
  - `npm run build` → `next build` succeeded; `/` and `/_not-found`
    prerendered as static; TypeScript validation passed
  - `npm run format:check` → all owned files conform to Prettier
- Manual runtime smoke test: served the production build (`next start`),
  `GET /` → **200** with rendered brand content ("STUDIO NOIR", tagline,
  "Milestone 0"); unknown route → **404**. Server stopped afterward.

### Known limitations
- **`package-lock.json` not committed to Git.** This workspace is not a Git
  repository (no `.git`), so the checklist's "commit `package-lock.json`"
  step cannot be performed literally. The lockfile is generated and ready;
  it should be committed as part of the first commit once the repo is
  initialised. Flagged rather than silently skipped.
- No Next.js app **logic** beyond a placeholder home page — routes, data,
  auth, payments all belong to later milestones.
- Supabase project not yet created; Razorpay account not yet configured
  (both external steps, Milestone 1+).
- Playwright browsers not installed and no e2e specs yet (`npx playwright
  install` + specs are Milestone 14 / CI).
- Central security headers, rate limiter, and `(storefront)` route-group
  layout intentionally **not** present yet (Milestone 3).

### Remaining Phase 1 tasks
- Milestone 1 (Supabase foundation) next: migrations for every table in
  `DATABASE_SCHEMA.md` with RLS enabled per-table, the
  `reserve_variant_stock` `SECURITY DEFINER` function, Supabase client
  wrappers (`client`/`server`/`admin`), generated DB types, seed script,
  and the manual admin-creation script.
- Milestones 2–16 per `docs/phases/PHASE_1_IMPLEMENTATION_CHECKLIST.md`.
- **Awaiting user go-ahead before starting Milestone 1.**
