import { useState } from 'react'
import { useAppSettings } from '../../hooks/useAppSettings'
import { settingsRepository } from '../../app/container'
import styles from './HomeStickyNote.module.css'

/**
 * Home Sticky Note (PRD §9.2, Interaction §5.1, Design Spec §13.1): a single,
 * always-present note. Click/tap edits in place; losing focus auto-saves.
 * No date, no checkbox, no completion state.
 */
export function HomeStickyNote() {
  const settings = useAppSettings()
  const [override, setOverride] = useState<string | null>(null)

  if (settings === null) return null

  const value = override ?? settings.homeNote

  const handleBlur = async () => {
    await settingsRepository.update({ homeNote: value })
  }

  return (
    <div className={styles.note}>
      <textarea
        className={styles.textarea}
        aria-label="首頁便條紙"
        value={value}
        onChange={(event) => setOverride(event.target.value)}
        onBlur={handleBlur}
        rows={3}
      />
    </div>
  )
}
