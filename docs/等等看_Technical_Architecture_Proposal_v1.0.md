# 《等等看》Technical Architecture Proposal v1.0

版本：v1.0  
文件修訂：1.4（2026-07-21 備份技術架構去綁定與決策補完）  
狀態：架構候選與實作約束（Repository 尚無 Xcode Project／程式碼，技術選型未定）  
適用範圍：Phase 1（本機優先、無後端）  

---

## 一、架構摘要

### 1.1 已確認方向與待選技術
- 已確認：原生 iOS App、SwiftUI、本機優先、Share Extension 方向、App Group 方向、JSON 備份、Repository／Domain 邊界、本機通知。
- 尚未建立：Xcode Project、Swift 程式碼、Share Extension Target、App Group entitlement、本機 store、測試 Target、Migration 機制。
- 持久化候選：SwiftData、Core Data、原生 SQLite、GRDB；建立 Xcode 專案時依共享存取、migration、效能、測試性與維護成本評估。
- 圖片載入候選：Apple 原生能力與第三方套件；Nuke 或其他套件均尚未選定。
- 原則：Apple 原生能力優先；第三方依賴只在 Xcode 專案建立後，確認原生能力不足且完成 license／security／maintenance 評估時採用。

### 1.2 最低 iOS 版本
- **iOS 17+（推薦）**
  - 理由：Share Extension / SwiftUI / Observation 與測試工具鏈穩定、維護成本低。

### 1.3 App 與 Share Extension Target 關係
- 產品需求方向為主 App 與 Share Extension 各自獨立 Target，並透過 App Group 共享必要本機資料。
- Target、entitlement、identifier、container 位置與共享實作均尚未建立或確認。
- 建立專案後應共享 Domain、Repository Protocol、URL 驗證、Tag 正規化與相容性規則；底層 migration 實作依最終持久化方案決定。

### 1.4 模組邊界與資料流
- `AppUI`：View + ViewModel（不直接依賴底層持久化 API）
- `Domain`：UseCase（Bookmark、Category、Tag、Recall、Export）
- `Data`：Repository 實作 + 持久化 adapter + Migration
- `Services`：Metadata、ImageCache、Notification、AppRootRouter
- 資料流：View -> ViewModel -> UseCase -> Repository -> DB/Service

---

## 二、資料持久化選型（SwiftData / Core Data / SQLite / GRDB.swift）

| 比較項目 | SwiftData | Core Data | 原生 SQLite | GRDB.swift |
|---|---|---|---|---|
| App Group 共用 | 可做但跨 target 管理繁瑣 | 可做，設定較重 | 原生支援 | **原生支援且封裝完整** |
| App/Extension 並發寫入 | 風險較高（抽象層較厚） | 可行但除錯成本高 | 可行（需自行處理） | **可行，具交易 API 與 busy timeout 控制** |
| Migration | 較新，複雜遷移可控性普通 | 成熟但操作複雜 | 全手寫 | **DatabaseMigrator 成熟且可測** |
| Transaction / Atomic Write | 有，但控制粒度一般 | 有 | 有（需自行封裝） | **明確交易語義、控制粒度佳** |
| 搜尋效能 | 中 | 中 | 高（自行最佳化） | **高（直接吃 SQLite 索引）** |
| 測試性 | 中 | 中 | 高但成本高 | **高（可 in-memory / temp DB）** |
| 維護成本 | 中 | 高 | 高 | **中（最佳平衡）** |
| 第三方風險 | 無 | 無 | 無 | 有（MIT，成熟） |

### 選型狀態
- SwiftData、Core Data、原生 SQLite 與 GRDB 均為候選，尚未選定。
- 比較表只供建立 Xcode 專案時評估，不構成採用決策。
- 若最終採 SQLite／GRDB，才需把 DatabasePool、WAL、checkpoint、busy timeout、`-wal`／`-shm` 與多程序連線管理列入實作注意事項；這些不是 Phase 1 必然需求。

---

## 三、資料模型

> 本節為邏輯資料模型，不是資料庫 schema 承諾。時間欄位以絕對時間表示；底層映射與 migration 由最終持久化選型決定。

### 3.1 Entity
- Bookmark
- Category
- Tag
- BookmarkTag
- AppSetting
- DailyRecallState
- MetadataState（可內嵌於 Bookmark）

### 3.2 邏輯模型映射（非資料庫 Schema）

- 欄位與關聯以 Developer Handoff 的 Bookmark、Category、Tag、BookmarkTag、Settings 與 DailyRecallState 為準。
- 本節不指定 SQL 型別、table、index、foreign key、trigger、managed object 或 SwiftData model。
- 各候選持久化方案須證明：ID 唯一、Bookmark 必有 Category、BookmarkTag 無孤立關聯、刪除規則一致、日期與 nullable 欄位可往返。
- `lastBackupAt` 是裝置本機作業狀態；成功匯出時設為當次建立日期，成功還原時設為 envelope `createdAt`，不屬於備份 payload。
- 搜尋索引、唯一性與 migration 寫法在持久化選型及未決產品規則確認後定案。

### 3.3 「未整理」系統分類
- 固定 `id = system-unorganized`
- `is_system = 1`
- App 啟動 migration 後保證存在（不存在即補建）
- 禁止 rename／delete；由 UseCase 與最終持久化框架可提供的約束雙層保護。

### 3.4 Tag 正規化與去重
- 以下僅為候選流程，須待 Jenny 確認 Tag 正規化與同名合併規則後才能採用：
  1. trim 前後空白
  2. 若英文字母則 case-insensitive 正規化為 lowercased key
  3. 以 `normalized_key` 查重
  4. 命中則重用既有 tag（display_name 不改）

### 3.5 URL 重複策略
- 產品上是否允許重複 URL 尚未決定。
- 在 Jenny 確認前，不得建立會造成資料不可逆合併或拒絕寫入的 uniqueness 規則。

---

## 四、App Group 與並發寫入

本節描述建立 Xcode 專案後必須滿足的行為，不表示 App Group、Share Extension、identifier、shared container 或跨程序鎖已存在。

### 4.1 Shared Container
- 預計使用 Apple App Group 能力讓主 App 與 Share Extension 存取必要的共享本機資料。
- identifier、entitlement、目錄與持久化檔案形式須在 Xcode 專案建立後確認，不在文件中預設資料庫檔名。

### 4.2 共用方式
- App 與 Extension 共用 Repository／Domain 契約；底層 adapter 依最終持久化框架決定。
- 不同 process 不得共享記憶體內 connection、context 或 singleton 實例。
- 讀寫錯誤必須顯性處理，不得 silent fallback 成空資料。
- 若最終採 SQLite／GRDB，需另行驗證多程序連線、WAL、DatabasePool 與 sidecar 檔案行為；未採用時不適用。

### 4.3 同時寫入交易策略
- 所有寫入必須以選定框架可證明一致的 transaction／context save／等效機制完成。
- 衝突處理與有界重試須依實際框架設計，不在選型前固定參數。
- Extension 僅執行最小必要寫入（先落地 bookmark pending）。

### 4.4 鎖定策略
- 一般寫入一致性由最終持久化框架與 Repository 層共同保證。
- Migration 與 Restore 必須有跨程序協調，避免主 App 與 Share Extension 同時寫入；具體可採 framework coordination、file coordination、程序鎖或其他經測試方案，尚未選定。
- Restore 期間鎖定所有資料寫入，但不鎖純瀏覽。
- 禁止長交易；Metadata 等網路流程不得包進資料寫入 transaction。

### 4.5 Schema Migration 管理
- Migration 機制尚未建立。
- 建立後，主 App 與 Extension 必須使用相容的 model／schema 定義；migration 執行者與協調方式依框架確認。
- migration 不相容或失敗時須停止寫入並保留原資料，不得以空 store 覆蓋。
- 備份 `schemaVersion`／`modelVersion` 與底層 store migration version 是不同版本域，不得直接綁定。

### 4.6 Extension 超時與失敗處理
- 先寫 bookmark（pending metadata）再做補充流程。
- 超時：直接完成儲存並標記 metadata pending/failed，不回滾 bookmark。

### 4.7 資料損毀與恢復
- 使用最終持久化框架提供的完整性檢查與錯誤回復能力。
- 發現損毀時不得自動以空 store 覆蓋；先停止寫入、保留可診斷狀態，再依明確恢復流程處理。
- 若最終採 SQLite／GRDB，才另行定義 `PRAGMA integrity_check`、WAL 與 sidecar 檔案處理。
- 建立 App Group 後啟用合適的 iOS Data Protection，並記錄不含私人內容的恢復事件。

---

## 五、Share Extension 架構

1. 接收 URL（NSExtensionItem / NSItemProvider）
2. URL 驗證（scheme: http/https，長度、格式、防惡意）
3. 建立 bookmark（最少欄位：url_original、url_normalized、category=未整理、metadata=pending）
4. 快速回饋「已收藏」
5. Metadata 在 extension 時間允許時可做**有界嘗試**（受 timeout 與重試上限限制）
6. 未完成 Metadata 由主 App 下次啟動或回前景時補抓
7. BackgroundTasks 僅 best effort，不保證立即執行
8. extension 結束前保證：bookmark transaction 已 commit

---

## 六、Metadata 擷取

### 6.1 方案比較

| 方案 | 優點 | 缺點 |
|---|---|---|
| 原生 URLSession + HTML/OG Parser | 可控 timeout/retry，效能可優化，跨 App/Extension 一致 | 需自行維護 parser |
| LinkPresentation | 系統 API、整合容易 | 延遲不可控、extension 時間窗不穩、可測性普通 |
| 成熟第三方套件（例如 OpenGraph libs） | 開發快 | 依賴風險、更新節奏不一 |

### 6.2 推薦（單一）
- **主流程：URLSession + HTML/OG 解析（自有 service）**
- LinkPresentation 僅作為「補值」來源（例如 image 缺失時嘗試）

### 6.3 欄位擷取優先序
- `title`: `og:title` > `<title>` > host
- `source`: `og:site_name` > host
- `image`: `og:image` > `twitter:image` > LinkPresentation fallback
- 永遠保留 `url_original`

### 6.4 Timeout / Retry / Backoff
- timeout：3s（extension）、6s（app）
- retry：最多 2 次（僅網路暫時錯誤）
- backoff：0.5s / 1.0s

### 6.5 狀態機
- `pending -> resolved`
- `pending -> failed`
- `failed -> pending`（使用者手動重試或主 App 補抓排程重試）

### 6.6 圖片快取策略比較與推薦
- A: 只靠 URLCache（簡單、控制弱）
- B: 圖片庫自帶快取（可控）
- C: 自建檔案快取（彈性高、維護重）
- **狀態：尚未選定。** 建立 Xcode 專案後先驗證 Apple 原生能力，再比較第三方圖片套件與自建方案。
- 快取上限、淘汰與清理時機須依真實圖片尺寸、離線需求與裝置測試決定。

---

## 七、圖片載入與快取（URLCache/AsyncImage vs Nuke vs Kingfisher vs SDWebImageSwiftUI）

| 項目 | URLCache/AsyncImage | Nuke | Kingfisher | SDWebImageSwiftUI |
|---|---|---|---|---|
| License | Apple API | MIT | MIT | MIT |
| App Size 影響 | 最小 | 小 | 中 | 中 |
| Memory 管控 | 基礎 | **佳** | 佳 | 中 |
| Disk Cache | 基礎 | **佳** | 佳 | 佳 |
| 解碼尺寸控制 | 弱 | **強（processors）** | 強 | 中 |
| Extension 相容性 | 可 | **可** | 可 | 可 |
| 維護風險 | 低 | **低（活躍）** | 中 | 中 |

### 選型狀態
- URLCache／AsyncImage 與 Nuke、Kingfisher、SDWebImageSwiftUI 皆僅為候選。
- Nuke 未採用、未加入依賴；第三方套件須等 Xcode 專案建立後才決定。

---

## 八、UI 架構

- SwiftUI + NavigationStack + TabView（四個固定 Tab）
  1. 收藏
  2. 洞洞板
  3. 搜尋
  4. 設定
- Daily Recall 為 route（由 `AppRootRouter` 導向 `DailyRecallView`），不是 Bottom Tab。
- 分層：View / ViewModel / Repository / Service
- Design Token：由 `DesignSystem` 集中定義 color/spacing/typography/radius
- Dynamic Type：支援至 AX 類級，關鍵元件防截斷
- Light/Dark：雙模式 token 對照
- Accessibility：VoiceOver label、button traits、hit area >= 44pt
- 洞洞板雙欄轉單欄：以 size class + Dynamic Type 條件切換

---

## 九、搜尋架構

### 9.1 搜尋欄位
- title, source, note, tags.display_name, url_original

### 9.2 文字正規化
- 英文：case-insensitive
- 中文：原文比對 + 去全半形差異（NFKC）
- URL：去 scheme 後可匹配 domain/path

### 9.3 條件篩選
- category_id
- tag_id（多選 AND/OR 規則由 UI 指定，Phase 1 建議 OR）

### 9.4 效能（1k/10k）
- 1k：一般 LIKE + 索引可達標
- 10k：依選定持久化框架補強索引；只有採 SQLite 時才評估 FTS5。

### 9.5 降級策略
- 查詢逾時時退回「title/source 優先」簡化搜尋

---

## 十、Daily Recall

已確認方向：
- 使用最近、久未開啟與洞洞板三個候選來源。
- 目標權重為 40% 最近 + 40% 久未 + 20% 洞洞板。
- 邀請收藏門檻、每批固定數量、從未開啟的最低天數與同日換批上限仍待 Jenny 決定，不得以示意值直接實作。

### 10.1 候選池定義
- 最近池：依 `created_at` 由新到舊建立候選（排除當日已出現）
- 久未池：`lastOpenedAt` 由舊到新；`lastOpenedAt == nil` 時，須等產品確認的最低天數後才納入。
- 洞洞板池：`is_pegboard = 1`

### 10.2 配比落地
- 40／40／20 為目標權重，不保證每批精確整數配額。
- 每批數量確認後，再決定可測試的 rounding／weighted selection 方法；不得直接把 Final UI 的示意三張卡視為正式固定數量。

### 10.3 去重與補位
- 全域去重（bookmark id）
- 池不足時由其餘可用池補位；正式補位優先順序待產品確認。
- 同一批不得重複同一 Bookmark。

### 10.4 同日換一批
- 允許換批，需避開 `seen_ids_json`
- 若可用候選不足，逐步放寬為「可重複池、不重複 id」

### 10.5 隨機種子 / 重複控制
- 若產品分析最終獲准，再定義本機 `installationUUID` 的保存位置；App Group UserDefaults 僅為建立 App Group 後的候選，不是已確認實作。
- 種子與可重現策略屬候選實作，需在同日換批規則確認後決定。

### 10.6 lastOpenedAt 更新規則
- 進入 Bookmark 詳細頁時更新。
- 點擊「開啟原文」時再次更新。
- 不設停留門檻。
- 列表、搜尋結果、洞洞板曝光不更新。

### 10.7 測試案例（最低）
- 候選池正常/不足
- 全庫少於已確認的每批數量
- 同日連續換批去重
- 從未開啟最低天數的邊界條件

### 10.8 待決事項
- 邀請收藏門檻、每批數量、從未開啟最低天數、最近池範圍與同日換批上限。

---

## 十一、本機通知

- 使用 `UNUserNotificationCenter`
- `UNCalendarNotificationTrigger`（每日固定時間）

### 11.1 權限流程
- 收藏達產品確認門檻後顯示 Daily Recall 邀請卡；目前門檻尚未定案
- 僅在使用者點擊「每天提醒我」時才呼叫 `requestAuthorization`
- Onboarding 不請求通知權限
- 拒絕後可在設定頁提供「前往系統設定」

### 11.2 Identifier 設計
- `daily-recall-<HHmm>`
- 更新時間時先移除舊 id 再建新 id

### 11.3 啟用/停用/改時間
- 啟用：建立 trigger
- 停用：移除 pending notification
- 改時間：remove + reschedule

### 11.4 Deep Link
- 點擊通知由 `AppRootRouter` 導向 `DailyRecallView`（非 Tab 切換）

### 11.5 通知文案策略（Phase 1）
- 不宣稱 repeating `UNCalendarNotificationTrigger` 可每日自動更換內容。
- 單一固定文案或多文案重新排程策略仍待決定；不得為輪播引入 Server。

---

## 十二、分類與標籤管理

### 12.1 分類（Phase 1）
- 「未整理」系統分類不可改名、不可刪除。
- 新增、改名、刪除、排序與刪除後 Bookmark 轉移規則仍待 Jenny 決定；不得先實作一般 CRUD 預設。

### 12.2 標籤
- Tag 正規化、大小寫、同名合併與顯示名稱保留規則仍待 Jenny 決定。

---

## 十三、匯出（CSV / JSON）

### 13.1 CSV 欄位
- id, url_original, title, source, note, category_name, tags, is_pegboard, created_at, last_opened_at
- `tags` 的 CSV 單欄序列化格式尚未定案。

### 13.2 JSON 欄位
- 與 Domain Model 一致，保留 null

### 13.3 日期格式
- ISO8601（UTC）

### 13.4 Null 規則
- CSV：空字串
- JSON：`null`

### 13.5 CSV escaping
- RFC 4180（逗號、雙引號、換行需轉義）

### 13.6 大量匯出記憶體策略
- 分批 cursor 讀取（例如每批 500）
- stream 寫檔，避免一次載入全量

### 13.7 資料匯出與專用備份的邊界
- CSV／JSON 資料匯出用於資料可攜與檢視。
- 專用備份用於完整還原 App 持久資料；兩者使用不同 encoder／decoder 契約與驗證器。
- 一般資料匯出檔不得直接進入還原流程。

---

## 十四、本機備份與受保護還原

### 14.1 架構邊界
- Phase 1 採本機 store + 使用者自主備份檔。
- App 只透過 iOS File Exporter／Document Picker 與系統 File Provider 機制交付或取得檔案。
- 不加入 CloudKit、Google Drive API、Dropbox API、OneDrive API、OAuth、自有 Server、帳號或同步 Service。
- App 不保存目的地、雲端帳號、Provider identifier 或 credential，也不代管備份。

### 14.2 Backup Module

```text
Settings UI
  -> BackupCoordinator
     -> BackupSnapshotReader
     -> BackupEncoder / BackupValidator
     -> TemporaryFileStore
     -> Native File Exporter

Native Document Picker
  -> RestoreCoordinator
     -> SecurityScopedFileReader
     -> BackupDecoder / SchemaValidator
     -> BackupMigrationAdapterRegistry
     -> StagingStoreBuilder
     -> ProtectedStorePublisher
```

- 上述為建立專案時的責任邊界示意，不表示 Target 或型別已存在。
- `BackupCoordinator` 與 `RestoreCoordinator` 只應存在主 App Target；Share Extension 不呈現備份 UI。
- Backup Domain Model 與任何底層 row／managed object／record 分離，避免持久化內部欄位成為公開檔案契約。
- 備份版本與底層 store migration version 分離。

### 14.3 Backup Envelope
- Phase 1 為單一 JSON，不使用 ZIP 或 package，最大 50 MB。
- JSON root 必填：`schemaVersion: 1`、`modelVersion: 1`、`createdAt`、`appVersion`、`bookmarkCount`、`payload`、`payloadChecksum`。
- `payload` 包含完整 Bookmark、Category、Tag、BookmarkTag、必要使用者 Settings 與需持久化的 Daily Recall 設定；裝置作業狀態 `last_backup_at` 不列為使用者內容。
- `payloadChecksum` 使用 SHA-256，對依文件固定 canonical JSON 規則序列化後的 payload UTF-8 bytes 計算。它只驗證完整性，不代表加密、簽章或身分驗證。
- 不包含通知授權、cache、log、App Group path、security-scoped bookmark、Token 或 UI 暫態。
- 不包含圖片二進位檔，只保存圖片 URL、Metadata 與可恢復欄位。
- 檔名：`等等看_Backup_YYYY-MM-DD_HHmm_v1.json`。
- 日期使用 ISO8601 UTC，ID 使用穩定 UUID 字串。

### 14.4 Export Pipeline
1. 透過 Repository／Domain 介面取得一致的 Domain Model snapshot；不得直接讀取或搬移底層資料庫／store 檔案。
2. encode 單一 JSON 到 App 受控暫存檔。
3. 完成後驗證 envelope、計數與 SHA-256 checksum，再交由原生 File Exporter／Share Sheet。
4. 系統回報成功完成才更新 `last_backup_at`；取消或錯誤不更新。
5. 結束後刪除 App 暫存副本。

### 14.5 Import Validation
1. Document Picker 取得 URL 後，以 security-scoped access 複製至受控暫存位置，隨即停止外部存取。
2. 在讀取內容前檢查檔案不超過 50 MB。
3. 驗證 JSON root、`schemaVersion`、`modelVersion`、SHA-256 checksum、必填 metadata、Bookmark count、型別、UUID、URL、關聯、唯一性與系統分類；未知非必要欄位忽略。
4. 舊版備份只允許透過明確 `BackupMigrationAdapter` 升級，不得猜測；高於目前支援版本時拒絕並提示更新 App。
5. 全部驗證成功後才回傳建立日期與收藏筆數供確認 UI 顯示。

### 14.6 Protected Replacement
- 還原開始前取得架構無關的 exclusive write gate，暫停主 App 與 Share Extension 的所有 Repository 寫入；純瀏覽維持可用。
- Share Extension 在鎖定期間以短句告知稍後重試，不得寫入正式資料。
- 在與正式資料隔離的 staging 區建立完整候選 Domain Model，並透過已選持久化 adapter 寫入候選 store。
- 執行版本、關聯、checksum、筆數與「未整理」系統分類檢查。
- 通過後依最終框架提供的 transaction、context 切換、受保護 publication 或其他經驗證的等效策略發布候選資料；不得將資料庫檔案 rename／swap、WAL checkpoint 或特定 connection 關閉流程寫成備份契約。
- 必須具備 rollback 能力；具體機制依最終持久化方案設計與測試。
- 成功還原後將本機 `last_backup_at` 設為 envelope `createdAt`。
- 任一步驟失敗則丟棄 staging、rollback、釋放鎖；原資料保持不變。絕不可先清空正式資料再逐筆匯入。
- 匯入不會自動在使用者的檔案 App 產生額外備份。

### 14.7 圖片策略邊界
- Phase 1 JSON 備份不包含圖片二進位檔，只保存圖片 URL、Metadata 與可恢復欄位。
- 不使用 Base64、ZIP、package 或圖片附件；圖片載入與快取套件不影響備份契約。

---

## 十五、商業模式技術邊界

- Phase 1 核心收藏功能永久免費。
- Phase 1 不開發 StoreKit、IAP、會員、訂閱、付費牆、支付或購買流程。
- 不建立 StoreKit Service、Support Service、Product ID、購買狀態、恢復購買、Receipt、Transaction、Entitlement 或會員資料結構。
- 不為未來付費預留 Protocol、Service、Schema、Feature Flag 或空 Scaffold。
- High Fidelity UI 中既有「支持木木」畫面只保留為 Future／Optional 設計參考，不進入 Phase 1 Target、Module 或 Slice。
- 未來若推出付費，只能針對新增且具有持續成本的服務，例如跨裝置同步；屆時必須另立架構提案與 ADR。

---

## 十六、安全與隱私

- 無帳號、無登入、無自有伺服器、無遠端 push、無自動雲端同步
- ATS 開啟（僅必要例外）
- URL Scheme 僅允許 http/https
- 惡意 URL/HTML 防護：大小限制、timeout、內容型別檢查
- App Group 權限最小化
- 本機資料保護：檔案保護等級 + 匯出／備份檔顯式提醒敏感性
- 備份檔由使用者自行管理；App 不得記錄內容、最終位置或第三方 File Provider 帳號
- payload SHA-256 checksum 只檢查檔案完整性，不得宣稱具備加密、簽章或身分驗證能力
- 回報問題／提供建議使用系統 Email compose／mailto 能力；不新增自有回報後端
- 隱私權政策與使用條款須於 App Store 上架前有可公開存取的正式網址；完成前不得放置假連結
- Analytics 建議：Phase 1 預設不加第三方追蹤；若加僅匿名本機事件

---

## 十七、Dependency 評估

目前沒有已採用第三方依賴。Xcode 專案建立後，先驗證 Apple 原生能力，再評估候選套件。

| 候選 | 用途 | 目前狀態 | 決策條件 |
|---|---|---|---|
| GRDB.swift | SQLite 存取／migration | 尚未選定 | 只有最終選 SQLite 且原生封裝成本不合理時評估 |
| Nuke／Kingfisher／SDWebImageSwiftUI | 圖片載入與快取 | 尚未選定 | 原生 URLSession／URLCache／AsyncImage 無法滿足已量測需求時評估 |
| SwiftSoup 或同級 parser | HTML／OG 解析 | 尚未選定 | Apple 原生能力與自有最小解析無法滿足 Metadata 規格時評估 |

所有候選均須檢查 license、維護狀態、安全紀錄、隱私、App／Extension 相容性、二進位體積與替換成本。

---

## 十八、測試策略

- Unit Test：Tag 正規化、URL 驗證、Recall 配比/補位
- Repository Integration Test：CRUD、持久化一致性、查詢與 migration
- App Group 寫入測試：Target 與 entitlement 建立後測試 App／Extension 競爭寫入
- Share Extension 測試：URL 進入、最小收藏成功、超時 fallback
- Metadata 測試：timeout/retry/狀態機
- Daily Recall 測試：14 天門檻、同日換批、去重
- Migration 測試：v1 -> v2（假資料）
- 備份測試：schema、stream encode、欄位／關聯完整性、0／1／10k 筆
- 備份契約測試：單一 JSON、檔名、50 MB、schema/model version 1、unknown optional field、SHA-256、無圖片二進位檔
- 還原測試：舊版 migration adapter、較新版本拒絕與更新提示、staging 失敗、受保護取代中斷、原資料保持、無額外 Files 備份
- 併發測試：Restore exclusive write gate 與 Share Extension 同時寫入；純瀏覽保持可用
- UI Test：主流程（收藏、搜尋、分類管理、Recall、設定）
- 資料量測試：0 / 1 / 100 / 1,000 / 10,000

---

## 十九、CI/CD

- GitHub Actions（macOS runner）
  1. Build（App + Extension）
  2. Test（Unit + Integration + UI smoke）
  3. Lint/Format：SwiftLint、SwiftFormat（建議採用）
  4. Dependency Scan：Dependabot + GitHub dependency graph + `Package.resolved` 差異檢查 + GitHub Security Advisory 檢查
- Branch/PR 規則
  - PR 必須綠燈才可 merge
  - 至少 1 review
- TestFlight 前置
  - 版本號規範
  - Release checklist（通知、Share Extension、資料匯出、備份／還原、Recall）

---

## 二十、實作順序（垂直切片）

1. **Slice A：收藏核心閉環**
   - 建立 Xcode Project／Targets，完成持久化選型與 Migration 基礎，再做 Bookmark 新增／列表與未整理分類保護
2. **Slice B：Share Extension 最小可用**
   - 外部分享 URL -> 成功落地 bookmark pending
3. **Slice C：Metadata 與封面圖**
   - 背景補抓 + 狀態機 + 經選型確認的圖片載入／快取
4. **Slice D：分類/標籤/搜尋**
   - 分類管理、Tag 正規化、複合搜尋
5. **Slice E：Daily Recall + 通知**
   - 3 筆配比、換批、通知 deep link
6. **Slice F：Export + Backup／Restore**
   - CSV／JSON 資料匯出
   - Domain Model 單一 JSON 備份、原生檔案介面、50 MB、版本、checksum、staging、exclusive write gate、受保護取代與 rollback

---

## 二十一、風險清單

| 風險類型 | 風險描述 | 緩解措施 |
|---|---|---|
| 技術風險 | App/Extension 併發寫入 | 先完成持久化選型，再以框架相容的短寫入、版本 gate 與跨程序協調測試；若採 SQLite／GRDB 才評估 WAL 等機制 |
| 規格風險 | Recall 配比與補位期望落差 | 先固定演算法 + 加可觀測測試樣本 |
| App Store 風險 | Share Extension 行為不穩 | 嚴格遵守 extension 時間窗與記憶體限制 |
| Extension 風險 | metadata 抓取超時 | 收藏先落地，metadata 後補 |
| 效能風險 | 10k 搜尋延遲 | 依最終持久化框架建立索引；若採 SQLite 才評估 FTS5 |
| 資料風險 | 還原失敗清空或部分覆蓋現有資料 | Domain staging + 完整驗證 + exclusive write gate + 受保護取代 + rollback |
| 相容風險 | 未來備份版本無法讀取 | 獨立 schemaVersion／modelVersion + migration adapter + 拒絕未知新版並提示更新 |

---

## 二十二、Architecture Decision Records（ADR）

| ADR | Decision | Alternatives | Reason | Consequences |
|---|---|---|---|---|
| ADR-001 | 持久化保持未定 | SwiftData／Core Data／原生 SQLite／GRDB | Repository 尚無 Xcode Project，缺乏實測依據 | 建立專案時完成選型 ADR |
| ADR-002 | 圖片載入保持未定，Apple 原生優先 | URLSession／URLCache／AsyncImage／第三方套件 | 尚無實測與依賴基線 | Xcode 專案建立後再決定 |
| ADR-003 | Metadata parser 尚未選定，Apple 原生優先 | URLSession／LinkPresentation／第三方 parser | 尚無 Xcode 實測 | 建立專案後形成選型 ADR |
| ADR-004 | 系統分類固定 `system-unorganized` | 無系統分類 | 符合刪分類回收規則 | 需雙層保護避免誤刪 |
| ADR-005 | Recall 保留 40／40／20 目標權重，具體取樣待參數確認 | rounding／weighted selection | 每批數量與天數尚未定案 | 不得先固定 1／1／1 |
| ADR-006 | 通知採本機排程，文案輪播策略待定 | 固定文案／多筆預排／App 開啟時重排 | 不引入 Server | 產品確認後形成排程 ADR |
| ADR-007 | Phase 1 預設不接第三方 analytics | 直接接入第三方 SDK | 隱私與維護風險最低 | 少即時產品分析 |
| ADR-008 | 狀態管理主方案採 `@Observable` | ObservableObject | iOS 17+ 下語意更一致、樣板較少 | 需 iOS 17 baseline |
| ADR-009 | Migration 與 Restore 需要跨程序協調 | 僅依賴單一 process 的持久化鎖 | 避免主 App／Extension 競態 | 具體機制待持久化選型 |
| ADR-010 | Phase 1 採使用者自主 JSON 備份檔 | 帳號同步／CloudKit／自有 Server | 無持續服務成本、資料主權清楚、符合本機優先 | 使用者需自行保存檔案 |
| ADR-011 | 還原採 Domain staging + 受保護取代 + rollback | 直接清空後逐筆匯入／合併匯入 | 任何失敗都能保留現有資料且不綁資料庫 | 需依最終框架證明取代原子性／一致性 |
| ADR-012 | 備份契約採單一 JSON、50 MB、version 1/1 與 SHA-256 | ZIP／package／直接複製 store | 可攜、可驗證且不綁持久化框架 | 不包含圖片二進位檔；checksum 非加密／驗證身分 |

---

## 最終輸出（Decision Summary）

### 1) 已確認架構方向
- **原生 iOS／SwiftUI + 本機優先 + Repository／Domain 邊界 + App Group／Share Extension 方向 + 本機通知 + Domain Model JSON 備份**。
- 持久化、圖片載入、Metadata parser、migration 與跨程序鎖的具體方案尚未選定。

### 2) 明確不採用方案
- 不直接備份、搬移或替換底層資料庫／store 檔案。
- 不把 GRDB、SQLite、SwiftData、Core Data、Nuke 或其他第三方套件視為已採用。
- 不在選型前要求 DatabasePool、WAL 或 checkpoint。
- 不在備份中使用 ZIP／package、Base64 圖片或圖片二進位附件。
- 不採 Phase 1 帳號、OAuth、CloudKit、自有雲端備份或自動同步架構

### 3) 尚待產品決策的事項
- 重複 URL 是否允許
- Daily Recall 邀請門檻、每批數量、從未開啟最低天數、最近池範圍與同日換批上限
- 分類管理／排序／刪除轉移、Tag 正規化與 CSV 多 Tag 格式
- 通知固定文案或多文案重排策略
- 隱私權政策與使用條款的正式內容與公開網址；完成前不得放置假連結

### 4) Phase 1 建立專案時的工程決策
- 建立 Xcode Project、主 App Target、Share Extension Target 與測試 Target。
- 確認 bundle IDs、App Group identifier、entitlements 與 iOS deployment target。
- 依需求比較 SwiftData、Core Data、原生 SQLite、GRDB；形成持久化 ADR 後才實作 store 與 migration。
- 先驗證 Apple 原生圖片／Metadata 能力；不足時才建立第三方依賴白名單。
- 將備份 Domain Model、JSON envelope、version／checksum／migration adapter 與 Repository 解耦。
- 建立可跨主 App／Extension 的 exclusive write gate；具體鎖機制必須通過實測後定案。
- 確認通知文案初版。

前置條件確認後，由小居整合規格與小摳的 Repository／Reuse Analysis，再指定 Claude Code 或 Codex 其中一位負責實作；不得同時修改同一 Repository。完成後必須通過 GitHub Actions，再交由 Jenny 驗收。

### 5) 建議第一個垂直開發階段
- **Slice A：建立專案基礎與收藏核心閉環（Targets + 持久化選型 ADR + Migration 基礎 + Bookmark + 未整理分類保護 + 基礎列表）**

---

## 版本紀錄

| Date | Revision | Change |
|---|---:|---|
| 2026-07-21 | 1.4 | 依 Repository 盤點撤回 GRDB／SQLite／Nuke 等既定技術；改為候選與條件式注意事項；備份固定為 Domain Model 單一 JSON，補齊 50 MB、version 1/1、SHA-256、migration adapter、寫入鎖、受保護取代與 rollback。 |
| 2026-07-20 | 1.3 | 新增使用者自主備份檔、獨立 schemaVersion、原生檔案介面、staging 與原子性還原架構；明確排除帳號、OAuth、雲端 API 與自動同步。 |
| 2026-07-20 | 1.2 | 同步最新版 AI Team Workflow 與阿克／扣哥單一工程師實作原則。 |
| 2026-07-20 | 1.1 | 移除 StoreKit 2 技術棧、Service、架構預留與 Slice；Slice F 改為 Export；Jenny 待決清單移除所有 StoreKit 項目。 |
| 2026-07-20 | 1.0 | 建立 Technical Architecture Proposal。 |
