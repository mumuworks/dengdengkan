import { EmptyState } from '../components/feedback/EmptyState'

/**
 * 收藏首頁 skeleton (Design Spec §24 Screen 5 / 15). Home Sticky Note and Category
 * Preview Cards are P1-C2 scope (Core Collection); this Slice only proves navigation,
 * layout and the empty state.
 *
 * Empty-state explanation text is adapted from Design Spec §15 ("從分享選單交給《等等看》")
 * to the paste-URL entry point, since DECISION_LOG.md 2026-08-27 Decision 1 fixes Phase 1's
 * collection entry as "貼上網址", not Web Share Target — the Decision Log outranks Design Spec
 * copy in the Source of Truth hierarchy (README §3).
 */
export function HomeRoute() {
  return (
    <section>
      <h1>收藏</h1>
      <EmptyState
        title="還沒有收藏任何內容。"
        explanation="看到喜歡的內容，貼上網址交給《等等看》。"
        actionLabel="看看怎麼收藏"
      />
    </section>
  )
}
