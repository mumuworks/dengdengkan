# 《等等看》Decision Log

文件版本：1.6  
最後更新：2026-08-27

本文件保存已確認的產品與商業決策。Decision Log 記錄決策背景、結論與影響範圍；若後續需要變更，必須新增一筆取代決策，不得直接刪除原紀錄。

## 2026-08-27｜Web／PWA 決策收斂：Product Validation 治理、移除固定 KPI 與三項技術決策

| 項目 | 內容 |
|---|---|
| 狀態 | Accepted |
| 決策類型 | Product Governance／Validation Methodology／Technical Decision |
| 適用範圍 | 補充並細化同日「Phase 1 轉向 Web／PWA，Native iOS 移至 Phase 2」決策，不取代其平台方向結論 |
| 影響文件 | PRD rev 1.6、PRODUCT_VALIDATION rev 1.1、Technical Architecture Proposal rev 1.6、Developer Handoff rev 1.7、README rev 1.7 |

### Context

同日稍早的「Phase 1 轉向 Web／PWA」決策已建立 Product Validation 概念與 Gate，但當時：(a) `PRODUCT_VALIDATION.md` 沿用了 PRD 舊有 Success Metrics 慣性，寫入「連續 4 週」「70%」「50%」等固定 KPI，與「Phase 1 先累積真實資料再訂 KPI」的精神矛盾；(b) `PRODUCT_VALIDATION.md` 雖已新增，但 README 的 Reading Order／Source of Truth 尚未明確將其列為與 PRD 同級的核心文件；(c) Web Share Target API 與 Dexie Schema 建置時機兩項技術問題仍列為「待 Jenny 確認」的開放問題，實際上已可決斷，不需再拖到實作階段才決定。本輪決策收斂上述三點，並重新確認 Product Principle 0 的優先順位，目的是讓文件在進入 Commit／PR／Merge 前完成最後收斂，不引入新範圍。

### Decision

1. **Product Validation 提升為文件集核心文件之一。** README 的 Documentation Set、Reading Order、Source of Truth 與新增的 Document Hierarchy 均將 `PRODUCT_VALIDATION.md` 列為與 PRD 同級的 Tier 0／核心產品文件；新閱讀順序為 README → PRD → PRODUCT_VALIDATION → Design Spec → Interaction → Technical Architecture → Developer Handoff → Decision Log（Decision Log 殿後代表「最終查核」，不代表優先度最低；衝突時仍以 Decision Log 為最終仲裁）。
2. **PRODUCT_VALIDATION 移除固定 KPI，改採觀察指標。** 原六項驗證項目的固定數字門檻（4 週觀察期、70%／50%／40% 等比例、天數與次數門檻）全數移除，改以六項觀察指標描述趨勢方向：收藏是否持續增加、Recall 是否自然被使用、收藏是否重新被閱讀、分類是否逐漸穩定、洞洞板是否形成固定使用方式、備份是否讓使用者有安全感。Phase 1 先累積真實使用資料，之後才依實際基準另訂可衡量的 KPI，並以新的 Decision Log 條目記錄，不得回頭假造基準。
3. **確認 PRD Product Principle 0。** 明文定名為「Principle 0」，內容為「任何功能，都必須回答它是否能讓使用者更快收藏、更容易回顧，或更容易重新找到資訊；如果不能，Phase 1 不納入」，並明確聲明優先於 Product Principles 1–10，衝突時以 Principle 0 為準。
4. **Decision 1（收藏入口）：** Phase 1 不承諾 Web Share Target API；正式收藏入口為「貼上網址」；未來視 Product Validation 結果與瀏覽器支援度再評估，本輪不再視為開放問題。
5. **Decision 2（Dexie Schema 範圍）：** `P1-C1 Web Foundation` 即建立完整 Dexie Schema v1（`bookmarks`／`categories`／`tags`／`bookmarkTags`／`settings` 五張表一次建立），即使 `tags`／`bookmarkTags` 尚未於 UI 啟用，目的是避免 `P1-C2` 啟用標籤功能時需要額外一次 Schema Migration。
6. **Decision 3（Native 文件保留與標示）：** 重申所有 Native 內容（Share Extension、App Group、Bundle ID、Xcode、GRDB、SwiftData、Core Data、SQLite 等）全數保留、不得刪除；文件中的分類標籤統一標示為「Native Phase（Phase 2）」，取代先前文件中出現的「Phase 2（Native iOS，保留規劃）」「Native Phase／Phase 2」等不一致寫法。

### Consequences

- `PRODUCT_VALIDATION.md` 升級為 rev 1.1；原 rev 1.0 的固定 KPI 描述視為已被本決策取代，不再是有效判準，但文件本身保留版本歷史，不刪除舊版描述文字所在的 Revision History 紀錄。
- README 的 Documentation Set 表格順序、Reading Order 圖示、Source of Truth 優先順序清單與新增的 §3.1 Document Hierarchy 圖示均反映 Product Validation 的核心地位。
- Technical Architecture Proposal §23.3 由「開放技術問題」改寫為「已確認決策」，Decision Summary 第 3 節同步移除已關閉的待決事項。
- Developer Handoff 的 `DEV-I13`／`DEV-I14` 從 Open Engineering Issues 移至 §22.1 Closed／Resolved。
- 本決策不改變 2026-08-27 稍早決策的平台方向結論（Phase 1＝Web／PWA、Phase 2＝Native iOS），僅收斂驗證方法論、文件治理順序與兩項原列為開放問題的技術決策。

### Verification

- [x] `PRODUCT_VALIDATION.md` 不再出現任何固定週數、百分比或次數門檻。
- [x] README Reading Order／Source of Truth／Document Hierarchy 已將 Product Validation 列為核心文件。
- [x] PRD Product Principles 明確標示 Principle 0 並聲明優先順位。
- [x] Web Share Target API 與 Dexie Schema 範圍已從開放問題移至已確認決策。
- [x] 全文件「Native Phase（Phase 2）」標示格式一致；未刪除任何 Native 內容。

## 2026-08-27｜Phase 1 轉向 Web／PWA，Native iOS 移至 Phase 2

| 項目 | 內容 |
|---|---|
| 狀態 | Accepted |
| 決策類型 | Product Strategy／Platform Roadmap |
| 適用範圍 | 《等等看》全案，取代本文件先前所有以 iOS 為 Phase 1 平台的隱含前提 |
| 影響文件 | PRD rev 1.5、Design Specification rev 1.4、Interaction Specification rev 1.4、Technical Architecture Proposal rev 1.5、Developer Handoff rev 1.6、README rev 1.6；新增 `docs/PRODUCT_VALIDATION.md` |

### Context

《等等看》先前所有正式文件均以原生 iOS App 為 Phase 1 平台規劃。為了在投入 Native iOS 工程成本前，先由產品作者本人日常使用驗證核心產品價值（是否真的想每天收藏、是否會回來看 Daily Recall、分類與洞洞板是否真正有用、備份流程是否可信賴），決定調整 Phase 1 平台方向。

Repository 盤點確認：目前 Repository 僅有 `docs/` 文件，未建立任何 Xcode Project、Swift 程式碼、Share Extension、App Group entitlement 或本機資料庫；`docs/adr/0001-phase1-slice1-persistence.md`（GRDB 持久化 ADR）仍為 Draft、從未 Accepted，`docs/engineering/phase1-slice1-project-plan.md` 為尚未執行的 Xcode Runbook。因此本次平台調整沒有任何既有程式碼或已核准架構被推翻，只有規劃與文件範圍需要調整。

### Decision

1. **Phase 1 平台由 iOS 改為 Web／PWA。** Phase 1 的目標是產品作者本人先以 Web App／PWA 形式日常驗證產品價值，確認核心流程成熟後，才投入 Native iOS 開發。
2. **Native iOS 不取消，改列為 Phase 2。** 所有既有 Native 規劃——Share Extension、App Group、Bundle ID／App Group Identifier 開發占位值、Xcode 專案結構、GRDB／SwiftData／Core Data／SQLite 持久化候選比較（含 ADR-0001）、`docs/engineering/phase1-slice1-project-plan.md` 執行 Runbook——全數保留、不得刪除，統一標記為「Native Phase（Phase 2）參考」，作為 Phase 2 啟動時的現成分析與起點。
3. **Phase 1 技術方向確定為：** Vite、React、TypeScript、Dexie（建構於 IndexedDB 之上）、`vite-plugin-pwa`（Web App Manifest ＋ Service Worker）。持久化選型邏輯與 ADR-0001 比較 GRDB／SwiftData／Core Data／SQLite 的判準同構：小型關聯 schema、需要 Schema 版本化與交易語意、避免重造 Migration／Transaction／測試工具。
4. **Phase 1 邊界明確排除：** 無 Server、無登入、無 Cloud Sync（跨裝置同步）、無 Push Notification（系統推播）。Daily Recall 在 Web Phase 1 為應用內「今日回顧」體驗，不模擬系統本機通知；真正的 iOS Local Notification 屬於 Phase 2 Native 範圍。
5. **新增 Product Validation 作為 Phase 2 前提。** 新增 `docs/PRODUCT_VALIDATION.md`，定義 MVP 目標、驗證項目（是否每天收藏、是否每天閱讀 Recall、收藏速度是否足夠快、分類是否合理、洞洞板是否真正有價值、備份流程是否足夠可靠）、成功條件、不成功條件，以及何時才進入 Phase 2 Native。**只有 Product Validation 判定成功，才開始 Phase 2 Native 開發。**
6. **正式採用新的 Phase／Slice 命名：**
   - Phase 1（Web／PWA）：`P1-C1 Web Foundation`、`P1-C2 Core Collection`、`P1-C3 Backup & Validation`。
   - Phase 2（Native）：`P2-C1 Native Foundation`、`P2-C2 Share Extension`、`P2-C3 Native Persistence`。
   舊有的「Slice A–F」（Technical Architecture 實作順序）與「Slice 1」（ADR-0001／`phase1-slice1-project-plan.md`）命名法保留在原文件中作為 Native Phase 歷史紀錄，不追溯改名；新規劃一律採 `P{phase}-C{n}` 格式。
7. **新增最高產品原則（凌駕一般 Product Principles 之上）：** 任何新增功能，都必須能回答「這個功能能幫助使用者更快收藏、更容易回顧，或更容易再次找到內容嗎？」若答案為否，該功能不得列入 Phase 1。此原則寫入 PRD Product Principles 第一條，作為 Phase 1 所有功能取捨的唯一判準。

### Consequences

- PRD、Design Specification、Interaction Specification、Technical Architecture Proposal、Developer Handoff、README 六份正式文件需同步修改為 Web／PWA 優先語言；既有 Native iOS 內容保留於文件中，加註「Native Phase（Phase 2）」，不刪除。
- Technical Architecture Proposal 新增 Web Phase 1 架構章節（前端、Router、Domain、Repository、Storage、Backup、Settings），原有 iOS 持久化／App Group／Share Extension／圖片快取章節整段標示為 Phase 2 參考。
- `docs/adr/0001-phase1-slice1-persistence.md` 與 `docs/engineering/phase1-slice1-project-plan.md` 本次不修改內容，僅由 README 與 Technical Architecture Proposal 標示其為 Native Phase（Phase 2）保留文件；两份文件維持原有 Draft／待辦狀態，Phase 2 啟動時再行審閱。
- 既有 Decision Log 條目（本機儲存與備份契約、商業模式、AI Team Workflow）維持有效；備份 JSON 契約（`schemaVersion`／`modelVersion`＝1、50 MB、SHA-256、staging＋受保護取代＋rollback、僅取代不合併、不含圖片二進位檔）與框架無關，Web 實作直接沿用，不需重新決策。
- 本決策不修改首頁、洞洞板、收藏核心互動語言或既有視覺／文案風格；僅平台與 Roadmap 命名調整。

### Verification

- [x] PRD、Design、Interaction、Technical Architecture、Developer Handoff、README 六份正式文件已同步 Web／PWA First、Native Later 與新 Phase／Slice 命名。
- [x] Share Extension、App Group、Bundle ID、Xcode、GRDB、SwiftData、Core Data、SQLite 等 Native 內容於文件中保留，未刪除，改標記為 Native Phase（Phase 2）。
- [x] 新增 `docs/PRODUCT_VALIDATION.md`，內容涵蓋 MVP 目標、驗證項目、成功條件、不成功條件與進入 Phase 2 Native 的條件。
- [x] PRD Product Principles 新增最高產品原則（收藏速度／回顧／再次找到內容判準）。
- [x] 未建立 Repository、未寫程式碼、未建立 Vite 專案、未 Commit、未 Push、未 Merge。

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
| 2026-08-27 | 1.6 | 記錄 Web／PWA 決策收斂：Product Validation 提升為核心文件、移除固定 KPI 改採觀察指標、確認 Product Principle 0、關閉 Web Share Target 與 Dexie Schema 兩項技術決策、統一 Native Phase（Phase 2）標示格式。 |
| 2026-08-27 | 1.5 | 記錄 Phase 1 轉向 Web／PWA、Native iOS 移至 Phase 2、Product Validation 前提、新 Phase／Slice 命名（P1-C1~C3／P2-C1~C3）與最高產品原則正式決策。 |
| 2026-07-21 | 1.4 | 記錄備份技術架構去綁定、Repository 現況、單一 JSON／50 MB／version 1/1／SHA-256／migration adapter／寫入鎖與 rollback 正式決策。 |
| 2026-07-20 | 1.3 | 記錄 Phase 1 本機儲存＋使用者自主備份檔、正式設定頁及原子性還原決策。 |
| 2026-07-20 | 1.2 | 新增 AI Team Workflow 決策並同步 README、Developer Handoff 與 Technical Architecture。 |
| 2026-07-20 | 1.1 | 完成 PRD、Design、Interaction、Developer Handoff、Technical Architecture 與 README 跨文件一致性同步。 |
| 2026-07-20 | 1.0 | 建立商業模式決策。 |
