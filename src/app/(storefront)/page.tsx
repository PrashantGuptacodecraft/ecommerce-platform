import { Suspense } from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Skeleton } from '@/components/ui/Skeleton'
import { RevealOnScroll } from '@/components/motion/RevealOnScroll'
import { BagIcon, BoxIcon, CheckIcon } from '@/components/ui/icons'
import { brand } from '@/config/brand'
import { FeaturedProducts } from '@/components/storefront/FeaturedProducts'
import { NewArrivals } from '@/components/storefront/NewArrivals'
import { CategoryGrid } from '@/components/storefront/CategoryGrid'
import { VideoHero } from '@/components/storefront/VideoHero'

const reassurance = [
  {
    icon: <BoxIcon className="size-5" />,
    title: 'Free shipping over ₹1,999',
    body: 'Fast, tracked dispatch across India.',
  },
  {
    icon: <CheckIcon className="size-5" />,
    title: '7-day easy returns',
    body: 'Not right? Send it back, no fuss.',
  },
  {
    icon: <BagIcon className="size-5" />,
    title: 'COD & Razorpay',
    body: 'Pay your way — cards, UPI, or on delivery.',
  },
]

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[4/5] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[4/5] w-full rounded-lg" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div>
      {/*
        Sticky stacking panels — the exact technique from the reference site.
        Panel 1 (hero video) is sticky at z-1, Panel 2 (content) slides OVER
        it at z-2 as the user scrolls. On mobile (<lg) they stack normally.
      */}
      <div className="relative">
        {/* Panel 1: Video Hero — sticky, stays pinned behind */}
        <div
          className="relative lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden"
          style={{ zIndex: 1 }}
        >
          <VideoHero />
        </div>

        {/* Panel 2: Content — slides over the hero */}
        <div
          className="relative lg:sticky lg:top-0 lg:min-h-screen"
          style={{ zIndex: 2 }}
        >
          {/* Featured Collection */}
          <section className="bg-paper py-20 sm:py-28 lg:flex lg:min-h-screen lg:items-center">
            <Container>
              <RevealOnScroll>
                <div className="mb-10 flex items-end justify-between gap-4">
                  <h2 className="font-serif text-2xl text-ink sm:text-3xl">Featured Collection</h2>
                  <Link
                    href="/shop?sort=featured"
                    className="text-sm text-slate underline-offset-4 hover:text-ink hover:underline"
                  >
                    View all
                  </Link>
                </div>
              </RevealOnScroll>
              <Suspense fallback={<ProductsSkeleton />}>
                <FeaturedProducts limit={4} />
              </Suspense>
            </Container>
          </section>
        </div>
      </div>



      {/* New Arrivals */}
      <section className="py-20">
        <Container>
          <RevealOnScroll>
            <div className="mb-10 flex items-end justify-between gap-4">
              <h2 className="font-serif text-2xl text-ink sm:text-3xl">New Arrivals</h2>
              <Link
                href="/shop?sort=new"
                className="text-sm text-slate underline-offset-4 hover:text-ink hover:underline"
              >
                View all
              </Link>
            </div>
          </RevealOnScroll>
          <Suspense fallback={<ProductsSkeleton />}>
            <NewArrivals limit={4} />
          </Suspense>
        </Container>
      </section>

      {/* Reassurance */}
      <section className="border-y border-fog bg-white py-16">
        <Container>
          <div className="grid gap-8 sm:grid-cols-3">
            {reassurance.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="mt-0.5 text-accent">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-slate">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Editorial band */}
      <section className="py-24">
        <Container size="narrow">
          <RevealOnScroll>
            <div className="text-center">
              <p className="text-xs tracking-[0.3em] text-mist uppercase">
                The {brand.shortName} approach
              </p>
              <p className="mt-4 font-serif text-2xl leading-relaxed text-ink sm:text-3xl">
                Fewer, better pieces. Honest fabrics, considered fits, and finishing that lasts —
                designed to sit quietly at the centre of your wardrobe.
              </p>
            </div>
          </RevealOnScroll>
        </Container>
      </section>
    </div>
  )
}
