import 'server-only'

import { createPublicClient } from '@/lib/supabase/public'
import { site } from '@/config/site'
import type {
  Category,
  PaginatedProducts,
  ProductDetail,
  ProductImage,
  ProductOption,
  ProductSummary,
  ProductVariant,
  ShopQuery,
} from '@/features/products/types'
import type { CatalogueFacets } from '@/features/products/types/facets'

/**
 * Server-only catalogue read layer. All queries go through the cookie-free
 * public client, so RLS enforces active-only visibility (public policies expose
 * only `is_active = true` catalogue rows). We additionally filter/derive here.
 *
 * These are READ ONLY — no mutations. Admin catalogue writes (Milestone 11) use
 * the service-role client and re-check authorization in the service layer.
 */

const PAGE_SIZE = site.pagination.storefrontPageSize

// Shape returned by the joined product select (only the columns we read).
type ProductJoinRow = {
  id: string
  slug: string
  name: string
  short_description: string | null
  base_price_paise: number
  compare_at_price_paise: number | null
  is_new_arrival: boolean
  is_featured: boolean
  product_images: {
    id: string
    storage_path: string
    alt_text: string | null
    sort_order: number
    is_primary: boolean
  }[]
  product_variants: { stock_quantity: number; is_active: boolean }[]
}

function pickPrimaryImage(images: ProductJoinRow['product_images']): ProductImage | null {
  if (images.length === 0) return null
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order)
  return sorted.find((img) => img.is_primary) ?? sorted[0] ?? null
}

function totalActiveStock(variants: ProductJoinRow['product_variants']): number {
  return variants.reduce((sum, v) => sum + (v.is_active ? v.stock_quantity : 0), 0)
}

function toSummary(row: ProductJoinRow): ProductSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    basePricePaise: row.base_price_paise,
    compareAtPricePaise: row.compare_at_price_paise,
    isNewArrival: row.is_new_arrival,
    isFeatured: row.is_featured,
    primaryImage: pickPrimaryImage(row.product_images),
    totalStock: totalActiveStock(row.product_variants),
  }
}

const PRODUCT_CARD_SELECT =
  'id, slug, name, short_description, base_price_paise, compare_at_price_paise, is_new_arrival, is_featured, ' +
  'product_images ( id, storage_path, alt_text, sort_order, is_primary ), ' +
  'product_variants ( stock_quantity, is_active )'

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export async function getActiveCategories(): Promise<Category[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, image_url, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`getActiveCategories: ${error.message}`)
  return data ?? []
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, image_url, sort_order')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new Error(`getCategoryBySlug: ${error.message}`)
  return data
}

// ---------------------------------------------------------------------------
// Product listings
// ---------------------------------------------------------------------------
type ListOptions = {
  page?: number
  limit?: number
}

/** Featured products for the homepage. */
export async function getFeaturedProducts(limit = 8): Promise<ProductSummary[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_CARD_SELECT)
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getFeaturedProducts: ${error.message}`)
  return ((data as unknown as ProductJoinRow[]) ?? []).map(toSummary)
}

/** Newest arrivals for the homepage. */
export async function getNewArrivals(limit = 8): Promise<ProductSummary[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_CARD_SELECT)
    .eq('is_active', true)
    .eq('is_new_arrival', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getNewArrivals: ${error.message}`)
  return ((data as unknown as ProductJoinRow[]) ?? []).map(toSummary)
}

/**
 * Paginated shop listing with optional category/price filters + sort. Size and
 * colour filtering is applied in-memory after fetch (they live in a
 * variant→option-value join not expressible as a single PostgREST filter);
 * acceptable at the Phase 1 catalogue size (<=20 products).
 */
export async function listProducts(query: ShopQuery): Promise<PaginatedProducts> {
  const supabase = createPublicClient()
  const page = query.page ?? 1
  const pageSize = PAGE_SIZE

  let builder = supabase
    .from('products')
    .select(PRODUCT_CARD_SELECT, { count: 'exact' })
    .eq('is_active', true)

  if (query.category) {
    const category = await getCategoryBySlug(query.category)
    if (!category) {
      return { items: [], total: 0, page, pageSize, totalPages: 0 }
    }
    builder = builder.eq('category_id', category.id)
  }

  if (query.q) {
    const escaped = query.q.replace(/[%_]/g, '\\$&')
    const pattern = `%${escaped}%`
    builder = builder.or(`name.ilike.${pattern},short_description.ilike.${pattern}`)
  }

  if (typeof query.minPrice === 'number') {
    builder = builder.gte('base_price_paise', query.minPrice)
  }
  if (typeof query.maxPrice === 'number') {
    builder = builder.lte('base_price_paise', query.maxPrice)
  }

  switch (query.sort) {
    case 'price-asc':
      builder = builder.order('base_price_paise', { ascending: true })
      break
    case 'price-desc':
      builder = builder.order('base_price_paise', { ascending: false })
      break
    case 'new':
      builder = builder.order('is_new_arrival', { ascending: false }).order('created_at', {
        ascending: false,
      })
      break
    default:
      builder = builder.order('is_featured', { ascending: false }).order('created_at', {
        ascending: false,
      })
  }

  // Stable secondary sort: deterministic ordering even when primary sort values
  // are equal (e.g. two products at the same price). Prevents pagination drift.
  builder = builder.order('id', { ascending: true })

  const needsVariantFilter = Boolean(query.size || query.colour)

  // When filtering by size/colour we must post-filter, so fetch the full active
  // set (bounded by the 20-product cap) and paginate in-memory. Otherwise
  // paginate at the database.
  if (!needsVariantFilter) {
    const from = (page - 1) * pageSize
    const { data, error, count } = await builder.range(from, from + pageSize - 1)
    if (error) throw new Error(`listProducts: ${error.message}`)
    const items = ((data as unknown as ProductJoinRow[]) ?? []).map(toSummary)
    const total = count ?? 0
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
  }

  const { data, error } = await builder
  if (error) throw new Error(`listProducts: ${error.message}`)

  const productIds = ((data as unknown as ProductJoinRow[]) ?? []).map((r) => r.id)
  const matchingIds = await filterProductIdsByOptionValues(supabase, productIds, {
    size: query.size,
    colour: query.colour,
  })

  const filtered = (data as unknown as ProductJoinRow[])
    .filter((r) => matchingIds.has(r.id))
    .map(toSummary)
  const total = filtered.length
  const from = (page - 1) * pageSize
  const items = filtered.slice(from, from + pageSize)
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

/**
 * Given candidate product ids, return the subset that has at least one ACTIVE
 * variant matching the requested size and/or colour option values.
 */
async function filterProductIdsByOptionValues(
  supabase: ReturnType<typeof createPublicClient>,
  productIds: string[],
  filters: { size?: string; colour?: string },
): Promise<Set<string>> {
  if (productIds.length === 0) return new Set()
  const wanted = [filters.size, filters.colour].filter(Boolean) as string[]
  if (wanted.length === 0) return new Set(productIds)

  const { data, error } = await supabase
    .from('product_variants')
    .select('product_id, is_active, variant_option_values ( product_option_values ( value ) )')
    .in('product_id', productIds)
    .eq('is_active', true)

  if (error) throw new Error(`filterProductIdsByOptionValues: ${error.message}`)

  type VariantRow = {
    product_id: string
    is_active: boolean
    variant_option_values: { product_option_values: { value: string } | null }[]
  }

  const matched = new Set<string>()
  for (const variant of (data as VariantRow[] | null) ?? []) {
    const values = variant.variant_option_values
      .map((vov) => vov.product_option_values?.value)
      .filter(Boolean) as string[]
    const hasAll = wanted.every((w) => values.includes(w))
    if (hasAll) matched.add(variant.product_id)
  }
  return matched
}



/** Get related products by category, excluding the current product. */
export async function getRelatedProducts(
  currentProductId: string,
  categoryId?: string,
  limit = 4,
): Promise<ProductSummary[]> {
  if (!categoryId) return []
  
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_CARD_SELECT)
    .eq('is_active', true)
    .eq('category_id', categoryId)
    .neq('id', currentProductId)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getRelatedProducts: ${error.message}`)
  return ((data as unknown as ProductJoinRow[]) ?? []).map(toSummary)
}

// ---------------------------------------------------------------------------
// Product detail
// ---------------------------------------------------------------------------
export async function getProductSlugs(): Promise<string[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase.from('products').select('slug').eq('is_active', true)

  if (error) throw new Error(`getProductSlugs: ${error.message}`)
  return (data ?? []).map((r) => r.slug)
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = createPublicClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      'id, slug, name, description, short_description, base_price_paise, compare_at_price_paise, ' +
        'fabric, care_instructions, fit_info, is_new_arrival, is_featured, seo_title, seo_description, size_chart, ' +
        'categories ( id, name, slug ), ' +
        'product_images ( id, storage_path, alt_text, sort_order, is_primary ), ' +
        'product_options ( id, name, sort_order, product_option_values ( id, value, sort_order ) ), ' +
        'product_variants ( id, sku, stock_quantity, price_adjustment_paise, is_active, image_id, ' +
        'variant_option_values ( option_value_id ) )',
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new Error(`getProductBySlug: ${error.message}`)
  if (!data) return null

  type DetailRow = {
    id: string
    slug: string
    name: string
    description: string | null
    short_description: string | null
    base_price_paise: number
    compare_at_price_paise: number | null
    fabric: string | null
    care_instructions: string | null
    fit_info: string | null
    is_new_arrival: boolean
    is_featured: boolean
    seo_title: string | null
    seo_description: string | null
    size_chart: unknown
    categories: { id: string; name: string; slug: string } | null
    product_images: ProductImage[]
    product_options: {
      id: string
      name: string
      sort_order: number
      product_option_values: { id: string; value: string; sort_order: number }[]
    }[]
    product_variants: {
      id: string
      sku: string
      stock_quantity: number
      price_adjustment_paise: number
      is_active: boolean
      image_id: string | null
      variant_option_values: { option_value_id: string }[]
    }[]
  }

  const row = data as unknown as DetailRow

  const images = [...row.product_images].sort((a, b) => a.sort_order - b.sort_order)

  const options: ProductOption[] = [...row.product_options]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((opt) => ({
      id: opt.id,
      name: opt.name,
      sortOrder: opt.sort_order,
      values: [...opt.product_option_values]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((v) => ({ id: v.id, value: v.value, sortOrder: v.sort_order })),
    }))

  const variants: ProductVariant[] = row.product_variants
    .filter((v) => v.is_active)
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      stockQuantity: v.stock_quantity,
      priceAdjustmentPaise: v.price_adjustment_paise,
      isActive: v.is_active,
      imageId: v.image_id,
      optionValueIds: v.variant_option_values.map((vov) => vov.option_value_id),
    }))

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    short_description: row.short_description,
    base_price_paise: row.base_price_paise,
    compare_at_price_paise: row.compare_at_price_paise,
    fabric: row.fabric,
    care_instructions: row.care_instructions,
    fit_info: row.fit_info,
    is_new_arrival: row.is_new_arrival,
    is_featured: row.is_featured,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    category: row.categories,
    sizeChart: row.size_chart,
    images,
    options,
    variants,
    totalStock: variants.reduce((sum, v) => sum + v.stockQuantity, 0),
  }
}

// ---------------------------------------------------------------------------
// Catalogue facets — filter values derived from active data
// ---------------------------------------------------------------------------

/**
 * Derives available filter facets from the active catalogue. Queries ALL active
 * products/variants/options (not just the current page) so filters reflect the
 * full public catalogue.
 *
 * Uses the cookie-bound anon client — RLS enforces active-only visibility.
 */
export async function getCatalogueFacets(): Promise<CatalogueFacets> {
  const supabase = createPublicClient()

  // 1. Category facets: active categories with count of active products
  const { data: catData, error: catError } = await supabase
    .from('categories')
    .select('slug, name, products ( id )')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (catError) throw new Error(`getCatalogueFacets/categories: ${catError.message}`)

  type CatRow = { slug: string; name: string; products: { id: string }[] | null }
  const categories = ((catData as CatRow[] | null) ?? []).map((c) => ({
    slug: c.slug,
    name: c.name,
    count: c.products?.length ?? 0,
  }))

  // 2. Price range across all active products
  const { data: priceData, error: priceError } = await supabase
    .from('products')
    .select('base_price_paise')
    .eq('is_active', true)

  if (priceError) throw new Error(`getCatalogueFacets/prices: ${priceError.message}`)

  const prices = (priceData ?? []).map((p) => p.base_price_paise)
  const priceRange =
    prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: 0, max: 0 }

  // 3. Distinct size and colour values from active variants of active products.
  //    We fetch variant→option_value→option to determine which are Size vs Colour.
  const { data: optData, error: optError } = await supabase
    .from('product_variants')
    .select(
      'is_active, stock_quantity, ' +
        'products!inner ( is_active ), ' +
        'variant_option_values ( product_option_values ( value, product_options ( name ) ) )',
    )
    .eq('is_active', true)

  if (optError) throw new Error(`getCatalogueFacets/options: ${optError.message}`)

  type FacetVariantRow = {
    is_active: boolean
    stock_quantity: number
    products: { is_active: boolean } | null
    variant_option_values: {
      product_option_values: {
        value: string
        product_options: { name: string } | null
      } | null
    }[]
  }

  const sizeSet = new Set<string>()
  const colourSet = new Set<string>()

  for (const v of (optData as unknown as FacetVariantRow[]) ?? []) {
    // Only include facets from active variants with stock
    if (!v.is_active || v.stock_quantity <= 0) continue
    for (const vov of v.variant_option_values) {
      const pov = vov.product_option_values
      if (!pov || !pov.product_options) continue
      const optionName = pov.product_options.name.toLowerCase()
      if (optionName === 'size') sizeSet.add(pov.value)
      else if (optionName === 'colour' || optionName === 'color') colourSet.add(pov.value)
    }
  }

  return {
    categories,
    sizes: [...sizeSet],
    colours: [...colourSet],
    priceRange,
  }
}
