import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const db = createClient(url, key, { auth: { persistSession: false } })

async function main() {
  // Get all active products
  const { data: products, error: getErr } = await db
    .from('products')
    .select('id, slug')
    .order('created_at', { ascending: true })

  if (getErr) throw getErr
  if (!products || products.length < 7) {
    console.error('Not enough products found.')
    return
  }

  const updates = [
    {
      id: products[4].id, // Product 5
      name: 'Pink Embroidered Lehenga Set',
      short_description: 'Stunning bright pink lehenga with intricate gold and silver embroidery.',
      slug: 'pink-embroidered-lehenga-set',
      image: 'local/5.png',
    },
    {
      id: products[5].id, // Product 6
      name: 'Lavender Embellished Suit',
      short_description: 'Beautiful lavender sleeveless suit featuring delicate floral beadwork.',
      slug: 'lavender-embellished-suit',
      image: 'local/6.png',
    },
    {
      id: products[6].id, // Product 7
      name: 'Reddish-Brown Unstructured Overshirt',
      short_description: 'A structured yet comfortable overshirt jacket with patch pockets.',
      slug: 'reddish-brown-unstructured-overshirt',
      image: 'local/7.png',
    },
  ]

  for (const update of updates) {
    // 1. Update product details
    const { error: updErr } = await db
      .from('products')
      .update({
        name: update.name,
        short_description: update.short_description,
        slug: update.slug,
      })
      .eq('id', update.id)
    if (updErr) console.error('Failed to update product', update.id, updErr)

    // 2. Clear existing images
    await db.from('product_images').delete().eq('product_id', update.id)

    // 3. Add new local image
    const { error: imgErr } = await db.from('product_images').insert({
      product_id: update.id,
      storage_path: update.image,
      is_primary: true,
      sort_order: 0,
      alt_text: update.name,
    })
    if (imgErr) console.error('Failed to insert image', update.id, imgErr)
  }

  console.log('Successfully updated products 5, 6, and 7 with new details and local image paths.')
}

main().catch(console.error)
