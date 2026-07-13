'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveProductAction } from '@/features/admin/products/actions'
import { ProductBasicSection } from './ProductBasicSection'
import { ProductPricingSection } from './ProductPricingSection'
import { ProductDetailsSection } from './ProductDetailsSection'
import { ProductSEOSection } from './ProductSEOSection'
import { ProductStateSection } from './ProductStateSection'
import { VariantEditor } from './VariantEditor'
import { type OptionGroup } from './OptionGroupEditor'
import { type VariantNode } from './VariantCombinationList'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import { type ProductTreePayload } from '@/features/admin/validation/product'
import { ImageManager } from '@/features/admin/images/components/ImageManager'
import type { ProductImage } from '@/features/products/types'

type CategoryNode = { id: string; name: string }

export type ProductFormProps = {
  product?: ProductTreePayload['product'] & { id: string; updated_at: string }
  existingOptions?: any[]
  existingVariants?: any[]
  images?: ProductImage[]
  categories: CategoryNode[]
}

export function ProductForm({
  product,
  existingOptions,
  existingVariants,
  images,
  categories,
}: ProductFormProps) {
  const router = useRouter()
  const isNewProduct = !product

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // State logic
  const [formState, setFormState] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    category_id: product?.category_id || '',
    base_price_rupees: product?.base_price_paise ? (product.base_price_paise / 100).toFixed(2) : '',
    compare_at_price_rupees: product?.compare_at_price_paise
      ? (product.compare_at_price_paise / 100).toFixed(2)
      : '',
    short_description: product?.short_description || '',
    description: product?.description || '',
    fabric: product?.fabric || '',
    fit: product?.fit_info || '',
    care_instructions: product?.care_instructions || '',
    size_chart: product?.size_chart || '',
    seo_title: product?.seo_title || '',
    seo_description: product?.seo_description || '',
    is_featured: product?.is_featured || false,
    is_new_arrival: product?.is_new_arrival || false,
    is_active: product?.is_active || false,
  })

  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState(product?.updated_at)
  const [idempotencyKey, setIdempotencyKey] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [options, setOptions] = useState<OptionGroup[]>(existingOptions || [])
  const [variants, setVariants] = useState<VariantNode[]>(existingVariants || [])

  useUnsavedChanges(isDirty)

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID())
  }, [])

  const handleChange = (name: string, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [name]: value }))
    setIsDirty(true)
    setError(null)
  }

  const handleSave = () => {
    // Basic frontend validation
    if (
      !formState.name ||
      !formState.slug ||
      !formState.category_id ||
      !formState.base_price_rupees ||
      !formState.short_description
    ) {
      setError('Please fill out all required fields.')
      return
    }

    startTransition(async () => {
      setError(null)
      const base_price_paise = Math.round(parseFloat(formState.base_price_rupees) * 100)
      const compare_at_price_paise = formState.compare_at_price_rupees
        ? Math.round(parseFloat(formState.compare_at_price_rupees) * 100)
        : null

      // Enforce inactive on first save
      const is_active = isNewProduct ? false : formState.is_active

      const payload: ProductTreePayload = {
        product: {
          name: formState.name,
          slug: formState.slug,
          category_id: formState.category_id,
          short_description: formState.short_description || null,
          description: formState.description || null,
          base_price_paise,
          compare_at_price_paise,
          fabric: formState.fabric || null,
          fit_info: formState.fit || null,
          care_instructions: formState.care_instructions || null,
          size_chart: formState.size_chart || null,
          seo_title: formState.seo_title || null,
          seo_description: formState.seo_description || null,
          is_featured: formState.is_featured,
          is_new_arrival: formState.is_new_arrival,
          is_active,
        },
        options: options,
        variants: variants,
      }

      const result = await saveProductAction({
        productId: product?.id,
        expectedUpdatedAt,
        payloadVersion: 1,
        payload,
        idempotencyKey,
      })

      if (result.success) {
        setIsDirty(false) // clear dirty state before routing
        if (isNewProduct && result.productId) {
          router.push(`/admin/products/${result.productId}`)
        } else {
          setExpectedUpdatedAt(result.updatedAt)
          setIdempotencyKey(crypto.randomUUID()) // new key for new mutation
          alert('Product saved successfully.') // No fake success states, simple alert or toast
        }
      } else {
        setError(result.error || 'Failed to save product.')
      }
    })
  }

  return (
    <div className="max-w-4xl space-y-6 pb-24">
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md border border-red-200">{error}</div>
      )}

      {isNewProduct && (
        <div className="bg-blue-50 text-blue-800 p-4 rounded-md border border-blue-200 mb-6">
          Save the product first before adding variants or images.
        </div>
      )}

      <ProductBasicSection
        name={formState.name}
        slug={formState.slug}
        categoryId={formState.category_id}
        categories={categories}
        onChange={handleChange}
      />

      <ProductPricingSection
        basePriceRupees={formState.base_price_rupees}
        compareAtPriceRupees={formState.compare_at_price_rupees}
        onChange={handleChange}
      />

      <ProductDetailsSection
        shortDescription={formState.short_description}
        fullDescription={formState.description}
        fabric={formState.fabric}
        fit={formState.fit}
        careInstructions={formState.care_instructions}
        sizeChart={formState.size_chart}
        onChange={handleChange}
      />

      <ProductSEOSection
        seoTitle={formState.seo_title}
        seoDescription={formState.seo_description}
        onChange={handleChange}
      />

      <ProductStateSection
        isActive={formState.is_active}
        isFeatured={formState.is_featured}
        isNewArrival={formState.is_new_arrival}
        isNewProduct={isNewProduct}
        onChange={handleChange}
      />

      {!isNewProduct && (
        <div className="space-y-6">
          {/* Variants Section */}
          <div className="bg-white p-6 rounded-md shadow-sm border border-fog/50">
            <VariantEditor
              options={options}
              variants={variants}
              onChange={(newOpts, newVars) => {
                setOptions(newOpts)
                setVariants(newVars)
                setIsDirty(true)
                setError(null)
              }}
              disabled={isPending}
            />
          </div>

          {/* Images Section (Only for existing products) */}
          {product && (
            <div className="bg-white p-6 rounded-md shadow-sm border border-fog/50">
              <h2 className="text-lg font-semibold text-ink mb-4">Product Images</h2>
              <ImageManager 
                productId={product.id}
                initialImages={images || []}
                initialExpectedUpdatedAt={expectedUpdatedAt || ''}
                onUpdatedAtChange={(newDate) => setExpectedUpdatedAt(newDate)}
              />
            </div>
          )}
        </div>
      )}

      {/* Sticky Mobile Save Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg md:relative md:bg-transparent md:border-none md:shadow-none md:p-0 flex justify-end gap-3 z-50">
        <button
          onClick={() => {
            if (isDirty) {
              if (confirm('You have unsaved changes. Discard?')) {
                router.push('/admin/products')
              }
            } else {
              router.push('/admin/products')
            }
          }}
          disabled={isPending}
          className="bg-white border border-gray-300 text-ink px-6 min-h-[44px] flex items-center justify-center rounded-md font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 flex-1 md:flex-none"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-ink text-paper px-8 min-h-[44px] flex items-center justify-center rounded-md font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex-1 md:flex-none shadow-sm"
        >
          {isPending ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </div>
  )
}
