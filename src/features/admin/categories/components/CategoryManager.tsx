'use client'

import { useState } from 'react'

import { Drawer } from '@/components/ui/Drawer'
import { CategoryForm } from './CategoryForm'

type CategoryNode = {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  is_active: boolean
  updated_at: string
  productCount: number
}

type CategoryManagerProps = {
  categories: CategoryNode[]
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState('')

  const handleCreate = () => {
    setEditingCategory(null)
    setIdempotencyKey(crypto.randomUUID())
    setIsDrawerOpen(true)
  }

  const handleEdit = (category: CategoryNode) => {
    setEditingCategory(category)
    setIdempotencyKey(crypto.randomUUID())
    setIsDrawerOpen(true)
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
    setTimeout(() => setEditingCategory(null), 300) // wait for animation
  }

  const handleSuccess = () => {
    handleClose()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <button
          onClick={handleCreate}
          className="bg-ink text-paper px-4 min-h-[44px] flex items-center justify-center rounded-md font-medium text-sm hover:bg-gray-800 transition-colors w-full sm:w-auto"
        >
          Create Category
        </button>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        {/* Mobile View */}
        <div className="block md:hidden">
          {categories.map((cat) => (
            <div key={cat.id} className="p-4 border-b border-gray-200 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-ink pr-12">{cat.name}</div>
                  <div className="text-gray-500 text-xs mt-1">{cat.slug}</div>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${cat.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                >
                  {cat.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-end mt-2">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-medium">Order: {cat.sort_order}</div>
                  <div className="text-sm text-gray-600">{cat.productCount} products</div>
                </div>
                <button
                  onClick={() => handleEdit(cat)}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm min-h-[44px] min-w-[44px] flex items-center justify-center focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label={`Edit ${cat.name}`}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">No categories found.</div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Products</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-ink">{cat.name}</div>
                    <div className="text-gray-500 text-xs mt-1">{cat.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cat.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">{cat.sort_order}</td>
                  <td className="px-6 py-4">{cat.productCount}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="text-blue-600 hover:text-blue-800 font-medium inline-flex min-h-[44px] min-w-[44px] items-center justify-center focus:ring-2 focus:ring-blue-500 rounded"
                      aria-label={`Edit ${cat.name}`}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer
        open={isDrawerOpen}
        onClose={handleClose}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
      >
        <CategoryForm
          category={editingCategory}
          onSuccess={handleSuccess}
          onCancel={handleClose}
          idempotencyKey={idempotencyKey}
        />
      </Drawer>
    </div>
  )
}
