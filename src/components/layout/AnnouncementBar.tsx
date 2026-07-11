import { Container } from '@/components/ui/Container'

/**
 * Thin promotional bar above the header. Content is a placeholder until real
 * campaign copy / `store_settings`-driven messaging lands; kept intentionally
 * simple and non-animated (it sits above the fold on every page).
 */
export function AnnouncementBar() {
  return (
    <div className="bg-ink text-paper">
      <Container>
        <p className="py-2 text-center text-xs tracking-wide">
          Complimentary shipping on orders over ₹1,999 · Easy 7-day returns
        </p>
      </Container>
    </div>
  )
}
