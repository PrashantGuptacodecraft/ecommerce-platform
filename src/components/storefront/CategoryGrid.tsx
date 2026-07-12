import Link from 'next/link'
import { getActiveCategories } from '@/features/products/queries'
import { ScaleOnHover } from '@/components/motion/ScaleOnHover'
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger'

/**
 * Tonal gradients per category slug — used as image placeholders until real
 * category images are uploaded. Consistent with the design system palette.
 */
const categoryTones: Record<string, string> = {
  shirts: 'from-[#c9c2b6] to-[#a99f8d]',
  't-shirts': 'from-[#b7bcc0] to-[#8a9196]',
  trousers: 'from-[#c3b6a6] to-[#9c8a74]',
  outerwear: 'from-[#a9a49c] to-[#7c766c]',
}

/**
 * Renders active categories from the database. Falls back gracefully to a
 * message if no categories exist.
 */
export async function CategoryGrid() {
  const categories = await getActiveCategories()

  if (categories.length === 0) {
    return <p className="py-8 text-center text-sm text-mist">Categories coming soon.</p>
  }

  return (
    <StaggerContainer className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {categories.map((cat) => (
        <StaggerItem key={cat.id}>
          <Link href={`/category/${cat.slug}`} className="group block">
            <ScaleOnHover>
              <div
                className={`aspect-[4/5] rounded-lg bg-gradient-to-br ${categoryTones[cat.slug] ?? 'from-fog to-mist'}`}
                role="img"
                aria-label={cat.name}
              />
            </ScaleOnHover>
            <p className="mt-3 text-sm font-medium text-charcoal transition-colors group-hover:text-ink">
              {cat.name}
            </p>
            {cat.description ? (
              <p className="mt-0.5 text-xs text-mist line-clamp-1">{cat.description}</p>
            ) : null}
          </Link>
        </StaggerItem>
      ))}
    </StaggerContainer>
  )
}
