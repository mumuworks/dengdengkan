import { AppDatabase } from './AppDatabase'

/** Singleton Dexie instance shared by all pages within this browser origin (see BR-001). */
export const db = new AppDatabase()
