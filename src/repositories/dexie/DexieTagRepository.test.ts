import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppDatabase } from '../../db/AppDatabase'
import { DexieTagRepository } from './DexieTagRepository'

function uniqueDbName(): string {
  return `test-tag-repo-${Math.random().toString(36).slice(2)}`
}

describe('DexieTagRepository', () => {
  let db: AppDatabase
  let repo: DexieTagRepository

  beforeEach(async () => {
    db = new AppDatabase(uniqueDbName())
    await db.open()
    repo = new DexieTagRepository(db)
  })

  afterEach(async () => {
    db.close()
    await db.delete()
  })

  describe('findOrCreate', () => {
    it('creates a new Tag preserving the caller-provided display name', async () => {
      const tag = await repo.findOrCreate('  work  ')
      expect(tag.name).toBe('work')
      expect(tag.createdAt).toBe(tag.updatedAt)
    })

    it('rejects a blank (post-trim) name', async () => {
      await expect(repo.findOrCreate('   ')).rejects.toThrow()
    })

    it('reuses an existing Tag for a case/width-insensitive duplicate and preserves the first display name', async () => {
      const first = await repo.findOrCreate('work')
      const second = await repo.findOrCreate('WORK')
      const third = await repo.findOrCreate('ＷＯＲＫ')

      expect(second.id).toBe(first.id)
      expect(third.id).toBe(first.id)
      expect(second.name).toBe('work')
      expect(third.name).toBe('work')
      expect(await db.tags.count()).toBe(1)
    })

    it('does not dedupe distinct names', async () => {
      const a = await repo.findOrCreate('工作')
      const b = await repo.findOrCreate('旅遊')
      expect(a.id).not.toBe(b.id)
      expect(await db.tags.count()).toBe(2)
    })
  })

  describe('getById / list', () => {
    it('returns undefined for a missing Tag', async () => {
      expect(await repo.getById('does-not-exist')).toBeUndefined()
    })

    it('lists all Tags', async () => {
      await repo.findOrCreate('工作')
      await repo.findOrCreate('旅遊')
      const all = await repo.list()
      expect(all.map((t) => t.name).sort()).toEqual(['旅遊', '工作'].sort())
    })
  })

  describe('assign / removeAssociation', () => {
    it('creates a BookmarkTag association', async () => {
      const tag = await repo.findOrCreate('工作')
      await repo.assign('bookmark-1', tag.id)

      const associations = await repo.listAssociations()
      expect(associations).toEqual([
        expect.objectContaining({ bookmarkId: 'bookmark-1', tagId: tag.id }),
      ])
    })

    it('is idempotent: assigning an already-assigned pair does not create a duplicate', async () => {
      const tag = await repo.findOrCreate('工作')
      await repo.assign('bookmark-1', tag.id)
      await repo.assign('bookmark-1', tag.id)

      expect(await db.bookmarkTags.count()).toBe(1)
    })

    it('removes only the association, not the Bookmark or the Tag entity', async () => {
      const tag = await repo.findOrCreate('工作')
      await repo.assign('bookmark-1', tag.id)

      await repo.removeAssociation('bookmark-1', tag.id)

      expect(await db.bookmarkTags.count()).toBe(0)
      expect(await repo.getById(tag.id)).toBeDefined()
    })

    it('is a no-op when removing an association that does not exist', async () => {
      await expect(repo.removeAssociation('no-such-bookmark', 'no-such-tag')).resolves.toBeUndefined()
    })
  })

  describe('listAssociations', () => {
    it('returns every BookmarkTag across all bookmarks', async () => {
      const tagA = await repo.findOrCreate('工作')
      const tagB = await repo.findOrCreate('旅遊')
      await repo.assign('bookmark-1', tagA.id)
      await repo.assign('bookmark-2', tagB.id)

      const associations = await repo.listAssociations()
      expect(associations).toHaveLength(2)
    })
  })
})
