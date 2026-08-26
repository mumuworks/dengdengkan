# 《等等看》Documentation

文件修訂：1.7（2026-08-27 Product Validation 提升為核心文件；Reading Order／Source of Truth／Document Hierarchy 同步調整）

本目錄保存《等等看》正式產品、設計、互動、工程交付與決策紀錄。2026-08-27 起，Phase 1 平台由原生 iOS 改為 Web／PWA，Native iOS 全部規劃保留並改列 Phase 2；文件內容依目前已定案產品規格、High Fidelity UI v1.1 Final、2026-07-20 商業模式與本機自主備份決策，以及 2026-08-27 Web／PWA 平台決策整理，可直接納入 GitHub 版本管理。

## 1. Documentation Set

| 文件 | 用途 | 主要讀者 |
|---|---|---|
| [`等等看_PRD_v1.0.md`](./等等看_PRD_v1.0.md) | 定義產品定位、使用者問題、目標、MVP、功能範圍與 Phase 邊界。 | Product、Design、Engineering |
| [`PRODUCT_VALIDATION.md`](./PRODUCT_VALIDATION.md) | **核心文件之一。** 定義 Phase 1 MVP 目標、觀察指標，以及進入 Phase 2 Native 的判定 Gate；是否可推進至 Phase 2，以本文件判定結果為準。 | Jenny、全體專案成員 |
| [`等等看_Design_Spec_v1.0.md`](./等等看_Design_Spec_v1.0.md) | 定義 Design System、Tokens、元件、畫面、Navigation、Dark Mode、文字縮放與 Accessibility（Phase 1：Web／CSS；Phase 2：iOS，保留規劃）。 | Design、Engineering、QA |
| [`等等看_Interaction_v1.0.md`](./等等看_Interaction_v1.0.md) | 定義所有畫面的 Trigger、User Action、System Response、Navigation 與 Exception Handling（Phase 1：Web；Phase 2：iOS，保留規劃）。 | Product、Engineering、QA |
| [`等等看_Technical_Architecture_Proposal_v1.0.md`](./等等看_Technical_Architecture_Proposal_v1.0.md) | 記錄 Phase 1（Web／PWA）已確認架構（Vite/React/TS/Dexie/vite-plugin-pwa）與 Native Phase（Phase 2）保留架構候選、備份契約、垂直切片、ADR 與風險。 | 小摳、阿克／扣哥、Engineering |
| [`等等看_Developer_Handoff_v1.0.md`](./等等看_Developer_Handoff_v1.0.md) | 定義邏輯 Data Model、State、Business Rules、Validation、Metadata、Daily Recall、Migration、安全與效能；平台專屬章節依 Phase 標記。 | 小居、Work、小摳、阿克／扣哥、QA |
| [`DECISION_LOG.md`](./DECISION_LOG.md) | 保存已確認且不得由工程重新解釋的產品與商業決策；文件集最終仲裁依據。 | 全體專案成員 |
| [`adr/0001-phase1-slice1-persistence.md`](./adr/0001-phase1-slice1-persistence.md) | 〔Native Phase（Phase 2），保留規劃〕原 Phase 1（iOS）持久化選型 ADR，Draft，尚未 Accepted；Phase 2 啟動時審閱。 | 小居、阿克／扣哥（Phase 2） |
| [`engineering/phase1-slice1-project-plan.md`](./engineering/phase1-slice1-project-plan.md) | 〔Native Phase（Phase 2），保留規劃〕原 Phase 1（iOS）Xcode／Share Extension 執行 Runbook，凍結保留供 Phase 2 接手。 | 阿克／扣哥（Phase 2） |

## 2. 閱讀順序 / Reading Order

```text
README_Documentation.md
↓
等等看_PRD_v1.0.md
↓
PRODUCT_VALIDATION.md（Phase 1 → Phase 2 Gate，核心文件）
↓
等等看_Design_Spec_v1.0.md
↓
等等看_Interaction_v1.0.md
↓
等等看_Technical_Architecture_Proposal_v1.0.md（§23 Web Phase 1 架構為現行 Source of Truth）
↓
等等看_Developer_Handoff_v1.0.md
↓
DECISION_LOG.md
```

`PRODUCT_VALIDATION.md` 緊接在 PRD 之後閱讀，是因為它與 PRD 同屬定義「Phase 1 為何存在、何時算成功」的核心文件，先於畫面與工程規格閱讀。`DECISION_LOG.md` 排在閱讀順序最後，不代表優先度最低——它是所有已確認決策的最終記錄，前面各份文件的規則多已引用其內容；讀完全部規格後查核 Decision Log，可確認理解與正式決策一致。遇到範圍或策略疑義時，仍以尚未被取代的 Accepted Decision 為準（見 §3 Source of Truth）。`docs/adr/0001-phase1-slice1-persistence.md` 與 `docs/engineering/phase1-slice1-project-plan.md` 為 Native Phase（Phase 2）保留文件，Phase 1 開發期間不需閱讀，Phase 2 啟動時再納入閱讀順序。

### 2.1 Why This Order

1. README：先理解文件範圍、版本與使用方式。
2. PRD：確認產品為何存在、Phase 1 做什麼與不做什麼。
3. Product Validation：確認 Phase 1 要驗證什麼、如何判斷成功，以及何時可推進至 Phase 2——這是後續所有規格文件服務的目標，因此緊接在 PRD 之後閱讀。
4. Design Specification：確認畫面語言、元件與無障礙基準。
5. Interaction：逐畫面確認使用者操作與系統反應。
6. Technical Architecture：在上述規格不再變動後，決定 Repository、持久化框架、模組切分與實作方案。
7. Developer Handoff：將已確認產品規則轉為工程可執行的資料、狀態與驗證。
8. Decision Log：最後查核所有已確認決策，確保理解與正式紀錄一致。

## 3. Source of Truth

### 3.1 Document Hierarchy

```text
Tier 0 － 治理與驗證 Gate
  DECISION_LOG.md（已確認決策，最終仲裁）
  PRODUCT_VALIDATION.md（Phase 1 → Phase 2 判定 Gate，核心產品文件）
      ↓
Tier 1 － 產品定義
  等等看_PRD_v1.0.md
      ↓
Tier 2 － 執行規格（互相平級，各自對應不同讀者）
  Design Specification／Interaction／Technical Architecture Proposal／Developer Handoff
      ↓
Tier 3 － 保留參考（Native Phase／Phase 2，凍結不刪除）
  docs/adr/0001-phase1-slice1-persistence.md
  docs/engineering/phase1-slice1-project-plan.md
```

本文件集的 Source of Truth 優先順序如下：

1. `DECISION_LOG.md` 中尚未被取代的 Accepted Decision。
2. `PRODUCT_VALIDATION.md` 的 Phase 1 → Phase 2 判定條件與觀察指標——與 PRD 同為核心產品文件；涉及「是否／何時推進 Phase 2」的疑義，以本文件為準。
3. PRD 的產品定位、Phase 1／Future 邊界與 Business Model。
4. High Fidelity UI v1.1 Final 的視覺與畫面結構；若其中的 Future 參考畫面與 Accepted Decision 衝突，以 Decision Log 為準。
5. Design Specification、Interaction、Developer Handoff 與 Technical Architecture Proposal。
6. Design System v1.0 與 Component Library。
7. Low Fidelity Wireframe 最終確認方向。
8. 產品核心原則與早期草案中的不衝突內容。

若早期文件與 Final UI 衝突，以較新的已確認規格為準。例如：

- Bottom Navigation 為「收藏／洞洞板／搜尋／設定」。
- 便條紙是收藏首頁元件，不是 Tab。
- 首頁不顯示最近新增 Carousel。
- Phase 1（Web／PWA）收藏入口為貼上網址；分類預設為「未整理」，不阻擋收藏。Share Extension 為 Phase 2（Native，保留規劃）收藏入口。
- Phase 1 無會員、Apple／Google／Email 登入、自動雲端備份、跨裝置同步（Cloud Sync）或 Push Notification。
- Phase 1 使用者可手動匯出／匯入專用備份檔；檔案透過瀏覽器檔案介面由使用者自行管理，《等等看》不代管。
- 備份由 Domain Model 產生為單一 JSON，不直接備份或搬移底層資料庫／store 檔案。
- 第一版 `schemaVersion`／`modelVersion` 均為 `1`，最大 50 MB，payload 使用 SHA-256 checksum；checksum 不代表加密或身分驗證。
- Phase 1 備份不含圖片二進位檔，只含圖片 URL、Metadata 與可恢復欄位。
- 匯出對所有使用者開放。
- Daily Recall 在 Phase 1 為應用內今日回顧，不是系統推播或待辦提醒；Phase 2（Native，保留規劃）使用 iOS Local Notification。
- Phase 1 核心收藏功能永久免費，不開發 IAP、會員或付費流程。
- 任何新增功能都必須先回答「能幫助使用者更快收藏、更容易回顧，或更容易再次找到內容嗎？」否則不列入 Phase 1（見 PRD Product Principles）。

## 4. Phase Boundary

> 2026-08-27 起，Phase 1 平台由原生 iOS 改為 Web／PWA；Native iOS 全部規劃保留、不取消，改列為 Phase 2。詳見 `DECISION_LOG.md` 2026-08-27 決策。

### 4.1 Phase 1 — Web／PWA（現行，`P1-C1 Web Foundation` / `P1-C2 Core Collection` / `P1-C3 Backup & Validation`）

- 完全本機收藏（瀏覽器 IndexedDB）。
- 收藏入口：貼上網址（Web Share Target API 為技術評估項目，非承諾功能）。
- 分類、標籤、搜尋。
- 洞洞板。
- 單一首頁便條紙。
- Daily Recall／應用內今日回顧（不使用系統推播）。
- Metadata 狀態。
- 匯出收藏。
- 專用備份檔匯出與匯入還原。
- 正式設定頁：本機儲存說明、收藏總筆數、最近備份、資料動作、每日回顧、回報問題／建議、App 版本、隱私與條款。
- Web App Manifest ＋ Service Worker，支援安裝與離線開啟。
- Light／Dark、文字縮放、Accessibility。
- 無 Server、無登入、無 Cloud Sync、無 Push Notification。

商業策略：

- Phase 1 核心收藏功能永久免費。
- Phase 1 不開發 IAP、會員、訂閱、付費牆或任何付費流程。
- High Fidelity UI 中的「支持木木」保留為未來設計參考，不列入 Phase 1 實作。

資料策略：

- 收藏資料完全儲存在瀏覽器本機（IndexedDB），單一 origin 即可共享，不需要 App Group。
- 不建立自有會員、Apple／Google／Email 登入、自有 Server、CloudKit、第三方雲端 API 或自動同步。
- 備份檔可由使用者透過瀏覽器檔案介面（File System Access API／下載）自行存到所選位置；App 不取得帳號、不綁定服務，也不負責代管。
- 匯入採讀取前 50 MB 檢查、版本／checksum／必要欄位／關聯驗證、預覽、明確確認、Domain staging 與受保護取代；失敗時 rollback，原資料保持不變。
- 匯入期間鎖定資料寫入，不鎖純瀏覽；不會自動在使用者的檔案系統產生額外備份。
- 回報問題／提供建議採 Email。隱私權政策與使用條款須於正式上線前建立公開網址，完成前不得使用假連結。

Product Validation：Phase 1 完成 `P1-C3` 後，須依 `PRODUCT_VALIDATION.md` 判定是否進入 Phase 2；判定不成功時先修正 Phase 1 產品或流程，不直接跳至 Native 開發。

### 4.2 Phase 2 — Native iOS（保留規劃，尚未開始；`P2-C1 Native Foundation` / `P2-C2 Share Extension` / `P2-C3 Native Persistence`）

以下為 2026-08-27 前的 Phase 1（iOS）規劃，全數保留、不取消，改列為 Phase 2，須待 Product Validation 判定成功才啟動：

- iOS App、SwiftUI、iOS Share Extension。
- App Group shared container；Xcode Project、Target、entitlement 或 store 目前均尚未建立。
- Bundle ID／App Group Identifier 開發占位值（見 `docs/engineering/phase1-slice1-project-plan.md`）。
- 持久化選型：SwiftData、Core Data、原生 SQLite、GRDB（見 `docs/adr/0001-phase1-slice1-persistence.md`，Draft，尚未 Accepted）。
- iOS Local Notification（取代 Phase 1 應用內今日回顧）。

### 4.3 Phase 2 — Evaluation Only（原本就屬於評估中、未承諾項目）

- CloudKit。
- Google 登入。
- Sign in with Apple。
- 跨裝置同步。
- 桌面 Widget。
- 鎖定畫面 Widget。
- 自願支持方案。
- 只針對新增且有持續成本服務的付費方案，例如跨裝置同步。

Phase 2 項目（4.2 與 4.3）不得提前出現在 Phase 1 正式畫面或宣稱中。

## 5. Open Issue Policy

文件中的 `Open Issues` 代表產品尚未定案的細節，不代表可由工程自行選擇。

處理規則：

1. 不得在實作時默默補上流程。
2. 不得用套件預設行為替代產品決策。
3. 先回到產品確認，再更新相應文件。
4. 同一決策必須同步更新 PRD、Design、Interaction 與 Developer Handoff 中受影響段落。
5. 關閉 Issue 時記錄原因、日期與版本。

目前主要 Open Issues：

- Daily Recall 邀請確切收藏門檻。
- 從未開啟收藏納入回顧的最低天數。
- 分類管理與排序／篩選內容。
- Tag 去重／正規化。
- Metadata 圖片快取策略。
- 本機通知文案輪播排程。
- 隱私權政策與使用條款的正式內容與公開網址。

## 6. AI Team Workflow — 小居流程

```text
Jenny
提出需求與商業決策
↓
ChatGPT（小居）
需求分析、產品思考、流程、系統規格與驗收標準
↓
ChatGPT Work
PRD、技術文件、跨檔案分析與文件一致性治理
↓
GitHub Copilot（小摳）
Repository／架構／重用方案研究
↓
Claude Code／Codex（阿克／扣哥）
由單一指定工程師依確認規格實作、測試、Commit、Push、PR
↓
GitHub Actions
Build、CI、Lint、Workflow、Deploy Check
↓
Jenny
產品流程、商業決策與最終驗收
```

本文件集已由 ChatGPT Work 完成 PRD、技術文件與跨檔案一致性治理。下一步不是直接交付阿克／扣哥開發，而是先由 GitHub Copilot 完成：

- Existing Repository 檢查。
- 可重用 Components、Services、Schema 與 Utilities。
- Apple 官方 Framework 與文件。
- 成熟 Package／Open-source 方案。
- Xcode Project／Targets／App Group 建立，以及 SwiftData、Core Data、原生 SQLite、GRDB 持久化候選比較。
- Metadata 解析與圖片快取方案。
- Local Notification 輪播方案。
- License、Security、Privacy 與 Dependency 風險。

小摳完成 Repository／Reuse Analysis 後，由小居整合已確認規格與技術建議，再指定阿克或扣哥其中一位負責該 Repository；兩者不得同時修改同一 Repository。

## 7. Versioning

- 文件採 `vMajor.Minor` 命名。
- 產品範圍或資料模型有不相容變更時提高 Major。
- 文案、驗證補充或不影響既有實作的澄清提高 Minor。
- 每次修改使用 Git Commit 保存 Diff。
- 不以覆蓋舊檔方式隱藏重要決策歷史。

建議 Commit 範例：

```text
docs: add Phase 1 product and engineering specifications
docs: clarify Daily Recall lastOpenedAt rules
docs: record free core product monetization strategy
docs: resolve category management decisions
```

## 8. Repository Placement

建議放置於：

```text
docs/
├── README_Documentation.md
├── 等等看_PRD_v1.0.md
├── 等等看_Design_Spec_v1.0.md
├── 等等看_Interaction_v1.0.md
├── 等等看_Developer_Handoff_v1.0.md
├── 等等看_Technical_Architecture_Proposal_v1.0.md
├── DECISION_LOG.md
├── PRODUCT_VALIDATION.md
├── adr/
│   └── 0001-phase1-slice1-persistence.md   （Native Phase（Phase 2），保留）
└── engineering/
    └── phase1-slice1-project-plan.md       （Native Phase（Phase 2），保留）
```

若未來導入 Docusaurus 或 MkDocs，可直接將本目錄作為內容來源，再補 Front Matter 與站點 Navigation；原始 Markdown 仍為版本控制基準。

## 9. Change Checklist

修改任何功能規格前，確認：

- [ ] 沒有改變「幫助記住，而不是幫助安排」的定位。
- [ ] 沒有加入 AI、社群、Todo、排程或未確認功能。
- [ ] 能清楚回答「這個功能能幫助使用者更快收藏、更容易回顧，或更容易再次找到內容嗎？」，答案為否則不列入 Phase 1（PRD Product Principles 最高原則）。
- [ ] Phase 1（Web／PWA）／Phase 2（Native iOS）邊界未被混淆；Native 內容標記為 Phase 2，未被誤植為 Phase 1 現行功能。
- [ ] Phase 1 核心功能仍永久免費，且未加入 IAP、會員或付費流程。
- [ ] 未加入帳號、OAuth、CloudKit、第三方雲端 API、自有 Server、自動備份、Cloud Sync 或 Push Notification 架構。
- [ ] 備份／還原失敗時現有資料仍完整保留。
- [ ] 未將 GRDB、SQLite、SwiftData、Core Data、Nuke、DatabasePool、WAL 或 checkpoint 描述為 Phase 1 已採用（僅為 Phase 2 保留候選）。
- [ ] 未直接備份／搬移資料庫檔案；備份由 Domain Model 產生為單一 JSON。
- [ ] PRD 已更新。
- [ ] Design Specification 已更新。
- [ ] Interaction 已更新。
- [ ] Developer Handoff 的資料、State、Migration 與測試已更新。
- [ ] Open Issue 已新增或關閉。
- [ ] High Fidelity UI 是否需要同步更新已確認。
- [ ] GitHub Diff 可清楚說明變更。

## 10. Document Status

| 文件 | 版本 | 狀態 |
|---|---:|---|
| README Documentation | 1.7 | Product Validation 提升為核心文件；Reading Order／Source of Truth／Document Hierarchy 已同步 |
| PRD | 1.6 | Product Principle 0 明文定名；Web Share Target 決策關閉；§17 摘要改採觀察指標 |
| Product Validation | 1.1 | 移除固定 KPI，改採六項觀察指標；提升為核心文件 |
| Design Specification | 1.5 | Native Phase（Phase 2）標示格式統一 |
| Interaction Specification | 1.5 | Native Phase（Phase 2）標示格式統一 |
| Technical Architecture Proposal | 1.6 | §23.3 由開放問題改寫為已確認決策（Web Share Target／Dexie Schema）；標示格式統一 |
| Developer Handoff | 1.7 | DEV-I13／I14 關閉並移至 Closed／Resolved；標示格式統一 |
| Decision Log | 1.6 | 新增 Web／PWA 決策收斂條目：Product Validation 治理、KPI 移除、三項技術決策 |
| ADR-0001（持久化） | Draft | Native Phase（Phase 2）保留，本輪未修改內容 |
| Phase 1 Slice 1 Project Plan（原） | 未變更 | Native Phase（Phase 2）保留，本輪未修改內容 |

## 11. Business Model Summary

- Phase 1 核心收藏功能永久免費。
- Phase 1 不開發 IAP、會員、訂閱、付費牆或支付流程。
- 未來自願支持不得解鎖或限制任何核心功能。
- 未來若推出付費方案，只針對新增且有持續成本的服務，例如跨裝置同步。
- 既有核心功能不得在後續版本改為付費。

## 12. Revision History

| Date | Revision | Change |
|---|---:|---|
| 2026-08-27 | 1.7 | `PRODUCT_VALIDATION.md` 提升為與 PRD 同級核心文件：重排 Documentation Set／Reading Order，新增 §3.1 Document Hierarchy，Source of Truth 插入 Product Validation 為第 2 順位；Document Status 全面更新版本號。 |
| 2026-08-27 | 1.6 | Phase 1 平台由原生 iOS 改為 Web／PWA；Native iOS 全部規劃保留並改列 Phase 2；新增 `PRODUCT_VALIDATION.md`；Documentation Set、Reading Order、Source of Truth、Phase Boundary、Change Checklist 與 Document Status 全面同步；`adr/0001` 與 `engineering/phase1-slice1-project-plan.md` 標記為 Native Phase 保留文件。 |
| 2026-07-21 | 1.5 | 同步 Repository 尚無 Xcode／程式碼現況；撤回持久化與圖片套件既定選型，固定 Domain Model 單一 JSON 備份與完整還原決策。 |
| 2026-07-20 | 1.4 | 將手動專用備份、原子性還原與正式設定頁納入 Phase 1，並同步無帳號、無代管、無自動同步資料策略。 |
| 2026-07-20 | 1.3 | 將小居流程升級為共用 AI Team Workflow，新增 Work 與 Codex 分工及單一工程師修改限制。 |
| 2026-07-20 | 1.2 | 完成七份正式文件跨文件一致性修正，加入 Technical Architecture 與 Source of Truth 優先順序。 |
| 2026-07-20 | 1.1 | 加入商業模式摘要、Decision Log、Phase 1 永久免費與不開發 IAP 的正式邊界。 |
| 2026-07-20 | 1.0 | 建立 Documentation README。 |
