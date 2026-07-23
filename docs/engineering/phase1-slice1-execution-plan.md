# 《等等看》Phase 1 / Slice 1 — 執行拆解（Linux 可完成 vs 需 Xcode 完成）

## 狀態

執行用 Runbook，供 Jenny／持有 macOS＋Xcode 環境者接手使用。撰寫時**尚未建立任何 `.xcodeproj`、Target 或 Swift 實作檔案**，本文件不假設它們已存在。

前置閱讀：`docs/adr/0001-phase1-slice1-persistence.md`（持久化 ADR，Draft）、`docs/engineering/phase1-slice1-project-plan.md`（完整設計草案，含分層架構／Domain Model／跨程序寫入設計／檔案清單）、`docs/DECISION_LOG.md`（rev 1.4）、`docs/等等看_Technical_Architecture_Proposal_v1.0.md`（rev 1.4）。

---

## Part A — 目前 Linux 環境可完成／已完成

| # | 項目 | 狀態 | 說明 |
|---|---|---|---|
| A1 | Repository／文件同步確認 | ✅ 已完成 | `origin/main` 已 merge 進工作分支，`DECISION_LOG.md` rev 1.4 確認存在，未重建 |
| A2 | 持久化候選比較 | ✅ 已完成 | `docs/adr/0001-phase1-slice1-persistence.md`，Draft 狀態，待審閱 |
| A3 | 開發占位識別值 | ✅ 已核准（Jenny，開發用） | Product Name「等等看」／英文模組名 `DengDengKan`／主 App Bundle ID `com.mumuworks.dengdengkan`／Share Extension Bundle ID `com.mumuworks.dengdengkan.ShareExtension`／App Group `group.com.mumuworks.dengdengkan`／最低 iOS 17.0；**Team／Provisioning 仍未處理** |
| A4 | 專案／Target／分層架構規劃 | ✅ 已完成 | 見 `phase1-slice1-project-plan.md` 第 1–2 節 |
| A5 | Domain Model 欄位規劃 | ✅ 已完成 | 見 `phase1-slice1-project-plan.md` 第 3 節（Bookmark／Category 最小欄位） |
| A6 | 跨程序寫入協調設計 | ✅ 已完成 | 見 `phase1-slice1-project-plan.md` 第 4 節（WAL＋交易＋busy timeout＋migration lock 的技術方向，數值待實作校準） |
| A7 | 最小分享收藏流程設計 | ✅ 已完成 | 見 `phase1-slice1-project-plan.md` 第 5 節 |
| A8 | 測試計畫（12 類測試對應） | ✅ 已完成 | 見 `phase1-slice1-project-plan.md` 第 7 節 |
| A9 | 預計檔案清單 | ✅ 已完成 | 見 `phase1-slice1-project-plan.md` 第 8 節 |
| A10 | Xcode 建立步驟草稿 | ✅ 已完成，本文件 Part B 為可執行細版 | 見下 |

**本階段刻意不做**：不生成 `.pbxproj`、Info.plist、entitlements、任何 `.swift` 實作檔案、Package.swift。理由：這些檔案的正確性只有在 Xcode／`xcodebuild`／`swift test` 實際執行後才能驗證，本環境（Linux，無 Xcode／swift 工具鏈）生成後無法驗證，容易與 Xcode 精靈實際產生的專案結構打架，徒增接手時的除錯成本。

---

## Part B — 需要 macOS＋Xcode 環境執行（依序）

> 每一步驟後方註記「可驗證方式」，接手者請照順序做，不要跳步。所有identifier 沿用 Part A / A3 的開發占位值，除非 Jenny 另行提供正式值。

### B1. 建立 Xcode Project
1. Xcode ▸ File ▸ New ▸ Project ▸ iOS App。
2. Product Name：`DengDengKan`；Interface：SwiftUI；Language：Swift；Bundle Identifier：`com.mumuworks.dengdengkan`；Minimum Deployments：iOS 17.0。
3. Team：先選 None／個人帳號（暫不處理正式 signing，依 Jenny 前次指示）。
4. 存放路徑：Repository 根目錄。
- **驗證**：Xcode 可正常開啟專案，Scheme 選單出現 `DengDengKan`。

### B2. 建立 Share Extension Target
1. File ▸ New ▸ Target ▸ Share Extension。
2. 命名 `DengDengKanShareExtension`，Bundle Identifier 需為 `com.mumuworks.dengdengkan.ShareExtension`（Xcode 通常自動用 `主App.ShareExtension`，確認一致）。
3. Embed in Application：`DengDengKan`。
- **驗證**：專案 Navigator 出現新 Target，`xcodebuild -list` 顯示兩個 Target。

### B3. 建立 local Swift Package（共用層）
1. File ▸ New ▸ Package，命名 `DengDengKanCore`，存放於 `Packages/DengDengKanCore`。
2. 依 `phase1-slice1-project-plan.md` 第 8 節檔案清單，在 Package 內建立 `Domain`、`Repository`、`Persistence`、`UseCase`、`Validation` 資料夾與對應檔案骨架（此時才由接手工程師依 Part A 的 Domain Model／Repository 設計實際寫 Swift 程式碼）。
3. 將 `DengDengKanCore` 加入 `DengDengKan` 與 `DengDengKanShareExtension` 兩個 Target 的 Frameworks and Libraries。
- **驗證**：`swift build`（在 Package 目錄內）或 Xcode Build 兩個 Target 皆能解析到 `DengDengKanCore` symbol。

### B4. App Group Capability
1. 於 Apple Developer 帳號建立 App Group `group.com.mumuworks.dengdengkan`（若尚未有可用 Team，先請 Jenny 提供或建立）。
2. 主 App Target 與 Share Extension Target 的 Signing & Capabilities 都加入 App Groups，勾選該 group。
3. 確認自動產生的 `.entitlements` 檔案內容一致（兩個 Target 的 App Group identifier 必須完全相同）。
- **驗證**：兩個 Target 的 entitlements 檔內 `com.apple.security.application-groups` 陣列都包含 `group.com.mumuworks.dengdengkan`。

### B5. 持久化選型落地（先確認 ADR）
1. 提交 `docs/adr/0001-phase1-slice1-persistence.md` 給 Jenny／小居審閱；**核准前不得執行本步驟以下動作**。
2. 核准後（若維持 GRDB.swift 結論）：於 `DengDengKanCore` 的 `Package.swift` 加入 GRDB.swift dependency，pin 版本並提交 `Package.resolved`。
3. 依 `phase1-slice1-project-plan.md` 第 4 節實作 `AppGroupDatabase`、`Migrations`（`DatabaseMigrator`）、`GRDBBookmarkRepository`。
4. 若審閱結果改採其他方案，回頭修改 ADR 狀態為 Accepted（記錄實際結論）並依新方案調整本步驟。
- **驗證**：`DengDengKanCoreTests` 內的 Repository／Migration 測試可執行且通過（見 B7）。

### B6. 依規劃建立 Swift 原始碼骨架
依 `phase1-slice1-project-plan.md` 第 3–6 節與第 8 節檔案清單，建立：
- 主 App：`DengDengKanApp.swift`、`RootView.swift`、`BookmarkListView.swift`、`SettingsPlaceholderView.swift`。
- Share Extension：`ShareViewController.swift`／SwiftUI Share View、Info.plist 的 `NSExtensionActivationRule`（僅接受 1 個 URL 附件）。
- Core：`Bookmark.swift`、`Category.swift`、`BookmarkRepository.swift` protocol、`ShareImportUseCase.swift`、`URLValidator.swift`。
- **驗證**：`xcodebuild build` 主 App／Extension 兩個 Target 皆成功。

### B7. 建立並執行測試
1. 建立 `DengDengKanCoreTests` Target，依賴 `DengDengKanCore`。
2. 依 `phase1-slice1-project-plan.md` 第 7 節建立 12 類測試檔案。
3. 執行：
   ```
   xcodebuild test -scheme DengDengKan -destination 'platform=iOS Simulator,name=iPhone 15'
   ```
- **驗證**：全部測試通過，包含 App Group 共用、重啟後資料一致、1,000 筆效能、模擬併發寫入。

### B8. 模擬器端到端驗證
1. 在模擬器開啟 Safari，瀏覽任一 https 網頁。
2. 分享 ▸ 選《等等看》▸ 確認最小確認畫面／直接完成收藏。
3. 開啟《等等看》主 App，確認該筆收藏出現在最小收藏列表。
4. 測試非法內容（例如純文字分享，若系統分享清單仍列出本 App）／格式錯誤字串，確認安全拒絕、不建立資料。
5. 強制關閉並重啟主 App，確認資料仍存在。
- **驗證**：對照 `phase1-slice1-project-plan.md` 第 10 節驗收清單逐項打勾。

### B9. 完成後回報
依原始任務要求的格式回報：ADR 最終結論、實際檔案清單、Build 結果、Test 結果、已知限制、待 Jenny 決策事項、`git diff` 摘要。**不得**自行 Commit／Push／建 PR／Merge，除非 Jenny 明確同意（沿用既有 Git 流程規則）。

---

## 交接備註

- 本文件與 `phase1-slice1-project-plan.md` 為同一批設計輸出的兩份文件：後者是「設計內容」，本文件是「執行順序」。兩者同時參照即可，不需要合併。
- 若接手工程師發現 Part A 的設計與 Xcode 實際狀況有落差（例如 Swift Package 與 Xcode Target 依賴設定的實際限制），應視為正常的設計落地調整，非規格衝突；但若涉及 Domain Model 欄位、Bundle ID／App Group 正式值、持久化最終選型以外的重大變更，仍需依 `AI_TEAM_WORKFLOW.md` 的 Stop Rule 停下確認。
