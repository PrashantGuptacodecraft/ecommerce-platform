import 'server-only'

import { requireAdmin } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { site } from '@/config/site'

export type AdminProductListParams = {
  page?: number
  search?: string
  status?: 'active' | 'inactive'
  categoryId?: string
  stockStatus?: 'low_stock' | 'out_of_stock' | 'in_stock'
}

export async function getAdminProducts({
  page = 1,
  search = '',
  status,
  categoryId,
  stockStatus,
}: AdminProductListParams) {
  await requireAdmin()
  const supabase = await createClient()

  let query = supabase.from('products').select(
    `
    id, name, slug, is_active, base_price_paise, created_at, category_id,
    product_variants ( id, stock_quantity, sku )
  `,
    { count: 'exact' },
  )

  // 1. Handle cross-table search (name, slug, SKU)
  if (search) {
    const matchingIds = new Set<string>()
    // Products match
    const { data: pData } = await supabase
      .from('products')
      .select('id')
      .or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
    pData?.forEach((p) => matchingIds.add(p.id))
    // Variants match
    const { data: vData } = await supabase
      .from('product_variants')
      .select('product_id')
      .ilike('sku', `%${search}%`)
    vData?.forEach((v) => matchingIds.add(v.product_id))

    if (matchingIds.size === 0) {
      return { products: [], count: 0, totalPages: 0 }
    }
    query = query.in('id', Array.from(matchingIds))
  }

  // 2. Handle cross-table stock status
  if (stockStatus) {
    let variantQuery = supabase.from('product_variants').select('product_id')
    if (stockStatus === 'out_of_stock') {
      variantQuery = variantQuery.eq('stock_quantity', 0)
    } else if (stockStatus === 'low_stock') {
      variantQuery = variantQuery
        .gt('stock_quantity', 0)
        .lt('stock_quantity', site.lowStockThreshold)
    } else if (stockStatus === 'in_stock') {
      variantQuery = variantQuery.gte('stock_quantity', site.lowStockThreshold)
    }
    const { data: vData } = await variantQuery
    const pIds = vData?.map((v) => v.product_id) || []

    if (pIds.length === 0) {
      return { products: [], count: 0, totalPages: 0 }
    }
    query = query.in('id', pIds)
  }

  // 3. Direct table filters
  if (status === 'active') {
    query = query.eq('is_active', true)
  } else if (status === 'inactive') {
    query = query.eq('is_active', false)
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const from = (page - 1) * site.pagination.adminPageSize
  const to = from + site.pagination.adminPageSize - 1

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  return {
    products: data,
    count: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / site.pagination.adminPageSize),
  }
}

export async function getAdminProductDetail(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      `
    *,
    product_options (*, product_option_values (*)),
    product_variants (*, variant_option_values (option_value_id)),
    product_images (*)
  `,
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}
