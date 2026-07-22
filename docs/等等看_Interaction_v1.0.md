# 《等等看》Interaction Specification v1.0

| 項目 | 內容 |
|---|---|
| 文件狀態 | Phase 1 開發基準 |
| 產品版本 | v1.0 |
| 文件修訂 | 1.3（2026-07-21 備份規格決策補完） |
| UI 依據 | High Fidelity UI v1.1 Final |
| 導覽 | 收藏／洞洞板／搜尋／設定 |

## 1. Global Interaction Rules

本文件定義 Phase 1 目標互動，不表示 Xcode Project、Share Extension Target 或 App Group 已存在；上述項目目前尚未建立。

- 使用 iOS 原生 NavigationStack、TabView、Sheet、Menu、Share Sheet 與系統通知行為。
- 所有觸控區至少 44 × 44 pt。
- Bottom Navigation 固定四個 Tab；切換 Tab 保留各 Tab 捲動位置，再次點擊目前 Tab 回到頂部。
- 正式 App 跟隨系統 Light／Dark 與 Dynamic Type，不提供 App 內外觀切換。
- 主要動作每個畫面至多一個；破壞性動作必須與一般動作分離。
- 本機資料寫入成功後立即回饋，不等待 Metadata 擷取。
- Loading 不得阻擋已存在的本機內容。
- 任何網路或 Metadata 失敗不得刪除已保存的原始網址。

## 2. App Launch

| 項目 | 規格 |
|---|---|
| Trigger | 使用者從 App Icon、通知或系統路由開啟 App。 |
| User Action | 無，或點擊 Daily Recall 通知。 |
| System Response | 顯示 Splash；載入本機資料與設定；判斷首次啟動、通知路由、Daily Recall 邀請條件及剪貼簿提示條件。 |
| Navigation | 首次啟動進 Onboarding；一般啟動進上次／預設 Tab；Daily Recall 通知直接進今日回顧。 |
| Exception Handling | 本機資料庫無法開啟時顯示阻擋錯誤，不建立空資料覆蓋原資料；通知目標不存在時進今日回顧並重新產生可用候選。 |

### 2.1 Launch Priority

1. 完成本機資料層初始化。
2. 處理 Daily Recall notification route。
3. 處理首次啟動 Onboarding。
4. 一般進入 App。
5. 進入後再評估非阻擋式剪貼簿提示或 Daily Recall 邀請，不同時堆疊兩個提示。

## 3. Splash

| 項目 | 規格 |
|---|---|
| Trigger | App 冷啟動。 |
| User Action | 無。 |
| System Response | 顯示品牌標誌與「等等看」，完成必要初始化後自動前進。 |
| Navigation | 首次啟動 → Onboarding；其他情況 → 對應目的頁。 |
| Exception Handling | 不為了延長品牌曝光而固定等待；初始化失敗依 App Launch 錯誤規則處理。 |

## 4. Onboarding

### 4.1 Page 1 — 收藏

| 項目 | 規格 |
|---|---|
| Trigger | 首次完成 Splash。 |
| User Action | 點「繼續」。 |
| System Response | 前進至第二頁。 |
| Navigation | Onboarding Page 2。 |
| Exception Handling | 不要求登入、通知權限或剪貼簿權限。 |

文案：

- 「看到喜歡的，就先收著。」
- 「分享到《等等看》，之後一定找得到。」

### 4.2 Page 2 — 理由

| 項目 | 規格 |
|---|---|
| Trigger | Page 1 點「繼續」。 |
| User Action | 點「繼續」。 |
| System Response | 前進至第三頁。 |
| Navigation | Onboarding Page 3。 |
| Exception Handling | 不要求立即輸入收藏理由。 |

### 4.3 Page 3 — 找回

| 項目 | 規格 |
|---|---|
| Trigger | Page 2 點「繼續」。 |
| User Action | 點「開始使用」。 |
| System Response | 記錄 Onboarding 已完成。 |
| Navigation | 收藏首頁。 |
| Exception Handling | 若記錄失敗，不清除其他本機資料；下次啟動可安全重試。 |

## 5. Home

| 項目 | 規格 |
|---|---|
| Trigger | 完成 Onboarding、一般啟動或點擊收藏 Tab。 |
| User Action | 編輯首頁便條紙、點擊分類、回應剪貼簿提示或 Daily Recall 邀請。 |
| System Response | 顯示單一便條紙與分類 Card；便條紙原位編輯並自動儲存。 |
| Navigation | 分類 Card → 分類列表；Bottom Tab → 對應主頁；提示卡「加入」→ 收藏流程。 |
| Exception Handling | 沒有收藏時顯示首頁空狀態；便條紙儲存失敗時保留輸入並顯示 Inline／Banner，不靜默丟失。 |

### 5.1 Home Sticky Note

- 全 App 只有一張。
- 點擊後原位進入編輯。
- 失去焦點或內容變更後自動儲存。
- 不顯示日期、完成按鈕、勾選框或排程。
- 空內容仍保留便條紙元件。

### 5.2 Home Categories

- 每張 Card 整張可點。
- 左側顯示分類名稱與收藏數，右側顯示 2–4 張預覽圖。
- 沒有可用圖片時使用 Placeholder Token，不留不合理空白。
- 首頁不顯示最近新增、最近瀏覽或收藏 Carousel。

## 6. Share Extension

| 項目 | 規格 |
|---|---|
| Trigger | 使用者從其他 App 的 iOS Share Sheet 選擇《等等看》。 |
| User Action | 可修改分類、輸入零或多個標籤、切換加入洞洞板，或直接點「幫我記住」。 |
| System Response | 預設分類為「未整理」、標籤空白、洞洞板關閉；寫入 App Group shared container 後顯示完成回饋並關閉 Extension。 |
| Navigation | 完成後回到來源 App；不強制開啟主 App。 |
| Exception Handling | Metadata 未完成不阻擋收藏；URL 無法解析或本機寫入失敗時保留面板並提供清楚錯誤與重試。 |

### 6.1 Share Validation

- `originalURL` 是網址收藏的必要資料。
- Category 必有值；未操作時使用「未整理」。
- Tag 為選填，可為空陣列。
- `isPinnedToBoard` 預設 `false`。
- 「幫我記住」不得因分類未手動選取、Tag 空白或 Metadata 尚未取得而停用。
- 不提供大型收藏理由輸入區。

### 6.2 Completion Feedback

- App Group 寫入成功後回饋「幫你記住了。」
- 不延長成功動畫。
- 若 Extension 結束前 Metadata 尚未完成，由後續本機流程接續。

## 7. Clipboard URL Detection

| 項目 | 規格 |
|---|---|
| Trigger | 使用者複製網址後開啟主 App，App 偵測到可處理的剪貼簿 URL。 |
| User Action | 點「加入」或關閉。 |
| System Response | 顯示非阻擋式提示列／提示卡；關閉後維持目前頁面。 |
| Navigation | 「加入」→ 收藏流程；關閉 → 留在原頁。 |
| Exception Handling | 非 URL、無效 URL 或已處理內容不顯示提示；不得一開 App 即顯示大型 Modal。 |

## 8. Bookmark Detail

| 項目 | 規格 |
|---|---|
| Trigger | 點擊分類列表、搜尋結果、洞洞板卡片或今日回顧卡片。 |
| User Action | 閱讀、編輯理由、釘選／取消釘選、開啟原文、分享、編輯或刪除。 |
| System Response | 顯示閱讀式詳細頁；進入頁面即更新 `lastOpenedAt`。 |
| Navigation | 返回來源列表；開啟原文 → 系統瀏覽器／來源 App；編輯 → 編輯流程；分享 → iOS Share Sheet。 |
| Exception Handling | 無理由時不顯示完整空白便利貼；無圖片／標題時使用 Metadata 替代狀態；原文無法開啟時顯示阻擋 Alert 並保留收藏。 |

### 8.1 Reason Note

- 有內容：顯示便利貼樣式，點擊直接編輯。
- 無內容：不顯示完整空白便利貼，不以引導文強迫填寫。

### 8.2 Pin Action

- 未加入洞洞板：顯示「釘到洞洞板」。
- 已加入洞洞板：顯示「取消釘選」。
- 操作成功後原位更新文字與狀態。
- 取消釘選不刪除收藏。

### 8.3 Open Original and `lastOpenedAt`

- 進入詳細頁時更新一次 `lastOpenedAt`。
- 點擊「開啟原文」時再次寫入目前時間。
- 只看到列表、搜尋結果、洞洞板或今日回顧卡片不更新。
- 外部 URL 開啟失敗不回復已寫入的 `lastOpenedAt`。

### 8.4 Delete

- 使用破壞性確認 Alert。
- 使用者確認後刪除 Bookmark 及其 BookmarkTag 關聯，並從分類、搜尋、洞洞板與今日回顧候選移除。
- 取消時不做任何變更。
- 寫入失敗時保留收藏並顯示錯誤。

## 9. Category

### 9.1 Category List — Populated

| 項目 | 規格 |
|---|---|
| Trigger | 點擊首頁分類 Card。 |
| User Action | 點擊收藏、開啟排序／篩選 Menu、返回。 |
| System Response | 顯示分類名稱、收藏數、排序／篩選入口與收藏列表。 |
| Navigation | 收藏 → Bookmark Detail；返回 → Home。 |
| Exception Handling | 圖片或 Metadata 不完整時顯示穩定替代卡；排序結果不得改變資料歸屬。 |

### 9.2 Category List — Empty

| 項目 | 規格 |
|---|---|
| Trigger | 開啟收藏數為 0 的分類。 |
| User Action | 返回。 |
| System Response | 顯示「這個分類還是空的。」與一句使用說明。 |
| Navigation | 返回收藏首頁。 |
| Exception Handling | 不顯示大型教學、不強制建立收藏。 |

### 9.3 Category Rules

- 每則收藏只有一個 Category。
- Category 不得為空；缺省使用「未整理」。
- Category 與 Tag 可同名。
- 分類新增、改名、刪除、排序及 Menu 選項內容仍為 Open Issue，不得由工程自行補流程。

## 10. Tag

| 項目 | 規格 |
|---|---|
| Trigger | Share Extension 或收藏編輯流程輸入 Tag；搜尋或詳細頁顯示 Tag。 |
| User Action | 新增或移除 Tag。 |
| System Response | 建立／移除 BookmarkTag 關聯；不改變 Category。 |
| Navigation | 不建立獨立 Bottom Tab；搜尋可依 Tag 找到收藏。 |
| Exception Handling | Tag 空白不阻擋收藏；同名 Category 不報錯；Tag 去重與正規化規則為 Open Issue。 |

## 11. Pegboard

### 11.1 Populated State

| 項目 | 規格 |
|---|---|
| Trigger | 點擊洞洞板 Tab。 |
| User Action | 捲動、切換篩選、點擊卡片。 |
| System Response | 顯示釘選視覺與已加入洞洞板的收藏。 |
| Navigation | 卡片 → Bookmark Detail。 |
| Exception Handling | 無理由卡片不顯示空白便利貼；無圖片使用 Placeholder；大型字級改為單欄。 |

### 11.2 Empty State

| 項目 | 規格 |
|---|---|
| Trigger | 洞洞板沒有收藏。 |
| User Action | 切換其他 Tab。 |
| System Response | 顯示「洞洞板還是空的。」與「可以把特別想留下來的收藏釘在這裡。」 |
| Navigation | 無額外教學頁。 |
| Exception Handling | 不顯示強迫加入或填寫理由的提示。 |

## 12. Search

| 項目 | 規格 |
|---|---|
| Trigger | 點擊搜尋 Tab。 |
| User Action | 輸入關鍵字、切換全部／分類／標籤範圍、點擊結果或清除。 |
| System Response | 即時或短延遲查詢本機資料；顯示符合的收藏。 |
| Navigation | 收藏結果 → Bookmark Detail。 |
| Exception Handling | 無結果顯示「沒有找到符合的內容。」與「清除搜尋」；空輸入不顯示熱門或推薦內容。 |

### 12.1 Search Result Presentation

- Category：固定「分類」標題加單一 Chip。
- Tag：固定「標籤」標題加零或多個 Chip。
- Category 與 Tag 即使同名也不能混成同一段 Metadata。
- 結果卡片整張可點。

## 13. Metadata State

| 狀態 | Trigger | System Response | Navigation | Exception Handling |
|---|---|---|---|---|
| Pending | URL 已保存，Metadata 尚未完成 | 固定縮圖槽、Skeleton、網址與「擷取中」 | 卡片仍可進詳細頁 | Reduce Motion 時停止流光 |
| URL only | 僅有原始網址 | 以網址或網域作主要文字 | 可開啟原文 | 不留空標題高度 |
| No title | Title 為空 | 以原始網址／網域替代 | 正常進詳細頁 | 不顯示空白標題 |
| No image | Image URL 為空或載入失敗 | 使用 `placeholder` Token | 正常進詳細頁 | 保留固定比例，不破版 |
| Resolved | Metadata 完成 | 原位更新標題、來源與圖片 | 無額外跳轉 | 不改變使用者已編輯內容 |
| Failed | 擷取失敗 | 顯示「內容暫時無法取得」「網址已保留」 | 可開啟原文／重試 | 不刪除 URL、不反覆阻擋 |

## 14. Daily Recall

### 14.1 Invitation

| 項目 | 規格 |
|---|---|
| Trigger | 第一筆收藏完成後的後續 App Launch，或收藏達 3–5 筆。 |
| User Action | 點「每天提醒我」或「先不用」。 |
| System Response | 「先不用」關閉並記錄提示狀態；「每天提醒我」才請求通知權限。 |
| Navigation | 完成後留在目前頁面；不進 Onboarding。 |
| Exception Handling | 同一啟動週期不與剪貼簿提示重疊；門檻確切數字為 Open Issue。 |

### 14.2 Notification Permission

| 項目 | 規格 |
|---|---|
| Trigger | 使用者點「每天提醒我」，或設定頁主動啟用。 |
| User Action | 在 iOS 系統權限視窗允許或拒絕。 |
| System Response | 允許：建立每日本機通知；拒絕：顯示權限未開狀態。 |
| Navigation | 拒絕後可從設定點「前往系統設定」。 |
| Exception Handling | 不重複呼叫不可再次顯示的系統授權視窗；設定 UI 以 `UNNotificationSettings` 真實狀態為準。 |

### 14.3 Daily Schedule

| 項目 | 規格 |
|---|---|
| Trigger | 首次啟用或修改提醒時間。 |
| User Action | 選擇時間。 |
| System Response | 取消既有 Daily Recall 排程並建立新的每日一次排程；預設 20:00。 |
| Navigation | 返回設定。 |
| Exception Handling | 排程失敗時不顯示已啟用假狀態；提示使用者再試一次。 |

### 14.4 Notification Tap

| 項目 | 規格 |
|---|---|
| Trigger | 使用者點 Daily Recall 本機通知。 |
| User Action | 點擊通知。 |
| System Response | 解析 `route=dailyRecall`，產生今日回顧候選。 |
| Navigation | 直接進今日回顧。 |
| Exception Handling | 冷啟動、背景與前景皆需支援；無候選時顯示簡短空狀態，不回首頁假裝成功。 |

### 14.5 Today Recall

| 項目 | 規格 |
|---|---|
| Trigger | 點通知或由 Daily Recall 流程開啟。 |
| User Action | 點收藏或「換一批」。 |
| System Response | 依最近收藏、久未開啟、洞洞板權重產生候選；換一批時重新取樣並避免同批重複。 |
| Navigation | 收藏 → Bookmark Detail；返回 → 原導覽狀態。 |
| Exception Handling | 候選不足時從可用池補齊；已刪除項目不顯示；列表曝光不更新 `lastOpenedAt`。 |

## 15. Export

| 項目 | 規格 |
|---|---|
| Trigger | 設定 → 匯出收藏。 |
| User Action | 選擇 CSV 或 JSON，點「匯出收藏」。 |
| System Response | 從本機資料建立檔案，完成後開啟 iOS Share Sheet。 |
| Navigation | Share Sheet 完成或取消後回匯出頁。 |
| Exception Handling | 建檔失敗顯示可恢復錯誤；不產生部分內容卻標示成功；使用者取消 Share Sheet 不視為錯誤。 |

### 15.1 Export Fields

- `title`
- `originalURL`
- `source`
- `category`
- `tags[]`
- `reason`
- `createdAt`
- `lastOpenedAt`
- `isPinnedToBoard`

`lastOpenedAt == nil` 時，CSV 為空值，JSON 為 `null`。

## 16. Backup and Restore

### 16.1 Export Backup

| 項目 | 規格 |
|---|---|
| Trigger | 設定 → 匯出備份。 |
| User Action | 點「匯出備份」，在 iOS 系統介面選擇儲存或分享位置。 |
| System Response | 從 Domain Model 建立不含圖片二進位檔的單一 JSON，檔名為 `等等看_Backup_YYYY-MM-DD_HHmm_v1.json`；成功建立後顯示系統 File Exporter／Share Sheet。只有系統回報完成匯出時，才更新「最近一次備份日期」。 |
| Navigation | 系統介面完成或取消後返回設定。 |
| Exception Handling | 建檔失敗不開啟空介面；使用者取消不視為失敗，也不更新最近備份日期。App 不判斷目的地是 iCloud Drive、我的 iPhone 或第三方 File Provider。 |

### 16.2 Import Backup — File Selection and Validation

| 項目 | 規格 |
|---|---|
| Trigger | 設定 → 匯入備份。 |
| User Action | 從 iOS Document Picker 選取備份檔。 |
| System Response | 先檢查檔案不得超過 50 MB，再將選取檔複製至受控暫存位置；驗證 JSON 格式、`schemaVersion`、`modelVersion`、SHA-256 checksum、必要欄位、資料型別、關聯完整性與支援版本。未知非必要欄位忽略；驗證期間不修改正式資料。 |
| Navigation | 驗證成功 → 匯入預覽；取消 → 設定；驗證失敗 → 錯誤狀態。 |
| Exception Handling | 無法存取、超過 50 MB、格式錯誤、checksum 不符、檔案不完整、版本不支援或資料關聯無效時停止流程，顯示「沒有匯入，原本的資料都還在。」並清理暫存檔。版本高於 App 支援範圍時提示更新 App；舊版沒有明確 migration adapter 時拒絕，不猜測轉換。 |

### 16.3 Import Preview and Replacement Confirmation

| 項目 | 規格 |
|---|---|
| Trigger | 備份檔驗證全部成功。 |
| User Action | 查看備份建立日期與收藏筆數，選擇「取消」或「取代目前資料」。 |
| System Response | 清楚警告 Phase 1 將以備份內容取代目前資料；不得預設選中破壞性動作。 |
| Navigation | 取消 → 設定；確認 → 受保護還原流程。 |
| Exception Handling | 未確認前不得寫入；合併匯入不得出現在 Phase 1 正式流程。 |

### 16.4 Protected Restore

| 項目 | 規格 |
|---|---|
| Trigger | 使用者確認「取代目前資料」。 |
| User Action | 等待還原完成；進行中不可重複觸發。 |
| System Response | 先在與正式資料隔離的 staging 區建立完整候選資料，完成所有驗證後才透過受保護的資料取代程序發布；成功後重新載入 App 狀態並顯示「已恢復備份。」匯入期間鎖定主 App 與 Share Extension 的資料寫入，但純瀏覽維持可用。 |
| Navigation | 成功 → 設定；失敗 → 保留在錯誤結果並可返回設定。 |
| Exception Handling | 任一步驟失敗即 rollback／放棄 staging；現有正式資料保持不變。不得先清空正式資料再逐筆匯入，也不會自動在使用者的檔案 App 產生額外備份。 |

### 16.5 Backup Status

- 沒有成功匯出或匯入過專用備份：顯示「尚未備份」。
- 成功完成匯出：顯示最近一次備份日期。
- 成功匯入並還原：顯示該備份檔的建立日期。
- CSV／JSON 資料匯出、使用者取消、建檔失敗或分享失敗均不得更新此日期。
- App 不追蹤備份檔之後被移動、刪除或儲存在哪個 File Provider。

## 17. Settings

### 17.1 Main Settings

| 項目 | 規格 |
|---|---|
| Trigger | 點擊設定 Tab。 |
| User Action | 進入資料匯出、匯出備份、匯入備份、每日回顧；以 Email 回報問題／提供建議；開啟隱私權政策、使用條款或相關資訊。 |
| System Response | 顯示「資料儲存在本機，不上傳《等等看》伺服器」、收藏總筆數、最近一次備份日期或「尚未備份」、App 版本；每日回顧依系統通知權限與本機設定呈現。 |
| Navigation | Selection Row → 對應子頁。 |
| Exception Handling | 不顯示 Apple、Google、Email 或其他登入，不顯示會員、自動同步、《等等看》代管備份或 Premium 同步入口。外觀跟隨系統，不顯示手動切換。隱私權政策與使用條款的公開網址完成前不得顯示假連結。 |

### 17.2 Daily Recall Enabled

- 顯示已勾選的「每天提醒我回來看看收藏」。
- 顯示提醒時間，預設 20:00。
- 關閉時取消排程。

### 17.3 Notification Permission Disabled

- 顯示「通知權限尚未開啟」。
- 顯示至少 44 pt 的「前往系統設定」。
- 從系統設定返回 App 後重新讀取權限狀態。

## 18. Future／Optional Support Boundary

「支持木木」不列入 Phase 1 Interaction Scope。

- Phase 1 核心收藏功能永久免費。
- Phase 1 不提供支持入口、支持層級、購買、恢復購買、IAP、會員或任何付費互動。
- High Fidelity UI 中既有支持畫面不修改，只作為 Future／Optional 設計參考。
- 未來若決定實作自願支持，必須另行建立 Trigger、User Action、System Response、Navigation、Exception Handling 與商店規則。
- 自願支持不得解鎖、限制或改變核心收藏功能。

## 19. Empty States

| 畫面 | 標題 | 說明 | 動作 |
|---|---|---|---|
| 收藏首頁 | 還沒有收藏任何內容。 | 看到喜歡的內容，從分享選單交給《等等看》。 | 看看怎麼收藏 |
| 分類 | 這個分類還是空的。 | 下次收藏時選擇這個分類，就會出現在這裡。 | 無必要動作 |
| 洞洞板 | 洞洞板還是空的。 | 可以把特別想留下來的收藏釘在這裡。 | 無必要動作 |
| 搜尋 | 沒有找到符合的內容。 | 無 | 清除搜尋 |
| 今日回顧 | 今天還沒有可回顧的收藏。 | 收藏一些內容後，再回來看看。 | 返回 |
| 設定／備份 | 尚未備份 | 資料目前保存在這支 iPhone。 | 匯出備份 |

## 20. Loading States

- Metadata：版型相符的低對比 Skeleton。
- 匯出：Primary Button 內使用原生 Progress View，保持按鈕寬度。
- 備份匯出／匯入驗證／受保護還原：顯示不可重複觸發的 Progress 狀態；不得用無進度畫面掩蓋長時間操作。
- 本機資料載入：低於約 300 ms 不顯示 Loading，避免閃爍。
- Reduce Motion 開啟時不使用流光動畫。

## 21. Error States

| 層級 | 適用 | System Response | Recovery |
|---|---|---|---|
| Inline | 輸入內容無效 | 欄位下方短句，不清除輸入 | 修正後重試 |
| Recoverable Banner／Card | Metadata、匯出、備份、匯入驗證、便條紙儲存等可恢復問題 | 說明發生什麼與資料是否保留 | 再試一次／關閉 |
| Blocking Alert | 資料庫無法開啟、原文無法開啟、破壞性刪除確認 | 阻擋當前動作，不影響其他本機資料 | 關閉／取消／確認 |

錯誤文案不得顯示技術代碼或責怪使用者。

## 22. Accessibility Interaction

- VoiceOver 順序與視覺順序一致。
- Icon Button 提供明確 accessibility label。
- Dynamic Type 放大後，卡片增高、文字換行；洞洞板改單欄。
- 顏色不是唯一狀態線索。
- 支援 Increase Contrast、Reduce Motion、Differentiate Without Color。
- Light／Dark × 標準／最大字級均需驗收。

## 23. Open Interaction Issues

| ID | Issue |
|---|---|
| INT-I01 | Daily Recall 邀請收藏門檻需從 3–5 筆確定單一值。 |
| INT-I02 | Daily Recall 從未開啟收藏的最低納入天數未定。 |
| INT-I03 | 分類管理流程與排序／篩選 Menu 選項未定。 |
| INT-I04 | Tag 同名去重與名稱正規化未定。 |
| INT-I05 | 「看看怎麼收藏」開啟的具體呈現方式未定，但不得改成大型 Onboarding。 |
| INT-I06 | 隱私權政策與使用條款的正式內容與公開網址尚未完成；完成前不得顯示假連結。 |

## 24. Revision History

| Date | Revision | Change |
|---|---:|---|
| 2026-07-21 | 1.3 | 固定單一 JSON 備份互動；補齊 50 MB、schema/model version、SHA-256、版本更新提示、migration adapter、寫入鎖、無額外備份與 Email 回報規則。 |
| 2026-07-20 | 1.2 | 新增專用備份匯出、檔案選擇、驗證、取代確認、原子性還原與設定頁狀態；不修改收藏核心流程。 |
| 2026-07-20 | 1.1 | 移除 Phase 1 支持層級、StoreKit、Product ID、購買與恢復購買互動；支持畫面僅保留 Future／Optional 參考。 |
| 2026-07-20 | 1.0 | 建立 Phase 1 Interaction Specification。 |
