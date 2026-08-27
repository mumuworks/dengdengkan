import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppDatabase } from '../../db/AppDatabase'
import { DexieCategoryRepository } from './DexieCategoryRepository'
import { SYSTEM_UNORGANIZED_CATEGORY_ID } from '../../domain/category'

function uniqueDbName(): string {
  return `test-category-repo-${Math.random().toString(36).slice(2)}`
}

describe('DexieCategoryRepository', () => {
  let db: AppDatabase
  let repo: DexieCategoryRepository

  beforeEach(async () => {
    db = new AppDatabase(uniqueDbName())
    await db.open()
    repo = new DexieCategoryRepository(db)
  })

  afterEach(async () => {
    db.close()
    await db.delete()
  })

  it('creates a category with trimmed name', async () => {
    const category = await repo.create({ name: '  旅遊  ' })
    expect(category.name).toBe('旅遊')
    expect(category.isSystem).toBe(false)
  })

  it('rejects an empty (or whitespace-only) name', async () => {
    await expect(repo.create({ name: '   ' })).rejects.toThrow()
  })

  it('reads a category by id, including the pre-seeded system category', async () => {
    const system = await repo.getById(SYSTEM_UNORGANIZED_CATEGORY_ID)
    expect(system).toMatchObject({ name: '未整理', isSystem: true })
  })

  it('lists categories ordered by sortOrder', async () => {
    await repo.create({ name: 'A', sortOrder: 5 })
    await repo.create({ name: 'B', sortOrder: 1 })
    const all = await repo.list()
    const sortOrders = all.map((c) => c.sortOrder)
    expect(sortOrders).toEqual([...sortOrders].sort((a, b) => a - b))
  })

  it('updates a category name', async () => {
    const created = await repo.create({ name: '旅遊' })
    const updated = await repo.update(created.id, { name: '美食' })
    expect(updated.name).toBe('美食')
  })

  it('refuses to rename the system 未整理 category (Technical Architecture §3.3)', async () => {
    await expect(
      repo.update(SYSTEM_UNORGANIZED_CATEGORY_ID, { name: '改名' }),
    ).rejects.toThrow()
  })

  it('has no delete method (Developer Handoff §7.2: deletion rule undecided)', () => {
    expect((repo as unknown as Record<string, unknown>).delete).toBeUndefined()
  })
})
