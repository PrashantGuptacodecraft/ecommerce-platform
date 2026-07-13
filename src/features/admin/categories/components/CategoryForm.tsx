'use client'

import { useTransition, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { saveCategoryTransactionAction } from '@/features/admin/categories/actions'

type CategoryNode = {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  is_active: boolean
  updated_at: string
}

type CategoryFormProps = {
  category?: CategoryNode | null
  onSuccess: () => void
  onCancel: () => void
  idempotencyKey: string
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-ink text-paper px-4 min-h-[44px] flex items-center justify-center rounded-md font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 w-full sm:w-auto"
    >
      {pending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Category'}
    </button>
  )
}

export function CategoryForm({ category, onSuccess, onCancel, idempotencyKey }: CategoryFormProps) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const isEditing = !!category

  const action = async (formData: FormData) => {
    // Generate base payload
    const payload = {
      name: formData.get('name') as string,
      slug: (formData.get('slug') as string).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: (formData.get('description') as string) || null,
      sort_order: parseInt((formData.get('sort_order') as string) || '0', 10),
      is_active: formData.get('is_active') === 'true'
    }

    startTransition(async () => {
      const result = await saveCategoryTransactionAction({
        categoryId: category?.id,
        expectedUpdatedAt: category?.updated_at,
        payloadVersion: 1,
        payload,
        idempotencyKey
      })

      if (result.success) {
        onSuccess()
      } else {
        // Safe error display logic (handled in UI context or alert)
        alert(result.error) // Using simple alert for safe error states as per standard browser behavior for minimal deps
      }
    })
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
            Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={category?.name}
            className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink"
            placeholder="e.g. Shirts"
          />
        </div>
        
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-ink mb-1">
            Slug *
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            defaultValue={category?.slug}
            className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink"
            placeholder="e.g. shirts"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-ink mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={category?.description || ''}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-ink focus:border-ink min-h-[88px]"
            placeholder="Optional description"
          />
        </div>

        <div>
          <label htmlFor="sort_order" className="block text-sm font-medium text-ink mb-1">
            Display Order
          </label>
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue={category?.sort_order ?? 0}
            className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink"
          />
        </div>

        <div>
          <label htmlFor="is_active" className="block text-sm font-medium text-ink mb-1">
            Status
          </label>
          <select
            id="is_active"
            name="is_active"
            defaultValue={category ? String(category.is_active) : 'true'}
            className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink bg-white"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="bg-white border border-gray-300 text-ink px-4 min-h-[44px] flex items-center justify-center rounded-md font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 w-full sm:w-auto"
        >
          Cancel
        </button>
        <SubmitButton isEditing={isEditing} />
      </div>
    </form>
  )
}
