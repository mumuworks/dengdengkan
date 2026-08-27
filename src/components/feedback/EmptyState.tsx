import styles from './EmptyState.module.css'

/** Structure per Design Spec §15: Short Title → One-line Explanation → Optional Single Action. */
export interface EmptyStateProps {
  title: string
  explanation?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, explanation, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className={styles.root}>
      <p className={styles.title}>{title}</p>
      {explanation ? <p className={styles.explanation}>{explanation}</p> : null}
      {actionLabel ? (
        <button type="button" className={styles.action} onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
