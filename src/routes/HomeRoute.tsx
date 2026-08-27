import { EmptyState } from '../components/feedback/EmptyState'
import { PasteUrlForm } from '../features/collect/PasteUrlForm'
import { useBookmarks } from '../hooks/useBookmarks'
import { bookmarkRepository } from '../app/container'
import styles from './HomeRoute.module.css'

/**
 * 收藏首頁 (Design Spec §24 Screen 5). The full fixed structure (Home Sticky Note +
 * Category Preview Cards, PRD §9.2) is P1-C2 scope; this Slice closes the P1-C1
 * Blocker identified in review — Technical Architecture §23.6 / Developer Handoff
 * §20A require a working "貼上網址收藏 → 最小收藏列表 → reload 後仍存在" vertical
 * flow, which is now wired via PasteUrlForm → bookmarkRepository → useBookmarks.
 *
 * The Empty State's optional action ("看看怎麼收藏") is intentionally omitted:
 * its concrete presentation is an open, undecided issue (Design Spec DES-I03 /
 * Interaction Spec INT-I05 — "不得改成大型 Onboarding"), so rather than invent a
 * behavior for it, the real, fully-specified paste-URL entry (Interaction §6.0)
 * is shown directly instead.
 *
 * List items are plain text (title-or-URL only, per §5 "無 metadata 來源時顯示
 * URL"): no image/click-through, since Bookmark Detail and full Collection Cards
 * are explicitly P1-C2 scope.
 */
export function HomeRoute() {
  const { bookmarks, refresh } = useBookmarks()

  const handleCreate = async (url: string) => {
    await bookmarkRepository.create({ originalURL: url })
    await refresh()
  }

  return (
    <section>
      <h1>收藏</h1>

      <div className={styles.form}>
        <PasteUrlForm onSubmit={handleCreate} />
      </div>

      {bookmarks === null ? null : bookmarks.length === 0 ? (
        <EmptyState
          title="還沒有收藏任何內容。"
          explanation="看到喜歡的內容，貼上網址交給《等等看》。"
        />
      ) : (
        <ul className={styles.list}>
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id} className={styles.listItem}>
              {bookmark.title ?? bookmark.originalURL}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
