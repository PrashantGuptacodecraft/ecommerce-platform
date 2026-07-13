import 'server-only'
import { cookies } from 'next/headers'

const CART_SESSION_COOKIE = 'cart_session'

export async function getCartSessionId(): Promise<string> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(CART_SESSION_COOKIE)?.value

  if (sessionToken) {
    return sessionToken
  }

  // Create new session token
  const newToken = crypto.randomUUID()

  // Set cookie with required attributes
  cookieStore.set(CART_SESSION_COOKIE, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  return newToken
}

export async function getExistingCartSessionId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CART_SESSION_COOKIE)?.value || null
}
