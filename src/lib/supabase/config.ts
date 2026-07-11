/**
 * Public (non-secret) Supabase connection values, validated lazily.
 *
 * These are the anon-key connection details, safe for both the browser and the
 * server. The service-role key is NOT here — it lives only in `admin.ts`
 * (server-only). Env vars are referenced by their full literal name so Next.js
 * can inline the `NEXT_PUBLIC_*` values at build time.
 */
export type PublicSupabaseConfig = {
  url: string
  anonKey: string
}

export function getPublicSupabaseConfig(): PublicSupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!anonKey) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return { url, anonKey }
}
