import Dexie, { type Table } from 'dexie'
import type { Bookmark } from '../domain/bookmark'
import { SYSTEM_UNORGANIZED_CATEGORY_ID, type Category } from '../domain/category'
import type { Tag, BookmarkTag } from '../domain/tag'
import { APP_SETTINGS_ID, DEFAULT_APP_SETTINGS, type AppSettings } from '../domain/settings'
import { DB_NAME, SCHEMA_V1 } from './schema'

/**
 * Dexie database for 《等等看》Phase 1.
 * Schema versioning lives here; future migrations add `this.version(2).stores({...})`
 * without removing the v1 definition (Developer Handoff §14.1).
 */
export class AppDatabase extends Dexie {
  bookmarks!: Table<Bookmark, string>
  categories!: Table<Category, string>
  tags!: Table<Tag, string>
  bookmarkTags!: Table<BookmarkTag, [string, string]>
  settings!: Table<AppSettings, string>

  constructor(name: string = DB_NAME) {
    super(name)
    this.version(1).stores(SCHEMA_V1)
    this.on('populate', () => this.seed())
  }

  private async seed(): Promise<void> {
    const now = new Date().toISOString()
    await this.categories.add({
      id: SYSTEM_UNORGANIZED_CATEGORY_ID,
      name: '未整理',
      isSystem: true,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    })
    await this.settings.add({ ...DEFAULT_APP_SETTINGS })
  }

  /**
   * Repairs the "未整理" system category if it is ever missing.
   * Technical Architecture Proposal §3.3: must be guaranteed to exist after startup migration.
   */
  async ensureSystemCategory(): Promise<void> {
    const existing = await this.categories.get(SYSTEM_UNORGANIZED_CATEGORY_ID)
    if (existing) return
    const now = new Date().toISOString()
    await this.categories.add({
      id: SYSTEM_UNORGANIZED_CATEGORY_ID,
      name: '未整理',
      isSystem: true,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    })
  }

  /** Repairs the single AppSettings record if it is ever missing. */
  async ensureSettings(): Promise<void> {
    const existing = await this.settings.get(APP_SETTINGS_ID)
    if (existing) return
    await this.settings.add({ ...DEFAULT_APP_SETTINGS })
  }

  async ensureBaseline(): Promise<void> {
    await this.ensureSystemCategory()
    await this.ensureSettings()
  }
}
