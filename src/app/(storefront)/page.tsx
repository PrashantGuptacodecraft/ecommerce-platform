import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FadeIn } from '@/components/motion/FadeIn'
import { SlideUp } from '@/components/motion/SlideUp'
import { RevealOnScroll } from '@/components/motion/RevealOnScroll'
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger'
import { ScaleOnHover } from '@/components/motion/ScaleOnHover'
import { BagIcon, BoxIcon, CheckIcon } from '@/components/ui/icons'
import { brand } from '@/config/brand'
import { mainNav } from '@/config/navigation'

// Refined storefront foundation. Real catalogue data (hero campaign, new
// arrivals, featured/best-sellers from Supabase) is wired in Milestone 4; this
// page establishes the visual system, motion, and section rhythm with
// placeholder tiles (no mock product data). Category tiles use tonal blocks as
// image placeholders.

const categoryTones: Record<string, string> = {
  '/shop': 'from-charcoal to-ink',
  '/category/shirts': 'from-[#c9c2b6] to-[#a99f8d]',
  '/category/t-shirts': 'from-[#b7bcc0] to-[#8a9196]',
  '/category/trousers': 'from-[#c3b6a6] to-[#9c8a74]',
  '/category/outerwear': 'from-[#a9a49c] to-[#7c766c]',
}

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

      {/* Shop by category */}
      <section className="py-20">
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

          <StaggerContainer className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
            {mainNav.map((item) => (
              <StaggerItem key={item.href}>
                <Link href={item.href} className="group block">
                  <ScaleOnHover>
                    <div
                      className={`aspect-[4/5] rounded-lg bg-gradient-to-br ${categoryTones[item.href] ?? 'from-fog to-mist'}`}
                    />
                  </ScaleOnHover>
                  <p className="mt-3 text-sm font-medium text-charcoal transition-colors group-hover:text-ink">
                    {item.label}
                  </p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </Container>
      </section>

      {/* Reassurance */}
      <section className="border-y border-fog bg-white py-16">
        <Container>
          <StaggerContainer className="grid gap-8 sm:grid-cols-3">
            {reassurance.map((item) => (
              <StaggerItem key={item.title}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-accent">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-ink">{item.title}</p>
                    <p className="mt-1 text-sm text-slate">{item.body}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
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
