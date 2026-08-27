import { useCallback, useEffect, useState } from 'react'
import { bookmarkRepository } from '../app/container'
import type { Bookmark } from '../domain/bookmark'

/** Loads the bookmark list through the Repository layer; `null` while loading. */
export function useBookmarks(): { bookmarks: Bookmark[] | null; refresh: () => Promise<void> } {
  const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(null)

  const refresh = useCallback(async () => {
    const all = await bookmarkRepository.list()
    setBookmarks(all)
  }, [])

  useEffect(() => {
    let cancelled = false
    bookmarkRepository.list().then((all) => {
      if (!cancelled) setBookmarks(all)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { bookmarks, refresh }
}
