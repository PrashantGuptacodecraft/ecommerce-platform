'use client'

import { motion, AnimatePresence } from 'motion/react'
import { BagIcon } from '@/components/ui/icons'
import Link from 'next/link'
import { cn } from '@/lib/utilities/cn'

type CartBadgeProps = {
  totalItems: number
  className?: string
  onClick?: () => void
}

export function CartBadge({ totalItems, className, onClick }: CartBadgeProps) {
  const content = (
    <>
      <BagIcon className="size-6" />
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-sm"
          >
            {totalItems > 99 ? '99+' : totalItems}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'relative flex items-center justify-center p-2 text-ink hover:text-accent transition-colors',
          className,
        )}
        aria-label="View Cart"
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      href="/cart"
      className={cn(
        'relative flex items-center justify-center p-2 text-ink hover:text-accent transition-colors',
        className,
      )}
      aria-label="View Cart"
    >
      {content}
    </Link>
  )
}
