/**
 * AppSettings domain model — a single record per Developer Handoff §4.5.
 * Notification authorization and theme are explicitly NOT persisted here (§4.5);
 * they must always be read live from the platform.
 */

export const APP_SETTINGS_ID = 'app-settings'

export interface AppSettings {
  id: typeof APP_SETTINGS_ID
  homeNote: string
  dailyRecallEnabled: boolean
  dailyRecallHour: number
  dailyRecallMinute: number
  hasSeenDailyRecallPrompt: boolean
  dailyRecallPromptDismissedAt: string | null
  onboardingCompleted: boolean
  lastBackupAt: string | null
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  id: APP_SETTINGS_ID,
  homeNote: '',
  dailyRecallEnabled: false,
  dailyRecallHour: 20,
  dailyRecallMinute: 0,
  hasSeenDailyRecallPrompt: false,
  dailyRecallPromptDismissedAt: null,
  onboardingCompleted: false,
  lastBackupAt: null,
}
