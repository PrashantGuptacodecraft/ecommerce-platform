import { z } from 'zod'

export const checkoutFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().min(10, 'Phone must be at least 10 digits'),
  addressLine1: z.string().trim().min(5, 'Address is too short'),
  addressLine2: z.string().trim().optional(),
  landmark: z.string().trim().optional(),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State is required'),
  postalCode: z.string().trim().min(6, 'Valid postal code is required'),
  notes: z.string().trim().optional(),
  paymentMethod: z.enum(['cod', 'razorpay']),
  idempotencyKey: z.string().uuid(),
  payloadHash: z.string().min(1),
  expectedTotalPaise: z.coerce.number().min(1),
})

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>
