import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface CustomerProfile {
  id: string
  auth_user_id: string
  email: string | null
  full_name: string | null
  phone: string | null
  created_at: string
}

export interface CustomerAuthResult {
  user: { id: string; email?: string }
  customer: CustomerProfile
}

/**
 * Idempotently ensures a customer profile exists for the authenticated user.
 * Called during OAuth callback and as a defensive fallback.
 */
export async function ensureCustomerProfile(): Promise<CustomerProfile | null> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  // We use the admin client (service_role) to bypass RLS for the initial lookup/creation,
  // guaranteeing the profile is created securely.
  const adminClient = createAdminClient()

  // 1. Check if profile already exists
  const { data: existingCustomer, error: existingError } = await adminClient
    .from('customers')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (existingCustomer) {
    // If it exists, returning it is sufficient to be idempotent.
    return existingCustomer as CustomerProfile
  }

  // 2. If it does not exist, insert it securely
  const email = user.email || null
  const fullName = user.user_metadata?.full_name || null

  const { data: newCustomer, error: insertError } = await adminClient
    .from('customers')
    .insert({
      auth_user_id: user.id,
      email: email,
      full_name: fullName,
    })
    .select('*')
    .single()

  if (insertError) {
    console.error('Failed to ensure customer profile:', insertError)
    throw new Error('Failed to create customer profile')
  }

  return newCustomer as CustomerProfile
}

/**
 * Authorization boundary for Customer-only Server Actions and Routes.
 * Returns the verified auth user and their corresponding customer profile.
 * Throws if not authenticated or profile is missing.
 */
export async function requireCustomer(): Promise<CustomerAuthResult> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('UNAUTHORIZED')
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (customerError || !customer) {
    // Defensive fallback: If the profile is missing (e.g. manual insertion missed),
    // ensure it now.
    const newCustomer = await ensureCustomerProfile()
    if (!newCustomer) {
      throw new Error('CUSTOMER_PROFILE_MISSING')
    }
    return {
      user: { id: user.id, email: user.email },
      customer: newCustomer,
    }
  }

  return {
    user: { id: user.id, email: user.email },
    customer: customer as CustomerProfile,
  }
}
