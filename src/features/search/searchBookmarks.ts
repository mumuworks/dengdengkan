import type { Bookmark } from '../../domain/bookmark'
import type { Category } from '../../domain/category'
import type { Tag, BookmarkTag } from '../../domain/tag'
import { normalizedIncludes, normalizedUrlIncludes } from '../../utils/textSearch'

/**
 * Search scope (PRD §9.7, Interaction §12, Technical Architecture §9.1/§9.3):
 * "全部／分類／標籤" select which field(s) the query is matched against, not a
 * post-hoc result filter — see Decision Closure P1-C2b Decision 4.
 */
export type SearchScope = 'all' | 'category' | 'tag'

export interface SearchBookmarksInput {
  query: string
  scope: SearchScope
  bookmarks: Bookmark[]
  categories: Category[]
  tags: Tag[]
  bookmarkTags: BookmarkTag[]
}

/**
 * Pure search over already-loaded data — no Dexie access here, so every scope/field
 * combination is unit-testable without an IndexedDB round trip. Repository-loaded
 * lists are composed by `useSearch`, matching the app's existing pattern of
 * composing repositories in hooks/features (see `useHomeCategories`).
 */
export function searchBookmarks({
  query,
  scope,
  bookmarks,
  categories,
  tags,
  bookmarkTags,
}: SearchBookmarksInput): Bookmark[] {
  const trimmedQuery = query.trim()
  if (trimmedQuery.length === 0) return []

  if (scope === 'category') {
    const matchedCategoryIds = new Set(
      categories.filter((category) => normalizedIncludes(category.name, trimmedQuery)).map((c) => c.id),
    )
    return bookmarks.filter((bookmark) => matchedCategoryIds.has(bookmark.categoryId))
  }

  if (scope === 'tag') {
    const matchedTagIds = new Set(
      tags.filter((tag) => normalizedIncludes(tag.name, trimmedQuery)).map((t) => t.id),
    )
    const matchedBookmarkIds = new Set(
      bookmarkTags.filter((bt) => matchedTagIds.has(bt.tagId)).map((bt) => bt.bookmarkId),
    )
    return bookmarks.filter((bookmark) => matchedBookmarkIds.has(bookmark.id))
  }

  // scope === 'all': title, source, reason, originalURL, Category name, Tag display name.
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]))
  const tagNameById = new Map(tags.map((t) => [t.id, t.name]))
  const tagNamesByBookmarkId = new Map<string, string[]>()
  for (const bt of bookmarkTags) {
    const tagName = tagNameById.get(bt.tagId)
    if (!tagName) continue
    const existing = tagNamesByBookmarkId.get(bt.bookmarkId)
    if (existing) {
      existing.push(tagName)
    } else {
      tagNamesByBookmarkId.set(bt.bookmarkId, [tagName])
    }
  }

  return bookmarks.filter((bookmark) => {
    if (bookmark.title && normalizedIncludes(bookmark.title, trimmedQuery)) return true
    if (bookmark.source && normalizedIncludes(bookmark.source, trimmedQuery)) return true
    if (bookmark.reason && normalizedIncludes(bookmark.reason, trimmedQuery)) return true
    if (normalizedUrlIncludes(bookmark.originalURL, trimmedQuery)) return true

    const categoryName = categoryNameById.get(bookmark.categoryId)
    if (categoryName && normalizedIncludes(categoryName, trimmedQuery)) return true

    const tagNames = tagNamesByBookmarkId.get(bookmark.id) ?? []
    if (tagNames.some((name) => normalizedIncludes(name, trimmedQuery))) return true

    return false
  })
}
