import type { Tag, BookmarkTag } from '../domain/tag'

/**
 * P1-C2b Tag surface is deliberately limited to what Decision Closure Decision 1
 * approved: normalized create-or-reuse, listing, and Bookmark association. No
 * rename, no delete-entity, no orphan cleanup — those remain out of scope.
 */
export interface TagRepository {
  /**
   * Returns the existing Tag whose name matches after normalization (trim + NFKC +
   * case-insensitive), or creates a new one preserving the caller's exact display
   * name (Decision Closure Decision 1). Rejects a blank (post-trim) name.
   */
  findOrCreate(name: string): Promise<Tag>
  getById(id: string): Promise<Tag | undefined>
  list(): Promise<Tag[]>
  /** Every BookmarkTag association, for Search's 標籤／全部 scope (Decision Closure Decision 4). */
  listAssociations(): Promise<BookmarkTag[]>
  /** Idempotent: no-op if `(bookmarkId, tagId)` is already assigned. */
  assign(bookmarkId: string, tagId: string): Promise<void>
  /** Removes only the BookmarkTag association — never the Bookmark or the Tag entity. */
  removeAssociation(bookmarkId: string, tagId: string): Promise<void>
}
