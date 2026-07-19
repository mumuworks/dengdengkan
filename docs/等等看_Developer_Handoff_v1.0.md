# 《等等看》Developer Handoff v1.0

| 項目 | 內容 |
|---|---|
| 文件狀態 | Phase 1 工程交付基準 |
| 產品版本 | v1.0 |
| UI 依據 | High Fidelity UI v1.1 Final |
| 儲存範圍 | 完全本機；主 App 與 Share Extension 共用 App Group |
| 下一階段 | Technical Architecture 與 Repository／Reuse Analysis |

## 1. Engineering Boundary

本文件定義邏輯資料模型、狀態、商業規則、驗證、流程與非功能需求。實際持久化框架、Repository 實作、URL Metadata 解析方案、StoreKit 商品與通知排程策略，須於下一階段由 GitHub Copilot 完成 Repository／官方能力／成熟方案研究後定案。

Phase 1 不得加入：

- 自建 Server 或帳號系統。
- Google／Apple 登入。
- 跨裝置同步或雲端備份宣稱。
- Firebase、Push Server 或遠端 APNs。
- AI、社群、Todo、任務或排程功能。
- Widget。

## 2. Platform and Native Capabilities

優先使用：

- SwiftUI。
- NavigationStack。
- TabView。
- ScrollView／LazyVGrid。
- Menu。
- Share Extension。
- App Group shared container。
- UserNotifications／`UNCalendarNotificationTrigger`。
- `UIActivityViewController` 或符合部署版本的原生分享能力。
- StoreKit 2（支持木木；商品規則待定）。
- SwiftData 或 SQLite Repository（下一階段定案）。

## 3. App Group

### 3.1 Requirements

- 主 App 與 Share Extension 必須使用同一 App Group entitlement。
- Shared container 為 Phase 1 單一資料來源。
- Bookmark、Category、Tag、BookmarkTag、Settings 與必要 Metadata 狀態必須能由兩個 Target 讀寫。
- Share Extension 完成本機寫入後，主 App 必須可立即讀取。
- Schema migration 需由兩個 Target 共用同一版本定義。

### 3.2 Write Safety

- 使用交易或等效原子寫入。
- Extension 不得先回報成功再寫入。
- 寫入失敗不得建立半筆 Bookmark 或孤立 BookmarkTag。
- Extension 與主 App 同時寫入時不得覆蓋彼此已提交資料。
- 資料庫初始化與 migration 需具程序間競態保護。

## 4. Logical Data Model

所有日期使用絕對時間儲存；顯示時依使用者 Locale／Time Zone 格式化。ID 建議使用 UUID。實際型別映射由 Technical Architecture 定案。

### 4.1 Bookmark

| Field | Type | Required | Default | Rule |
|---|---|---:|---|---|
| `id` | UUID | Yes | Generated | Primary identifier |
| `originalURL` | URL/String | Yes | — | 原始內容網址；不得因 Metadata 失敗清除 |
| `title` | String? | No | `nil` | 無標題時 UI 以 URL／domain 替代 |
| `source` | String? | No | `nil` | 網站或來源名稱 |
| `summary` | String? | No | `nil` | Metadata 描述；Phase 1 不由 AI 產生 |
| `imageURL` | URL/String? | No | `nil` | 預覽圖片位置；本機快取策略待 Technical Architecture 定案 |
| `reason` | String? | No | `nil` | 收藏理由；空白正規化後視為 `nil` |
| `categoryID` | UUID | Yes | 未整理 ID | 每則收藏只能有一個 Category |
| `isPinnedToBoard` | Bool | Yes | `false` | Share Extension 或 Detail 可更新 |
| `metadataState` | MetadataState | Yes | `pending` | `pending`／`resolved`／`failed` |
| `createdAt` | Date | Yes | Now | 建立時間，不因 Metadata 更新改變 |
| `updatedAt` | Date | Yes | Now | 使用者內容或 Bookmark 狀態變更時更新 |
| `lastOpenedAt` | Date? | No | `nil` | 進入 Detail 或開啟原文時更新；列表曝光不更新 |

### 4.2 Category

| Field | Type | Required | Default | Rule |
|---|---|---:|---|---|
| `id` | UUID | Yes | Generated | Primary identifier |
| `name` | String | Yes | — | 顯示名稱；空白不可保存 |
| `isSystem` | Bool | Yes | `false` | 「未整理」為系統分類 |
| `sortOrder` | Integer | Yes | Next | 首頁排序；管理流程尚未定案 |
| `createdAt` | Date | Yes | Now | 建立時間 |
| `updatedAt` | Date | Yes | Now | 名稱或順序更新時間 |

#### System Category: 未整理

- App 首次建立資料庫時必須存在。
- 所有 Bookmark 都必須有有效 `categoryID`。
- Share Extension 未選分類時使用此 ID。
- 是否允許改名或刪除尚未定案；Phase 1 實作前必須由產品決定。

### 4.3 Tag

| Field | Type | Required | Default | Rule |
|---|---|---:|---|---|
| `id` | UUID | Yes | Generated | Primary identifier |
| `name` | String | Yes | — | 使用者輸入名稱；空白不可保存 |
| `createdAt` | Date | Yes | Now | 建立時間 |
| `updatedAt` | Date | Yes | Now | 名稱更新時間 |

Category 與 Tag 可同名。Tag 同名去重、大小寫及 Unicode 正規化規則尚未定案。

### 4.4 BookmarkTag

| Field | Type | Required | Rule |
|---|---|---:|---|
| `bookmarkID` | UUID | Yes | Foreign key → Bookmark |
| `tagID` | UUID | Yes | Foreign key → Tag |
| `createdAt` | Date | Yes | 關聯建立時間 |

Constraints：

- `(bookmarkID, tagID)` 必須唯一。
- Bookmark 刪除時 cascade 刪除 BookmarkTag。
- Tag 刪除時移除關聯，不刪除 Bookmark。
- 不允許孤立關聯。

### 4.5 Settings

使用單一 AppSettings record 或等效 Key-Value abstraction。不可把系統通知權限當成可自行寫入的真實值。

| Field | Type | Required | Default | Rule |
|---|---|---:|---|---|
| `homeNote` | String | Yes | Empty | 全 App 唯一首頁便條紙內容 |
| `dailyRecallEnabled` | Bool | Yes | `false` | 使用者意圖；實際可用性仍依系統權限 |
| `dailyRecallHour` | Integer | Yes | `20` | 0…23 |
| `dailyRecallMinute` | Integer | Yes | `0` | 0…59 |
| `hasSeenDailyRecallPrompt` | Bool | Yes | `false` | 防止重複邀請 |
| `dailyRecallPromptDismissedAt` | Date? | No | `nil` | 使用者選「先不用」時記錄 |
| `onboardingCompleted` | Bool | Yes | `false` | 完成第三頁後寫入 |
| `schemaVersion` | Integer | Yes | Current | Migration 控制 |

以下不得作為持久化真實來源：

- Light／Dark：跟隨系統。
- Notification authorization：每次由 `UNNotificationSettings` 讀取。
- 使用者目前 Tab 或暫時 Loading：UI State。

### 4.6 Daily Recall Selection State

Phase 1 可使用瞬時狀態；若為避免同日重複而持久化，建議邏輯欄位如下，實際是否落盤由 Technical Architecture 決定：

| Field | Type | Purpose |
|---|---|---|
| `generatedForDate` | LocalDate/String | 今日批次日期 |
| `bookmarkIDs` | [UUID] | 目前顯示候選 |
| `generationSeed` | String/Integer? | 可重現取樣，選填 |

## 5. Enumerated States

### 5.1 MetadataState

```text
pending  -> resolved
pending  -> failed
failed   -> pending   (manual or scheduled retry)
pending  -> failed    (timeout/unrecoverable fetch)
```

| State | Meaning | Required UI |
|---|---|---|
| `pending` | URL 已保存，Metadata 擷取中 | Skeleton、URL、擷取中 |
| `resolved` | 可用 Metadata 已完成 | 標題／來源／圖片；缺欄位仍可為空 |
| `failed` | 本次擷取失敗 | URL 已保留、穩定 Placeholder、可重試 |

`resolved` 不代表每個欄位都有值；網站可能合法地沒有圖片或標題。

### 5.2 NotificationAuthorizationState

由 iOS 系統回傳並映射：

- `notDetermined`
- `denied`
- `authorized`
- `provisional`（若部署策略使用）
- `ephemeral`（如 API 回傳；一般 App 不依賴）

UI 至少區分：未詢問、可用、權限未開。

### 5.3 DailyRecallState

| State | Definition |
|---|---|
| `notEligible` | 尚未達邀請條件 |
| `eligible` | 可顯示邀請卡 |
| `promptDismissed` | 使用者選「先不用」 |
| `permissionRequired` | 使用者有啟用意圖，系統尚未授權 |
| `enabled` | 使用者啟用且系統允許，排程存在 |
| `disabled` | 使用者關閉或未啟用 |
| `permissionDenied` | 使用者啟用意圖存在，但系統拒絕 |
| `scheduleError` | 權限允許但排程建立失敗 |

### 5.4 Bookmark Content States

- Has image／No image。
- Has title／No title。
- Has reason／No reason。
- Has tags／No tags。
- Pinned／Not pinned。
- URL only。
- Metadata pending／resolved／failed。

### 5.5 UI States

所有可互動元件至少支援：

- Default。
- Pressed。
- Focused（輸入）。
- Filled（輸入）。
- Disabled。
- Loading。
- Error。
- Empty。

## 6. Business Rules

### BR-001 Local First

Phase 1 所有使用者資料儲存在 App Group shared container；不要求帳號或登入。

### BR-002 Bookmark Completion

`originalURL` 與有效 `categoryID` 寫入成功即視為收藏完成。Metadata、Tag、Reason 與洞洞板均不得阻擋完成。

### BR-003 Default Category

未選 Category 時必須使用「未整理」，不得讓 Category 為 `nil`。

### BR-004 Category Cardinality

每則 Bookmark 恰有一個 Category。

### BR-005 Tag Cardinality

每則 Bookmark 可有 0…n 個 Tag；透過 BookmarkTag 關聯。

### BR-006 Category and Tag Names

Category 與 Tag 允許同名；UI 必須以區塊標題與不同元件呈現。

### BR-007 Reason Optionality

Reason 為選填。無 Reason 時詳細頁與洞洞板不顯示空白便利貼或強迫填寫提示。

### BR-008 Pinning

Bookmark 可由 Share Extension 或 Detail 設為 Pinned；取消釘選只改變 `isPinnedToBoard`，不刪除資料。

### BR-009 Last Opened Time

- Bookmark 建立時 `lastOpenedAt = nil`。
- 進入 Bookmark Detail 時更新為 Now。
- 點擊開啟原文時更新為 Now。
- 列表、搜尋、洞洞板或 Daily Recall 卡片曝光不更新。

### BR-010 Metadata Independence

Metadata 擷取不得延遲或回滾已完成的本機收藏。

### BR-011 Daily Recall Purpose

Daily Recall 只邀請重新觀看收藏，不建立完成狀態、任務或排程。

### BR-012 Notification Permission

只有使用者點「每天提醒我」或在設定主動啟用時才能呼叫通知權限；Onboarding 不得要求。

### BR-013 Daily Frequency

每日一次，預設 20:00；只允許修改單一時間。不支援每週、多次、多組或間隔。

### BR-014 Notification Route

點擊 Daily Recall 通知直接進今日回顧。

### BR-015 Export Ownership

CSV／JSON 匯出對所有使用者開放，不得設為支持或付費功能。

### BR-016 Support

支持木木不解鎖功能。

### BR-017 Single Home Note

全 App 只有一筆 Home Note；不建立列表、第二頁或 Tab。

### BR-018 Theme

App 外觀跟隨 iOS；不保存 App 內 Light／Dark 選項。

## 7. Validation

### 7.1 Bookmark

| Rule | Failure Handling |
|---|---|
| `originalURL` 必須可解析為允許的 URL scheme | 保留 Extension，顯示短錯誤，不寫入半筆資料 |
| `categoryID` 必須存在 | 回退至「未整理」；若系統分類不存在，先修復／建立後交易寫入 |
| `reason` 去除首尾空白後為空 | 儲存為 `nil` |
| `lastOpenedAt` 不得早於不合理系統界線 | 不由使用者輸入；以系統 Now 寫入 |
| `createdAt` 不可由 Metadata 覆寫 | 保留原值 |

### 7.2 Category

- 名稱去除首尾空白後不可為空。
- 系統分類「未整理」必須存在且 ID 穩定。
- Category 刪除時 Bookmark 轉移規則尚未定案，未確認前不得實作刪除。

### 7.3 Tag

- 名稱去除首尾空白後不可為空。
- 單一 Bookmark 不得建立重複 `(bookmarkID, tagID)`。
- Tag 正規化與全域同名策略未定案。

### 7.4 Daily Recall Time

- Hour：0…23。
- Minute：0…59。
- 依使用者目前 Calendar／Time Zone 建立排程。
- 時區改變後的排程行為需在 Technical Architecture 與 QA 明確測試。

### 7.5 Export

- 匯出前以一致性快照讀取資料。
- 每列 Bookmark 必須能解析 Category；異常關聯不得造成整批靜默缺漏。
- JSON `lastOpenedAt` 可為 `null`；CSV 為空欄。
- URL、Reason 與 Tag 中的逗號、換行、引號必須正確 escaping。

## 8. Daily Recall Recommendation Logic

### 8.1 Inputs

- 全部未刪除 Bookmark。
- `createdAt`。
- `lastOpenedAt`。
- `isPinnedToBoard`。
- 當日已選 Bookmark IDs（若有）。

### 8.2 Candidate Pools

1. Recent：依 `createdAt` 由新到舊。
2. Long-unopened：
   - `lastOpenedAt != nil`：依最後開啟時間由舊到新。
   - `lastOpenedAt == nil`：收藏滿最低天數後視為從未開啟候選。
3. Pegboard：`isPinnedToBoard == true`。

### 8.3 Target Weight

- Recent 40%。
- Long-unopened 40%。
- Pegboard 20%。

比例為工程可微調權重，不是每一批必須精確整數配額；三個來源不得永久只剩 Recent。

### 8.4 Selection Rules

- 同一批不重複 Bookmark。
- 排除已刪除 Bookmark。
- 候選池不足時從其他可用池補齊。
- 點「換一批」時優先避開目前批次。
- 被顯示不更新 `lastOpenedAt`。
- 點入 Detail 才更新 `lastOpenedAt`。

### 8.5 Unresolved Parameters

- 每批顯示數量目前由 Final UI 示意為 3，是否固定仍需產品確認。
- 從未開啟候選的最低收藏天數未定。
- 同日換一批是否需跨 App 重啟保留排除清單未定。

## 9. Metadata Flow

```mermaid
stateDiagram-v2
    [*] --> URLSaved
    URLSaved --> Pending
    Pending --> Resolved: metadata available
    Pending --> Failed: timeout or parse failure
    Failed --> Pending: retry
```

### 9.1 Save Order

1. 驗證 URL。
2. 解析／取得有效 Category，缺省使用未整理。
3. 在單一交易建立 Bookmark、Tag 與 BookmarkTag。
4. Commit shared container。
5. 回饋收藏完成。
6. 進行 Metadata 擷取。
7. 只更新仍未被使用者手動修改的 Metadata 欄位。

### 9.2 Metadata Field Precedence

- 使用者手動編輯內容優先於後續擷取。
- Metadata retry 不得覆蓋使用者已編輯 Title／Reason／Category／Tags。
- 原始 URL 永遠保留。

### 9.3 Failure

- 設 `metadataState = failed`。
- 保留 Bookmark。
- UI 顯示 URL、Placeholder 與「網址已保留」。
- 不以無限重試消耗電量或網路。

## 10. Share Extension Flow

```mermaid
flowchart TD
    A["Receive shared URL"] --> B["Build preview"]
    B --> C["Default category: 未整理"]
    C --> D["Optional category / tags / pin"]
    D --> E["Atomic App Group write"]
    E -->|Success| F["幫你記住了"]
    E -->|Failure| G["Keep sheet and retry"]
    F --> H["Metadata continues locally"]
```

### 10.1 Extension Limits

- 不依賴主 App 正在執行。
- 避免大型記憶體圖片解碼。
- 不在 Extension 執行長時間背景任務。
- Extension 完成前必須確保資料已持久化。
- 必須處理主 App 與 Extension 同時存取 shared store。

## 11. Export

### 11.1 CSV

- UTF-8 with BOM。
- 第一列為穩定英文欄位名稱。
- 正確處理逗號、雙引號、CR/LF。
- `tags[]` 的單欄序列化分隔規則尚未定案。
- `lastOpenedAt == nil` 輸出空欄。

### 11.2 JSON

建議結構：

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-07-20T12:00:00Z",
  "bookmarks": [
    {
      "title": "東京住宿攻略",
      "originalURL": "https://example.com/tokyo",
      "source": "example.com",
      "category": "旅遊",
      "tags": ["東京", "住宿"],
      "reason": null,
      "createdAt": "2026-07-18T12:00:00Z",
      "lastOpenedAt": null,
      "isPinnedToBoard": false
    }
  ]
}
```

- 日期使用 ISO 8601。
- 不輸出內部 App Group path、系統 Token 或其他非使用者資料。
- 匯出檔建立於暫存位置，Share Sheet 結束後依保留政策清理。

## 12. Notification Rules

### 12.1 Permission

- Onboarding 禁止請求。
- 只有明確點擊啟用動作才呼叫 `requestAuthorization`。
- `denied` 時顯示系統設定入口。
- App 進入前景或返回設定頁時重新讀取通知權限。

### 12.2 Schedule

- Identifier 必須穩定且可精確移除，例如 `dailyRecall.primary`。
- 啟用或改時間時先移除既有 Pending Request，再建立新 Request。
- 關閉時移除 Pending Request。
- 每日一次，預設 20:00。
- Notification `userInfo` 包含 `route = dailyRecall`。

### 12.3 Copy

文案從已確認清單選擇，不得使用「待辦」「完成」或催促語氣。若要求每日輪播，單一 repeating notification 無法自然更換每日內容；排程策略須在 Technical Architecture 定案，不得為了輪播引入 Server。

## 13. Migration

### 13.1 General Rules

- 每次 schema 變更提高 `schemaVersion`。
- Migration 必須在 shared store 可被兩個 Target 一致理解。
- Migration 前不得破壞原資料。
- 失敗時不得建立空 store 覆蓋舊 store。
- 建議保留可恢復備份或使用持久化框架的安全 migration 能力。

### 13.2 `lastOpenedAt` Migration

- 新增 nullable Date 欄位。
- 所有既有 Bookmark 回填 `nil`。
- 不得以 `createdAt` 假裝最後開啟時間。
- Migration 後 Daily Recall 將這些資料視為從未開啟，須套用最低收藏天數規則。

### 13.3 System Category Migration

- 確認「未整理」存在。
- 任何缺少有效 Category 的 Bookmark 必須轉至「未整理」。
- 不刪除使用者資料。

## 14. Security and Privacy Notes

### 14.1 Data Classification

收藏 URL、Reason、Tag 與 Home Note 可能包含私人生活資訊，視為使用者私人資料。

### 14.2 Storage

- Shared container 使用 iOS Data Protection 能力。
- 不將完整收藏資料寫入 Console、Analytics 或 Crash log。
- 不在通知內容中顯示敏感收藏標題；Final 文案採一般性文字。
- 匯出檔可能含私人資料，僅由使用者主動觸發。

### 14.3 URL Handling

- 僅允許明確支援的 URL scheme；不得直接執行任意 deep link 或 script scheme。
- UI 顯示 URL 時做文字處理，不解析為 HTML。
- 開啟外部 URL 使用系統安全 API。
- Metadata 內容視為不可信輸入，需限制長度並避免 HTML／script 注入到任何 WebView。

### 14.4 Share Extension

- App Group identifier 不得提交錯誤環境或 Team 設定。
- 不在 Extension 暴露 secret；Phase 1 不需要 Server credential。

### 14.5 Export

- 匯出暫存檔完成分享後清理。
- 檔名不得包含使用者私人內容。
- 錯誤 log 不記錄 URL、Reason 或 Tag 原文。

### 14.6 Third-party Dependencies

下一階段研究任何 Package 時必須檢查：維護狀態、License、安全紀錄、依賴負擔、資料傳輸、隱私與是否真的優於原生能力。

## 15. Performance Notes

- 分類與搜尋列表使用 Lazy container，不一次實體化所有卡片。
- 圖片載入需限制解碼尺寸、快取上限與記憶體使用。
- Share Extension 不下載大型圖片後再完成收藏。
- 搜尋需避免每次鍵入進行昂貴全資料重算；採 debounce 或本機索引策略由 Technical Architecture 決定。
- Metadata retry 需有次數／退避上限。
- App 啟動不等待網路。
- Daily Recall 候選只在需要時產生，避免每次畫面刷新全量排序。
- 匯出大量資料使用串流／分批編碼或背景工作，避免一次建立巨大記憶體物件。
- 測試至少包含 0、1、100、1,000、10,000 筆 Bookmark 的列表、搜尋、回顧與匯出。

## 16. Error Recovery

| Failure | Required Behavior |
|---|---|
| Shared store init failure | 阻擋寫入、保留原檔、顯示可理解錯誤 |
| Share write failure | Extension 保持開啟、允許重試、不回報成功 |
| Metadata failure | Bookmark 與 URL 保留，標記 failed |
| Image load failure | 使用 Placeholder Token |
| Notification permission denied | 顯示前往系統設定，不重複彈系統視窗 |
| Schedule failure | 不顯示已啟用假狀態，允許重試 |
| Export failure | 不開啟空 Share Sheet，清理不完整暫存檔 |
| Delete failure | Bookmark 保留，畫面回復一致狀態 |

## 17. Accessibility Engineering

- 所有主要文字使用 iOS Text Style／Dynamic Type。
- 最小實際產品字級 Caption 12 pt；不得以 8–9 px 實作。
- 觸控區至少 44 × 44 pt。
- 洞洞板在 Accessibility Large 起支援單欄。
- 使用者輸入文字不可無提示截斷。
- Placeholder、Error、Selected 不只依賴顏色。
- VoiceOver label 不朗讀裝飾字元。
- Reduce Motion 下停止 Skeleton 流光與非必要動畫。

## 18. Test Matrix

### 18.1 Required Functional Tests

- Share Extension 零操作收藏。
- 未整理不存在時的修復與收藏。
- 0／1／多個 Tag。
- Category 與 Tag 同名顯示。
- Metadata pending／resolved／failed／無圖片／無標題。
- Detail 進入與開啟原文更新 `lastOpenedAt`。
- 列表曝光不更新 `lastOpenedAt`。
- Pin／Unpin 不刪除 Bookmark。
- Daily Recall 邀請、先不用、允許、拒絕、系統設定返回。
- 修改時間、關閉通知、冷啟動 notification route。
- Recommendation 三個候選池與不足補位。
- CSV／JSON escaping、null、10,000 筆匯出。
- Migration 將既有 `lastOpenedAt` 回填 nil。

### 18.2 Required UI Matrix

- Light／Dark。
- 標準 Dynamic Type／Accessibility 最大測試尺寸。
- VoiceOver。
- Increase Contrast。
- Reduce Motion。
- iPhone Safe Area 與不同寬度。

## 19. Technical Acceptance Criteria

- [ ] 主 App 與 Share Extension 讀寫同一 App Group store。
- [ ] Share Extension 寫入成功後主 App 可立即看到 Bookmark。
- [ ] Metadata 失敗不造成資料遺失或卡片破版。
- [ ] Bookmark、Category、Tag、BookmarkTag 關聯完整且無孤立資料。
- [ ] `lastOpenedAt` 更新點與不更新點符合 BR-009。
- [ ] Daily Recall 不需要網路或 Server。
- [ ] 通知點擊直接進今日回顧。
- [ ] 匯出包含 `lastOpenedAt` 且可處理 null。
- [ ] 不含登入、同步、AI、Todo 或 Widget。
- [ ] HTML Final 中已確認的 Light／Dark、Dynamic Type 與 44 pt 規則被落實。
- [ ] 所有必要自動化測試與 GitHub Actions 檢查通過。

## 20. Safety Review

| 項目 | 狀態 | 說明 |
|---|---|---|
| Authentication | N/A | Phase 1 無帳號 |
| Authorization | N/A／App sandbox | 單一裝置使用者；App Group 只供兩個 Target |
| Private data | Action required | 使用 Data Protection、避免敏感 log 與通知內容 |
| Destructive delete | Action required | Alert 確認、交易刪除、失敗回復 |
| Export privacy | Action required | 主動觸發、暫存清理、無隱藏欄位 |
| URL input | Action required | Scheme allowlist、長度限制、Metadata 不可信 |
| Migration | Blocking until tested | 不得以空 store 覆蓋舊資料 |
| Third-party packages | Pending next gate | Copilot 需完成 reuse／license／security 研究 |

## 21. Open Engineering Issues

| ID | Issue |
|---|---|
| DEV-I01 | SwiftData 或 SQLite 及 shared container 的具體持久化方案待 Technical Architecture。 |
| DEV-I02 | Daily Recall 邀請確切收藏門檻未定。 |
| DEV-I03 | 從未開啟候選最低天數與每批固定數量未定。 |
| DEV-I04 | 十則通知每日輪播的本機排程策略未定，不得引入 Server。 |
| DEV-I05 | 分類新增／改名／刪除／排序及刪除後 Bookmark 轉移規則未定。 |
| DEV-I06 | Tag 正規化與同名去重規則未定。 |
| DEV-I07 | Metadata 圖片快取策略與保留上限未定。 |
| DEV-I08 | CSV `tags[]` 單欄格式未定。 |
| DEV-I09 | 支持木木 StoreKit 商品、價格、消耗型態與恢復規則未定。 |
| DEV-I10 | Analytics 與隱私策略未定；Phase 1 不得假設有事件後端。 |

