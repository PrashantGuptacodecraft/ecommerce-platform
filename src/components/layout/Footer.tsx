import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { NewsletterForm } from '@/components/layout/NewsletterForm'
import { brand } from '@/config/brand'
import { footerSections } from '@/config/navigation'

/** Premium footer foundation: brand blurb, newsletter, link columns, legal bar. */
export function Footer() {
  return (
    <footer className="mt-24 border-t border-fog bg-white">
      <Container>
        <div className="grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-lg font-semibold tracking-[0.22em] text-ink uppercase">
              {brand.name}
            </p>
            <p className="mt-3 max-w-sm text-sm text-slate">{brand.description}</p>
            <div className="mt-6 max-w-sm">
              <p className="mb-2 text-sm font-medium text-charcoal">Join the list</p>
              <NewsletterForm />
            </div>
          </div>

          {footerSections.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h2 className="text-xs font-semibold tracking-wider text-mist uppercase">
                {section.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-fog py-6 text-xs text-mist sm:flex-row sm:items-center sm:justify-between">
          <p>© {brand.name} · All prices in INR (₹), inclusive of taxes where applicable.</p>
          <p>Secure payments via Razorpay · Cash on Delivery available</p>
        </div>
      </Container>
    </footer>
  )
}
