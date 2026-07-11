/**
 * Navigation configuration — storefront + admin. Kept here (not hardcoded in
 * components) so link sets are edited in one place. Category links point at the
 * seeded category slugs; the catalogue pages themselves arrive in Milestone 4.
 */
export type NavItem = {
  label: string
  href: string
}

export const mainNav: NavItem[] = [
  { label: 'Shop All', href: '/shop' },
  { label: 'Shirts', href: '/category/shirts' },
  { label: 'T-Shirts', href: '/category/t-shirts' },
  { label: 'Trousers', href: '/category/trousers' },
  { label: 'Outerwear', href: '/category/outerwear' },
]

export type FooterSection = {
  title: string
  links: NavItem[]
}

export const footerSections: FooterSection[] = [
  {
    title: 'Shop',
    links: [
      { label: 'Shop All', href: '/shop' },
      { label: 'New Arrivals', href: '/shop?sort=new' },
      { label: 'Shirts', href: '/category/shirts' },
      { label: 'Outerwear', href: '/category/outerwear' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Contact', href: '/contact' },
      { label: 'Shipping', href: '/policies/shipping' },
      { label: 'Returns & Exchanges', href: '/policies/returns' },
      { label: 'Track Order', href: '/order' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Privacy Policy', href: '/policies/privacy' },
      { label: 'Terms & Conditions', href: '/policies/terms' },
    ],
  },
]

export const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Products', href: '/admin/products' },
  { label: 'Categories', href: '/admin/categories' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Inventory', href: '/admin/inventory' },
  { label: 'Settings', href: '/admin/settings' },
]
