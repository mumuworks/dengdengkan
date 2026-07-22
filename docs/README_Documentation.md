# 《等等看》Documentation

文件修訂：1.5（2026-07-21 備份技術架構去綁定與決策補完）

本目錄保存《等等看》Phase 1 的正式產品、設計、互動、工程交付與決策紀錄。文件內容依目前已定案產品規格、High Fidelity UI v1.1 Final，以及 2026-07-20 商業模式與本機自主備份決策整理，可直接納入 GitHub 版本管理。

## 1. Documentation Set

| 文件 | 用途 | 主要讀者 |
|---|---|---|
| [`等等看_PRD_v1.0.md`](./等等看_PRD_v1.0.md) | 定義產品定位、使用者問題、目標、MVP、功能範圍、Phase 邊界與成功指標。 | Product、Design、Engineering |
| [`等等看_Design_Spec_v1.0.md`](./等等看_Design_Spec_v1.0.md) | 定義 Design System、Tokens、元件、畫面、Navigation、Dark Mode、Dynamic Type 與 Accessibility。 | Design、iOS Engineering、QA |
| [`等等看_Interaction_v1.0.md`](./等等看_Interaction_v1.0.md) | 定義所有畫面的 Trigger、User Action、System Response、Navigation 與 Exception Handling。 | Product、iOS Engineering、QA |
| [`等等看_Developer_Handoff_v1.0.md`](./等等看_Developer_Handoff_v1.0.md) | 定義邏輯 Data Model、State、Business Rules、Validation、Metadata、Daily Recall、Migration、安全與效能。 | 小居、Work、小摳、阿克／扣哥、QA |
| [`等等看_Technical_Architecture_Proposal_v1.0.md`](./等等看_Technical_Architecture_Proposal_v1.0.md) | 記錄已確認架構方向、候選方案、備份契約、垂直切片、ADR 與風險；不代表持久化或第三方依賴已選定。 | 小摳、阿克／扣哥、iOS Engineering |
| [`DECISION_LOG.md`](./DECISION_LOG.md) | 保存已確認且不得由工程重新解釋的產品與商業決策。 | 全體專案成員 |

## 2. 閱讀順序 / Reading Order

```text
README_Documentation.md
↓
等等看_PRD_v1.0.md
↓
等等看_Design_Spec_v1.0.md
↓
等等看_Interaction_v1.0.md
↓
等等看_Developer_Handoff_v1.0.md
↓
Technical Architecture（下一階段）
```

`DECISION_LOG.md` 應與 README 一併閱讀；遇到範圍或策略疑義時，以尚未被取代的 Accepted Decision 為準。

### 2.1 Why This Order

1. README：先理解文件範圍、版本與使用方式。
2. PRD：確認產品為何存在、Phase 1 做什麼與不做什麼。
3. Design Specification：確認畫面語言、元件與無障礙基準。
4. Interaction：逐畫面確認使用者操作與系統反應。
5. Developer Handoff：將已確認產品規則轉為工程可執行的資料、狀態與驗證。
6. Technical Architecture：在上述規格不再變動後，決定 Repository、持久化框架、模組切分與實作方案。

## 3. Source of Truth

本文件集的 Source of Truth 優先順序如下：

1. `DECISION_LOG.md` 中尚未被取代的 Accepted Decision。
2. PRD 的產品定位、Phase 1／Future 邊界與 Business Model。
3. High Fidelity UI v1.1 Final 的視覺與畫面結構；若其中的 Future 參考畫面與 Accepted Decision 衝突，以 Decision Log 為準。
4. Design Specification、Interaction、Developer Handoff 與 Technical Architecture Proposal。
5. Design System v1.0 與 Component Library。
6. Low Fidelity Wireframe 最終確認方向。
7. 產品核心原則與早期草案中的不衝突內容。

若早期文件與 Final UI 衝突，以較新的已確認規格為準。例如：

- Bottom Navigation 為「收藏／洞洞板／搜尋／設定」。
- 便條紙是收藏首頁元件，不是 Tab。
- 首頁不顯示最近新增 Carousel。
- Share Extension 的分類預設為「未整理」，不阻擋收藏。
- Phase 1 無會員、Apple／Google／Email 登入、自動雲端備份或跨裝置同步。
- Phase 1 使用者可手動匯出／匯入專用備份檔；檔案透過 iOS 系統介面由使用者自行管理，《等等看》不代管。
- 備份由 Domain Model 產生為單一 JSON，不直接備份或搬移底層資料庫／store 檔案。
- 第一版 `schemaVersion`／`modelVersion` 均為 `1`，最大 50 MB，payload 使用 SHA-256 checksum；checksum 不代表加密或身分驗證。
- Phase 1 備份不含圖片二進位檔，只含圖片 URL、Metadata 與可恢復欄位。
- 匯出對所有使用者開放。
- Daily Recall 使用本機通知，不是待辦提醒。
- Phase 1 核心收藏功能永久免費，不開發 IAP、會員或付費流程。

## 4. Phase Boundary

### 4.1 Phase 1

- 完全本機收藏。
- Share Extension。
- 分類、標籤、搜尋。
- 洞洞板。
- 單一首頁便條紙。
- Daily Recall／iOS Local Notification。
- Metadata 狀態。
- 匯出收藏。
- 專用備份檔匯出與匯入還原。
- 正式設定頁：本機儲存說明、收藏總筆數、最近備份、資料動作、每日回顧、回報問題／建議、App 版本、隱私與條款。
- App Group shared container 與 Share Extension 為建立 Xcode 專案時要實作的方向；目前尚未建立。
- Light／Dark、Dynamic Type、Accessibility。

商業策略：

- Phase 1 核心收藏功能永久免費。
- Phase 1 不開發 IAP、會員、訂閱、付費牆或任何付費流程。
- High Fidelity UI 中的「支持木木」保留為未來設計參考，不列入 Phase 1 實作。

資料策略：

- 收藏資料預設且主要儲存在裝置本機；未來主 App 與 Share Extension 預計透過 App Group 共享必要資料，但目前尚未建立 Xcode Project、Target、entitlement 或 store。
- 不建立自有會員、Apple／Google／Email 登入、自有 Server、CloudKit、第三方雲端 API 或自動同步。
- 備份檔可由使用者透過系統 File Provider 自行存到所選位置；App 不取得帳號、不綁定服務，也不負責代管。
- 匯入採讀取前 50 MB 檢查、版本／checksum／必要欄位／關聯驗證、預覽、明確確認、Domain staging 與受保護取代；失敗時 rollback，原資料保持不變。
- 匯入期間鎖定主 App 與 Share Extension 的資料寫入，不鎖純瀏覽；不會自動在使用者的檔案 App 產生額外備份。
- 回報問題／提供建議採 Email。隱私權政策與使用條款須於 App Store 上架前建立公開網址，完成前不得使用假連結。

### 4.2 Phase 2 — Evaluation Only

- CloudKit。
- Google 登入。
- Sign in with Apple。
- 跨裝置同步。
- 桌面 Widget。
- 鎖定畫面 Widget。
- 自願支持方案。
- 只針對新增且有持續成本服務的付費方案，例如跨裝置同步。

Phase 2 項目不得提前出現在 Phase 1 正式畫面或宣稱中。

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
└── DECISION_LOG.md
```

若未來導入 Docusaurus 或 MkDocs，可直接將本目錄作為內容來源，再補 Front Matter 與站點 Navigation；原始 Markdown 仍為版本控制基準。

## 9. Change Checklist

修改任何功能規格前，確認：

- [ ] 沒有改變「幫助記住，而不是幫助安排」的定位。
- [ ] 沒有加入 AI、社群、Todo、排程或未確認功能。
- [ ] Phase 1／Phase 2 邊界未被混淆。
- [ ] Phase 1 核心功能仍永久免費，且未加入 IAP、會員或付費流程。
- [ ] 未加入帳號、OAuth、CloudKit、第三方雲端 API、自有 Server、自動備份或同步架構。
- [ ] 備份／還原失敗時現有資料仍完整保留。
- [ ] 未將 GRDB、SQLite、SwiftData、Core Data、Nuke、DatabasePool、WAL 或 checkpoint 描述為已採用。
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
| README Documentation | 1.5 | 技術去綁定、備份正式決策與 Repository 現況已同步 |
| PRD | 1.4 | Domain JSON 備份、版本／checksum／容量與還原原則已同步 |
| Design Specification | 1.3 | 備份錯誤狀態、Email 與政策網址規則已同步 |
| Interaction Specification | 1.3 | 大小／版本／checksum／寫入鎖與受保護取代流程已同步 |
| Developer Handoff | 1.5 | 架構無關備份契約、migration adapter、寫入鎖與 rollback 已同步 |
| Technical Architecture Proposal | 1.4 | 持久化與第三方依賴改為候選；資料庫檔案替換已移除 |
| Decision Log | 1.4 | 備份技術架構去綁定與 19 項正式決策已記錄 |

## 11. Business Model Summary

- Phase 1 核心收藏功能永久免費。
- Phase 1 不開發 IAP、會員、訂閱、付費牆或支付流程。
- 未來自願支持不得解鎖或限制任何核心功能。
- 未來若推出付費方案，只針對新增且有持續成本的服務，例如跨裝置同步。
- 既有核心功能不得在後續版本改為付費。

## 12. Revision History

| Date | Revision | Change |
|---|---:|---|
| 2026-07-21 | 1.5 | 同步 Repository 尚無 Xcode／程式碼現況；撤回持久化與圖片套件既定選型，固定 Domain Model 單一 JSON 備份與完整還原決策。 |
| 2026-07-20 | 1.4 | 將手動專用備份、原子性還原與正式設定頁納入 Phase 1，並同步無帳號、無代管、無自動同步資料策略。 |
| 2026-07-20 | 1.3 | 將小居流程升級為共用 AI Team Workflow，新增 Work 與 Codex 分工及單一工程師修改限制。 |
| 2026-07-20 | 1.2 | 完成七份正式文件跨文件一致性修正，加入 Technical Architecture 與 Source of Truth 優先順序。 |
| 2026-07-20 | 1.1 | 加入商業模式摘要、Decision Log、Phase 1 永久免費與不開發 IAP 的正式邊界。 |
| 2026-07-20 | 1.0 | 建立 Documentation README。 |
