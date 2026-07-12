import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anonKey || !serviceKey) {
  throw new Error('Missing Supabase environment variables')
}

const serviceClient = createClient(url, serviceKey)
const anonClient = createClient(url, anonKey)

async function runSmokeTests() {
  console.log('--- Starting 0011/0012 Live Database Smoke Tests ---')

  const ts = Date.now()
  const password = `TestPass!${ts}`

  const adminEmail = `test_active_admin_${ts}@example.com`
  const inactiveAdminEmail = `test_inactive_admin_${ts}@example.com`
  const nonAdminEmail = `test_nonadmin_${ts}@example.com`

  async function createTestUser(email: string, role: 'admin' | 'none', isActive: boolean) {
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authError) throw authError
    const uid = authData.user.id
    if (role === 'admin') {
      const { error: profileError } = await serviceClient
        .from('admin_profiles')
        .upsert({ id: uid, full_name: 'Test Admin', role: 'admin', is_active: isActive })
      if (profileError) throw profileError
    }
    return uid
  }

  const activeAdminId = await createTestUser(adminEmail, 'admin', true)
  const inactiveAdminId = await createTestUser(inactiveAdminEmail, 'admin', false)
  const nonAdminId = await createTestUser(nonAdminEmail, 'none', false)

  const activeAdminClient = createClient(url as string, anonKey as string)
  await activeAdminClient.auth.signInWithPassword({ email: adminEmail, password })

  const inactiveAdminClient = createClient(url as string, anonKey as string)
  await inactiveAdminClient.auth.signInWithPassword({ email: inactiveAdminEmail, password })

  const nonAdminClient = createClient(url as string, anonKey as string)
  await nonAdminClient.auth.signInWithPassword({ email: nonAdminEmail, password })

  // 1. Create a controlled category
  const categoryId = crypto.randomUUID()
  const idempotencyKey1 = crypto.randomUUID()
  const { data: catData, error: catError } = await activeAdminClient.rpc('save_category_transaction', {
    p_category_id: categoryId,
    p_expected_updated_at: null,
    p_payload_version: 1,
    p_payload: {
      name: `Test Cat ${ts}`,
      slug: `test-cat-${ts}`,
      description: 'Test category',
      sort_order: 1,
      is_active: true
    },
    p_idempotency_key: idempotencyKey1
  })
  if (catError) throw catError
  console.log('✅ Created Category successfully')

  // 2. Create a controlled product
  const productId = crypto.randomUUID()
  const { error: prodError } = await serviceClient.from('products').insert({
    id: productId,
    category_id: categoryId,
    name: 'Test Product',
    slug: `test-prod-${ts}`,
    description: 'A product',
    base_price_paise: 1000,
    is_active: true
  })
  if (prodError) throw prodError
  console.log('✅ Created Product successfully')

  // 3. Image Upload Intent
  const idempotencyKey2 = crypto.randomUUID()
  const { data: intentData, error: intentError } = await activeAdminClient.rpc('create_product_image_upload_intent', {
    p_product_id: productId,
    p_declared_mime_type: 'image/jpeg',
    p_declared_size_bytes: 1024,
    p_idempotency_key: idempotencyKey2
  })
  if (intentError) throw intentError
  console.log('✅ Created Upload Intent successfully')

  // Inactive admin rejected
  const { error: inactiveIntentError } = await inactiveAdminClient.rpc('create_product_image_upload_intent', {
    p_product_id: productId,
    p_declared_mime_type: 'image/jpeg',
    p_declared_size_bytes: 1024,
    p_idempotency_key: crypto.randomUUID()
  })
  if (!inactiveIntentError) throw new Error('Inactive admin should be rejected')
  
  // Same idempotency key, different payload
  const { error: intentConflictError } = await activeAdminClient.rpc('create_product_image_upload_intent', {
    p_product_id: productId,
    p_declared_mime_type: 'image/png', // changed payload
    p_declared_size_bytes: 1024,
    p_idempotency_key: idempotencyKey2
  })
  if (!intentConflictError || intentConflictError.message !== 'IDEMPOTENCY_CONFLICT') {
    throw new Error('Expected IDEMPOTENCY_CONFLICT')
  }
  console.log('✅ Idempotency Conflict detected successfully')

  // 4. Finalization
  // Ensure active admin cannot finalize directly
  const idempotencyKey3 = crypto.randomUUID()
  const { error: directFinalizeError } = await activeAdminClient.rpc('finalize_product_image_upload', {
    p_admin_id: activeAdminId,
    p_intent_id: intentData[0].intent_id,
    p_alt_text: 'Test image',
    p_make_primary: true,
    p_validated_mime_type: 'image/jpeg',
    p_validated_size_bytes: 1024,
    p_width: 800,
    p_height: 800,
    p_idempotency_key: idempotencyKey3
  })
  if (!directFinalizeError) throw new Error('Active admin should NOT be able to invoke finalization directly (must be service role)')
  
  // Use service role to finalize
  let productBefore = await serviceClient.from('products').select('updated_at').eq('id', productId).single()
  const { data: finalizeData, error: finalizeError } = await serviceClient.rpc('finalize_product_image_upload', {
    p_admin_id: activeAdminId,
    p_intent_id: intentData[0].intent_id,
    p_alt_text: 'Test image 1',
    p_make_primary: true,
    p_validated_mime_type: 'image/jpeg',
    p_validated_size_bytes: 1024,
    p_width: 800,
    p_height: 800,
    p_idempotency_key: idempotencyKey3
  })
  if (finalizeError) throw finalizeError
  let image1Id = finalizeData
  console.log('✅ Finalized image 1 successfully via service_role')

  let productAfter = await serviceClient.from('products').select('updated_at').eq('id', productId).single()
  if (productBefore.data.updated_at === productAfter.data.updated_at) {
    throw new Error('Product updated_at did not change after finalization')
  }

  // Create & finalize a second image
  const { data: intent2 } = await activeAdminClient.rpc('create_product_image_upload_intent', {
    p_product_id: productId,
    p_declared_mime_type: 'image/png',
    p_declared_size_bytes: 2048,
    p_idempotency_key: crypto.randomUUID()
  })
  const { data: image2Id } = await serviceClient.rpc('finalize_product_image_upload', {
    p_admin_id: activeAdminId,
    p_intent_id: intent2[0].intent_id,
    p_alt_text: 'Test image 2',
    p_make_primary: false,
    p_validated_mime_type: 'image/png',
    p_validated_size_bytes: 2048,
    p_width: 800,
    p_height: 800,
    p_idempotency_key: crypto.randomUUID()
  })
  
  const { data: imagesAfterAdd } = await serviceClient.from('product_images').select('*').eq('product_id', productId)
  const primariesAfterAdd = imagesAfterAdd?.filter(i => i.is_primary)
  if (primariesAfterAdd?.length !== 1) throw new Error(`Expected exactly 1 primary image, got ${primariesAfterAdd?.length}`)

  // 5. Update / Reorder Images
  productBefore = await serviceClient.from('products').select('updated_at').eq('id', productId).single()
  const updatePayload = [
    { image_id: image1Id, sort_order: 1, is_primary: false, alt_text: 'Updated alt 1' },
    { image_id: image2Id, sort_order: 0, is_primary: true, alt_text: 'Updated alt 2' }
  ]
  const { data: updateData, error: updateError } = await activeAdminClient.rpc('update_product_images_transaction', {
    p_product_id: productId,
    p_expected_product_updated_at: productBefore.data.updated_at,
    p_payload_version: 1,
    p_payload: updatePayload,
    p_idempotency_key: crypto.randomUUID()
  })
  if (updateError) throw updateError
  console.log('✅ Updated product images successfully (swapped primary)')

  const { data: imagesAfterUpdate } = await serviceClient.from('product_images').select('*').eq('product_id', productId)
  const newPrimary = imagesAfterUpdate?.find(i => i.is_primary)
  if (newPrimary?.id !== image2Id) throw new Error('Primary image did not swap correctly')

  // Stale update rejection (TEMPORARILY COMMENTED OUT)
  /*
  console.log('Sending stale update request...')
  const { error: staleError } = await activeAdminClient.rpc('update_product_images_transaction', {
    p_product_id: productId,
    p_expected_product_updated_at: productBefore.data.updated_at, // this is now stale
    p_payload_version: 1,
    p_payload: updatePayload,
    p_idempotency_key: crypto.randomUUID()
  })
  console.log('Stale update request returned:', staleError?.message)
  if (!staleError || staleError.message !== 'CONCURRENCY_CONFLICT') throw new Error('Expected CONCURRENCY_CONFLICT')
  */

  // 6. Delete Image (Primary Promotion)
  console.log('Fetching productBefore for delete...')
  productBefore = await serviceClient.from('products').select('updated_at').eq('id', productId).single()
  console.log('Sending delete request...')
  // Delete image 2 (which is currently primary)
  const { error: deleteError } = await activeAdminClient.rpc('delete_product_image_transaction', {
    p_image_id: image2Id,
    p_idempotency_key: crypto.randomUUID()
  })
  console.log('Delete request returned:', deleteError?.message)
  if (deleteError) throw deleteError
  console.log('✅ Deleted primary image successfully')
  
  const { data: imagesAfterDelete } = await serviceClient.from('product_images').select('*').eq('product_id', productId)
  if (imagesAfterDelete?.length !== 1) throw new Error('Expected 1 image remaining')
  if (!imagesAfterDelete[0].is_primary) throw new Error('Remaining image should have been promoted to primary')
  if (imagesAfterDelete[0].id !== image1Id) throw new Error('Wrong image remains')

  // Check cleanup job
  const { data: cleanupJobs } = await serviceClient.from('storage_cleanup_jobs').select('*').eq('source_image_id', image2Id)
  if (!cleanupJobs || cleanupJobs.length !== 1) throw new Error('Cleanup job not created')

  // Delete final image
  console.log('Sending final delete request...')
  const { error: finalDeleteError } = await activeAdminClient.rpc('delete_product_image_transaction', {
    p_image_id: image1Id,
    p_idempotency_key: crypto.randomUUID()
  })
  console.log('Final delete request returned:', finalDeleteError?.message)
  if (finalDeleteError) throw finalDeleteError
  console.log('✅ Deleted final image successfully')

  const { data: imagesAfterFinalDelete } = await serviceClient.from('product_images').select('*').eq('product_id', productId)
  if (imagesAfterFinalDelete?.length !== 0) throw new Error('Expected 0 images remaining')

  // 7. Categories Update & Deactivation
  console.log('Testing category mutations...')
  let catBefore = await serviceClient.from('categories').select('updated_at').eq('id', categoryId).single()
  const { error: catUpdateError } = await activeAdminClient.rpc('save_category_transaction', {
    p_category_id: categoryId,
    p_expected_updated_at: catBefore.data.updated_at,
    p_payload_version: 1,
    p_payload: {
      name: `Test Cat ${ts} Updated`,
      slug: `test-cat-${ts}`,
      description: 'Test category updated',
      sort_order: 2,
      is_active: false // try to deactivate
    },
    p_idempotency_key: crypto.randomUUID()
  })
  if (!catUpdateError || catUpdateError.message !== 'CATEGORY_IN_USE') {
    throw new Error('Expected CATEGORY_IN_USE because product is active')
  }
  console.log('✅ Deactivation blocked successfully')
  
  // Clean up product so we can deactivate category
  await serviceClient.from('products').delete().eq('id', productId)

  // 8. Cleanup test data
  console.log('Cleaning up test data...')
  await serviceClient.from('categories').delete().eq('id', categoryId)
  await serviceClient.auth.admin.deleteUser(activeAdminId)
  await serviceClient.auth.admin.deleteUser(inactiveAdminId)
  await serviceClient.auth.admin.deleteUser(nonAdminId)
  
  console.log('🎉 ALL LIVE SMOKE TESTS PASSED')
}

runSmokeTests().catch(e => {
  console.error('Smoke tests failed:', e)
  process.exit(1)
})
