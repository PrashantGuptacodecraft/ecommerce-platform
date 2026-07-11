import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utilities/cn'

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', false, undefined, 'c')).toBe('a b c')
  })

  it('resolves conflicting Tailwind utilities last-wins', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('supports conditional objects', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active')
  })
})
