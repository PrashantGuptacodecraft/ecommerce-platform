/**
 * Money formatting. The server always stores and computes in integer paise
 * (docs/DATABASE_SCHEMA.md); this is the single place paise become a display
 * string, formatted for India (₹, lakh/crore grouping).
 */
const INR = 'en-IN'

/**
 * Format integer paise as an INR string.
 *
 * - Whole rupees render with no decimals (₹1,899); fractional paise render with
 *   two (₹1,899.50).
 * - `withSymbol: false` omits the ₹ (e.g. for inputs / compact contexts).
 */
export function formatPaise(paise: number, options?: { withSymbol?: boolean }): string {
  const withSymbol = options?.withSymbol ?? true
  const rupees = paise / 100
  const hasFraction = paise % 100 !== 0

  const formatted = new Intl.NumberFormat(INR, {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rupees)

  return withSymbol ? `₹${formatted}` : formatted
}

/**
 * Compute a percentage-off value from a compare-at price, for discount badges.
 * Returns a rounded integer percentage, or null when there is no valid discount.
 */
export function discountPercent(
  basePricePaise: number,
  compareAtPricePaise: number | null | undefined,
): number | null {
  if (!compareAtPricePaise || compareAtPricePaise <= basePricePaise) return null
  return Math.round(((compareAtPricePaise - basePricePaise) / compareAtPricePaise) * 100)
}
