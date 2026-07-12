import { Container } from '@/components/ui/Container'
import { Skeleton } from '@/components/ui/Skeleton'

export default function SearchLoading() {
  return (
    <div className="py-10">
      <Container>
        <Skeleton className="mb-6 h-12 max-w-lg rounded-lg" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-24 mb-8" />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/5] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
