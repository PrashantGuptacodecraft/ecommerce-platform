import { requireAdmin } from '@/lib/security/auth'
import { AdminLayoutClient } from './AdminLayoutClient'

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const adminContext = await requireAdmin()

  return <AdminLayoutClient adminEmail={adminContext.email}>{children}</AdminLayoutClient>
}
