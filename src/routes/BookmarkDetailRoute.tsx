import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { useBookmarkDetail } from '../hooks/useBookmarkDetail'
import { useCategory } from '../hooks/useCategory'
import { useBookmarkTags } from '../hooks/useBookmarkTags'
import { bookmarkRepository } from '../app/container'
import { ReasonNote } from '../features/bookmark-detail/ReasonNote'
import { shareBookmark } from '../features/bookmark-detail/share'
import { EmptyState } from '../components/feedback/EmptyState'
import { getDisplayHost } from '../utils/url'
import { formatDate } from '../utils/formatDate'
import styles from './BookmarkDetailRoute.module.css'

const METADATA_STATUS_TEXT: Record<'pending' | 'failed', string> = {
  pending: '擷取中',
  failed: '內容暫時無法取得，網址已保留',
}

/**
 * 收藏詳細頁 (PRD §9.4, Interaction §8, Design Spec §24 Screen 6/19).
 * lastOpenedAt is updated once on entry by `useBookmarkDetail`, and again when
 * "開啟原文" is clicked (BR-009).
 */
export function BookmarkDetailRoute() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { bookmark, refresh } = useBookmarkDetail(id)
  const category = useCategory(bookmark?.categoryId)
  const tags = useBookmarkTags(bookmark?.id)
  const [shareStatus, setShareStatus] = useState<string | null>(null)

  if (bookmark === undefined) return null

  if (bookmark === null) {
    return (
      <section>
        <Link to="/" className={styles.back}>
          ← 返回
        </Link>
        <EmptyState title="找不到這筆收藏。" />
      </section>
    )
  }

  const title = bookmark.title ?? bookmark.originalURL
  const source = bookmark.source ?? getDisplayHost(bookmark.originalURL)
  const metadataStatus =
    bookmark.metadataState === 'resolved' ? null : METADATA_STATUS_TEXT[bookmark.metadataState]

  const handleSaveReason = async (next: string) => {
    await bookmarkRepository.update(bookmark.id, { reason: next })
    await refresh()
  }

  const handleTogglePin = async () => {
    await bookmarkRepository.update(bookmark.id, { isPinnedToBoard: !bookmark.isPinnedToBoard })
    await refresh()
  }

  const handleOpenOriginal = () => {
    void bookmarkRepository.update(bookmark.id, { lastOpenedAt: new Date().toISOString() })
  }

  const handleShare = async () => {
    const result = await shareBookmark({ title, url: bookmark.originalURL })
    if (result === 'copied') {
      setShareStatus('連結已複製。')
    } else if (result === 'failed') {
      setShareStatus('無法分享，請稍後再試。')
    } else {
      setShareStatus(null)
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm('確定要刪除這筆收藏嗎？刪除後無法復原。')
    if (!confirmed) return
    await bookmarkRepository.delete(bookmark.id)
    navigate(-1)
  }

  return (
    <section>
      <Link to="/" className={styles.back}>
        ← 返回
      </Link>

      {bookmark.imageURL ? (
        <img className={styles.image} src={bookmark.imageURL} alt="" />
      ) : (
        <div className={styles.imagePlaceholder} aria-hidden="true" />
      )}

      <h1 className={styles.title}>{title}</h1>
      <p className={styles.metaRow}>
        <span>{source}</span>
        {metadataStatus ? <span className={styles.metadataStatus}>{metadataStatus}</span> : null}
      </p>

      <div className={styles.section}>
        <ReasonNote value={bookmark.reason} onSave={handleSaveReason} />
      </div>

      {category ? (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>分類</p>
          <span className={styles.categoryChip}>{category.name}</span>
        </div>
      ) : null}

      {tags && tags.length > 0 ? (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>標籤</p>
          <ul className={styles.tagList}>
            {tags.map((tag) => (
              <li key={tag.id} className={styles.tagChip}>
                {tag.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className={styles.createdAt}>收藏於 {formatDate(bookmark.createdAt)}</p>

      <div className={styles.actions}>
        <button type="button" className={styles.actionButton} onClick={handleTogglePin}>
          {bookmark.isPinnedToBoard ? '取消釘選' : '釘到洞洞板'}
        </button>
        <a
          className={styles.actionLink}
          href={bookmark.originalURL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpenOriginal}
        >
          開啟原文
        </a>
        <button type="button" className={styles.actionButton} onClick={handleShare}>
          分享
        </button>
        {shareStatus ? <p className={styles.shareStatus}>{shareStatus}</p> : null}
        <button type="button" className={styles.destructiveButton} onClick={handleDelete}>
          刪除收藏
        </button>
      </div>
    </section>
  )
}
