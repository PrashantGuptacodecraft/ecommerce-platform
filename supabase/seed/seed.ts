/**
 * Seed script — populates a fresh Supabase project with default store settings,
 * categories, and a realistic (<= 20) set of products with size/colour variants.
 *
 *   npm run seed
 *
 * Uses the service-role key (bypasses RLS) and is idempotent: re-running upserts
 * on natural keys (slug / sku / composite) rather than duplicating rows. It is a
 * standalone Node program (run via tsx), so it builds its own Supabase client
 * instead of importing src/lib/supabase/admin.ts (whose `server-only` guard is
 * for the Next.js bundle, not CLI scripts).
 *
 * Placeholder brand/pricing values are recorded in docs/DECISIONS.md.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import type { Database } from '../../src/types/database'

loadEnv({ path: '.env.local' })

type Db = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const STORE_SETTINGS: {
  key: string
  value: Database['public']['Tables']['store_settings']['Row']['value']
}[] = [
  // ₹79 flat shipping, free over ₹1,999. Placeholder — admin-editable later.
  { key: 'shipping', value: { flat_rate_paise: 7900, free_shipping_threshold_paise: 199900 } },
  { key: 'cod', value: { enabled: true } },
  { key: 'shipping_provider', value: { active: 'manual' } },
  {
    key: 'contact',
    value: {
      email: 'hello@studionoir.example',
      phone: '+91 00000 00000',
      whatsapp: '+910000000000',
      address: 'India',
    },
  },
]

const CATEGORIES = [
  { slug: 'shirts', name: 'Shirts', sort_order: 0 },
  { slug: 't-shirts', name: 'T-Shirts', sort_order: 1 },
  { slug: 'trousers', name: 'Trousers', sort_order: 2 },
  { slug: 'outerwear', name: 'Outerwear', sort_order: 3 },
]

type SeedProduct = {
  slug: string
  name: string
  category: string
  base_price_paise: number
  compare_at_price_paise?: number
  short_description: string
  description: string
  fabric: string
  care_instructions: string
  fit_info: string
  is_featured?: boolean
  is_new_arrival?: boolean
  sizes: string[]
  colours: string[]
  stockPerVariant: number
}

const SIZES = ['S', 'M', 'L', 'XL']

const PRODUCTS: SeedProduct[] = [
  {
    slug: 'noir-oxford-shirt',
    name: 'Noir Oxford Shirt',
    category: 'shirts',
    base_price_paise: 189900,
    compare_at_price_paise: 229900,
    short_description: 'A crisp everyday oxford in a considered cut.',
    description:
      'Our signature oxford shirt in a mid-weight cotton. Cut for a clean, modern silhouette that layers easily.',
    fabric: '100% combed cotton oxford, 140 GSM',
    care_instructions: 'Machine wash cold, line dry, warm iron.',
    fit_info: 'Regular fit. Model is 6ft and wears size M.',
    is_featured: true,
    is_new_arrival: true,
    sizes: SIZES,
    colours: ['White', 'Sky Blue'],
    stockPerVariant: 25,
  },
  {
    slug: 'linen-band-collar-shirt',
    name: 'Linen Band-Collar Shirt',
    category: 'shirts',
    base_price_paise: 219900,
    short_description: 'Breathable linen with a relaxed band collar.',
    description:
      'A warm-weather essential in pure European linen with a soft band collar and shell buttons.',
    fabric: '100% linen, 165 GSM',
    care_instructions: 'Gentle machine wash cold, dry flat, cool iron.',
    fit_info: 'Relaxed fit.',
    is_new_arrival: true,
    sizes: SIZES,
    colours: ['Ecru', 'Charcoal'],
    stockPerVariant: 18,
  },
  {
    slug: 'essential-crew-tee',
    name: 'Essential Crew Tee',
    category: 't-shirts',
    base_price_paise: 89900,
    short_description: 'A heavyweight crew tee that holds its shape.',
    description:
      'The everyday tee, upgraded — a heavyweight combed cotton with a structured crew neckline.',
    fabric: '100% combed cotton, 220 GSM',
    care_instructions: 'Machine wash cold, tumble dry low.',
    fit_info: 'Classic fit.',
    is_featured: true,
    sizes: SIZES,
    colours: ['Black', 'White', 'Sage'],
    stockPerVariant: 40,
  },
  {
    slug: 'boxy-pocket-tee',
    name: 'Boxy Pocket Tee',
    category: 't-shirts',
    base_price_paise: 99900,
    short_description: 'A boxy, drop-shoulder tee with a chest pocket.',
    description: 'Relaxed through the body with a dropped shoulder and a clean patch pocket.',
    fabric: '100% organic cotton, 210 GSM',
    care_instructions: 'Machine wash cold, line dry.',
    fit_info: 'Boxy fit. Size down for a classic fit.',
    is_new_arrival: true,
    sizes: SIZES,
    colours: ['Stone', 'Navy'],
    stockPerVariant: 30,
  },
  {
    slug: 'tapered-chino-trouser',
    name: 'Tapered Chino Trouser',
    category: 'trousers',
    base_price_paise: 249900,
    compare_at_price_paise: 299900,
    short_description: 'A refined chino with a modern taper.',
    description:
      'A versatile chino in stretch-cotton twill, tapered from the knee for a sharp line.',
    fabric: '98% cotton, 2% elastane twill',
    care_instructions: 'Machine wash cold, warm iron.',
    fit_info: 'Slim-tapered fit.',
    is_featured: true,
    sizes: SIZES,
    colours: ['Stone', 'Olive'],
    stockPerVariant: 22,
  },
  {
    slug: 'pleated-wide-trouser',
    name: 'Pleated Wide Trouser',
    category: 'trousers',
    base_price_paise: 289900,
    short_description: 'A single-pleat trouser with a relaxed leg.',
    description: 'An elevated trouser with a single forward pleat and a fluid, wide leg.',
    fabric: '100% viscose-blend suiting',
    care_instructions: 'Dry clean recommended.',
    fit_info: 'Relaxed, wide leg.',
    is_new_arrival: true,
    sizes: SIZES,
    colours: ['Charcoal', 'Taupe'],
    stockPerVariant: 15,
  },
  {
    slug: 'unstructured-overshirt',
    name: 'Unstructured Overshirt',
    category: 'outerwear',
    base_price_paise: 329900,
    short_description: 'A shirt-jacket that bridges seasons.',
    description:
      'A lightweight, unstructured overshirt in brushed cotton — a shacket built for layering.',
    fabric: '100% brushed cotton, 260 GSM',
    care_instructions: 'Machine wash cold, line dry.',
    fit_info: 'Regular fit, designed to layer.',
    is_featured: true,
    is_new_arrival: true,
    sizes: SIZES,
    colours: ['Ecru', 'Forest'],
    stockPerVariant: 12,
  },
  {
    slug: 'quilted-liner-jacket',
    name: 'Quilted Liner Jacket',
    category: 'outerwear',
    base_price_paise: 419900,
    compare_at_price_paise: 479900,
    short_description: 'A lightweight quilted liner for cool evenings.',
    description: 'A packable quilted liner jacket with a soft collar — wear alone or under a coat.',
    fabric: 'Recycled polyester shell + fill',
    care_instructions: 'Machine wash cold, do not tumble dry.',
    fit_info: 'Regular fit.',
    sizes: SIZES,
    colours: ['Black', 'Sand'],
    stockPerVariant: 10,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Set it in .env.local.`)
  }
  return value
}

function skuFor(productSlug: string, size: string, colour: string): string {
  const base = productSlug.toUpperCase().replace(/[^A-Z0-9]+/g, '-')
  const colourCode = colour
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 3)
  return `${base}-${size}-${colourCode}`
}

async function seedStoreSettings(db: Db): Promise<void> {
  const { error } = await db.from('store_settings').upsert(
    STORE_SETTINGS.map((s) => ({ key: s.key, value: s.value })),
    { onConflict: 'key' },
  )
  if (error) throw new Error(`store_settings: ${error.message}`)
  console.log(`  ✓ store_settings (${STORE_SETTINGS.length} keys)`)
}

async function seedCategories(db: Db): Promise<Map<string, string>> {
  const { data, error } = await db
    .from('categories')
    .upsert(
      CATEGORIES.map((c) => ({
        slug: c.slug,
        name: c.name,
        sort_order: c.sort_order,
        is_active: true,
      })),
      { onConflict: 'slug' },
    )
    .select('id, slug')
  if (error) throw new Error(`categories: ${error.message}`)

  const bySlug = new Map<string, string>()
  for (const row of data ?? []) {
    bySlug.set(row.slug, row.id)
  }
  console.log(`  ✓ categories (${bySlug.size})`)
  return bySlug
}

async function upsertOption(
  db: Db,
  productId: string,
  name: string,
  sortOrder: number,
): Promise<string> {
  const { data, error } = await db
    .from('product_options')
    .upsert(
      { product_id: productId, name, sort_order: sortOrder },
      { onConflict: 'product_id,name' },
    )
    .select('id')
    .single()
  if (error || !data) throw new Error(`product_options(${name}): ${error?.message ?? 'no row'}`)
  return data.id
}

async function upsertOptionValue(
  db: Db,
  optionId: string,
  value: string,
  sortOrder: number,
): Promise<string> {
  const { data, error } = await db
    .from('product_option_values')
    .upsert(
      { product_option_id: optionId, value, sort_order: sortOrder },
      { onConflict: 'product_option_id,value' },
    )
    .select('id')
    .single()
  if (error || !data)
    throw new Error(`product_option_values(${value}): ${error?.message ?? 'no row'}`)
  return data.id
}

async function seedProduct(db: Db, product: SeedProduct, categoryId: string): Promise<void> {
  const { data: productRow, error: productErr } = await db
    .from('products')
    .upsert(
      {
        slug: product.slug,
        name: product.name,
        category_id: categoryId,
        base_price_paise: product.base_price_paise,
        compare_at_price_paise: product.compare_at_price_paise ?? null,
        short_description: product.short_description,
        description: product.description,
        fabric: product.fabric,
        care_instructions: product.care_instructions,
        fit_info: product.fit_info,
        is_active: true,
        is_featured: product.is_featured ?? false,
        is_new_arrival: product.is_new_arrival ?? false,
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single()
  if (productErr || !productRow) {
    throw new Error(`products(${product.slug}): ${productErr?.message ?? 'no row'}`)
  }
  const productId = productRow.id

  // Options + values.
  const sizeOptionId = await upsertOption(db, productId, 'Size', 0)
  const colourOptionId = await upsertOption(db, productId, 'Colour', 1)

  const sizeValueIds = new Map<string, string>()
  for (const [i, size] of product.sizes.entries()) {
    sizeValueIds.set(size, await upsertOptionValue(db, sizeOptionId, size, i))
  }
  const colourValueIds = new Map<string, string>()
  for (const [i, colour] of product.colours.entries()) {
    colourValueIds.set(colour, await upsertOptionValue(db, colourOptionId, colour, i))
  }

  // Variants = sizes × colours.
  let variantCount = 0
  for (const size of product.sizes) {
    for (const colour of product.colours) {
      const sku = skuFor(product.slug, size, colour)
      const { data: variantRow, error: variantErr } = await db
        .from('product_variants')
        .upsert(
          { product_id: productId, sku, stock_quantity: product.stockPerVariant, is_active: true },
          { onConflict: 'sku' },
        )
        .select('id')
        .single()
      if (variantErr || !variantRow) {
        throw new Error(`product_variants(${sku}): ${variantErr?.message ?? 'no row'}`)
      }

      const sizeValueId = sizeValueIds.get(size)
      const colourValueId = colourValueIds.get(colour)
      if (!sizeValueId || !colourValueId) {
        throw new Error(`missing option value ids for ${sku}`)
      }

      const { error: linkErr } = await db.from('variant_option_values').upsert(
        [
          { variant_id: variantRow.id, option_value_id: sizeValueId },
          { variant_id: variantRow.id, option_value_id: colourValueId },
        ],
        { onConflict: 'variant_id,option_value_id', ignoreDuplicates: true },
      )
      if (linkErr) throw new Error(`variant_option_values(${sku}): ${linkErr.message}`)
      variantCount += 1
    }
  }
  console.log(`  ✓ ${product.slug} (${variantCount} variants)`)
}

async function main(): Promise<void> {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

  if (PRODUCTS.length > 20) {
    throw new Error(`Seed exceeds the Phase 1 cap of 20 products (got ${PRODUCTS.length}).`)
  }

  const db: Db = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  console.log('Seeding Supabase…')
  await seedStoreSettings(db)
  const categoriesBySlug = await seedCategories(db)

  for (const product of PRODUCTS) {
    const categoryId = categoriesBySlug.get(product.category)
    if (!categoryId) throw new Error(`Unknown category '${product.category}' for ${product.slug}`)
    await seedProduct(db, product, categoryId)
  }

  console.log(
    `Done. Seeded ${PRODUCTS.length} products across ${categoriesBySlug.size} categories.`,
  )
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`Seed failed: ${message}`)
  process.exit(1)
})
