import { brand } from '@/config/brand'

/**
 * Temporary root placeholder so the app builds and runs from Milestone 0.
 *
 * The real homepage is built in Milestone 4 inside the `(storefront)` route
 * group (`src/app/(storefront)/page.tsx`) with the full section stack
 * (announcement bar, hero, category grid, new arrivals, …). This file is
 * relocated/removed then; it does not represent final structure.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-[#5f5f5f]">{brand.name}</p>
      <h1 className="text-2xl font-semibold">{brand.tagline}</h1>
      <p className="max-w-md text-sm text-[#5f5f5f]">
        Storefront under construction — Phase 1, Milestone 0 (project init) complete.
      </p>
    </main>
  )
}
