'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Admin logout. Clears the Supabase session (removes the auth cookies) and
 * returns to the login page. Used as a `<form action={...}>` in the admin shell.
 */
export async function signOutAdmin(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
