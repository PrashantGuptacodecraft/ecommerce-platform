import { describe, it, expect } from 'vitest'
import { computeVariants } from '@/features/admin/products/utils/cartesian'

describe('Cartesian Generation', () => {
  it('generates variants deterministically from options', () => {
    const options = [
      {
        id: 'opt-1',
        name: 'Size',
        sortOrder: 0,
        values: [
          { id: 'val-s', value: 'S', sortOrder: 0 },
          { id: 'val-m', value: 'M', sortOrder: 1 },
        ],
      },
      {
        id: 'opt-2',
        name: 'Color',
        sortOrder: 1,
        values: [{ id: 'val-red', value: 'Red', sortOrder: 0 }],
      },
    ]

    const variants = computeVariants(options, [])
    expect(variants).toHaveLength(2)

    // Deterministic order based on options array
    expect(variants[0]?.optionValueIds).toEqual(['val-s', 'val-red'])
    expect(variants[1]?.optionValueIds).toEqual(['val-m', 'val-red'])
  })

  it('preserves existing variant IDs when the combination remains', () => {
    const options = [
      {
        id: 'opt-1',
        name: 'Size',
        sortOrder: 0,
        values: [{ id: 'val-s', value: 'S', sortOrder: 0 }],
      },
    ]

    const existingVariants = [
      {
        id: 'existing-id-123',
        sku: 'TEST-SKU',
        priceAdjustmentPaise: 500,
        stockQuantity: 10,
        isActive: true,
        optionValueIds: ['val-s'],
        imageId: 'img-1',
      },
    ]

    const variants = computeVariants(options, existingVariants)
    expect(variants).toHaveLength(1)
    expect(variants[0]?.id).toBe('existing-id-123')
    expect(variants[0]?.sku).toBe('TEST-SKU')
    expect(variants[0]?.stockQuantity).toBe(10)
    expect(variants[0]?.imageId).toBe('img-1')
  })

  it('drops variants that no longer match the cartesian combinations', () => {
    const options = [
      {
        id: 'opt-1',
        name: 'Size',
        sortOrder: 0,
        values: [{ id: 'val-s', value: 'S', sortOrder: 0 }],
      },
    ]

    const existingVariants = [
      {
        id: 'existing-id-123',
        sku: 'TEST-SKU',
        priceAdjustmentPaise: 0,
        stockQuantity: 0,
        isActive: true,
        optionValueIds: ['val-deleted'], // This option value is no longer in options
        imageId: null,
      },
    ]

    const variants = computeVariants(options, existingVariants)
    expect(variants).toHaveLength(1) // Should generate the new one for 'val-s'
    expect(variants[0]?.optionValueIds).toEqual(['val-s'])
    expect(variants[0]?.id).not.toBe('existing-id-123')
  })

  it('ignores options with empty names or empty values', () => {
    const options = [
      {
        id: 'opt-1',
        name: '  ',
        sortOrder: 0,
        values: [{ id: 'val-s', value: 'S', sortOrder: 0 }],
      },
      {
        id: 'opt-2',
        name: 'Valid Name',
        sortOrder: 1,
        values: [
          { id: 'val-1', value: '  ', sortOrder: 0 },
          { id: 'val-2', value: 'M', sortOrder: 1 },
        ],
      },
    ]

    const variants = computeVariants(options, [])
    expect(variants).toHaveLength(1)
    expect(variants[0]?.optionValueIds).toEqual(['val-2'])
  })

  it('returns empty array if any valid option group has zero valid values', () => {
    const options = [
      {
        id: 'opt-1',
        name: 'Size',
        sortOrder: 0,
        values: [{ id: 'val-s', value: 'S', sortOrder: 0 }],
      },
      {
        id: 'opt-2',
        name: 'Color',
        sortOrder: 1,
        values: [
          { id: 'val-1', value: '  ', sortOrder: 0 }, // No valid values
        ],
      },
    ]

    const variants = computeVariants(options, [])
    expect(variants).toHaveLength(0)
  })
})
