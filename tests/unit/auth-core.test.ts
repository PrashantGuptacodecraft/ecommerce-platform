import { describe, expect, it } from 'vitest'
import { resolveAdminAccess, safeNextPath } from '@/lib/security/auth-core'

describe('resolveAdminAccess', () => {
  it('grants an active admin', () => {
    expect(resolveAdminAccess({ role: 'admin', is_active: true }).isAdmin).toBe(true)
  })
  it('rejects an inactive admin', () => {
    expect(resolveAdminAccess({ role: 'admin', is_active: false }).isAdmin).toBe(false)
  })
  it('rejects a non-admin role', () => {
    expect(resolveAdminAccess({ role: 'staff', is_active: true }).isAdmin).toBe(false)
  })
  it('rejects a missing profile', () => {
    expect(resolveAdminAccess(null).isAdmin).toBe(false)
  })
})

describe('safeNextPath', () => {
  it('allows same-origin admin paths', () => {
    expect(safeNextPath('/admin')).toBe('/admin')
    expect(safeNextPath('/admin/products')).toBe('/admin/products')
    expect(safeNextPath('/admin/orders/abc-123')).toBe('/admin/orders/abc-123')
  })
  it('rejects absolute and protocol-relative URLs (open redirect)', () => {
    expect(safeNextPath('https://evil.com')).toBe('/admin')
    expect(safeNextPath('http://evil.com/admin')).toBe('/admin')
    expect(safeNextPath('//evil.com')).toBe('/admin')
  })
  it('rejects backslash tricks', () => {
    expect(safeNextPath('/\\evil.com')).toBe('/admin')
    expect(safeNextPath('/admin\\..\\x')).toBe('/admin')
  })
  it('rejects non-admin app paths', () => {
    expect(safeNextPath('/')).toBe('/admin')
    expect(safeNextPath('/shop')).toBe('/admin')
    expect(safeNextPath('/adminx')).toBe('/admin')
  })
  it('never bounces back to the login page', () => {
    expect(safeNextPath('/admin/login')).toBe('/admin')
    expect(safeNextPath('/admin/login?x=1')).toBe('/admin')
  })
  it('rejects control-character (CRLF) splitting', () => {
    expect(safeNextPath('/admin\nSet-Cookie: x=y')).toBe('/admin')
    expect(safeNextPath('/admin\t/x')).toBe('/admin')
  })
  it('falls back for empty / nullish input', () => {
    expect(safeNextPath(undefined)).toBe('/admin')
    expect(safeNextPath(null)).toBe('/admin')
    expect(safeNextPath('')).toBe('/admin')
  })
})
