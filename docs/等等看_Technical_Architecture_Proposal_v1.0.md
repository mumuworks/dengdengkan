# 《等等看》Technical Architecture Proposal v1.0

版本：v1.0  
狀態：Step 3 架構提案（審查通過，待 Commit）  
適用範圍：Phase 1（本機優先、無後端）  

---

## 一、架構摘要

### 1.1 建議技術棧（單一推薦）
- UI：SwiftUI + NavigationStack + TabView
- 狀態管理：**iOS 17 Observation（`@Observable`）**
- 資料層：Repository Pattern
- 持久化：**GRDB.swift + SQLite (App Group Shared DB)**
- Metadata：URLSession + HTML/OG 解析（主流程）+ LinkPresentation（補充）
- 圖片載入：**Nuke**
- 通知：UNUserNotificationCenter（本機排程）
- 內購：StoreKit 2（架構預留，不阻擋核心）

### 1.2 最低 iOS 版本
- **iOS 17+（推薦）**
  - 理由：Share Extension / SwiftUI / Observation 與測試工具鏈穩定、維護成本低。

### 1.3 App 與 Share Extension Target 關係
- 主 App 與 Share Extension 各自獨立 target。
- 共享 `Core`（Domain、Repository Protocol、DB Migration、URL 驗證、Tag 正規化）。
- 共享 App Group Container：
  - `group.com.mumuworks.dengdengkan`
  - `Library/Application Support/dengdengkan.sqlite`

### 1.4 模組邊界與資料流
- `AppUI`：View + ViewModel（不直接碰 SQL）
- `Navigation`：`AppRootRouter`（route 與 deep link 導航）
- `Domain`：UseCase（Bookmark、Category、Tag、Recall、Export）
- `Data`：Repository 實作 + GRDB DAO + Migration
- `Services`：Metadata、ImageCache、Notification、StoreKit
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

### 推薦結論（單一）
- **採用 GRDB.swift**
  1. 最符合 App + Extension 共享 DB 與並發寫入需求。
  2. 比 Core Data 更可預測、比原生 SQLite 開發成本更低。
  3. Migration、Transaction、測試覆蓋最容易做完整。

---

## 三、資料模型

> 使用 SQLite（由 GRDB 管理），**DB 時間欄位統一使用 INTEGER Unix epoch milliseconds（UTC）**。`daily_recall_state.date_key` 使用使用者本地時區 `YYYY-MM-DD`。

### 3.1 Entity
- Bookmark
- Category
- Tag
- BookmarkTag
- AppSetting
- DailyRecallState
- MetadataState（可內嵌於 Bookmark）

### 3.2 建議 Schema（重點）

#### `categories`
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `is_system INTEGER NOT NULL DEFAULT 0`
- `created_at`, `updated_at`
- Unique：`UNIQUE(name COLLATE NOCASE)`（系統分類初始化時先占用）

#### `bookmarks`
- `id TEXT PRIMARY KEY`
- `url_original TEXT NOT NULL`
- `url_normalized TEXT NOT NULL`
- `title TEXT NULL`
- `source TEXT NULL`
- `note TEXT NULL`
- `category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT`
- `is_pegboard INTEGER NOT NULL DEFAULT 0`
- `metadata_status TEXT NOT NULL` (`pending/resolved/failed`)
- `metadata_error_code TEXT NULL`
- `metadata_updated_at`
- `last_opened_at NULL`
- `created_at`, `updated_at`
- 索引：
  - `idx_bookmarks_created_at`
  - `idx_bookmarks_last_opened_at`
  - `idx_bookmarks_category_id`
  - `idx_bookmarks_url_normalized`

#### `tags`
- `id TEXT PRIMARY KEY`
- `display_name TEXT NOT NULL`（保留第一次建立的顯示名稱）
- `normalized_key TEXT NOT NULL UNIQUE`（trim + 英文 lowercased）
- `created_at`, `updated_at`

#### `bookmark_tags`
- `bookmark_id TEXT NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE`
- `tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE`
- `PRIMARY KEY (bookmark_id, tag_id)`
- 索引：`idx_bookmark_tags_tag_id`

#### `app_settings`
- `key TEXT PRIMARY KEY`
- `value TEXT NOT NULL`

#### `daily_recall_state`
- `date_key TEXT PRIMARY KEY`（YYYY-MM-DD, local）
- `batch_json TEXT NOT NULL`（當日 3 筆 id）
- `seen_ids_json TEXT NOT NULL`（同日換批避免重複）
- `refresh_count INTEGER NOT NULL DEFAULT 0`

### 3.3 「未整理」系統分類
- 固定 `id = system-unorganized`
- `is_system = 1`
- App 啟動 migration 後保證存在（不存在即補建）
- 禁止 rename / delete（UseCase + DB trigger 雙保護）

### 3.4 Tag 正規化與去重
- 建立流程：
  1. trim 前後空白
  2. 若英文字母則 case-insensitive 正規化為 lowercased key
  3. 以 `normalized_key` 查重
  4. 命中則重用既有 tag（display_name 不改）

### 3.5 URL 重複策略
- Phase 1 移除 `url_normalized` UNIQUE 限制，允許技術上可儲存重複 URL。
- 「產品上是否允許重複 URL」列為待決事項（見文末 Jenny 決策清單）。

---

## 四、App Group 與並發寫入

### 4.1 Shared Container
- `FileManager.default.containerURL(forSecurityApplicationGroupIdentifier:)`
- DB 路徑：`.../Library/Application Support/dengdengkan.sqlite`

### 4.2 共用方式
- App 與 Extension 皆使用同一套 `DatabaseProvider` 規格，但**各自建立獨立 connection**（不同 process 不共享同一 DB 連線實例）。
- 遵循 GRDB shared database / multiple process guidance：
  - 每個 process 啟動時獨立 open DB。
  - 僅做短交易，避免長時間持鎖。
  - 讀寫錯誤必須顯性上拋，不做 silent fallback。
- SQLite 模式採 WAL，並確保 `-wal` / `-shm` 檔可在 App Group 目錄正常建立與存取。

### 4.3 同時寫入交易策略
- 所有寫入統一使用 `inTransaction(.immediate)`。
- 設定 `busy_timeout`（例如 1500ms）+ 有界重試（2 次，指數退避）作為輔助，不作為唯一一致性策略。
- Extension 僅執行最小必要寫入（先落地 bookmark pending）。

### 4.4 鎖定策略
- DB 寫入鎖：由 SQLite/WAL 處理。
- Migration 鎖：由 `MigrationCoordinator` 實作跨程序鎖（lock file + 檔案鎖）。
- 禁止長交易；metadata 等網路流程絕不包進 transaction。

### 4.5 Schema Migration 管理
- 單一 `DatabaseMigrator`，App 與 Extension 共用同一 migration list。
- 加入 `MigrationCoordinator`：
  1. 啟動先檢查 schema version/compatibility。
  2. 需要 migration 時先嘗試取得跨程序 migration lock。
  3. 僅持鎖者可執行 migration。
- Extension 原則上只做 schema 驗證，不主動升級 schema。
- **例外：首次空 DB 且 Extension 取得 migration lock 時，可建立 v1 schema。**
- schema 不相容或 migration 失敗時：安全停止寫入並回報可觀測錯誤。

### 4.6 Extension 超時與失敗處理
- Extension 僅做 URL 驗證與 bookmark pending 原子寫入。
- 不在 Extension 執行 Metadata 網路請求或 retry。
- 任何 Extension 流程失敗需顯性回報；已 commit 的 bookmark 不回滾。

### 4.7 資料損毀與恢復
- 啟動時執行 `PRAGMA integrity_check`（抽樣或版本升級時）。
- DB 檔案與 `-wal/-shm` 一併視為同一組資料單位處理。
- 偵測損毀後立即停止寫入，保留 DB/WAL/SHM 原始檔，不做靜默刪除。
- 先嘗試 SQLite/GRDB backup recovery（可讀部分最大化回收）。
- 僅在確認無法恢復時才建立新 DB，並保留原始檔供後續檢查。
- 啟用檔案資料保護等級（App Group 可用範圍內）並記錄恢復事件。

---

## 五、Share Extension 架構

1. 接收 URL（NSExtensionItem / NSItemProvider）
2. URL 驗證（scheme: http/https，長度、格式、防惡意）
3. 建立 bookmark（最少欄位：url_original、url_normalized、category=未整理、metadata=pending）
4. 快速回饋「已收藏」
5. Extension 不執行 Metadata 網路請求與 retry
6. Metadata 由主 App 下次啟動或回前景時補抓
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
- timeout：6s（app）
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
- **推薦：B（Nuke 快取）**
  - disk 上限 200MB（Phase 1）
  - LRU 淘汰
  - App 啟動或低空間通知時觸發清理

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

### 推薦結論（單一）
- **採用 Nuke**
  - 效能/體積/可控性平衡最佳。

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
- title、url_original、source、note、categories.name、tags.display_name

### 9.2 文字正規化
- 英文：case-insensitive
- 中文：原文比對 + 去全半形差異（NFKC）
- URL：去 scheme 後可匹配 domain/path

### 9.3 條件篩選
- category_id
- tag_id（多選 AND/OR 規則由 UI 指定，Phase 1 建議 OR）

### 9.4 效能（1k/10k）
- 1k：一般 LIKE + 索引可達標
- 10k：需補強索引，必要時導入 SQLite FTS5（Phase 1 預設不啟用）

### 9.5 降級策略
- 查詢逾時時退回「title/source 優先」簡化搜尋

---

## 十、Daily Recall

固定規則：
- 收藏達 3 筆顯示邀請
- 每次顯示 3 筆
- 從未開啟收藏滿 14 天才進「久未」
- 配比 40% 最近 + 40% 久未 + 20% 洞洞板

### 10.1 候選池定義
- 最近池：優先使用最近 30 天收藏（依 `created_at` 由新到舊）；若候選不足，再由更早收藏補位
- 久未池：`last_opened_at IS NULL AND created_at <= now - 14 days`
- 洞洞板池：`is_pegboard = 1`

### 10.2 配比落地（3 筆）
- 使用最大餘數法（Hamilton）：
  - 40/40/20 * 3 => 1.2/1.2/0.6
  - 先取整：1/1/0，剩餘 1 筆給餘數最大池（洞洞板）
  - 最終目標：**1 最近 + 1 久未 + 1 洞洞板**

### 10.3 去重與補位
- 全域去重（bookmark id）
- 池不足時由其餘池補位，優先順序：久未 -> 最近 -> 洞洞板
- 優先避開 `seen_ids_json`；候選不足時允許重新出現
- 同一批內永遠不得出現重複 bookmark id

### 10.4 同日換一批
- 同日換一批不限次數
- 優先避開 `seen_ids_json`；若可用候選不足可重新出現
- 讀取 `batch_json`/`seen_ids_json` 時先過濾已刪除 bookmark id，再依補位規則補足 3 筆

### 10.5 隨機種子 / 重複控制
- 定義 `installationUUID`：首次啟動生成並保存於 App Group UserDefaults。
- 種子：`installationUUID + localDate + refreshCount`
- 確保同使用者同日可重現、換批可變化

### 10.6 lastOpenedAt 更新規則
- 進入 Bookmark 詳細頁時更新。
- 點擊「開啟原文」時再次更新。
- 不設停留門檻。
- 列表、搜尋結果、洞洞板曝光不更新。

### 10.7 測試案例（最低）
- 候選池正常/不足
- 全庫少於 3
- 同日連續換批去重
- 14 天邊界條件

---

## 十一、本機通知

- 使用 `UNUserNotificationCenter`
- `UNCalendarNotificationTrigger`（每日固定時間）

### 11.1 權限流程
- 收藏達 3 筆後顯示 Daily Recall 邀請卡
- 僅在使用者點擊「每天提醒我」時才呼叫 `requestAuthorization`
- Onboarding 不請求通知權限
- 拒絕後可在設定頁提供「前往系統設定」

### 11.2 Identifier 設計
- 固定 identifier：`dailyRecall.primary`
- 啟用、停用、改時間都針對 `dailyRecall.primary` 操作

### 11.3 啟用/停用/改時間
- 啟用：以 `dailyRecall.primary` 建立 trigger
- 停用：移除 `dailyRecall.primary`
- 改時間：移除 `dailyRecall.primary` 後以同 identifier 重建

### 11.4 Deep Link
- 點擊通知由 `AppRootRouter` 導向 `DailyRecallView`（非 Tab 切換）

### 11.5 通知文案策略（Phase 1）
- 不宣稱 repeating `UNCalendarNotificationTrigger` 可每日自動更換內容。
- Phase 1 採**單一固定文案**的每日 repeating notification。
- 多文案輪播列為後續可選優化（需搭配重新排程策略）。

---

## 十二、分類與標籤管理

### 12.1 分類（Phase 1）
- 支援新增、改名、刪除
- 不做拖曳排序
- 刪除分類時：分類內 bookmarks 全部移至 `system-unorganized`
- `system-unorganized` 不可改名、不可刪除（UI 禁止 + UseCase 防呆 + DB trigger）

### 12.2 標籤
- 輸入時 trim
- 英文大小寫不敏感比對
- 命中既有 normalized_key 則重用既有 tag
- 顯示名稱保留首次建立版

---

## 十三、匯出（CSV / JSON）

### 13.1 CSV 欄位
- id, url_original, title, source, note, category_name, tags, is_pegboard, created_at, last_opened_at
- `tags` 以 `;` 分隔

### 13.2 JSON 欄位
- 與 Domain Model 一致，保留 null

### 13.3 日期格式
- Unix epoch milliseconds（UTC）

### 13.4 Null 規則
- CSV：空字串
- JSON：`null`

### 13.5 CSV escaping
- RFC 4180（逗號、雙引號、換行需轉義）

### 13.6 大量匯出記憶體策略
- 分批 cursor 讀取（例如每批 500）
- stream 寫檔，避免一次載入全量

---

## 十四、StoreKit 2（支持木木）

- 自願支持，不解鎖功能
- 商品 ID、價格延後決定（不阻擋 Phase 1）

### 架構預留
- `SupportMumuService`（protocol）
- `StoreKitSupportMumuService`（實作）
- 狀態：idle / purchasing / purchased / failed（`restored` 是否需要待商品決策）

### 流程
- 購買：呼叫 StoreKit 2 -> 驗證 transaction -> 更新本機支持狀態
- 恢復規則：不預設一定支援，依商品類型與商業決策定案
- 失敗：保留可讀錯誤訊息，不隱性吞錯

---

## 十五、安全與隱私

- 無帳號、無伺服器、無遠端 push
- ATS 開啟（僅必要例外）
- URL Scheme 僅允許 http/https
- 惡意 URL/HTML 防護：大小限制、timeout、內容型別檢查
- App Group 權限最小化
- 本機資料保護：檔案保護等級 + 匯出檔顯式提醒敏感性
- Analytics 建議：Phase 1 預設不加第三方追蹤；若加僅匿名本機事件

---

## 十六、Dependency 評估

| 套件 | 用途 | License | 維護狀態 | 風險 | 可否官方替代 | 決策 |
|---|---|---|---|---|---|---|
| GRDB.swift | SQLite 存取/遷移 | MIT | 活躍 | 中低 | 部分（Core Data/SQLite） | **採用** |
| Nuke | 圖片載入與快取 | MIT | 活躍 | 中低 | 可（AsyncImage）但能力不足 | **採用** |
| SwiftSoup（或同級 parser） | HTML/OG 解析 | MIT | 活躍 | 中 | 無等效完整官方 parser | **採用** |
| Kingfisher | 圖片快取 | MIT | 活躍 | 中 | - | 不採用（Nuke 較輕量） |
| SDWebImageSwiftUI | 圖片 | MIT | 活躍 | 中 | - | 不採用（依賴較重） |

---

## 十七、測試策略

- Unit Test：Tag 正規化、URL 驗證、Recall 配比/補位
- Repository Integration Test：CRUD、transaction、索引查詢
- App Group 寫入測試：App/Extension 競爭寫入
- Share Extension 測試：URL 進入、最小收藏成功、pending 原子寫入與失敗回報
- Metadata 測試：timeout/retry/狀態機
- Daily Recall 測試：14 天門檻、同日換批、去重
- Migration 測試：v1 -> v2（假資料）
- UI Test：主流程（收藏、搜尋、分類管理、Recall、設定）
- 資料量測試：0 / 1 / 100 / 1,000 / 10,000

---

## 十八、CI/CD

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
  - Release checklist（通知、Share Extension、匯出、Recall）

---

## 十九、實作順序（垂直切片）

1. **Slice A：收藏核心閉環**
   - DB + Migration + Bookmark 新增/列表 + 未整理分類保護
2. **Slice B：Share Extension 最小可用**
   - 外部分享 URL -> 成功落地 bookmark pending
3. **Slice C：Metadata 與封面圖**
   - 背景補抓 + 狀態機 + Nuke 快取
4. **Slice D：分類/標籤/搜尋**
   - 分類管理、Tag 正規化、複合搜尋
5. **Slice E：Daily Recall + 通知**
   - 3 筆配比、換批、通知 deep link
6. **Slice F：匯出 + 支持木木預留**
   - CSV/JSON 匯出 + StoreKit 2 scaffold

---

## 二十、風險清單

| 風險類型 | 風險描述 | 緩解措施 |
|---|---|---|
| 技術風險 | App/Extension 併發鎖競爭 | WAL + 短交易 + busy timeout/retry + MigrationCoordinator 跨程序鎖 + schema compatibility gate |
| 規格風險 | Recall 配比與補位期望落差 | 先固定演算法 + 加可觀測測試樣本 |
| App Store 風險 | Share Extension 行為不穩 | 嚴格遵守 extension 時間窗與記憶體限制 |
| Extension 風險 | metadata 抓取超時 | 收藏先落地，metadata 後補 |
| 效能風險 | 10k 搜尋延遲 | 索引優化，必要時 FTS5 |

---

## 二十一、Architecture Decision Records（ADR）

| ADR | Decision | Alternatives | Reason | Consequences |
|---|---|---|---|---|
| ADR-001 | 持久化採 GRDB.swift | SwiftData/Core Data/Raw SQLite | App Group + 並發 + migration 平衡最佳 | 增加第三方依賴 |
| ADR-002 | 圖片載入採 Nuke | AsyncImage/Kingfisher/SDWebImageSwiftUI | 體積與效能最佳平衡 | 需維護套件版本 |
| ADR-003 | Metadata 主流程採 URLSession+OG Parser | LinkPresentation-only/第三方全包 | 可控 timeout 與錯誤處理 | parser 維護責任在專案 |
| ADR-004 | 系統分類固定 `system-unorganized` | 無系統分類 | 符合刪分類回收規則 | 需雙層保護避免誤刪 |
| ADR-005 | Recall 配比用最大餘數法落地為 1/1/1 | 固定優先池、純隨機 | 最符合 40/40/20 且可解釋 | 需補位規則處理池不足 |
| ADR-006 | Phase 1 通知採單一固定文案 repeating | 隨機/循序/日期種子輪播 | 與系統排程能力一致、行為可預期 | 多文案需未來改版再導入 |
| ADR-007 | Phase 1 預設不接第三方 analytics | 直接接入第三方 SDK | 隱私與維護風險最低 | 少即時產品分析 |
| ADR-008 | 狀態管理主方案採 `@Observable` | ObservableObject | iOS 17+ 下語意更一致、樣板較少 | 需 iOS 17 baseline |
| ADR-009 | Migration 由 Coordinator + 跨程序鎖控管 | 僅依賴 WAL/busy timeout | 降低多程序 schema 競態風險 | 啟動流程較複雜 |

---

## 最終輸出（Decision Summary）

### 1) 單一推薦架構
- **SwiftUI + GRDB.swift + SQLite(App Group) + Nuke + URLSession/OG Metadata + UNUserNotificationCenter**

### 2) 明確不採用方案
- 不採 SwiftData 作為 Phase 1 主 DB
- 不採 Core Data 作為 Phase 1 主 DB
- 不採 Kingfisher / SDWebImageSwiftUI
- 不採 LinkPresentation-only metadata 流程

### 3) 需由 Jenny 決定的剩餘事項
- App Group 最終 identifier 命名
- StoreKit 商品 ID 與價格
- 重複 URL 是否允許（目前技術上允許）
- StoreKit 商品類型與恢復規則

### 4) 可直接交給 Claude 實作的前置條件
- 確認 bundle IDs 與 App Group
- 確認 iOS deployment target（本提案為 iOS 17+）
- 確認第三方依賴白名單（GRDB/Nuke/SwiftSoup）
- 確認通知文案初版

### 5) 建議第一個垂直開發階段
- **Slice A：收藏核心閉環（DB + Bookmark + 未整理分類保護 + 基礎列表）**
