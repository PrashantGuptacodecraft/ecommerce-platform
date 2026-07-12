import 'server-only'

import { requireAdmin } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { site } from '@/config/site'

export type AdminInventoryListParams = {
  page?: number
  search?: string
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock'
}

export async function getAdminInventory({
  page = 1,
  search = '',
  stockStatus,
}: AdminInventoryListParams) {
  await requireAdmin()
  const supabase = await createClient()

  let query = supabase.from('product_variants').select(
    `
    id, sku, stock_quantity, is_active,
    products!inner ( id, name, slug )
  `,
    { count: 'exact' },
  )

  if (search) {
    query = query.or(`sku.ilike.%${search}%,products.name.ilike.%${search}%`)
  }

  if (stockStatus === 'out_of_stock') {
    query = query.eq('stock_quantity', 0)
  } else if (stockStatus === 'low_stock') {
    query = query.gt('stock_quantity', 0).lt('stock_quantity', site.lowStockThreshold)
  } else if (stockStatus === 'in_stock') {
    query = query.gte('stock_quantity', site.lowStockThreshold)
  }

  const from = (page - 1) * site.pagination.adminPageSize
  const to = from + site.pagination.adminPageSize - 1

  const { data, count, error } = await query
    .order('products(name)', { ascending: true })
    .order('sku', { ascending: true })
    .range(from, to)

  if (error) throw error

  return {
    variants: data,
    count: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / site.pagination.adminPageSize),
  }
}

export async function getAdminInventoryTransactions(variantId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_transactions')
    .select('*, admin_profiles(email)')
    .eq('variant_id', variantId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data
}
