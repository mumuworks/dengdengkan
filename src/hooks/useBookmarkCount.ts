import { useEffect, useState } from 'react'
import { bookmarkRepository } from '../app/container'

/** Total bookmark count for the Settings screen (PRD §9.14 「收藏總筆數」). */
export function useBookmarkCount(): number | null {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    bookmarkRepository.list().then((bookmarks) => {
      if (!cancelled) setCount(bookmarks.length)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return count
}
