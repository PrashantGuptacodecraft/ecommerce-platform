import { z } from 'zod'

/**
 * Admin login input schema. The 12-character minimum mirrors the password
 * policy in docs/SECURITY_MODEL.md §1 and is enforced on both client and
 * server (this schema is used in both places).
 */
export const adminLoginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
})

export type AdminLoginInput = z.infer<typeof adminLoginSchema>
