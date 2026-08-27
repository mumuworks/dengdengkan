import { useCallback, useEffect, useState } from 'react'
import { bookmarkRepository } from '../app/container'
import type { Bookmark } from '../domain/bookmark'

/**
 * Bookmarks scoped to a single Category, for the Category collection list
 * (Interaction §9.1/§9.2). `null` while loading.
 */
export function useCategoryBookmarks(categoryId: string | undefined): {
  bookmarks: Bookmark[] | null
  refresh: () => Promise<void>
} {
  const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(null)

  const refresh = useCallback(async () => {
    const scoped = categoryId ? await bookmarkRepository.listByCategory(categoryId) : []
    setBookmarks(scoped)
  }, [categoryId])

  useEffect(() => {
    let cancelled = false

    const load = categoryId ? bookmarkRepository.listByCategory(categoryId) : Promise.resolve([])
    load.then((scoped) => {
      if (!cancelled) setBookmarks(scoped)
    })

    return () => {
      cancelled = true
    }
  }, [categoryId])

  return { bookmarks, refresh }
}
