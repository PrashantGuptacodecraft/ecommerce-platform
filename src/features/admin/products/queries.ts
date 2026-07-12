import 'server-only'

import { requireAdmin } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { site } from '@/config/site'

export type AdminProductListParams = {
  page?: number
  search?: string
  status?: 'active' | 'inactive'
}

export async function getAdminProducts({ page = 1, search = '', status }: AdminProductListParams) {
  await requireAdmin()
  const supabase = await createClient()

  let query = supabase.from('products').select(
    `
    id, name, slug, is_active, base_price_paise, created_at,
    product_variants ( id, stock_quantity, sku )
  `,
    { count: 'exact' },
  )

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
  }

  if (status === 'active') {
    query = query.eq('is_active', true)
  } else if (status === 'inactive') {
    query = query.eq('is_active', false)
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
