import type { Category, NewCategoryInput } from '../domain/category'

/**
 * Deliberately no `delete` method: Developer Handoff §7.2 forbids implementing
 * category deletion before the Bookmark-transfer rule is decided (PRD-I03).
 * Renaming/deleting the system "未整理" category is rejected by the implementation
 * regardless of caller (Technical Architecture Proposal §3.3).
 */
export interface CategoryRepository {
  create(input: NewCategoryInput): Promise<Category>
  getById(id: string): Promise<Category | undefined>
  list(): Promise<Category[]>
  update(id: string, changes: Partial<Pick<Category, 'name' | 'sortOrder'>>): Promise<Category>
}
