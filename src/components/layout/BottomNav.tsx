import { NavLink } from 'react-router'
import styles from './BottomNav.module.css'

/**
 * Bottom Navigation — fixed order per Design Spec §14 / PRD §8: 收藏／洞洞板／搜尋／設定.
 * No icons yet: final Outline Icon assets are not delivered (Design Spec DES-I06),
 * and Design Principle 1 ("能不用 Icon 就不用 Icon") allows text-only tabs for now.
 */
const NAV_ITEMS = [
  { to: '/', label: '收藏', end: true },
  { to: '/board', label: '洞洞板' },
  { to: '/search', label: '搜尋' },
  { to: '/settings', label: '設定' },
] as const

export function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="主要導覽">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={'end' in item ? item.end : false}
          className={({ isActive }) =>
            isActive ? `${styles.item} ${styles.itemActive}` : styles.item
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
