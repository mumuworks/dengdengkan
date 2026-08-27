import type { AppDatabase } from '../../db/AppDatabase'
import type { BookmarkRepository } from '../BookmarkRepository'
import type { Bookmark, NewBookmarkInput } from '../../domain/bookmark'
import { SYSTEM_UNORGANIZED_CATEGORY_ID } from '../../domain/category'
import { generateId } from '../../utils/id'

function normalizeReason(reason: string | null | undefined): string | null {
  if (reason == null) return null
  const trimmed = reason.trim()
  return trimmed.length === 0 ? null : trimmed
}

export class DexieBookmarkRepository implements BookmarkRepository {
  private readonly db: AppDatabase

  constructor(db: AppDatabase) {
    this.db = db
  }

  async create(input: NewBookmarkInput): Promise<Bookmark> {
    const now = new Date().toISOString()
    const bookmark: Bookmark = {
      id: generateId(),
      originalURL: input.originalURL,
      title: input.title ?? null,
      source: input.source ?? null,
      summary: input.summary ?? null,
      imageURL: input.imageURL ?? null,
      reason: normalizeReason(input.reason),
      categoryId: input.categoryId ?? SYSTEM_UNORGANIZED_CATEGORY_ID,
      isPinnedToBoard: input.isPinnedToBoard ?? false,
      metadataState: 'pending',
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: null,
    }
    await this.db.bookmarks.add(bookmark)
    return bookmark
  }

  async getById(id: string): Promise<Bookmark | undefined> {
    return this.db.bookmarks.get(id)
  }

  async list(): Promise<Bookmark[]> {
    return this.db.bookmarks.toArray()
  }

  async update(
    id: string,
    changes: Partial<Omit<Bookmark, 'id' | 'createdAt'>>,
  ): Promise<Bookmark> {
    const existing = await this.db.bookmarks.get(id)
    if (!existing) {
      throw new Error(`Bookmark not found: ${id}`)
    }
    const updated: Bookmark = {
      ...existing,
      ...changes,
      reason: 'reason' in changes ? normalizeReason(changes.reason) : existing.reason,
      updatedAt: new Date().toISOString(),
    }
    await this.db.bookmarks.put(updated)
    return updated
  }

  /** Cascades to BookmarkTag per Developer Handoff §4.4. */
  async delete(id: string): Promise<void> {
    await this.db.transaction('rw', this.db.bookmarks, this.db.bookmarkTags, async () => {
      await this.db.bookmarkTags.where('bookmarkId').equals(id).delete()
      await this.db.bookmarks.delete(id)
    })
  }
}
