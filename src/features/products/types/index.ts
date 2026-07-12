import { z } from 'zod'
import type { Database } from '@/types/database'

// Row aliases from the generated DB types (source of truth = migrations).
type ProductRow = Database['public']['Tables']['products']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']
type ProductImageRow = Database['public']['Tables']['product_images']['Row']

export type Category = Pick<
  CategoryRow,
  'id' | 'name' | 'slug' | 'description' | 'image_url' | 'sort_order'
>

export type ProductImage = Pick<
  ProductImageRow,
  'id' | 'storage_path' | 'alt_text' | 'sort_order' | 'is_primary'
>

/** One selectable option value (e.g. Size "M" or Colour "Black"). */
export type OptionValue = {
  id: string
  value: string
  sortOrder: number
}

/** A product option group with its values (e.g. Size → [S,M,L,XL]). */
export type ProductOption = {
  id: string
  name: string
  sortOrder: number
  values: OptionValue[]
}

/** A purchasable variant, with which option-value ids it maps to. */
export type ProductVariant = {
  id: string
  sku: string
  stockQuantity: number
  priceAdjustmentPaise: number
  isActive: boolean
  imageId: string | null
  /** option_value_ids this variant is composed of (e.g. {M, Black}). */
  optionValueIds: string[]
}

/** Card-level product summary for listing grids. */
export type ProductSummary = {
  id: string
  slug: string
  name: string
  shortDescription: string | null
  basePricePaise: number
  compareAtPricePaise: number | null
  isNewArrival: boolean
  isFeatured: boolean
  primaryImage: ProductImage | null
  /** Sum of active-variant stock — 0 means sold out. */
  totalStock: number
}

/** Full product detail with options, values, variants and gallery. */
export type ProductDetail = Pick<
  ProductRow,
  | 'id'
  | 'slug'
  | 'name'
  | 'description'
  | 'short_description'
  | 'base_price_paise'
  | 'compare_at_price_paise'
  | 'fabric'
  | 'care_instructions'
  | 'fit_info'
  | 'is_new_arrival'
  | 'is_featured'
  | 'seo_title'
  | 'seo_description'
> & {
  category: Pick<Category, 'name' | 'slug'> | null
  sizeChart: unknown
  images: ProductImage[]
  options: ProductOption[]
  variants: ProductVariant[]
  totalStock: number
}

export type ProductSort = 'featured' | 'new' | 'price-asc' | 'price-desc'

export type PaginatedProducts = {
  items: ProductSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ---------------------------------------------------------------------------
// Query-param validation (trust boundary for URL search params).
// ---------------------------------------------------------------------------
export const productSortSchema = z
  .enum(['featured', 'new', 'price-asc', 'price-desc'])
  .catch('featured')

export const shopQuerySchema = z.object({
  category: z.string().trim().min(1).max(80).optional(),
  size: z.string().trim().min(1).max(40).optional(),
  colour: z.string().trim().min(1).max(40).optional(),
  minPrice: z.coerce.number().int().min(0).max(100_000_000).optional(),
  maxPrice: z.coerce.number().int().min(0).max(100_000_000).optional(),
  sort: productSortSchema.optional(),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
})

export type ShopQuery = z.infer<typeof shopQuerySchema>

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
})

export type SearchQuery = z.infer<typeof searchQuerySchema>

// Re-export facet types for convenience.
export type { CatalogueFacets, CategoryFacet } from './facets'
