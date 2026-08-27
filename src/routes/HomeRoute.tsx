import { EmptyState } from '../components/feedback/EmptyState'
import { CategoryPreviewCard } from '../components/content/CategoryPreviewCard'
import { HomeStickyNote } from '../features/home/HomeStickyNote'
import { PasteUrlForm } from '../features/collect/PasteUrlForm'
import { useHomeCategories } from '../hooks/useHomeCategories'
import { bookmarkRepository } from '../app/container'
import styles from './HomeRoute.module.css'

/**
 * 收藏首頁 (Design Spec §24 Screen 5 / PRD §9.2): title, single Home Sticky Note,
 * Category Preview Cards as the primary browsing entry, Bottom Navigation (via
 * AppShell). No most-recent/most-viewed list or carousel (PRD §9.2).
 *
 * The paste-URL entry point (Interaction §6.0) established in P1-C1 is kept as-is;
 * Category Preview Cards are the P1-C2a addition. Design Spec Screen 15 (首次使用)
 * shows Home Note + 未整理 + a compact Empty State together, so the Empty State
 * below supplements the category cards rather than replacing them.
 */
export function HomeRoute() {
  const { categories, refresh: refreshCategories } = useHomeCategories()
  const totalCount = categories === null ? null : categories.reduce((sum, c) => sum + c.count, 0)

  const handleCreate = async (url: string) => {
    await bookmarkRepository.create({ originalURL: url })
    await refreshCategories()
  }

  return (
    <section>
      <h1>收藏</h1>

      <div className={styles.note}>
        <HomeStickyNote />
      </div>

      <div className={styles.form}>
        <PasteUrlForm onSubmit={handleCreate} />
      </div>

      {categories === null ? null : (
        <ul className={styles.categoryList}>
          {categories.map(({ category, count, previewImageUrls }) => (
            <li key={category.id}>
              <CategoryPreviewCard
                categoryId={category.id}
                name={category.name}
                count={count}
                previewImageUrls={previewImageUrls}
              />
            </li>
          ))}
        </ul>
      )}

      {totalCount === 0 ? (
        <EmptyState
          title="還沒有收藏任何內容。"
          explanation="看到喜歡的內容，貼上網址交給《等等看》。"
        />
      ) : null}
    </section>
  )
}
