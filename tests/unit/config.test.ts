import { describe, expect, it } from 'vitest'
import { designTokens } from '@/config/design-tokens'
import { motionTokens } from '@/config/motion-tokens'
import { site } from '@/config/site'

// Milestone 0 sanity test: proves the toolchain (Vitest + jsdom + the `@/*`
// path alias) resolves and runs, and guards the invariants other milestones
// rely on in the config tokens.
describe('design tokens', () => {
  it('exposes a single restrained accent colour', () => {
    expect(designTokens.colors.accent).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('keeps the z-index stack strictly ascending', () => {
    const layers = Object.values(designTokens.zIndex)
    const ascending = layers.every((z, i) => i === 0 || z > layers[i - 1]!)
    expect(ascending).toBe(true)
    expect(designTokens.zIndex.modal).toBeGreaterThan(designTokens.zIndex.header)
  })
})

describe('motion tokens', () => {
  it('orders durations fast < standard < slowEditorial', () => {
    const { fast, standard, slowEditorial } = motionTokens.duration
    expect(fast).toBeLessThan(standard)
    expect(standard).toBeLessThan(slowEditorial)
  })

  it('defines cubic-bezier easings as 4-point tuples', () => {
    expect(motionTokens.easing.standard).toHaveLength(4)
    expect(motionTokens.easing.premium).toHaveLength(4)
  })
})

describe('site config', () => {
  it('honours the Phase 1 commercial boundary of 20 seed products', () => {
    expect(site.seedProductCap).toBe(20)
  })
})
