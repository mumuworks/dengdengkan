import type { AppSettings } from '../domain/settings'

/**
 * Single AppSettings record (Developer Handoff §4.5). Notification authorization
 * and theme are intentionally not part of this model — they must be read live
 * from the platform, never persisted.
 */
export interface SettingsRepository {
  get(): Promise<AppSettings>
  update(changes: Partial<Omit<AppSettings, 'id'>>): Promise<AppSettings>
}
