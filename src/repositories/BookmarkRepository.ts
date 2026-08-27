import type { Bookmark, NewBookmarkInput } from '../domain/bookmark'

/**
 * UI/hooks access bookmark data only through this interface — never through Dexie
 * tables directly — so the persistence implementation can be swapped later
 * (Technical Architecture Proposal §23.2).
 */
export interface BookmarkRepository {
  create(input: NewBookmarkInput): Promise<Bookmark>
  getById(id: string): Promise<Bookmark | undefined>
  list(): Promise<Bookmark[]>
  update(id: string, changes: Partial<Omit<Bookmark, 'id' | 'createdAt'>>): Promise<Bookmark>
  delete(id: string): Promise<void>
}
