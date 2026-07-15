import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AdminLayoutClient } from '../../src/app/admin/(protected)/AdminLayoutClient'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/products',
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, onClick, className, 'aria-current': ariaCurrent }: any) => (
    <a href={href} onClick={onClick} className={className} data-testid={`link-${href}`} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
}))

// Mock LogoutButton
vi.mock('../../src/components/admin/LogoutButton', () => ({
  LogoutButton: ({ className }: any) => (
    <button data-testid="logout-button" className={className}>
      Sign out
    </button>
  ),
}))

// Mock Drawer to simplify testing
vi.mock('../../src/components/ui/Drawer', () => ({
  Drawer: ({ open, children, onClose }: any) =>
    open ? (
      <div data-testid="mobile-drawer">
        <button onClick={onClose} data-testid="close-drawer">
          Close
        </button>
        {children}
      </div>
    ) : null,
}))

describe('AdminLayoutClient', () => {
  it('renders the sidebar with correct active route', () => {
    render(<AdminLayoutClient adminEmail="admin@example.com">Content</AdminLayoutClient>)

    // Both desktop and mobile sidebars are technically in the DOM (though one is hidden by CSS)
    // We check the desktop one
    const productsLink = screen.getAllByTestId('link-/admin/products')[0]!
    expect(productsLink).toHaveAttribute('aria-current', 'page')
    expect(productsLink.className).toContain('bg-white/10') // Active style

    const dashboardLink = screen.getAllByTestId('link-/admin')[0]!
    expect(dashboardLink).not.toHaveAttribute('aria-current')
  })

  it('mobile sidebar opens and closes correctly', () => {
    render(<AdminLayoutClient adminEmail="admin@example.com">Content</AdminLayoutClient>)

    // Initially closed
    expect(screen.queryByTestId('mobile-drawer')).not.toBeInTheDocument()

    // Open drawer
    const menuButton = screen.getByLabelText('Open sidebar menu')
    fireEvent.click(menuButton)

    expect(screen.getByTestId('mobile-drawer')).toBeInTheDocument()

    // Close drawer
    const closeButton = screen.getByTestId('close-drawer')
    fireEvent.click(closeButton)

    expect(screen.queryByTestId('mobile-drawer')).not.toBeInTheDocument()
  })

  it('logout remains functional', () => {
    render(<AdminLayoutClient adminEmail="admin@example.com">Content</AdminLayoutClient>)
    // Desktop and mobile header might both render a logout (wait, only sidebar has it now)
    const logoutButtons = screen.getAllByTestId('logout-button')
    expect(logoutButtons.length).toBeGreaterThan(0)
  })

  it('Settings link is absent', () => {
    render(<AdminLayoutClient adminEmail="admin@example.com">Content</AdminLayoutClient>)
    expect(screen.queryByTestId('link-/admin/settings')).not.toBeInTheDocument()
  })

  it('shows admin email or fallback', () => {
    const { rerender } = render(
      <AdminLayoutClient adminEmail="admin@example.com">Content</AdminLayoutClient>,
    )
    expect(screen.getAllByText('admin@example.com').length).toBeGreaterThan(0)

    rerender(<AdminLayoutClient adminEmail={null}>Content</AdminLayoutClient>)
    expect(screen.getAllByText('Administrator').length).toBeGreaterThan(0)
  })
})
