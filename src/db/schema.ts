/**
 * Dexie Schema v1 — full Phase 1 schema built in P1-C1 per
 * DECISION_LOG.md 2026-08-27 Decision 2 / Technical Architecture Proposal §23.3.
 *
 * All five tables (bookmarks/categories/tags/bookmarkTags/settings) are created
 * in this single version even though `tags`/`bookmarkTags` are not yet wired into
 * any UI, to avoid a second schema migration when P1-C2 enables tagging.
 */

export const DB_NAME = 'dengdengkan'

export const TABLE_NAMES = {
  bookmarks: 'bookmarks',
  categories: 'categories',
  tags: 'tags',
  bookmarkTags: 'bookmarkTags',
  settings: 'settings',
} as const

/**
 * Dexie store-definition strings for `db.version(1).stores({...})`.
 * First field in each string is the primary key.
 */
export const SCHEMA_V1 = {
  [TABLE_NAMES.bookmarks]:
    'id, categoryId, createdAt, updatedAt, lastOpenedAt, isPinnedToBoard, metadataState',
  [TABLE_NAMES.categories]: 'id, isSystem, sortOrder, name',
  [TABLE_NAMES.tags]: 'id, name',
  [TABLE_NAMES.bookmarkTags]: '[bookmarkId+tagId], bookmarkId, tagId',
  [TABLE_NAMES.settings]: 'id',
} as const
