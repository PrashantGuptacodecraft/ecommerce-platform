import { requireAdmin } from '@/lib/security/auth'
import { getAdminCategories } from '@/features/admin/categories/queries'
import { CategoryManager } from '@/features/admin/categories/components/CategoryManager'

export default async function AdminCategoriesPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireAdmin()
  const searchParams = await props.searchParams
  const search = (searchParams?.q as string) || ''

  // Categories are generally few, we don't paginate the manager list heavily 
  // but the query supports it if needed. We'll just fetch page 1 with all for the basic manager UI.
  const { categories } = await getAdminCategories({ search, page: 1 })

  return (
    <div className="space-y-6">
      <CategoryManager categories={categories} />
    </div>
  )
}
