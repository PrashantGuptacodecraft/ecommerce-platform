import { describe, it, expect } from 'vitest'
import { computeVariants } from '@/features/admin/products/utils/cartesian'

describe('Cartesian UUID & Stability Rules', () => {
  it('generates valid UUIDs for new variants', () => {
    const options = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Size',
        sortOrder: 0,
        values: [{ id: '123e4567-e89b-12d3-a456-426614174001', value: 'S', sortOrder: 0 }],
      },
    ]

    const variants = computeVariants(options, [])
    expect(variants).toHaveLength(1)

    // Check if ID is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(variants[0]?.id).toMatch(uuidRegex)
    expect(variants[0]?.optionValueIds).toEqual(['123e4567-e89b-12d3-a456-426614174001'])
  })

  it('preserves generated IDs across recalculations if the combination remains', () => {
    const options = [
      {
        id: 'opt-uuid',
        name: 'Size',
        sortOrder: 0,
        values: [{ id: 'val-s-uuid', value: 'S', sortOrder: 0 }],
      },
    ]

    // First generation
    const initialVariants = computeVariants(options, [])
    const generatedId = initialVariants[0]?.id

    // Second generation (re-render or option addition)
    const optionsWithNewValue = [
      {
        id: 'opt-uuid',
        name: 'Size',
        sortOrder: 0,
        values: [
          { id: 'val-s-uuid', value: 'S', sortOrder: 0 },
          { id: 'val-m-uuid', value: 'M', sortOrder: 1 },
        ],
      },
    ]

    const recalculatedVariants = computeVariants(optionsWithNewValue, initialVariants)

    // The 'S' variant should retain its previously generated ID
    expect(recalculatedVariants).toHaveLength(2)
    const sVariant = recalculatedVariants.find((v) => v.optionValueIds.includes('val-s-uuid'))
    expect(sVariant?.id).toBe(generatedId)
  })

  it('existing database IDs are strictly preserved', () => {
    const options = [
      {
        id: 'db-opt-1',
        name: 'Size',
        sortOrder: 0,
        values: [{ id: 'db-val-1', value: 'S', sortOrder: 0 }],
      },
    ]

    const existingVariants = [
      {
        id: 'db-variant-1234', // Came from DB
        sku: 'TEST-SKU',
        priceAdjustmentPaise: 500,
        stockQuantity: 10,
        isActive: true,
        optionValueIds: ['db-val-1'],
        imageId: null,
      },
    ]

    const variants = computeVariants(options, existingVariants)
    expect(variants).toHaveLength(1)
    expect(variants[0]?.id).toBe('db-variant-1234')
  })
})
