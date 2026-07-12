import { Suspense } from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { FadeIn } from '@/components/motion/FadeIn'
import { SlideUp } from '@/components/motion/SlideUp'
import { RevealOnScroll } from '@/components/motion/RevealOnScroll'
import { BagIcon, BoxIcon, CheckIcon } from '@/components/ui/icons'
import { brand } from '@/config/brand'
import { FeaturedProducts } from '@/components/storefront/FeaturedProducts'
import { NewArrivals } from '@/components/storefront/NewArrivals'
import { CategoryGrid } from '@/components/storefront/CategoryGrid'

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
      {/* Hero */}
      <section className="border-b border-fog">
        <Container>
          <div className="flex min-h-[70vh] flex-col items-start justify-center gap-6 py-20">
            <FadeIn>
              <Badge variant="outline">New season · Considered essentials</Badge>
            </FadeIn>
            <SlideUp>
              <h1 className="max-w-3xl font-serif text-4xl leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
                Quietly premium clothing, made to be lived in.
              </h1>
            </SlideUp>
            <FadeIn delay={0.1}>
              <p className="max-w-xl text-base text-slate sm:text-lg">
                {brand.description} Explore a tightly edited range in a restrained, neutral palette.
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="flex flex-wrap gap-3">
                <Link href="/shop">
                  <Button size="lg" className="px-7">
                    Shop the collection
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" size="lg">
                    Our story
                  </Button>
                </Link>
              </div>
            </FadeIn>
          </div>
        </Container>
      </section>

      {/* Featured Collection — real data from Supabase */}
      <section className="py-20">
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

      {/* Shop by category — real data from Supabase */}
      <section className="border-y border-fog bg-white py-20">
        <Container>
          <RevealOnScroll>
            <div className="mb-10 flex items-end justify-between gap-4">
              <h2 className="font-serif text-2xl text-ink sm:text-3xl">Shop by category</h2>
              <Link
                href="/shop"
                className="text-sm text-slate underline-offset-4 hover:text-ink hover:underline"
              >
                View all
              </Link>
            </div>
          </RevealOnScroll>
          <Suspense fallback={<CategoriesSkeleton />}>
            <CategoryGrid />
          </Suspense>
        </Container>
      </section>

      {/* New Arrivals — real data from Supabase */}
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
