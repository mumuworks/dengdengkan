import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppDatabase } from '../../db/AppDatabase'
import { DexieBookmarkRepository } from './DexieBookmarkRepository'
import { SYSTEM_UNORGANIZED_CATEGORY_ID } from '../../domain/category'

function uniqueDbName(): string {
  return `test-bookmark-repo-${Math.random().toString(36).slice(2)}`
}

describe('DexieBookmarkRepository', () => {
  let db: AppDatabase
  let repo: DexieBookmarkRepository

  beforeEach(async () => {
    db = new AppDatabase(uniqueDbName())
    await db.open()
    repo = new DexieBookmarkRepository(db)
  })

  afterEach(async () => {
    db.close()
    await db.delete()
  })

  it('creates a bookmark defaulting to the 未整理 category and pending metadata', async () => {
    const bookmark = await repo.create({ originalURL: 'https://example.com/a' })

    expect(bookmark.categoryId).toBe(SYSTEM_UNORGANIZED_CATEGORY_ID)
    expect(bookmark.metadataState).toBe('pending')
    expect(bookmark.isPinnedToBoard).toBe(false)
    expect(bookmark.lastOpenedAt).toBeNull()
    expect(bookmark.createdAt).toBe(bookmark.updatedAt)
  })

  it('normalizes a whitespace-only reason to null (BR-007)', async () => {
    const bookmark = await repo.create({ originalURL: 'https://example.com/b', reason: '   ' })
    expect(bookmark.reason).toBeNull()
  })

  it('reads a bookmark by id', async () => {
    const created = await repo.create({ originalURL: 'https://example.com/c' })
    const found = await repo.getById(created.id)
    expect(found).toEqual(created)
  })

  it('returns undefined for a missing bookmark', async () => {
    expect(await repo.getById('does-not-exist')).toBeUndefined()
  })

  it('lists all bookmarks', async () => {
    await repo.create({ originalURL: 'https://example.com/d' })
    await repo.create({ originalURL: 'https://example.com/e' })
    const all = await repo.list()
    expect(all).toHaveLength(2)
  })

  it('updates a bookmark and bumps updatedAt without touching createdAt', async () => {
    const created = await repo.create({ originalURL: 'https://example.com/f' })
    await new Promise((resolve) => setTimeout(resolve, 2))

    const updated = await repo.update(created.id, { title: '標題', isPinnedToBoard: true })

    expect(updated.title).toBe('標題')
    expect(updated.isPinnedToBoard).toBe(true)
    expect(updated.createdAt).toBe(created.createdAt)
    expect(updated.updatedAt).not.toBe(created.updatedAt)
  })

  it('deletes a bookmark and its BookmarkTag associations', async () => {
    const created = await repo.create({ originalURL: 'https://example.com/g' })
    await db.tags.add({ id: 'tag-1', name: '旅遊', createdAt: '', updatedAt: '' })
    await db.bookmarkTags.add({ bookmarkId: created.id, tagId: 'tag-1', createdAt: '' })

    await repo.delete(created.id)

    expect(await repo.getById(created.id)).toBeUndefined()
    expect(await db.bookmarkTags.where('bookmarkId').equals(created.id).count()).toBe(0)
  })

  describe('listByCategory', () => {
    it('returns only bookmarks in the given category', async () => {
      await db.categories.add({
        id: 'cat-other',
        name: '其他',
        isSystem: false,
        sortOrder: 1,
        createdAt: '',
        updatedAt: '',
      })
      const inSystem = await repo.create({ originalURL: 'https://example.com/h' })
      await repo.create({ originalURL: 'https://example.com/i', categoryId: 'cat-other' })

      const results = await repo.listByCategory(SYSTEM_UNORGANIZED_CATEGORY_ID)

      expect(results.map((b) => b.id)).toEqual([inSystem.id])
    })

    it('returns an empty array for a category with no bookmarks', async () => {
      expect(await repo.listByCategory('no-such-category')).toEqual([])
    })
  })

  describe('listTags', () => {
    it('returns the Tags associated with a bookmark via BookmarkTag', async () => {
      const created = await repo.create({ originalURL: 'https://example.com/j' })
      await db.tags.add({ id: 'tag-a', name: '旅遊', createdAt: '', updatedAt: '' })
      await db.tags.add({ id: 'tag-b', name: '美食', createdAt: '', updatedAt: '' })
      await db.bookmarkTags.add({ bookmarkId: created.id, tagId: 'tag-a', createdAt: '' })
      await db.bookmarkTags.add({ bookmarkId: created.id, tagId: 'tag-b', createdAt: '' })

      const tags = await repo.listTags(created.id)

      expect(tags.map((t) => t.name).sort()).toEqual(['旅遊', '美食'])
    })

    it('returns an empty array when a bookmark has no tags', async () => {
      const created = await repo.create({ originalURL: 'https://example.com/k' })
      expect(await repo.listTags(created.id)).toEqual([])
    })
  })
})
