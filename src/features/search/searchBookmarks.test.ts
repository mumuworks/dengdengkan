import { describe, expect, it } from 'vitest'
import { searchBookmarks } from './searchBookmarks'
import type { Bookmark } from '../../domain/bookmark'
import type { Category } from '../../domain/category'
import type { Tag, BookmarkTag } from '../../domain/tag'

function makeBookmark(overrides: Partial<Bookmark> & { id: string }): Bookmark {
  return {
    originalURL: 'https://example.com',
    title: null,
    source: null,
    summary: null,
    imageURL: null,
    reason: null,
    categoryId: 'cat-unorganized',
    isPinnedToBoard: false,
    metadataState: 'resolved',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    lastOpenedAt: null,
    ...overrides,
  }
}

function makeCategory(overrides: Partial<Category> & { id: string; name: string }): Category {
  return {
    isSystem: false,
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeTag(overrides: Partial<Tag> & { id: string; name: string }): Tag {
  return {
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeAssociation(bookmarkId: string, tagId: string): BookmarkTag {
  return { bookmarkId, tagId, createdAt: '2026-01-01T00:00:00.000Z' }
}

const categories: Category[] = [
  makeCategory({ id: 'cat-unorganized', name: '未整理' }),
  makeCategory({ id: 'cat-travel', name: '旅遊' }),
]

const tags: Tag[] = [makeTag({ id: 'tag-food', name: '美食' }), makeTag({ id: 'tag-work', name: 'WORK' })]

describe('searchBookmarks', () => {
  it('returns nothing for an empty (or whitespace-only) query regardless of scope', () => {
    const bookmarks = [makeBookmark({ id: 'b1', title: '某個標題' })]
    expect(searchBookmarks({ query: '', scope: 'all', bookmarks, categories, tags, bookmarkTags: [] })).toEqual([])
    expect(searchBookmarks({ query: '   ', scope: 'all', bookmarks, categories, tags, bookmarkTags: [] })).toEqual([])
  })

  describe('scope: all', () => {
    it('matches on title', () => {
      const bookmarks = [makeBookmark({ id: 'b1', title: '東京旅行筆記' })]
      const results = searchBookmarks({ query: '旅行', scope: 'all', bookmarks, categories, tags, bookmarkTags: [] })
      expect(results.map((b) => b.id)).toEqual(['b1'])
    })

    it('matches on source', () => {
      const bookmarks = [makeBookmark({ id: 'b1', source: 'Example News' })]
      const results = searchBookmarks({ query: 'example', scope: 'all', bookmarks, categories, tags, bookmarkTags: [] })
      expect(results.map((b) => b.id)).toEqual(['b1'])
    })

    it('matches on reason', () => {
      const bookmarks = [makeBookmark({ id: 'b1', reason: '想找時間去看看' })]
      const results = searchBookmarks({ query: '看看', scope: 'all', bookmarks, categories, tags, bookmarkTags: [] })
      expect(results.map((b) => b.id)).toEqual(['b1'])
    })

    it('matches on originalURL, tolerating scheme differences', () => {
      const bookmarks = [makeBookmark({ id: 'b1', originalURL: 'https://example.com/deal' })]
      const results = searchBookmarks({
        query: 'example.com/deal',
        scope: 'all',
        bookmarks,
        categories,
        tags,
        bookmarkTags: [],
      })
      expect(results.map((b) => b.id)).toEqual(['b1'])
    })

    it('matches on the bookmark’s Category name', () => {
      const bookmarks = [makeBookmark({ id: 'b1', categoryId: 'cat-travel' })]
      const results = searchBookmarks({ query: '旅遊', scope: 'all', bookmarks, categories, tags, bookmarkTags: [] })
      expect(results.map((b) => b.id)).toEqual(['b1'])
    })

    it('matches on an associated Tag display name', () => {
      const bookmarks = [makeBookmark({ id: 'b1' })]
      const bookmarkTags = [makeAssociation('b1', 'tag-food')]
      const results = searchBookmarks({ query: '美食', scope: 'all', bookmarks, categories, tags, bookmarkTags })
      expect(results.map((b) => b.id)).toEqual(['b1'])
    })

    it('is case-insensitive and NFKC-normalized', () => {
      const bookmarks = [makeBookmark({ id: 'b1' })]
      const bookmarkTags = [makeAssociation('b1', 'tag-work')]
      const results = searchBookmarks({
        query: 'ｗｏｒｋ',
        scope: 'all',
        bookmarks,
        categories,
        tags,
        bookmarkTags,
      })
      expect(results.map((b) => b.id)).toEqual(['b1'])
    })

    it('excludes bookmarks that match nothing', () => {
      const bookmarks = [makeBookmark({ id: 'b1', title: '完全無關' })]
      const results = searchBookmarks({ query: '旅行', scope: 'all', bookmarks, categories, tags, bookmarkTags: [] })
      expect(results).toEqual([])
    })
  })

  describe('scope: category', () => {
    it('matches only Category name, ignoring title/reason/tag hits', () => {
      const bookmarks = [
        makeBookmark({ id: 'b1', categoryId: 'cat-travel' }),
        makeBookmark({ id: 'b2', categoryId: 'cat-unorganized', title: '旅遊筆記' }),
      ]
      const results = searchBookmarks({ query: '旅遊', scope: 'category', bookmarks, categories, tags, bookmarkTags: [] })
      expect(results.map((b) => b.id)).toEqual(['b1'])
    })

    it('returns nothing when no Category name matches', () => {
      const bookmarks = [makeBookmark({ id: 'b1', categoryId: 'cat-travel' })]
      const results = searchBookmarks({ query: '美食', scope: 'category', bookmarks, categories, tags, bookmarkTags: [] })
      expect(results).toEqual([])
    })
  })

  describe('scope: tag', () => {
    it('matches only Tag display name, ignoring title/reason/category hits', () => {
      const bookmarks = [
        makeBookmark({ id: 'b1' }),
        makeBookmark({ id: 'b2', title: '美食好文' }),
      ]
      const bookmarkTags = [makeAssociation('b1', 'tag-food')]
      const results = searchBookmarks({ query: '美食', scope: 'tag', bookmarks, categories, tags, bookmarkTags })
      expect(results.map((b) => b.id)).toEqual(['b1'])
    })

    it('matches multiple Tags with OR semantics', () => {
      const bookmarks = [
        makeBookmark({ id: 'b1' }),
        makeBookmark({ id: 'b2' }),
        makeBookmark({ id: 'b3' }),
      ]
      const bookmarkTags = [makeAssociation('b1', 'tag-food'), makeAssociation('b2', 'tag-work')]
      const tagsWithOverlap: Tag[] = [
        makeTag({ id: 'tag-food', name: '美食' }),
        makeTag({ id: 'tag-work', name: '美工' }),
      ]
      const results = searchBookmarks({
        query: '美',
        scope: 'tag',
        bookmarks,
        categories,
        tags: tagsWithOverlap,
        bookmarkTags,
      })
      expect(results.map((b) => b.id).sort()).toEqual(['b1', 'b2'])
    })

    it('does not duplicate a bookmark that matches more than one hit tag', () => {
      const bookmarks = [makeBookmark({ id: 'b1' })]
      const bookmarkTags = [makeAssociation('b1', 'tag-food'), makeAssociation('b1', 'tag-work')]
      const tagsWithOverlap: Tag[] = [
        makeTag({ id: 'tag-food', name: '美食' }),
        makeTag({ id: 'tag-work', name: '美工' }),
      ]
      const results = searchBookmarks({
        query: '美',
        scope: 'tag',
        bookmarks,
        categories,
        tags: tagsWithOverlap,
        bookmarkTags,
      })
      expect(results.map((b) => b.id)).toEqual(['b1'])
    })
  })
})
