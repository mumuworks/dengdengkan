import { db } from '../db'
import {
  DexieBookmarkRepository,
  DexieCategoryRepository,
  DexieSettingsRepository,
  DexieTagRepository,
} from '../repositories/dexie'

/**
 * Composition root: wires the Dexie repository implementations to the shared
 * database singleton. Hooks/UI import these instances, never `db` tables directly.
 */
export const bookmarkRepository = new DexieBookmarkRepository(db)
export const categoryRepository = new DexieCategoryRepository(db)
export const settingsRepository = new DexieSettingsRepository(db)
export const tagRepository = new DexieTagRepository(db)
