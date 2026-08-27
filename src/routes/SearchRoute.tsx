import { useSearch, type SearchScope } from '../hooks/useSearch'
import { CollectionRow } from '../components/content/CollectionRow'
import { EmptyState } from '../components/feedback/EmptyState'
import styles from './SearchRoute.module.css'

const SCOPES: { value: SearchScope; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'category', label: '分類' },
  { value: 'tag', label: '標籤' },
]

/**
 * 搜尋 (Design Spec §24 Screen 9, Interaction §12, PRD §9.7). Empty query shows
 * no results and no suggestions (Interaction §12 Exception Handling: 空輸入不顯示
 * 熱門或推薦內容). Clicking a result only navigates — it must never update
 * `lastOpenedAt` on exposure (Developer Handoff §8.3 / BR-009), which
 * `CollectionRow`'s plain `Link` already guarantees.
 */
export function SearchRoute() {
  const { query, setQuery, scope, setScope, results, loaded, clear } = useSearch()
  const trimmedQuery = query.trim()

  return (
    <section>
      <h1>搜尋</h1>

      <input
        className={styles.input}
        type="search"
        aria-label="搜尋"
        placeholder="搜尋收藏、分類或標籤"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className={styles.scopeChips} role="tablist" aria-label="搜尋範圍">
        {SCOPES.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={scope === item.value}
            className={
              scope === item.value ? `${styles.scopeChip} ${styles.scopeChipActive}` : styles.scopeChip
            }
            onClick={() => setScope(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!loaded || trimmedQuery.length === 0 ? null : results.length === 0 ? (
        <EmptyState title="沒有找到符合的內容。" actionLabel="清除搜尋" onAction={clear} />
      ) : (
        <ul className={styles.results}>
          {results.map((bookmark) => (
            <li key={bookmark.id}>
              <CollectionRow bookmark={bookmark} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
