import { useState, type FormEvent } from 'react'
import { validateUrl, type UrlValidationFailureReason } from '../../utils/urlValidator'
import styles from './PasteUrlForm.module.css'

/**
 * Minimal Phase 1 collection entry point (Interaction Spec §6.0 / §6.2 / §6.3):
 * paste a URL, category defaults to 未整理, tags/pin stay at their defaults — the
 * primary action must never be blocked by those optional fields. Category/Tag/Pin
 * controls themselves are P1-C2 scope and are intentionally not built here.
 */
export interface PasteUrlFormProps {
  onSubmit: (normalizedUrl: string) => Promise<void> | void
}

const ERROR_MESSAGES: Record<UrlValidationFailureReason, string> = {
  empty: '請先輸入網址。',
  invalidFormat: '這個網址看起來不完整，請確認後再試一次。',
  unsupportedScheme: '目前只支援 http 或 https 開頭的網址。',
}

export function PasteUrlForm({ onSubmit }: PasteUrlFormProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = validateUrl(value)
    if (!result.valid) {
      setError(ERROR_MESSAGES[result.reason])
      return
    }

    setError(null)
    await onSubmit(result.normalized)
    setValue('')
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label className={styles.label} htmlFor="paste-url-input">
        貼上網址
      </label>
      <input
        id="paste-url-input"
        className={styles.input}
        type="text"
        inputMode="url"
        placeholder="https://"
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          if (error) setError(null)
        }}
      />
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className={styles.submit}>
        幫我記住
      </button>
    </form>
  )
}
