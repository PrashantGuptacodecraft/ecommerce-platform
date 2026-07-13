import { z } from 'zod'

export const addCartItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  idempotencyKey: z.string().uuid().optional(),
})

export const updateCartItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  idempotencyKey: z.string().uuid().optional(),
})

export const removeCartItemSchema = z.object({
  variantId: z.string().uuid(),
})
