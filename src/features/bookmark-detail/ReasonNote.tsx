import { useState } from 'react'
import styles from './ReasonNote.module.css'

/**
 * Bookmark Reason Note (Interaction §8.1 / Design Spec §13.2): click-to-edit,
 * autosave on blur. When there is no reason, the full note area is not shown —
 * only a minimal, non-forcing entry point to add one is kept, per Interaction
 * §8.1 "不以引導文強迫填寫".
 */
export interface ReasonNoteProps {
  value: string | null
  onSave: (next: string) => Promise<void>
}

export function ReasonNote({ value, onSave }: ReasonNoteProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const startEditing = () => {
    setDraft(value ?? '')
    setEditing(true)
  }

  const handleBlur = async () => {
    setEditing(false)
    await onSave(draft)
  }

  if (editing) {
    return (
      <div className={styles.note}>
        <textarea
          className={styles.textarea}
          aria-label="收藏理由"
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={handleBlur}
          rows={3}
        />
      </div>
    )
  }

  if (value === null) {
    return (
      <button type="button" className={styles.addButton} onClick={startEditing}>
        新增收藏理由
      </button>
    )
  }

  return (
    <div className={styles.note}>
      <button type="button" className={styles.text} onClick={startEditing}>
        {value}
      </button>
    </div>
  )
}
