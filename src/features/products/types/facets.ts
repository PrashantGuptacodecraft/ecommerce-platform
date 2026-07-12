/**
 * Catalogue facet types for the shop page filter sidebar.
 * Facets are derived server-side from active catalogue data — never hardcoded.
 */

export type CategoryFacet = {
  slug: string
  name: string
  count: number
}

export type CatalogueFacets = {
  /** Active categories with the count of active products in each. */
  categories: CategoryFacet[]
  /** Distinct size values across all active variants of active products. */
  sizes: string[]
  /** Distinct colour values across all active variants of active products. */
  colours: string[]
  /** Min/max base price (in paise) across all active products. */
  priceRange: { min: number; max: number }
}
