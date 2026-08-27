import { useCallback, useEffect, useState } from 'react'
import { bookmarkRepository, categoryRepository } from '../app/container'
import type { Category } from '../domain/category'
import type { Bookmark } from '../domain/bookmark'

export interface HomeCategoryPreview {
  category: Category
  count: number
  previewImageUrls: string[]
}

const MAX_PREVIEW_IMAGES = 4

function buildPreviews(categories: Category[], bookmarks: Bookmark[]): HomeCategoryPreview[] {
  const counts = new Map<string, number>()
  const previews = new Map<string, string[]>()
  for (const bookmark of bookmarks) {
    counts.set(bookmark.categoryId, (counts.get(bookmark.categoryId) ?? 0) + 1)
    if (bookmark.imageURL) {
      const existing = previews.get(bookmark.categoryId) ?? []
      if (existing.length < MAX_PREVIEW_IMAGES) {
        existing.push(bookmark.imageURL)
        previews.set(bookmark.categoryId, existing)
      }
    }
  }

  return categories.map((category) => ({
    category,
    count: counts.get(category.id) ?? 0,
    previewImageUrls: previews.get(category.id) ?? [],
  }))
}

/**
 * Categories with bookmark counts and up to 4 preview image URLs each, for the
 * Home Category Preview Cards (Design Spec §11.2 / PRD §9.5). Composes the
 * existing `CategoryRepository`/`BookmarkRepository` — no new Repository surface.
 */
export function useHomeCategories(): {
  categories: HomeCategoryPreview[] | null
  refresh: () => Promise<void>
} {
  const [categories, setCategories] = useState<HomeCategoryPreview[] | null>(null)

  const refresh = useCallback(async () => {
    const [allCategories, allBookmarks] = await Promise.all([
      categoryRepository.list(),
      bookmarkRepository.list(),
    ])
    setCategories(buildPreviews(allCategories, allBookmarks))
  }, [])

  useEffect(() => {
    let cancelled = false

    Promise.all([categoryRepository.list(), bookmarkRepository.list()]).then(
      ([allCategories, allBookmarks]) => {
        if (!cancelled) setCategories(buildPreviews(allCategories, allBookmarks))
      },
    )

    return () => {
      cancelled = true
    }
  }, [])

  return { categories, refresh }
}
