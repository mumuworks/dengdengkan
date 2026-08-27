import type { AppDatabase } from '../../db/AppDatabase'
import type { SettingsRepository } from '../SettingsRepository'
import type { AppSettings } from '../../domain/settings'
import { APP_SETTINGS_ID, DEFAULT_APP_SETTINGS } from '../../domain/settings'

export class DexieSettingsRepository implements SettingsRepository {
  private readonly db: AppDatabase

  constructor(db: AppDatabase) {
    this.db = db
  }

  async get(): Promise<AppSettings> {
    const existing = await this.db.settings.get(APP_SETTINGS_ID)
    if (existing) return existing
    const seeded = { ...DEFAULT_APP_SETTINGS }
    await this.db.settings.add(seeded)
    return seeded
  }

  async update(changes: Partial<Omit<AppSettings, 'id'>>): Promise<AppSettings> {
    const current = await this.get()
    const updated: AppSettings = { ...current, ...changes }
    await this.db.settings.put(updated)
    return updated
  }
}
