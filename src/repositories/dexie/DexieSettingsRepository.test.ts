import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppDatabase } from '../../db/AppDatabase'
import { DexieSettingsRepository } from './DexieSettingsRepository'
import { APP_SETTINGS_ID } from '../../domain/settings'

function uniqueDbName(): string {
  return `test-settings-repo-${Math.random().toString(36).slice(2)}`
}

describe('DexieSettingsRepository', () => {
  let db: AppDatabase
  let repo: DexieSettingsRepository

  beforeEach(async () => {
    db = new AppDatabase(uniqueDbName())
    await db.open()
    repo = new DexieSettingsRepository(db)
  })

  afterEach(async () => {
    db.close()
    await db.delete()
  })

  it('returns the seeded default settings record', async () => {
    const settings = await repo.get()
    expect(settings).toMatchObject({ id: APP_SETTINGS_ID, dailyRecallHour: 20, dailyRecallMinute: 0 })
  })

  it('re-seeds a default record if it was ever deleted', async () => {
    await db.settings.delete(APP_SETTINGS_ID)
    const settings = await repo.get()
    expect(settings).toMatchObject({ id: APP_SETTINGS_ID })
  })

  it('updates settings and persists the change', async () => {
    const updated = await repo.update({ homeNote: '今天想紀錄的事' })
    expect(updated.homeNote).toBe('今天想紀錄的事')

    const reread = await repo.get()
    expect(reread.homeNote).toBe('今天想紀錄的事')
  })

  it('never exposes notification authorization or theme as persisted fields', async () => {
    const settings = await repo.get()
    expect('notificationAuthorization' in settings).toBe(false)
    expect('theme' in settings).toBe(false)
  })
})
