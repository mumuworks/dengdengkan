import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HomeStickyNote } from './HomeStickyNote'
import { db } from '../../db'
import { APP_SETTINGS_ID } from '../../domain/settings'

/**
 * Uses the real Dexie/IndexedDB stack (fake-indexeddb), not mocks, so autosave
 * is proven against actual storage per the Repository boundary.
 */
describe('HomeStickyNote', () => {
  beforeEach(async () => {
    await db.settings.clear()
  })

  afterEach(async () => {
    await db.settings.clear()
  })

  it('loads the persisted homeNote and displays it', async () => {
    await db.settings.put({
      id: APP_SETTINGS_ID,
      homeNote: '既有筆記',
      dailyRecallEnabled: false,
      dailyRecallHour: 20,
      dailyRecallMinute: 0,
      hasSeenDailyRecallPrompt: false,
      dailyRecallPromptDismissedAt: null,
      onboardingCompleted: false,
      lastBackupAt: null,
    })

    render(<HomeStickyNote />)

    expect(await screen.findByDisplayValue('既有筆記')).toBeInTheDocument()
  })

  it('persists the note to IndexedDB when the field loses focus', async () => {
    render(<HomeStickyNote />)
    const textarea = await screen.findByLabelText('首頁便條紙')

    fireEvent.change(textarea, { target: { value: '今天想紀錄的事' } })
    fireEvent.blur(textarea)

    await screen.findByDisplayValue('今天想紀錄的事')
    const settings = await db.settings.get(APP_SETTINGS_ID)
    expect(settings?.homeNote).toBe('今天想紀錄的事')
  })

  it('keeps an empty note as a valid, persisted state', async () => {
    render(<HomeStickyNote />)
    const textarea = await screen.findByLabelText('首頁便條紙')

    fireEvent.change(textarea, { target: { value: '' } })
    fireEvent.blur(textarea)

    await new Promise((resolve) => setTimeout(resolve, 0))
    const settings = await db.settings.get(APP_SETTINGS_ID)
    expect(settings?.homeNote).toBe('')
  })
})
