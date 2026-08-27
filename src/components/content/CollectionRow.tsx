import { Link } from 'react-router'
import type { Bookmark } from '../../domain/bookmark'
import { getDisplayHost } from '../../utils/url'
import styles from './CollectionRow.module.css'

/**
 * Design Spec §11.3: image or Placeholder, title-or-URL text, source. The whole
 * row is clickable and leads to Bookmark Detail.
 */
export interface CollectionRowProps {
  bookmark: Bookmark
}

export function CollectionRow({ bookmark }: CollectionRowProps) {
  const title = bookmark.title ?? bookmark.originalURL
  const source = bookmark.source ?? getDisplayHost(bookmark.originalURL)

  return (
    <Link to={`/bookmark/${bookmark.id}`} className={styles.row}>
      {bookmark.imageURL ? (
        <img className={styles.thumb} src={bookmark.imageURL} alt="" />
      ) : (
        <span className={styles.thumbPlaceholder} aria-hidden="true" />
      )}
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        <span className={styles.source}>{source}</span>
      </span>
    </Link>
  )
}
