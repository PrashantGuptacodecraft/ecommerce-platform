'use server'

import { createClient } from '@/lib/supabase/server'
import { clearCartSessionCookie } from '@/features/cart/cart-session.server'

export async function logoutAction() {
  const supabase = await createClient()
  
  // Sign out from Supabase
  await supabase.auth.signOut()
  
  // Clear the customer's cart session cookie to securely isolate them
  await clearCartSessionCookie()
  
  return { success: true }
}
