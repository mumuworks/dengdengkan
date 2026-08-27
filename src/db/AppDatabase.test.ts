import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppDatabase } from './AppDatabase'
import { TABLE_NAMES } from './schema'
import { SYSTEM_UNORGANIZED_CATEGORY_ID } from '../domain/category'
import { APP_SETTINGS_ID } from '../domain/settings'

function uniqueDbName(): string {
  return `test-app-db-${Math.random().toString(36).slice(2)}`
}

describe('AppDatabase schema v1', () => {
  let db: AppDatabase

  beforeEach(() => {
    db = new AppDatabase(uniqueDbName())
  })

  afterEach(async () => {
    db.close()
    await db.delete()
  })

  it('is created at schema version 1', async () => {
    await db.open()
    expect(db.verno).toBe(1)
  })

  it('creates all five Phase 1 tables (Decision Log 2026-08-27 Decision 2)', async () => {
    await db.open()
    const tableNames = db.tables.map((table) => table.name).sort()
    expect(tableNames).toEqual(
      [
        TABLE_NAMES.bookmarks,
        TABLE_NAMES.categories,
        TABLE_NAMES.tags,
        TABLE_NAMES.bookmarkTags,
        TABLE_NAMES.settings,
      ].sort(),
    )
  })

  it('gives bookmarkTags a compound primary key over (bookmarkId, tagId)', async () => {
    await db.open()
    const primKey = db.bookmarkTags.schema.primKey
    expect(primKey.compound).toBe(true)
    expect(primKey.keyPath).toEqual(['bookmarkId', 'tagId'])
  })

  it('seeds the "未整理" system category on first populate', async () => {
    await db.open()
    const category = await db.categories.get(SYSTEM_UNORGANIZED_CATEGORY_ID)
    expect(category).toMatchObject({
      id: SYSTEM_UNORGANIZED_CATEGORY_ID,
      name: '未整理',
      isSystem: true,
    })
  })

  it('seeds a default AppSettings record on first populate', async () => {
    await db.open()
    const settings = await db.settings.get(APP_SETTINGS_ID)
    expect(settings).toMatchObject({ id: APP_SETTINGS_ID, onboardingCompleted: false })
  })

  it('ensureSystemCategory repairs the system category if it is ever deleted', async () => {
    await db.open()
    await db.categories.delete(SYSTEM_UNORGANIZED_CATEGORY_ID)
    expect(await db.categories.get(SYSTEM_UNORGANIZED_CATEGORY_ID)).toBeUndefined()

    await db.ensureSystemCategory()

    const repaired = await db.categories.get(SYSTEM_UNORGANIZED_CATEGORY_ID)
    expect(repaired).toMatchObject({ id: SYSTEM_UNORGANIZED_CATEGORY_ID, isSystem: true })
  })

  it('ensureSettings repairs the settings record if it is ever deleted', async () => {
    await db.open()
    await db.settings.delete(APP_SETTINGS_ID)
    expect(await db.settings.get(APP_SETTINGS_ID)).toBeUndefined()

    await db.ensureSettings()

    expect(await db.settings.get(APP_SETTINGS_ID)).toMatchObject({ id: APP_SETTINGS_ID })
  })

  it('persists data across close/reopen of the same named database', async () => {
    const name = uniqueDbName()
    const first = new AppDatabase(name)
    await first.open()
    await first.categories.add({
      id: 'cat-1',
      name: '旅遊',
      isSystem: false,
      sortOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    first.close()

    const reopened = new AppDatabase(name)
    await reopened.open()
    expect(reopened.verno).toBe(1)
    const category = await reopened.categories.get('cat-1')
    expect(category).toMatchObject({ id: 'cat-1', name: '旅遊' })

    reopened.close()
    await reopened.delete()
  })
})
