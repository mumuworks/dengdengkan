import { Outlet } from 'react-router'
import { BottomNav } from './BottomNav'
import styles from './AppShell.module.css'

/** Root layout: scrollable page content above a fixed Bottom Navigation (Design Spec §14/§26.1). */
export function AppShell() {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
