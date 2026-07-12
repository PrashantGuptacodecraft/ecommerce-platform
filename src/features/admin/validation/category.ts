import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(100, 'Slug is too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().trim().max(500, 'Description is too long').optional().nullable(),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(false),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
