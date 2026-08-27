import { describe, expect, it } from 'vitest'
import { APP_SETTINGS_ID, DEFAULT_APP_SETTINGS } from './settings'

describe('DEFAULT_APP_SETTINGS', () => {
  it('matches the Developer Handoff §4.5 defaults', () => {
    expect(DEFAULT_APP_SETTINGS).toEqual({
      id: APP_SETTINGS_ID,
      homeNote: '',
      dailyRecallEnabled: false,
      dailyRecallHour: 20,
      dailyRecallMinute: 0,
      hasSeenDailyRecallPrompt: false,
      dailyRecallPromptDismissedAt: null,
      onboardingCompleted: false,
      lastBackupAt: null,
    })
  })
})
