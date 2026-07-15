'use client'

import { useState, useTransition } from 'react'
import { submitReviewAction } from '@/features/reviews/actions'
import type { Review } from '@/features/reviews/queries'
import { useToast } from '@/components/ui/Toast'
import { CheckIcon } from '@/components/ui/icons'

// Star Icon for Ratings
function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export function ProductReviewsSection({
  productId,
  reviews,
}: {
  productId: string
  reviews: Review[]
}) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.append('rating', rating.toString())
    
    startTransition(async () => {
      const result = await submitReviewAction(formData)
      if (result.success) {
        toast({
          title: 'Review submitted',
          description: 'Thank you! Your review is pending approval.',
        })
        setFormOpen(false)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit review.',
        })
      }
    })
  }

  return (
    <div className="mt-16 border-t border-fog/50 pt-10">
      <h2 className="text-2xl font-bold text-ink">Customer Reviews</h2>
      
      <div className="mt-6 flex flex-col md:flex-row gap-8">
        {/* Left side: Aggregate & Write Review */}
        <div className="w-full md:w-1/3 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold text-ink">{averageRating}</span>
              <div className="flex text-accent">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarIcon key={i} filled={i <= Math.round(Number(averageRating))} className="size-5" />
                ))}
              </div>
            </div>
            <p className="mt-1 text-sm text-mist">Based on {reviews.length} review{reviews.length !== 1 && 's'}</p>
          </div>

          {!formOpen ? (
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex w-full justify-center rounded-md border border-charcoal/20 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper active:bg-fog"
            >
              Write a Review
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-paper p-5 border border-fog">
              <input type="hidden" name="productId" value={productId} />
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Overall Rating</label>
                <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseEnter={() => setHoverRating(i)}
                      onClick={() => setRating(i)}
                      className="text-accent hover:scale-110 transition-transform"
                    >
                      <StarIcon filled={i <= (hoverRating || rating)} className="size-6" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="authorName" className="block text-sm font-medium text-charcoal mb-1">Name</label>
                <input
                  type="text"
                  name="authorName"
                  id="authorName"
                  required
                  className="w-full rounded-md border border-fog px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                />
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-charcoal mb-1">Review Title</label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  placeholder="Summarize your experience"
                  className="w-full rounded-md border border-fog px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-charcoal mb-1">Review</label>
                <textarea
                  name="content"
                  id="content"
                  rows={4}
                  placeholder="Tell others about this product..."
                  className="w-full rounded-md border border-fog px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-1 rounded-md border border-fog px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-fog"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/90 disabled:opacity-70"
                >
                  {isPending ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right side: Review List */}
        <div className="w-full md:w-2/3 space-y-6">
          {reviews.length === 0 ? (
            <p className="text-sm text-mist py-8 text-center bg-paper rounded-xl border border-dashed border-fog">
              No reviews yet. Be the first to share your thoughts!
            </p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-b border-fog/50 pb-6 last:border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink">{review.author_name}</p>
                      {review.is_verified_purchase && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          <CheckIcon className="size-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex text-accent">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <StarIcon key={i} filled={i <= review.rating} className="size-3.5" />
                      ))}
                    </div>
                  </div>
                  <time className="text-xs text-mist">
                    {new Date(review.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </div>
                {review.title && <h4 className="mt-3 font-semibold text-ink">{review.title}</h4>}
                {review.content && <p className="mt-1 text-sm text-charcoal leading-relaxed">{review.content}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
