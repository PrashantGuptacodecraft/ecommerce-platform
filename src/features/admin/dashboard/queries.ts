import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/security/auth'
import { site } from '@/config/site'

export type DashboardMetrics = {
  activeProducts: number
  activeCategories: number
  activeVariants: number
  lowStockVariants: number
  outOfStockVariants: number
  recentProducts: {
    id: string
    name: string
    slug: string
    updated_at: string
  }[]
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  await requireAdmin()
  const supabase = await createClient()

  // Dashboard metrics are fetched directly from the DB via RLS
  // Note: We use exact count and specific filters

  const [
    { count: activeProducts },
    { count: activeCategories },
    { count: activeVariants },
    { count: lowStockVariants },
    { count: outOfStockVariants },
    { data: recentProducts },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('categories').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('product_variants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('product_variants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .lt('stock_quantity', site.lowStockThreshold)
      .gt('stock_quantity', 0),
    supabase
      .from('product_variants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('stock_quantity', 0),
    supabase
      .from('products')
      .select('id, name, slug, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  return {
    activeProducts: activeProducts ?? 0,
    activeCategories: activeCategories ?? 0,
    activeVariants: activeVariants ?? 0,
    lowStockVariants: lowStockVariants ?? 0,
    outOfStockVariants: outOfStockVariants ?? 0,
    recentProducts: recentProducts ?? [],
  }
}
