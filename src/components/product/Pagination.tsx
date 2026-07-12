import Link from 'next/link'
import { cn } from '@/lib/utilities/cn'

type PaginationProps = {
  page: number
  totalPages: number
  searchParams?: Record<string, string>
}

/**
 * Build the URL for a given page number, preserving all other search params.
 */
function pageHref(targetPage: number, searchParams?: Record<string, string>): string {
  const params = new URLSearchParams(searchParams ?? {})
  if (targetPage <= 1) {
    params.delete('page')
  } else {
    params.set('page', String(targetPage))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : '?'
}

/**
 * Compute which page numbers to show, with ellipsis markers (-1).
 */
function getPageRange(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: number[] = [1]

  if (current > 3) pages.push(-1)

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) pages.push(-1)

  pages.push(total)

  return pages
}

const baseStyles =
  'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-3 text-sm font-medium transition-colors duration-150'

const activeStyles = 'bg-ink text-paper'
const inactiveStyles = 'border border-fog bg-white text-ink hover:bg-fog/50'
const disabledStyles = 'pointer-events-none opacity-40'

/**
 * Page-based navigation links.
 * Preserves existing filter/sort search params when navigating between pages.
 */
export function Pagination({ page, totalPages, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageRange(page, totalPages)

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
      {/* Previous */}
      {page <= 1 ? (
        <span className={cn(baseStyles, disabledStyles)} aria-disabled="true">
          Previous
        </span>
      ) : (
        <Link
          href={pageHref(page - 1, searchParams)}
          className={cn(baseStyles, inactiveStyles)}
          aria-label="Go to previous page"
        >
          Previous
        </Link>
      )}

      {/* Page numbers */}
      {pages.map((p, idx) => {
        if (p === -1) {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-sm text-mist select-none"
              aria-hidden
            >
              …
            </span>
          )
        }

        if (p === page) {
          return (
            <span key={p} className={cn(baseStyles, activeStyles)} aria-current="page">
              {p}
            </span>
          )
        }

        return (
          <Link
            key={p}
            href={pageHref(p, searchParams)}
            className={cn(baseStyles, inactiveStyles)}
            aria-label={`Go to page ${p}`}
          >
            {p}
          </Link>
        )
      })}

      {/* Next */}
      {page >= totalPages ? (
        <span className={cn(baseStyles, disabledStyles)} aria-disabled="true">
          Next
        </span>
      ) : (
        <Link
          href={pageHref(page + 1, searchParams)}
          className={cn(baseStyles, inactiveStyles)}
          aria-label="Go to next page"
        >
          Next
        </Link>
      )}
    </nav>
  )
}
