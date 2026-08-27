/**
 * Bookmark domain model.
 * Field set and rules per docs/等等看_Developer_Handoff_v1.0.md §4.1, §5.1, BR-002~BR-010.
 * Dates are stored as ISO 8601 strings to match the Backup Envelope contract (§14.3 / Handoff §12.1).
 */

export type MetadataState = 'pending' | 'resolved' | 'failed'

export interface Bookmark {
  id: string
  originalURL: string
  title: string | null
  source: string | null
  summary: string | null
  imageURL: string | null
  reason: string | null
  categoryId: string
  isPinnedToBoard: boolean
  metadataState: MetadataState
  createdAt: string
  updatedAt: string
  lastOpenedAt: string | null
}

export type NewBookmarkInput = {
  originalURL: string
  categoryId?: string
  title?: string | null
  source?: string | null
  summary?: string | null
  imageURL?: string | null
  reason?: string | null
  isPinnedToBoard?: boolean
}
