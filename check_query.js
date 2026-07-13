const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, slug, name, description, short_description, base_price_paise, compare_at_price_paise, ' +
        'fabric, care_instructions, fit_info, is_new_arrival, is_featured, seo_title, seo_description, size_chart, ' +
        'categories ( name, slug ), ' +
        'product_images ( id, storage_path, alt_text, sort_order, is_primary ), ' +
        'product_options ( id, name, sort_order, product_option_values ( id, value, sort_order ) ), ' +
        'product_variants ( id, sku, stock_quantity, price_adjustment_paise, is_active, image_id, ' +
        'variant_option_values ( option_value_id ) )',
    )
    .eq('is_active', true)

  if (error) console.error('Error:', error)
  else console.log('Products:', data)
}
run()
