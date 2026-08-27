import { useParams, Link } from 'react-router'
import { useCategory } from '../hooks/useCategory'
import { useCategoryBookmarks } from '../hooks/useCategoryBookmarks'
import { CollectionRow } from '../components/content/CollectionRow'
import { EmptyState } from '../components/feedback/EmptyState'
import styles from './CategoryRoute.module.css'

/**
 * 分類收藏列表 (Design Spec §24 Screen 13/14, Interaction §9.1/§9.2). Only lists
 * bookmarks with `categoryId === category.id` and shows the defined Empty State.
 * Sorting/filtering is an Open Decision (DES-I02/PRD-I04) and is intentionally
 * omitted rather than invented.
 */
export function CategoryRoute() {
  const { id } = useParams<{ id: string }>()
  const category = useCategory(id)
  const { bookmarks } = useCategoryBookmarks(id)

  if (category === undefined || bookmarks === null) return null

  if (category === null) {
    return (
      <section>
        <Link to="/" className={styles.back}>
          ← 返回
        </Link>
        <EmptyState title="找不到這個分類。" />
      </section>
    )
  }

  return (
    <section>
      <Link to="/" className={styles.back}>
        ← 返回
      </Link>
      <h1>{category.name}</h1>
      <p className={styles.count}>{bookmarks.length} 筆收藏</p>

      {bookmarks.length === 0 ? (
        <EmptyState
          title="這個分類還是空的。"
          explanation="下次收藏時選擇這個分類，就會出現在這裡。"
        />
      ) : (
        <ul className={styles.list}>
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id}>
              <CollectionRow bookmark={bookmark} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
