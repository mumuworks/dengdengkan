import type { AppDatabase } from '../../db/AppDatabase'
import type { CategoryRepository } from '../CategoryRepository'
import type { Category, NewCategoryInput } from '../../domain/category'
import { generateId } from '../../utils/id'

export class DexieCategoryRepository implements CategoryRepository {
  private readonly db: AppDatabase

  constructor(db: AppDatabase) {
    this.db = db
  }

  async create(input: NewCategoryInput): Promise<Category> {
    const name = input.name.trim()
    if (name.length === 0) {
      throw new Error('Category name must not be empty')
    }
    const now = new Date().toISOString()
    const sortOrder = input.sortOrder ?? (await this.db.categories.count())
    const category: Category = {
      id: generateId(),
      name,
      isSystem: false,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.categories.add(category)
    return category
  }

  async getById(id: string): Promise<Category | undefined> {
    return this.db.categories.get(id)
  }

  async list(): Promise<Category[]> {
    return this.db.categories.orderBy('sortOrder').toArray()
  }

  async update(
    id: string,
    changes: Partial<Pick<Category, 'name' | 'sortOrder'>>,
  ): Promise<Category> {
    const existing = await this.db.categories.get(id)
    if (!existing) {
      throw new Error(`Category not found: ${id}`)
    }
    if (existing.isSystem && changes.name !== undefined && changes.name !== existing.name) {
      throw new Error('System category name cannot be changed')
    }
    const name = changes.name !== undefined ? changes.name.trim() : existing.name
    if (name.length === 0) {
      throw new Error('Category name must not be empty')
    }
    const updated: Category = {
      ...existing,
      ...changes,
      name,
      updatedAt: new Date().toISOString(),
    }
    await this.db.categories.put(updated)
    return updated
  }
}
