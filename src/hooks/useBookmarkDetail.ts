import { useCallback, useEffect, useRef, useState } from 'react'
import { bookmarkRepository } from '../app/container'
import type { Bookmark } from '../domain/bookmark'

/**
 * Loads a single Bookmark for the Detail screen and applies BR-009: entering
 * Detail updates `lastOpenedAt` exactly once per id (Developer Handoff §8.3 /
 * Interaction §8.3). List/search/pegboard/recall exposure must NOT call this —
 * only the Detail route and "開啟原文" do.
 *
 * `undefined` while loading, `null` if no such bookmark exists (e.g. already deleted).
 */
export function useBookmarkDetail(id: string | undefined): {
  bookmark: Bookmark | null | undefined
  refresh: () => Promise<void>
} {
  const [bookmark, setBookmark] = useState<Bookmark | null | undefined>(undefined)
  const markedOpenedForId = useRef<string | null>(null)

  const refresh = useCallback(async () => {
    if (!id) {
      setBookmark(null)
      return
    }
    const found = await bookmarkRepository.getById(id)
    setBookmark(found ?? null)
  }, [id])

  useEffect(() => {
    let cancelled = false

    const load = id ? bookmarkRepository.getById(id) : Promise.resolve(undefined)
    load
      .then((found) => {
        if (!id || !found) return found ?? null
        if (markedOpenedForId.current === id) return found
        markedOpenedForId.current = id
        return bookmarkRepository.update(id, { lastOpenedAt: new Date().toISOString() })
      })
      .then((result) => {
        if (!cancelled) setBookmark(result ?? null)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  return { bookmark, refresh }
}
