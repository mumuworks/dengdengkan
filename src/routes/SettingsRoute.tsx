import { useBookmarkCount } from '../hooks/useBookmarkCount'
import { useAppSettings } from '../hooks/useAppSettings'
import styles from './SettingsRoute.module.css'

/**
 * 設定 skeleton (Design Spec §24 Screen 10 / PRD §9.14). Data actions (export/backup/
 * restore) are P1-C3 scope; this Slice only proves the layout and reads real values
 * (bookmark count, `lastBackupAt`) through the Repository layer.
 */
export function SettingsRoute() {
  const bookmarkCount = useBookmarkCount()
  const settings = useAppSettings()

  return (
    <section>
      <h1>設定</h1>
      <p className={styles.notice}>資料儲存在本機，不上傳《等等看》伺服器。</p>

      <div className={styles.group}>
        <p className={styles.groupTitle}>資料</p>
        <div className={styles.row}>
          <span className={styles.rowLabel}>收藏總筆數</span>
          <span className={styles.rowValue}>{bookmarkCount ?? '—'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>最近一次備份</span>
          <span className={styles.rowValue}>
            {settings?.lastBackupAt ? settings.lastBackupAt : '尚未備份'}
          </span>
        </div>
      </div>
    </section>
  )
}
