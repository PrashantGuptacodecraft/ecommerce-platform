'use client'

import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adminLoginSchema, type AdminLoginInput } from '@/lib/validation/auth'
import { signInAdmin } from '@/features/auth/actions/sign-in'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FormError } from '@/components/ui/FormError'

type AdminLoginFormProps = {
  /** Validated server-side before use; safe fallback applied there. */
  next?: string
}

/**
 * Functional admin login form. Client-side validation mirrors the server Zod
 * schema; on success the server action establishes the session and redirects.
 * All server errors are generic (no account enumeration).
 */
export function AdminLoginForm({ next }: AdminLoginFormProps) {
  const emailId = useId()
  const passwordId = useId()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    // On success this redirects server-side and never returns a value.
    const result = await signInAdmin({ ...values, next })
    if (result?.ok === false) {
      setFormError(result.error)
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor={emailId} required>
          Email
        </Label>
        <Input
          id={emailId}
          type="email"
          autoComplete="email"
          invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${emailId}-error` : undefined}
          {...register('email')}
        />
        <FormError id={`${emailId}-error`}>{errors.email?.message}</FormError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={passwordId} required>
          Password
        </Label>
        <Input
          id={passwordId}
          type="password"
          autoComplete="current-password"
          invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? `${passwordId}-error` : undefined}
          {...register('password')}
        />
        <FormError id={`${passwordId}-error`}>{errors.password?.message}</FormError>
      </div>

      {formError ? <FormError>{formError}</FormError> : null}

      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Sign in
      </Button>
    </form>
  )
}
