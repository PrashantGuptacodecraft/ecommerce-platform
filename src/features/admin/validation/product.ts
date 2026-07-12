import { z } from 'zod'

export const productBasicSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(150, 'Name is too long'),
    slug: z
      .string()
      .trim()
      .min(1, 'Slug is required')
      .max(150, 'Slug is too long')
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
    short_description: z
      .string()
      .trim()
      .max(300, 'Short description is too long')
      .optional()
      .nullable(),
    description: z.string().trim().max(5000, 'Description is too long').optional().nullable(),
    category_id: z.string().uuid('Invalid category ID'),

    base_price_paise: z
      .number()
      .int('Price must be an integer (paise)')
      .min(0, 'Price cannot be negative'),
    compare_at_price_paise: z
      .number()
      .int('Price must be an integer (paise)')
      .min(0, 'Price cannot be negative')
      .optional()
      .nullable(),

    fabric: z.string().trim().max(255).optional().nullable(),
    fit_info: z.string().trim().max(255).optional().nullable(),
    care_instructions: z.string().trim().max(500).optional().nullable(),
    size_chart: z.any().optional().nullable(), // Passed as JSONB

    seo_title: z.string().trim().max(100).optional().nullable(),
    seo_description: z.string().trim().max(255).optional().nullable(),

    is_featured: z.boolean().default(false),
    is_new_arrival: z.boolean().default(false),
    is_active: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.compare_at_price_paise !== null && data.compare_at_price_paise !== undefined) {
        return data.compare_at_price_paise > data.base_price_paise
      }
      return true
    },
    {
      message: 'Compare at price must be greater than base price',
      path: ['compare_at_price_paise'],
    },
  )

export type ProductBasicFormValues = z.infer<typeof productBasicSchema>

export const optionValueSchema = z.object({
  id: z.string().uuid(),
  value: z.string().trim().min(1).max(50),
  sortOrder: z.number().int().default(0),
})

export const optionGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(50),
  sortOrder: z.number().int().default(0),
  values: z.array(optionValueSchema).min(1, 'At least one value is required'),
})

export const variantSchema = z.object({
  id: z.string().uuid(),
  sku: z.string().trim().min(1, 'SKU is required').max(100, 'SKU is too long'),
  priceAdjustmentPaise: z.number().int().default(0),
  stockQuantity: z.number().int().min(0).default(0), // Only used during creation, ignored on update
  isActive: z.boolean().default(true),
  optionValueIds: z.array(z.string().uuid()),
  imageId: z.string().uuid().optional().nullable(),
})

export const productTreePayloadSchema = z.object({
  product: productBasicSchema,
  options: z.array(optionGroupSchema).max(3, 'Maximum 3 options allowed'),
  variants: z.array(variantSchema).max(100, 'Maximum 100 variants allowed'),
})

export type ProductTreePayload = z.infer<typeof productTreePayloadSchema>
