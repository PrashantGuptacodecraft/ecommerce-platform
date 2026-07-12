import { Container } from '@/components/ui/Container'
import { Skeleton } from '@/components/ui/Skeleton'

export default function ProductLoading() {
  return (
    <div className="py-10">
      <Container>
        <Skeleton className="h-4 w-48 mb-6" />
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          {/* Gallery skeleton */}
          <Skeleton className="aspect-[4/5] w-full rounded-lg" />
          {/* Info skeleton */}
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-11 rounded-full" />
                ))}
              </div>
            </div>
            <div className="mt-2 space-y-3">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-20 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
