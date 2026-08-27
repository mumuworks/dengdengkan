import type { AppDatabase } from '../../db/AppDatabase'
import type { TagRepository } from '../TagRepository'
import type { Tag, BookmarkTag } from '../../domain/tag'
import { normalizeForCompare } from '../../utils/textSearch'
import { generateId } from '../../utils/id'

export class DexieTagRepository implements TagRepository {
  private readonly db: AppDatabase

  constructor(db: AppDatabase) {
    this.db = db
  }

  async findOrCreate(name: string): Promise<Tag> {
    const trimmed = name.trim()
    if (trimmed.length === 0) {
      throw new Error('Tag name must not be empty')
    }
    const key = normalizeForCompare(trimmed)

    return this.db.transaction('rw', this.db.tags, async () => {
      const all = await this.db.tags.toArray()
      const existing = all.find((tag) => normalizeForCompare(tag.name) === key)
      if (existing) return existing

      const now = new Date().toISOString()
      const tag: Tag = { id: generateId(), name: trimmed, createdAt: now, updatedAt: now }
      await this.db.tags.add(tag)
      return tag
    })
  }

  async getById(id: string): Promise<Tag | undefined> {
    return this.db.tags.get(id)
  }

  async list(): Promise<Tag[]> {
    return this.db.tags.orderBy('name').toArray()
  }

  async listAssociations(): Promise<BookmarkTag[]> {
    return this.db.bookmarkTags.toArray()
  }

  async assign(bookmarkId: string, tagId: string): Promise<void> {
    await this.db.transaction('rw', this.db.bookmarkTags, async () => {
      const existing = await this.db.bookmarkTags.get([bookmarkId, tagId])
      if (existing) return
      await this.db.bookmarkTags.add({
        bookmarkId,
        tagId,
        createdAt: new Date().toISOString(),
      })
    })
  }

  async removeAssociation(bookmarkId: string, tagId: string): Promise<void> {
    await this.db.bookmarkTags.delete([bookmarkId, tagId])
  }
}
