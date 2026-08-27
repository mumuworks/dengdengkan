import { useCallback, useEffect, useState } from 'react'
import { bookmarkRepository } from '../app/container'
import type { Bookmark } from '../domain/bookmark'

/** Bookmarks with `isPinnedToBoard === true`, for the Pegboard (Interaction §11). `null` while loading. */
export function usePinnedBookmarks(): { bookmarks: Bookmark[] | null; refresh: () => Promise<void> } {
  const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(null)

  const refresh = useCallback(async () => {
    setBookmarks(await bookmarkRepository.listPinned())
  }, [])

  useEffect(() => {
    let cancelled = false

    bookmarkRepository.listPinned().then((found) => {
      if (!cancelled) setBookmarks(found)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { bookmarks, refresh }
}
