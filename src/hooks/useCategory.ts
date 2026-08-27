import { useEffect, useState } from 'react'
import { categoryRepository } from '../app/container'
import type { Category } from '../domain/category'

/**
 * Loads a single Category by id through the Repository layer.
 * `undefined` while loading, `null` if no such category exists.
 */
export function useCategory(id: string | undefined): Category | null | undefined {
  const [category, setCategory] = useState<Category | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    const load = id ? categoryRepository.getById(id) : Promise.resolve(undefined)
    load.then((found) => {
      if (!cancelled) setCategory(id ? (found ?? null) : null)
    })

    return () => {
      cancelled = true
    }
  }, [id])

  return category
}
