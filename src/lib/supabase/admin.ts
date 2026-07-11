// The `server-only` import is a hard build-time guard: if this module is ever
// imported (even transitively) into a Client Component bundle, the build fails.
// The service-role key must NEVER reach the browser (docs/SECURITY_MODEL.md).
import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getPublicSupabaseConfig } from '@/lib/supabase/config'
import type { Database } from '@/types/database'

/**
 * Service-role Supabase client. **Bypasses Row Level Security** — every use is
 * responsible for re-checking authorization in TypeScript first (the primary
 * gate; RLS is defense in depth). Used by the order/payment/webhook/inventory
 * server layers and the seed/admin scripts. Never in a Client Component.
 */
export function createAdminClient() {
  const { url } = getPublicSupabaseConfig()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY')
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
