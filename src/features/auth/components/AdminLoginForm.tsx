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

/**
 * Secure admin login form (client). Validated with the shared Zod schema
 * (client + server). Errors are generic; the form disables on submit. Session
 * establishment is wired in Milestone 10 — see `signInAdmin`.
 */
export function AdminLoginForm() {
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
    const result = await signInAdmin(values)
    if (!result.ok) {
      setFormError(result.error)
    }
    // On success (Milestone 10): redirect to the allow-listed `next` path.
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
