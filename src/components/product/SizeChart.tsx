'use client'

import { useState } from 'react'
import { Dialog } from '@/components/ui'
import { cn } from '@/lib/utilities/cn'

type SizeChartData = {
  headers: string[]
  rows: string[][]
}

type SizeChartProps = {
  sizeChart: unknown
  productName: string
}

/**
 * Validates and narrows the sizeChart data to the expected format.
 */
function parseSizeChart(data: unknown): SizeChartData | null {
  if (!data || typeof data !== 'object') return null

  const obj = data as Record<string, unknown>

  // Expected format: { headers: string[], rows: string[][] }
  if (
    Array.isArray(obj.headers) &&
    obj.headers.every((h: unknown) => typeof h === 'string') &&
    Array.isArray(obj.rows) &&
    obj.rows.every(
      (row: unknown) =>
        Array.isArray(row) && row.every((cell: unknown) => typeof cell === 'string'),
    )
  ) {
    return { headers: obj.headers as string[], rows: obj.rows as string[][] }
  }

  // Attempt array-of-arrays format: first row = headers, rest = data
  if (
    Array.isArray(data) &&
    data.length >= 2 &&
    data.every(
      (row: unknown) =>
        Array.isArray(row) && row.every((cell: unknown) => typeof cell === 'string'),
    )
  ) {
    const allRows = data as string[][]
    const headers = allRows[0]
    const rows = allRows.slice(1)
    if (headers) return { headers, rows }
  }

  return null
}

/**
 * Ruler icon for the size guide trigger button.
 */
function RulerIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z" />
      <path d="m14.5 12.8 2-2" />
      <path d="m11.5 9.8 2-2" />
      <path d="m8.5 6.8 2-2" />
      <path d="m17.5 15.8 2-2" />
    </svg>
  )
}

/**
 * Size chart component. Only renders the trigger if sizeChart is truthy
 * and can be parsed into a valid table format.
 */
export function SizeChart({ sizeChart, productName }: SizeChartProps) {
  const [open, setOpen] = useState(false)

  const parsed = parseSizeChart(sizeChart)
  if (!parsed) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-1.5 text-sm font-medium text-slate',
          'transition-colors duration-150 hover:text-ink',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:rounded-sm',
        )}
      >
        <RulerIcon />
        Size Guide
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Size Guide — ${productName}`}
        className="max-w-lg"
      >
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-fog">
                {parsed.headers.map((header, i) => (
                  <th
                    key={i}
                    className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    'border-b border-fog/50 last:border-b-0',
                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-paper/50',
                  )}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={cn(
                        'whitespace-nowrap px-3 py-2.5 tabular-nums text-ink',
                        cellIndex === 0 && 'font-medium',
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Dialog>
    </>
  )
}
