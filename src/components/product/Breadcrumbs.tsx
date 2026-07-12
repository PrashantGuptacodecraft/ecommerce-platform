import Link from 'next/link'
import { cn } from '@/lib/utilities/cn'

type BreadcrumbItem = {
  label: string
  href: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
}

/**
 * Breadcrumb trail: Home › Category › Product.
 * The last item is the current page (rendered as plain text with aria-current).
 * All prior items are navigable links.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {index > 0 && (
                <span className="text-mist select-none" aria-hidden>
                  /
                </span>
              )}
              {isLast ? (
                <span aria-current="page" className="font-medium text-ink">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn('transition-colors duration-150', 'hover:text-ink')}
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
