import 'server-only'
import { cookies } from 'next/headers'

const WISHLIST_SESSION_COOKIE = 'wishlist_session'

export async function getWishlistSessionId(): Promise<string> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(WISHLIST_SESSION_COOKIE)?.value

  if (sessionToken) {
    return sessionToken
  }

  // Create new session token
  const newToken = crypto.randomUUID()

  // Set cookie with required attributes
  cookieStore.set(WISHLIST_SESSION_COOKIE, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  return newToken
}

export async function getExistingWishlistSessionId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(WISHLIST_SESSION_COOKIE)?.value || null
}
