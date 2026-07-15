'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

interface WishlistContextType {
  wishedProductIds: Set<string>
  toggleLocalWishedState: (productId: string, isAdded: boolean) => void
  isLoaded: boolean
}

const WishlistContext = createContext<WishlistContextType>({
  wishedProductIds: new Set(),
  toggleLocalWishedState: () => {},
  isLoaded: false,
})

export function useWishlist() {
  return useContext(WishlistContext)
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishedProductIds, setWishedProductIds] = useState<Set<string>>(new Set())
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    async function loadWishlist() {
      try {
        const res = await fetch('/api/wishlist')
        if (res.ok) {
          const data = await res.json()
          setWishedProductIds(new Set(data.ids))
        }
      } catch (error) {
        console.error('Failed to load wishlist IDs', error)
      } finally {
        setIsLoaded(true)
      }
    }
    loadWishlist()
  }, [])

  const toggleLocalWishedState = useCallback((productId: string, isAdded: boolean) => {
    setWishedProductIds((prev) => {
      const newSet = new Set(prev)
      if (isAdded) {
        newSet.add(productId)
      } else {
        newSet.delete(productId)
      }
      return newSet
    })
  }, [])

  return (
    <WishlistContext.Provider value={{ wishedProductIds, toggleLocalWishedState, isLoaded }}>
      {children}
    </WishlistContext.Provider>
  )
}
