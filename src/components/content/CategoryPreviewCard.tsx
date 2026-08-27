import { Link } from 'react-router'
import styles from './CategoryPreviewCard.module.css'

/**
 * Design Spec §11.2: left = name + count, right = up to 4 preview images (or a
 * Placeholder token when none are available). The whole card is clickable.
 */
export interface CategoryPreviewCardProps {
  categoryId: string
  name: string
  count: number
  previewImageUrls: string[]
}

export function CategoryPreviewCard({
  categoryId,
  name,
  count,
  previewImageUrls,
}: CategoryPreviewCardProps) {
  return (
    <Link to={`/category/${categoryId}`} className={styles.card}>
      <span className={styles.info}>
        <span className={styles.name}>{name}</span>
        <span className={styles.count}>{count} 筆收藏</span>
      </span>
      <span className={styles.previews}>
        {previewImageUrls.length > 0 ? (
          previewImageUrls.map((url) => (
            <img key={url} className={styles.previewImage} src={url} alt="" />
          ))
        ) : (
          <span className={styles.previewPlaceholder} aria-hidden="true" />
        )}
      </span>
    </Link>
  )
}
