import { useEffect, useState } from 'react'
import { categoryRepository } from '../app/container'
import type { Category } from '../domain/category'

/** All Categories, for the Pegboard Filter Chips and Search's 分類 scope. `null` while loading. */
export function useCategories(): Category[] | null {
  const [categories, setCategories] = useState<Category[] | null>(null)

  useEffect(() => {
    let cancelled = false

    categoryRepository.list().then((found) => {
      if (!cancelled) setCategories(found)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return categories
}
