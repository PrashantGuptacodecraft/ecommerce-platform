'use client'

import { Input, Label } from '@/components/ui'

interface Props {
  errors?: Record<string, string[]>
  defaultValues?: Record<string, string>
}

export function CheckoutAddressFields({ errors, defaultValues }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" required aria-invalid={!!errors?.name} defaultValue={defaultValues?.name} />
        {errors?.name && <p className="text-sm text-red-500">{errors.name[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required aria-invalid={!!errors?.email} defaultValue={defaultValues?.email} />
        {errors?.email && <p className="text-sm text-red-500">{errors.email[0]}</p>}
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" name="phone" type="tel" required aria-invalid={!!errors?.phone} defaultValue={defaultValues?.phone} />
        {errors?.phone && <p className="text-sm text-red-500">{errors.phone[0]}</p>}
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="addressLine1">Address Line 1</Label>
        <Input
          id="addressLine1"
          name="addressLine1"
          required
          aria-invalid={!!errors?.addressLine1}
          defaultValue={defaultValues?.addressLine1}
        />
        {errors?.addressLine1 && <p className="text-sm text-red-500">{errors.addressLine1[0]}</p>}
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
        <Input id="addressLine2" name="addressLine2" defaultValue={defaultValues?.addressLine2} />
        {errors?.addressLine2 && <p className="text-sm text-red-500">{errors.addressLine2[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="landmark">Landmark (Optional)</Label>
        <Input id="landmark" name="landmark" defaultValue={defaultValues?.landmark} />
        {errors?.landmark && <p className="text-sm text-red-500">{errors.landmark[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" required aria-invalid={!!errors?.city} defaultValue={defaultValues?.city} />
        {errors?.city && <p className="text-sm text-red-500">{errors.city[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <Input id="state" name="state" required aria-invalid={!!errors?.state} defaultValue={defaultValues?.state} />
        {errors?.state && <p className="text-sm text-red-500">{errors.state[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="postalCode">Postal Code</Label>
        <Input id="postalCode" name="postalCode" required aria-invalid={!!errors?.postalCode} defaultValue={defaultValues?.postalCode} />
        {errors?.postalCode && <p className="text-sm text-red-500">{errors.postalCode[0]}</p>}
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Order Notes (Optional)</Label>
        <Input id="notes" name="notes" defaultValue={defaultValues?.notes} />
        {errors?.notes && <p className="text-sm text-red-500">{errors.notes[0]}</p>}
      </div>
    </div>
  )
}
