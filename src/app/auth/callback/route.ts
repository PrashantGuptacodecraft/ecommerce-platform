import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureCustomerProfile } from '@/features/auth/server-customer'
import { getExistingCartSessionId, rotateCartSessionCookie } from '@/features/cart/cart-session.server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // 1. Validate internal next path
  let next = searchParams.get('next') ?? '/'
  
  // Reject absolute or protocol-relative URLs
  if (
    next.startsWith('http://') || 
    next.startsWith('https://') || 
    next.startsWith('//') || 
    !next.startsWith('/')
  ) {
    next = '/'
  }

  if (code) {
    const supabase = await createClient()
    
    // 3. Call exchangeCodeForSession
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      try {
        // 5. Call ensureCustomerProfile
        const customer = await ensureCustomerProfile()
        
        if (customer) {
          // 6. Merge the guest cart
          const guestSessionToken = await getExistingCartSessionId()
          
          if (guestSessionToken) {
            const adminClient = createAdminClient()
            const { data, error: mergeError } = await adminClient.rpc('merge_guest_cart_to_customer_atomic', {
              p_session_token: guestSessionToken,
              p_auth_user_id: customer.auth_user_id
            })

            if (mergeError) {
              console.error('Cart merge failed:', mergeError)
            } else if ((data as any)?.success) {
              // 7. Rotate the cart-session token
              // We need to fetch the customer's actual cart session token
              const { data: customerCart } = await adminClient
                .from('carts')
                .select('session_token')
                .eq('customer_id', customer.id)
                .single()

              if (customerCart?.session_token) {
                // Keep the customer's existing session token, or generate a new one?
                // The instruction says "generate a new random cart session token server-side"
                // "bind it to the authenticated customer cart"
                const newSessionToken = crypto.randomUUID()
                await adminClient
                  .from('carts')
                  .update({ session_token: newSessionToken })
                  .eq('customer_id', customer.id)
                
                // Update cookie
                await rotateCartSessionCookie(newSessionToken)
              }
            }
          }
        }
        
        // 8. Redirect to validated destination
        return NextResponse.redirect(`${origin}${next}`)
      } catch (e) {
        console.error('Error during callback processing:', e)
        // Fall through to error redirect
      }
    }
  }

  // On failure: redirect to safe login error state
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
