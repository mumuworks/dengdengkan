import { useEffect, useState } from 'react'
import { bookmarkRepository } from '../app/container'
import type { Tag } from '../domain/tag'

/**
 * Read-only Tag Chips for Bookmark Detail (Interaction §8). Tag creation/removal
 * is P1-C2b scope — this only displays whatever associations already exist.
 * `null` while loading.
 */
export function useBookmarkTags(bookmarkId: string | undefined): Tag[] | null {
  const [tags, setTags] = useState<Tag[] | null>(null)

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

  return tags
}
