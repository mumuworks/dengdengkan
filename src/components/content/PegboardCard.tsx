import { Link } from 'react-router'
import type { Bookmark } from '../../domain/bookmark'
import { getDisplayHost } from '../../utils/url'
import styles from './PegboardCard.module.css'

/**
 * Design Spec §11.4: pinned visual, image-or-Placeholder. Reason is only shown
 * when present — no empty sticky-note area (Interaction §11.1 Exception Handling).
 */
export interface PegboardCardProps {
  bookmark: Bookmark
}

export function PegboardCard({ bookmark }: PegboardCardProps) {
  const title = bookmark.title ?? bookmark.originalURL
  const source = bookmark.source ?? getDisplayHost(bookmark.originalURL)

  return (
    <Link to={`/bookmark/${bookmark.id}`} className={styles.card}>
      {bookmark.imageURL ? (
        <img className={styles.image} src={bookmark.imageURL} alt="" />
      ) : (
        <span className={styles.imagePlaceholder} aria-hidden="true" />
      )}
      <span className={styles.title}>{title}</span>
      <span className={styles.source}>{source}</span>
      {bookmark.reason ? <span className={styles.reason}>{bookmark.reason}</span> : null}
    </Link>
  )
}
