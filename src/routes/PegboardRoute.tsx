import { EmptyState } from '../components/feedback/EmptyState'

/** 洞洞板 skeleton (Design Spec §24 Screen 16). Pinning/cards are P1-C2 scope. */
export function PegboardRoute() {
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
