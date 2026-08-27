import { useMemo, useState } from 'react'
import type { Tag } from '../../domain/tag'
import { normalizeForCompare, normalizedIncludes } from '../../utils/textSearch'
import styles from './TagPicker.module.css'

/**
 * Tag Picker Sheet (Decision Closure P1-C2b Decision 2): opened from Bookmark
 * Detail's "編輯標籤"/"新增標籤" entry. Assign-existing and create-and-assign
 * only — no rename, no delete-entity, no standalone Tag management page.
 * Removing an already-assigned Tag happens via the chip on Detail itself, not here.
 */
export interface TagPickerProps {
  allTags: Tag[]
  assignedTagIds: ReadonlySet<string>
  onAssignExisting: (tag: Tag) => void | Promise<void>
  onCreateAndAssign: (name: string) => void | Promise<void>
  onClose: () => void
}

export function TagPicker({
  allTags,
  assignedTagIds,
  onAssignExisting,
  onCreateAndAssign,
  onClose,
}: TagPickerProps) {
  const [query, setQuery] = useState('')
  const trimmedQuery = query.trim()

  const filteredTags = useMemo(
    () => (trimmedQuery ? allTags.filter((tag) => normalizedIncludes(tag.name, trimmedQuery)) : allTags),
    [allTags, trimmedQuery],
  )

  const hasExactMatch = useMemo(() => {
    if (trimmedQuery.length === 0) return false
    const key = normalizeForCompare(trimmedQuery)
    return allTags.some((tag) => normalizeForCompare(tag.name) === key)
  }, [allTags, trimmedQuery])

  const handleCreate = async () => {
    if (!trimmedQuery || hasExactMatch) return
    await onCreateAndAssign(trimmedQuery)
    setQuery('')
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="編輯標籤"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <p className={styles.title}>編輯標籤</p>
          <button type="button" className={styles.done} onClick={onClose}>
            完成
          </button>
        </div>

        <input
          className={styles.searchInput}
          type="text"
          placeholder="搜尋或建立標籤"
          aria-label="搜尋標籤"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        {trimmedQuery && !hasExactMatch ? (
          <button type="button" className={styles.createButton} onClick={handleCreate}>
            建立「{trimmedQuery}」
          </button>
        ) : null}

        <ul className={styles.list}>
          {filteredTags.map((tag) => {
            const assigned = assignedTagIds.has(tag.id)
            return (
              <li key={tag.id}>
                <button
                  type="button"
                  className={assigned ? `${styles.tagOption} ${styles.tagOptionAssigned}` : styles.tagOption}
                  disabled={assigned}
                  onClick={() => onAssignExisting(tag)}
                >
                  <span>{tag.name}</span>
                  {assigned ? <span className={styles.assignedLabel}>已指派</span> : null}
                </button>
              </li>
            )
          })}
        </ul>

        {filteredTags.length === 0 && !trimmedQuery ? (
          <p className={styles.emptyHint}>還沒有任何標籤，輸入名稱即可建立第一個。</p>
        ) : null}
      </div>
    </div>
  )
}
