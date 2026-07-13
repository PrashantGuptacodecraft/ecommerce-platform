import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/security/auth'
import { getAdminProductDetail } from '@/features/admin/products/queries'
import { getAdminCategories } from '@/features/admin/categories/queries'
import { ProductForm } from '@/features/admin/products/components/ProductForm'
import Link from 'next/link'

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const params = await props.params

  try {
    const productDetail = await getAdminProductDetail(params.id)
    if (!productDetail) notFound()

    const { categories } = await getAdminCategories({ search: '', page: 1 })
    const mappedCategories = categories.map((c) => ({ id: c.id, name: c.name }))

    // Format options for the payload schema
    const formattedOptions = (productDetail.product_options || []).map((opt: any) => ({
      id: opt.id,
      name: opt.name,
      sortOrder: opt.sort_order,
      values: (opt.product_option_values || []).map((val: any) => ({
        id: val.id,
        value: val.value,
        sortOrder: val.sort_order,
      })),
    }))

    // Format variants for the payload schema
    const formattedVariants = (productDetail.product_variants || []).map((v: any) => ({
      id: v.id,
      sku: v.sku,
      priceAdjustmentPaise: v.price_adjustment_paise,
      stockQuantity: v.stock_quantity,
      isActive: v.is_active,
      optionValueIds: (v.variant_option_values || []).map((vov: any) => vov.option_value_id),
      imageId: v.image_id,
    }))

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/products"
            className="text-gray-500 hover:text-ink transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-md"
          >
            &larr; Back
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
        </div>

        <ProductForm
          product={productDetail}
          existingOptions={formattedOptions}
          existingVariants={formattedVariants}
          categories={mappedCategories}
        />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
