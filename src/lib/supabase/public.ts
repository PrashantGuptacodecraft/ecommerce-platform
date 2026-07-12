import { createServerClient } from '@supabase/ssr'
import { getPublicSupabaseConfig } from '@/lib/supabase/config'
import type { Database } from '@/types/database'

/**
 * Cookie-free Supabase client for public catalogue reads (SSG/ISR).
 * Uses the anon key but does not read/write cookies. This allows Next.js
 * to statically generate pages without opting into dynamic rendering.
 * RLS still applies, treating all queries as strictly anonymous.
 */
export function createPublicClient() {
  const { url, anonKey } = getPublicSupabaseConfig()

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  })
}
