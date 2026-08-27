import { useCallback, useEffect, useState } from 'react'
import { tagRepository } from '../app/container'
import type { Tag } from '../domain/tag'

/** All Tags, for the Tag Picker Sheet's browse/search list (Decision Closure P1-C2b Decision 2). `null` while loading. */
export function useAllTags(): { tags: Tag[] | null; refresh: () => Promise<void> } {
  const [tags, setTags] = useState<Tag[] | null>(null)

  const refresh = useCallback(async () => {
    setTags(await tagRepository.list())
  }, [])

  useEffect(() => {
    let cancelled = false

    tagRepository.list().then((found) => {
      if (!cancelled) setTags(found)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { tags, refresh }
}
