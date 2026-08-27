/**
 * Category domain model.
 * Field set per Developer Handoff §4.2. The system "未整理" category id is fixed
 * per Technical Architecture Proposal §3.3 (`system-unorganized`) and must always exist;
 * rename/delete are not decided for Phase 1 (see PRD-I03) and are intentionally not exposed.
 */

export const SYSTEM_UNORGANIZED_CATEGORY_ID = 'system-unorganized'

export interface Category {
  id: string
  name: string
  isSystem: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type NewCategoryInput = {
  name: string
  sortOrder?: number
}
