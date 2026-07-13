import { type OptionGroup } from '../components/OptionGroupEditor'
import { type VariantNode } from '../components/VariantCombinationList'

export function computeVariants(
  newOptions: OptionGroup[],
  existingVariants: VariantNode[],
): VariantNode[] {
  // Filter out options with no name. If it has a name but no valid values, we keep it so the Cartesian product correctly aborts.
  const validOptions = newOptions.filter((o) => o.name.trim().length > 0)

  if (validOptions.length === 0) return []

  // Extract valid values per group
  const groupsOfValues = validOptions.map((o) => o.values.filter((v) => v.value.trim().length > 0))

  // Check if any group has 0 valid values, meaning we can't form combinations
  if (groupsOfValues.some((g) => g.length === 0)) return []

  // Cartesian product
  const combinations = groupsOfValues.reduce<string[][]>(
    (acc, curr) => acc.flatMap((c) => curr.map((v) => [...c, v.id])),
    [[]],
  )

  // Match with existing variants or create new
  return combinations.map((combo) => {
    // Find existing variant with exactly these optionValueIds (order agnostic)
    const existing = existingVariants.find((v) => {
      if (v.optionValueIds.length !== combo.length) return false
      const sortedExisting = [...v.optionValueIds].sort()
      const sortedCombo = [...combo].sort()
      return sortedExisting.every((val, i) => val === sortedCombo[i])
    })

    if (existing) {
      return {
        ...existing,
        optionValueIds: combo, // keep the deterministic order based on options array
      }
    }

    return {
      id: crypto.randomUUID(),
      sku: '',
      priceAdjustmentPaise: 0,
      stockQuantity: 0,
      isActive: true,
      optionValueIds: combo,
      imageId: null,
    }
  })
}
