import 'server-only'

import { requireAdmin } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { site } from '@/config/site'

export type AdminCategoryListParams = {
  page?: number
  search?: string
}

export async function getAdminCategories({ page = 1, search = '' }: AdminCategoryListParams) {
  await requireAdmin()
  const supabase = await createClient()

  let query = supabase.from('categories').select(
    `
    *,
    products ( id )
  `,
    { count: 'exact' },
  )

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
  }

  const from = (page - 1) * site.pagination.adminPageSize
  const to = from + site.pagination.adminPageSize - 1

  const { data, count, error } = await query
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  // Transform to include product count
  const categories = data.map((cat) => ({
    ...cat,
    productCount: cat.products.length,
  }))

  return {
    categories,
    count: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / site.pagination.adminPageSize),
  }
}

export async function getAdminCategoryDetail(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase.from('categories').select('*').eq('id', id).single()

  if (error) throw error
  return data
}

// For dropdown selection in product form
export async function getAdminCategoryOptions() {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}
