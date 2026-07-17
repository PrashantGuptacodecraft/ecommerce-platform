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
  if (!products || products.length < 4) {
    console.error('Not enough products found.')
    return
  }

  const updates = [
    {
      id: products[0].id,
      name: 'Embroidered White Cotton Tunic',
      short_description: 'A beautiful white tunic featuring pink floral embroidery.',
      slug: 'embroidered-white-cotton-tunic',
      image: 'local/1.png',
    },
    {
      id: products[1].id,
      name: 'Orange Mirror-Work Kurti',
      short_description: 'Vibrant orange kurti detailed with intricate mirror-work and tassels.',
      slug: 'orange-mirror-work-kurti',
      image: 'local/2.png',
    },
    {
      id: products[2].id,
      name: 'Mint Green Sheer Suit Set',
      short_description: 'An elegant mint green sheer suit set with delicate scalloped edges.',
      slug: 'mint-green-sheer-suit-set',
      image: 'local/3.png',
    },
    {
      id: products[3].id,
      name: 'Black Embellished Gown',
      short_description: 'A premium black embellished gown with sequin detailing for evening wear.',
      slug: 'black-embellished-gown',
      image: 'local/4.png',
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

  console.log('Successfully updated the first 4 products with client data and local image paths.')
}

main().catch(console.error)
