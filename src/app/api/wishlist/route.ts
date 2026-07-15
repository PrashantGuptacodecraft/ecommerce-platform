import { NextResponse } from 'next/server'
import { getWishlistProductIds } from '@/features/wishlist/queries'

export async function GET() {
  const ids = await getWishlistProductIds()
  return NextResponse.json({ ids })
}
