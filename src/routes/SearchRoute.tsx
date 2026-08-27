import { EmptyState } from '../components/feedback/EmptyState'

/** 搜尋 skeleton (Design Spec §24 Screen 9). Search field/results are P1-C2 scope. */
export function SearchRoute() {
  return (
    <section>
      <h1>搜尋</h1>
      <EmptyState title="沒有找到符合的內容。" actionLabel="清除搜尋" />
    </section>
  )
}
