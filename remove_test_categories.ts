import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const db = createClient(url, key, { auth: { persistSession: false } })

async function main() {
  const { data: categories, error } = await db.from('categories').select('*')
  
  if (error) {
    console.error('Error fetching categories:', error)
    return
  }

  // Find categories with "test" or "e2e" in the name or slug
  const testCategories = categories.filter(c => 
    c.name.toLowerCase().includes('test') || 
    c.slug.toLowerCase().includes('test') ||
    c.name.toLowerCase().includes('e2e') ||
    c.slug.toLowerCase().includes('e2e')
  )
  
  console.log('\n--- TEST CATEGORIES TO DEACTIVATE ---')
  if (testCategories.length === 0) {
    console.log('No test categories found.')
    return
  }
  
  testCategories.forEach(c => console.log(`- ${c.name} (ID: ${c.id})`))
  
  const idsToDeactivate = testCategories.map(c => c.id)
  
  // Deactivate the categories instead of deleting them to avoid foreign key constraint errors
  const { error: updateErr } = await db
    .from('categories')
    .update({ is_active: false })
    .in('id', idsToDeactivate)
  
  if (updateErr) {
    console.error('Failed to deactivate test categories:', updateErr)
  } else {
    console.log(`\nSuccessfully deactivated ${idsToDeactivate.length} test categories. They will no longer appear on the site.`)
  }
}

main().catch(console.error)
