import { createBrowserClient } from '@supabase/ssr'
import { getPublicSupabaseConfig } from '@/lib/supabase/config'
import type { Database } from '@/types/database'

/**
 * Browser Supabase client (anon key). Use inside Client Components only.
 * Reads/writes are gated by Row Level Security — this client can never see
 * order/payment data or perform admin mutations.
 */
export function createClient() {
  const { url, anonKey } = getPublicSupabaseConfig()
  return createBrowserClient<Database>(url, anonKey)
}
