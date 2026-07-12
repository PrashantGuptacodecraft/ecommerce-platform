import { z } from 'zod'

export const adjustStockSchema = z.object({
  variant_id: z.string().uuid(),
  change_quantity: z
    .number()
    .int()
    .refine((val) => val !== 0, 'Quantity change cannot be 0'),
  note: z.string().trim().min(1, 'A note is required').max(200, 'Note is too long'),
  idempotency_key: z.string().uuid(),
})

export type AdjustStockFormValues = z.infer<typeof adjustStockSchema>
