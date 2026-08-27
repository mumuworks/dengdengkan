import { useMemo, useState } from 'react'
import { usePinnedBookmarks } from '../hooks/usePinnedBookmarks'
import { useCategories } from '../hooks/useCategories'
import { PegboardCard } from '../components/content/PegboardCard'
import { EmptyState } from '../components/feedback/EmptyState'
import styles from './PegboardRoute.module.css'

/**
 * 洞洞板 (Design Spec §24 Screen 8/16, Interaction §11). Only bookmarks with
 * `isPinnedToBoard === true` are shown. Filter Chips are 全部 + Category per
 * Decision Closure P1-C2b Decision 3 — Tag filtering is out of scope this slice.
 * The overall-empty state and the "this category has no pins" state use distinct
 * copy so the two data conditions are never conflated.
 */
export function PegboardRoute() {
  const { bookmarks } = usePinnedBookmarks()
  const categories = useCategories()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!bookmarks) return null
    if (selectedCategoryId === null) return bookmarks
    return bookmarks.filter((bookmark) => bookmark.categoryId === selectedCategoryId)
  }, [bookmarks, selectedCategoryId])

  if (bookmarks === null || categories === null) return null

  if (bookmarks.length === 0) {
    return (
      <section>
        <h1>洞洞板</h1>
        <EmptyState
          title="洞洞板還是空的。"
          explanation="可以把特別想留下來的收藏釘在這裡。"
        />
      </section>
    )
  }

  return (
    <section>
      <h1>洞洞板</h1>

      <div className={styles.chips} role="tablist" aria-label="洞洞板篩選">
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategoryId === null}
          className={selectedCategoryId === null ? `${styles.chip} ${styles.chipActive}` : styles.chip}
          onClick={() => setSelectedCategoryId(null)}
        >
          全部
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={selectedCategoryId === category.id}
            className={
              selectedCategoryId === category.id ? `${styles.chip} ${styles.chipActive}` : styles.chip
            }
            onClick={() => setSelectedCategoryId(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {filtered && filtered.length === 0 ? (
        <EmptyState title="這個分類目前沒有釘選的收藏。" />
      ) : (
        <ul className={styles.grid}>
          {(filtered ?? []).map((bookmark) => (
            <li key={bookmark.id}>
              <PegboardCard bookmark={bookmark} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
