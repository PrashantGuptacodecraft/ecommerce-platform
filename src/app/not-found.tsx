import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { FadeIn } from '@/components/motion/FadeIn'
import { SlideUp } from '@/components/motion/SlideUp'
import { brand } from '@/config/brand'

// Global 404. Rendered inside the root layout (no storefront chrome), kept
// self-contained and on-brand. Motion is reduced-motion aware via the
// primitives.
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <FadeIn>
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.22em] text-slate uppercase transition-colors hover:text-ink"
        >
          {brand.name}
        </Link>
      </FadeIn>
      <SlideUp>
        <div className="space-y-3">
          <p className="font-serif text-6xl text-ink">404</p>
          <h1 className="text-lg font-medium text-ink">This page couldn’t be found</h1>
          <p className="mx-auto max-w-sm text-sm text-slate">
            The page may have moved or no longer exists. Let’s get you back to the collection.
          </p>
        </div>
      </SlideUp>
      <FadeIn delay={0.1}>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/">
            <Button>Back to home</Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline">Shop all</Button>
          </Link>
        </div>
      </FadeIn>
    </main>
  )
}
