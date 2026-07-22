# 《等等看》Decision Log

文件版本：1.4  
最後更新：2026-07-21

本文件保存已確認的產品與商業決策。Decision Log 記錄決策背景、結論與影響範圍；若後續需要變更，必須新增一筆取代決策，不得直接刪除原紀錄。

## 2026-07-20｜AI Team Workflow 決策

| 項目 | 內容 |
|---|---|
| 狀態 | Accepted |
| 決策類型 | Project Governance／AI Responsibility |
| 適用範圍 | 《等等看》及 Jenny 所有現有與未來專案 |
| 影響文件 | README Documentation rev 1.3、Developer Handoff rev 1.3、Technical Architecture Proposal rev 1.2 |

### Decision

- Jenny 提出需求並保留商業決策與最終驗收權。
- ChatGPT（小居）負責需求、產品、流程、系統規格、資料／權限與驗收設計。
- ChatGPT Work 負責 PRD、技術／制度文件、大量文件、跨檔案分析、市場與商業研究。
- GitHub Copilot（小摳）負責 Repository、Components、npm、GitHub／Open Source、架構與重用方案研究。
- Claude Code／Codex（阿克／扣哥）負責實作、重構、核准的 Migration、測試、Commit、Push 與 PR。
- 同一 Repository 同一階段只指定阿克或扣哥其中一位修改。
- GitHub Actions 負責 Build、CI、Lint、Workflow 與 Deploy Check；通過後才交 Jenny 驗收。

### Consequences

- 不得由小居推測未檢查的 Repository 內容。
- Work 不修改 Repository；小摳不承擔大量 Coding；阿克／扣哥不重新收斂需求或取代大量文件研究。
- Coding 前必須先完成小摳的 Repository／Reuse Analysis。
- 純文件或研究任務可在 Work 成果經 Jenny 確認後結束，不為了形式製造無必要 Coding。

## 2026-07-20｜本機儲存、使用者自主備份與設定頁決策

| 項目 | 內容 |
|---|---|
| 狀態 | Accepted |
| 決策類型 | Product／Data Strategy／Phase 1 Scope |
| 適用版本 | Phase 1 起 |
| 影響文件 | PRD rev 1.3、Design rev 1.2、Interaction rev 1.2、Developer Handoff rev 1.4、Technical Architecture rev 1.3、README rev 1.4 |

### Context

《等等看》採本機優先，Phase 1 不建立會員、帳號、Server 或自動同步。為避免換機或重新安裝造成使用者無法自行保存資料，Phase 1 需提供不依賴《等等看》帳號與雲端代管的手動備份／還原能力。

### Decision

- Phase 1 採「本機儲存＋使用者自主備份檔」模式。
- 不建立自有會員系統，不提供 Apple、Google、Email 或其他帳號登入。
- 使用者可手動匯出《等等看》專用備份檔，並透過 iOS 系統檔案／分享介面自行選擇可用位置。
- 《等等看》不串接 CloudKit、Google Drive、Dropbox、OneDrive 或其他雲端服務 API，不取得雲端帳號，也不代管備份。
- 使用者可於換機或重新安裝後匯入備份檔恢復資料。
- 匯入必須先驗證格式、`schemaVersion`、必要欄位與關聯；Phase 1 以明確確認後「取代目前資料」為準。
- 任何驗證、寫入或替換失敗均不得清空或部分覆蓋現有資料。
- 合併匯入不是已確認 Phase 1 流程；重複資料規則未定前不得自行實作。
- 未來自動雲端或跨裝置同步另行評估，不得在 Phase 1 預留帳號、Server 或同步架構。
- 本決策不修改首頁、洞洞板、收藏核心流程或既有視覺語言。

### Consequences

- 設定頁正式列入 Phase 1，包含本機儲存說明、收藏總筆數、最近備份日期、匯出備份、匯入備份、問題回報／建議、App 版本、隱私權政策與條款／資訊頁。
- 備份檔包含獨立 `schemaVersion`、建立日期、App 版本、收藏數量及完整還原所需持久資料。
- 備份檔由使用者自行保存；App 不保證外部檔案持續存在。
- 匯入採 staging、受保護取代與 rollback；Share Extension 與主 App 的所有資料寫入必須受同一 write gate 協調，純瀏覽不需鎖定。
- Phase 1 備份不封裝圖片二進位檔，只保存圖片 URL、Metadata 與可恢復資料欄位。
- 本機備份／還原屬永久免費核心資料權利，不得置於付費層。

### Verification

- [x] 七份正式文件已同步 Phase 1 範圍、流程、資料契約、架構、安全與版本紀錄。
- [x] 未加入登入、OAuth、CloudKit、第三方雲端 API、自有 Server、自動同步、StoreKit 或 IAP。
- [x] 首頁、洞洞板與收藏核心流程未變更。

## 2026-07-21｜備份技術架構去綁定與決策補完

| 項目 | 內容 |
|---|---|
| 狀態 | Accepted |
| 決策類型 | Architecture Boundary／Backup Contract／Phase 1 |
| 適用版本 | Phase 1 起 |
| 影響文件 | PRD rev 1.4、Design rev 1.3、Interaction rev 1.3、Developer Handoff rev 1.5、Technical Architecture rev 1.4、README rev 1.5 |

### Context

Repository 盤點確認目前只有 `docs` 文件，尚未建立 Xcode Project、Swift 程式碼、Share Extension、App Group、本機資料庫、測試 Target 或 Migration 機制。因此既有文件不得把 GRDB、SQLite、DatabasePool、WAL、checkpoint、Nuke、資料庫檔案原子替換或具體跨程序鎖描述為已採用架構。

### Decision

- 保留 SwiftUI、原生 iOS、本機優先、App Group、Share Extension 與 JSON 備份方向；App Group、Share Extension 與 Xcode Project 均標示為尚未建立。
- SwiftData、Core Data、原生 SQLite、GRDB 均為建立專案時的持久化候選，尚未選定。
- Apple 原生能力優先；Nuke 與任何第三方套件只在 Xcode 專案建立後依需求評估。
- 若最終採 SQLite／GRDB，DatabasePool、WAL、checkpoint 與相關多程序細節才成為條件式實作注意事項，不是 Phase 1 必然需求。
- 備份由 Domain Model 產生，不直接備份、搬移或替換資料庫／store 檔案。
- Phase 1 備份為單一 JSON，不使用 ZIP 或 package；檔名為 `等等看_Backup_YYYY-MM-DD_HHmm_v1.json`。
- Phase 1 不包含圖片二進位檔，只保存圖片 URL、Metadata 與可恢復資料欄位。
- 最大檔案大小為 50 MB，讀取內容前先檢查。
- 第一版 `schemaVersion` 與 `modelVersion` 均為整數 `1`。
- 未知非必要欄位忽略；必要欄位缺失或型別錯誤則拒絕。
- 高於 App 支援版本的備份拒絕匯入並提示更新 App；舊版只透過明確 migration adapter 升級，不得猜測。
- payload 使用 SHA-256 checksum 驗證完整性；checksum 不代表加密、簽章或身分驗證。
- Phase 1 只提供「取代目前資料」，不提供合併。
- 匯入不會自動在使用者的檔案 App 產生額外備份。
- 匯入時原資料保持不動；候選資料完成 staging 與全部驗證後，才透過最終持久化框架可證明一致的受保護程序發布。
- 任一步驟失敗即 rollback 或放棄 staging，原資料保持不變。
- 匯入期間鎖定主 App 與 Share Extension 的所有資料寫入；純瀏覽不鎖定。具體跨程序協調方式待技術選型。
- 回報問題／提供建議採 Email。
- 隱私權政策與使用條款須於 App Store 上架前建立公開網址；完成前不得放置假連結。

### Consequences

- Technical Architecture Proposal 不再是單一技術棧定案，而是架構候選、已確認邊界與實作條件。
- 備份檔契約不受未來更換持久化框架影響。
- 還原文件使用 Domain staging、exclusive write gate、受保護取代與 rollback 描述，不把 database file swap 當作契約。
- 圖片快取選型與備份圖片契約分離；無論使用何種圖片載入方案，Phase 1 備份均不含圖片二進位檔。

### Verification

- [x] 七份正式文件已同步版本與決策。
- [x] GRDB、SQLite、DatabasePool、WAL、checkpoint 與 Nuke 僅保留為候選或條件式注意事項。
- [x] 文件未宣稱 Xcode Project、Share Extension 或 App Group 已存在。
- [x] High Fidelity UI、程式碼與 Git 均未修改。

## 2026-07-20｜商業模式決策

| 項目 | 內容 |
|---|---|
| 狀態 | Accepted |
| 決策類型 | Product Strategy／Business Model |
| 適用版本 | Phase 1 起 |
| 影響文件 | PRD v1.0 rev 1.1、Developer Handoff v1.0 rev 1.1、README Documentation rev 1.1 |

### Context

《等等看》Phase 1 的目標是建立簡單、可信任且能長期使用的生活收藏 App。核心價值來自收藏、找回與重新觀看內容，不應以人為限制或付費牆破壞使用體驗。

Phase 1 採完全本機儲存，不需要帳號、Server 或跨裝置同步，因此不具備必須立即建立付費系統的持續營運成本。

### Decision

- Phase 1 核心功能永久免費。
- Phase 1 暫不開發 IAP、會員、訂閱、付費牆或任何付費流程。
- High Fidelity UI 中既有「支持木木」畫面保留為未來設計參考，不列入 Phase 1 實作。
- 未來若推出自願支持，支持不影響、不限制，也不解鎖核心功能。
- 未來若推出付費方案，只針對 Phase 1 之後新增、且具有持續開發或營運成本的服務，例如跨裝置同步。
- 不將 Phase 1 已提供的收藏、分類、標籤、搜尋、洞洞板、Daily Recall 或資料匯出改為付費功能。

### Consequences

- Phase 1 不建立 StoreKit Product、購買流程、Receipt 驗證、Entitlement 或會員資料模型。
- Phase 1 不需要 Paywall、訂閱狀態或免費／付費功能判斷。
- 匯出收藏維持所有使用者可用。
- 未來商業化必須另行建立 PRD、Interaction、Developer Handoff 與商店規格。
- 未來同步若收費，必須清楚區分：核心本機功能永久免費；同步是新增且具持續成本的服務。

### Superseded / Resolved Items

- 早期文件中的 Plus／Premium 與 Phase 1 支持購買構想不再適用。
- `PRD-I09`「支持木木 StoreKit 規則未定」已由本決策關閉：Phase 1 不實作。
- `PRD-I10`「商業模式是否永久取消尚未定案」已由本決策關閉：核心功能永久免費；未來只對新增且有持續成本的服務評估收費。
- `DEV-I09`「支持木木 StoreKit 商品規則未定」已由本決策關閉：不列入 Phase 1。

### Verification

- [x] PRD 已新增 Business Model／Monetization Strategy。
- [x] README 已更新 Phase 1／Phase 2 商業邊界。
- [x] Developer Handoff 已移除 Phase 1 StoreKit 與購買工程假設。
- [x] Design Specification 已將支持畫面降為 Future／Optional 參考。
- [x] Interaction Specification 已移除 Phase 1 支持層級、購買、Product ID 與恢復購買流程。
- [x] Technical Architecture 已移除 StoreKit 技術棧、Service、架構預留與 Slice，Slice F 已改為 Export。
- [x] UI 未修改。
- [x] Interaction Specification 僅移除已排除的購買流程，未新增或改變 Phase 1 功能流程。
- [x] 未新增功能流程。

> 2026-07-20 跨文件修正說明：Interaction Specification 的文件文字已為一致性而更新，但未修改任何 Phase 1 UI 或新增互動流程；原先的購買流程已移除，支持僅保留 Future／Optional 邊界說明。

## Revision History

| Date | Revision | Change |
|---|---:|---|
| 2026-07-21 | 1.4 | 記錄備份技術架構去綁定、Repository 現況、單一 JSON／50 MB／version 1/1／SHA-256／migration adapter／寫入鎖與 rollback 正式決策。 |
| 2026-07-20 | 1.3 | 記錄 Phase 1 本機儲存＋使用者自主備份檔、正式設定頁及原子性還原決策。 |
| 2026-07-20 | 1.2 | 新增 AI Team Workflow 決策並同步 README、Developer Handoff 與 Technical Architecture。 |
| 2026-07-20 | 1.1 | 完成 PRD、Design、Interaction、Developer Handoff、Technical Architecture 與 README 跨文件一致性同步。 |
| 2026-07-20 | 1.0 | 建立商業模式決策。 |
