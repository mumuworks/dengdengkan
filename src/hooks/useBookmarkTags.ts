import { useCallback, useEffect, useState } from 'react'
import { bookmarkRepository } from '../app/container'
import type { Tag } from '../domain/tag'

/**
 * Tag Chips for Bookmark Detail (Interaction §8), plus a `refresh` so the Tag
 * Picker (P1-C2b, Decision Closure Decision 2) can update the Detail view
 * immediately after assigning/removing a Tag. `null` while loading.
 */
export function useBookmarkTags(bookmarkId: string | undefined): {
  tags: Tag[] | null
  refresh: () => Promise<void>
} {
  const [tags, setTags] = useState<Tag[] | null>(null)

  const refresh = useCallback(async () => {
    const found = bookmarkId ? await bookmarkRepository.listTags(bookmarkId) : []
    setTags(found)
  }, [bookmarkId])

  useEffect(() => {
    let cancelled = false

    const load = bookmarkId ? bookmarkRepository.listTags(bookmarkId) : Promise.resolve([])
    load.then((found) => {
      if (!cancelled) setTags(found)
    })

    return () => {
      cancelled = true
    }
  }, [bookmarkId])

  return { tags, refresh }
}
