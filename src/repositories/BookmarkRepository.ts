import type { Bookmark, NewBookmarkInput } from '../domain/bookmark'
import type { Tag } from '../domain/tag'

/**
 * UI/hooks access bookmark data only through this interface — never through Dexie
 * tables directly — so the persistence implementation can be swapped later
 * (Technical Architecture Proposal §23.2).
 */
export interface BookmarkRepository {
  create(input: NewBookmarkInput): Promise<Bookmark>
  getById(id: string): Promise<Bookmark | undefined>
  list(): Promise<Bookmark[]>
  /** Bookmarks with `categoryId === categoryId`, for the Category collection list (Interaction §9.1). */
  listByCategory(categoryId: string): Promise<Bookmark[]>
  /** Bookmarks with `isPinnedToBoard === true`, for the Pegboard (Interaction §11). */
  listPinned(): Promise<Bookmark[]>
  update(id: string, changes: Partial<Omit<Bookmark, 'id' | 'createdAt'>>): Promise<Bookmark>
  delete(id: string): Promise<void>
  /**
   * Read-only join to the Tags currently associated with a bookmark, for Bookmark
   * Detail's Tag Chips (Interaction §8). This is not a Tag CRUD surface — creating,
   * renaming or normalizing Tags is P1-C2b scope.
   */
  listTags(bookmarkId: string): Promise<Tag[]>
}
