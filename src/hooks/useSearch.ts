import { useEffect, useMemo, useState } from 'react'
import { bookmarkRepository, categoryRepository, tagRepository } from '../app/container'
import type { Bookmark } from '../domain/bookmark'
import type { Category } from '../domain/category'
import type { Tag, BookmarkTag } from '../domain/tag'
import { searchBookmarks, type SearchScope } from '../features/search/searchBookmarks'

export type { SearchScope }

interface SearchData {
  bookmarks: Bookmark[]
  categories: Category[]
  tags: Tag[]
  bookmarkTags: BookmarkTag[]
}

/**
 * 搜尋 (PRD §9.7, Interaction §12, Technical Architecture §9). Loads bookmarks/
 * categories/tags/associations once and recomputes matches locally as the query
 * or scope changes — Phase 1 scale (Technical Architecture §9.4) does not need a
 * database round trip per keystroke. `loaded` distinguishes "still loading" from
 * "loaded but zero results" for the empty-state decision in `SearchRoute`.
 */
export function useSearch(): {
  query: string
  setQuery: (value: string) => void
  scope: SearchScope
  setScope: (value: SearchScope) => void
  results: Bookmark[]
  loaded: boolean
  clear: () => void
} {
  const [data, setData] = useState<SearchData | null>(null)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<SearchScope>('all')

  useEffect(() => {
    let cancelled = false

    Promise.all([
      bookmarkRepository.list(),
      categoryRepository.list(),
      tagRepository.list(),
      tagRepository.listAssociations(),
    ]).then(([bookmarks, categories, tags, bookmarkTags]) => {
      if (!cancelled) setData({ bookmarks, categories, tags, bookmarkTags })
    })

    return () => {
      cancelled = true
    }
  }, [])

  const results = useMemo(() => {
    if (!data) return []
    return searchBookmarks({ query, scope, ...data })
  }, [data, query, scope])

  return { query, setQuery, scope, setScope, results, loaded: data !== null, clear: () => setQuery('') }
}
