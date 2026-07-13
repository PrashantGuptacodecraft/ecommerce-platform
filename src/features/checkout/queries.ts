import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getShippingSettings() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('public_store_settings')
    .select('value')
    .eq('key', 'shipping')
    .single()

  if (!data || !data.value) return { flatRatePaise: 0, freeThresholdPaise: 0 }

  const value = data.value as { flat_rate_paise?: number; free_shipping_threshold_paise?: number }
  return {
    flatRatePaise: value.flat_rate_paise || 0,
    freeThresholdPaise: value.free_shipping_threshold_paise || 0,
  }
}
