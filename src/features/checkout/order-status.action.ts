'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function checkOrderStatusAction(orderNumber: string): Promise<{ status: string }> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('orders')
    .select('status')
    .eq('order_number', orderNumber)
    .single()

  return { status: data?.status ?? 'PENDING_PAYMENT' }
}
