import { z } from 'zod'
import { site } from '@/config/site'

export const imageUploadIntentSchema = z.object({
  productId: z.string().uuid(),
  mimeType: z
    .string()
    .refine((val) => site.upload.acceptedImageTypes.includes(val as any), 'Unsupported file type'),
  sizeBytes: z.number().int().max(site.upload.maxBytes, 'File size exceeds maximum allowed'),
})

export type ImageUploadIntentValues = z.infer<typeof imageUploadIntentSchema>

export const imageUpdatePayloadSchema = z.array(
  z.object({
    image_id: z.string().uuid(),
    sort_order: z.number().int(),
    is_primary: z.boolean(),
    alt_text: z.string().trim().max(255).optional().nullable(),
  }),
)
