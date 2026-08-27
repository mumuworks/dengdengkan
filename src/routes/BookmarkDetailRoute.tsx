import { useParams } from 'react-router'

/**
 * 收藏詳細頁 route stub (Technical Architecture Proposal §23.2: `/bookmark/:id`).
 * Full detail layout (Design Spec §24 Screen 6/19) is P1-C2 scope.
 */
export function BookmarkDetailRoute() {
  const { id } = useParams<{ id: string }>()
  return (
    <section>
      <h1>收藏詳細頁</h1>
      <p>{id}</p>
    </section>
  )
}
