# 《等等看》Phase 1 / Slice 1 — 開發前技術設計包

## 狀態

**設計草案，尚未建立 Xcode 專案本體。** 本文件是在無 macOS／Xcode 執行環境下完成的「開發前技術設計包」，同時也是唯一的執行 Runbook，供 Jenny／持有 macOS＋Xcode 環境者接手使用。不包含任何已生成、未經驗證的 `.pbxproj`、entitlements 或大量 Swift 實作檔案。

依據：`docs/adr/0001-phase1-slice1-persistence.md`（持久化 ADR，Draft）、`docs/DECISION_LOG.md`（rev 1.4，已同步）、`等等看_Technical_Architecture_Proposal_v1.0.md`（rev 1.4）、PRD、Developer Handoff、Jenny 於 2026-07-22 核准之開發占位識別值。

> 本文件原本拆成兩份（設計內容 + 執行拆解），因內容重複已於 2026-07-22 合併為單一文件。

**本階段刻意不做**：不生成 `.pbxproj`、Info.plist、entitlements、任何 `.swift` 實作檔案、`Package.swift`。理由：這些檔案的正確性只有在 Xcode／`xcodebuild`／`swift test` 實際執行後才能驗證，Linux 環境（無 Xcode／swift 工具鏈）生成後無法驗證，容易與 Xcode 精靈實際產生的專案結構打架，徒增接手時的除錯成本。

## 0. 開發占位識別值（已由 Jenny 核准，非正式 signing 值）

| 項目 | 值 |
|---|---|
| Product Name | 等等看 |
| 專案／程式模組英文名 | DengDengKan |
| 主 App Bundle ID | `com.mumuworks.dengdengkan` |
| Share Extension Bundle ID | `com.mumuworks.dengdengkan.ShareExtension` |
| App Group | `group.com.mumuworks.dengdengkan` |
| 最低 iOS Deployment Target | iOS 17.0 |
| Apple Developer Team／Provisioning | **暫不處理**，留待正式簽署階段 |

## 1. Xcode Project 與 Target 規劃

```
DengDengKan.xcodeproj
├── DengDengKan                     (主 App Target, SwiftUI App)
├── DengDengKanShareExtension       (Share Extension Target, Action/Share Extension point)
├── DengDengKanCore                 (共用 Framework/Swift Package：Domain + Repository + Persistence)
├── DengDengKanTests                (Unit Test Target, 對 DengDengKanCore 為主)
└── (視需要) DengDengKanUITests     (僅在無法以 Unit/Integration Test 涵蓋分享流程時才新增，預設不建立)
```

- 共用程式碼放在 `DengDengKanCore`（建議用 local Swift Package，而非單純 target membership 打勾），理由：
  - Swift Package 對「主 App + Extension + Test 三邊共用」的依賴關係最清楚，減少 target membership 手動勾選出錯風險（這正是 Core Data 方案在 ADR 中被扣分的同一類風險，選 Swift Package 可以從專案結構面直接避免）。
  - 可獨立對 `DengDengKanCore` 跑 `swift test`，不需要模擬器，加快本地／CI 反饋。
- App Group entitlements 需同時加在主 App Target 與 Share Extension Target，值為 `group.com.mumuworks.dengdengkan`。
- Share Extension 的 `NSExtensionActivationRule` 僅接受 `NSExtensionActivationSupportsWebPageWithMaxCount = 1` 與 URL 類型附件，其餘內容類型不顯示《等等看》於分享清單（對應「非 URL 內容要安全拒絕」）。

## 2. 分層架構

```
View (SwiftUI)  ──不得直接碰 DB──▶  ViewModel  ──▶  UseCase  ──▶  Repository (protocol)  ──▶  GRDB Persistence
                                                                        ▲
                                                        Share Extension 也透過同一 Repository protocol 存取
```

- **Domain Model**：plain Swift `struct`，`Codable`，不依賴 GRDB 型別。
- **Repository protocol**：定義在 `DengDengKanCore`，主 App 與 Extension 對它 mock／測試皆用同一介面。
- **Persistence implementation**：GRDB `DatabasePool` 實作，內部才知道 SQL/Schema。
- **Share import use case**：封裝「驗證 URL → 決定分類 → 交易寫入 → 回報結果」的流程，Extension UI 只呼叫這個 use case。
- **Write coordination abstraction**：見第 4 節。

## 3. Domain Model（Slice 1 最小欄位）

僅實作本 Slice 需要的欄位，Category／Tag 保留最小可擴充結構、不做管理流程。

### Bookmark

| Field | Type | Required | Default | 備註 |
|---|---|---|---|---|
| `id` | `UUID` | Yes | 產生 | 唯一 ID |
| `originalURL` | `String` | Yes | — | 原始網址，不因 Metadata 失敗被清除 |
| `title` | `String?` | No | `nil` | Slice 1 不做 Metadata 擷取，維持 `nil` |
| `sourceApp` | `String?` | No | `nil` | 若可由 Extension context 取得來源 App／host，先存起來；取不到則 `nil` |
| `note` | `String?` | No | `nil` | 使用者便利貼／收藏理由；trim 後為空則存 `nil` |
| `categoryID` | `UUID` | Yes | 系統分類「未整理」ID | 每則收藏恰一個分類 |
| `isPinnedToBoard` | `Bool` | Yes | `false` | 洞洞板保留欄位，Slice 1 UI 不操作 |
| `metadataState` | `enum { pending, resolved, failed }` | Yes | `pending` | Slice 1 恆為 `pending`（不做擷取），欄位先建立以符合未來擴充 |
| `imageURL` | `String?` | No | `nil` | 只存 URL 字串，不存二進位 |
| `createdAt` | `Date` | Yes | Now | 不可由使用者輸入 |
| `updatedAt` | `Date` | Yes | Now | 內容變更時更新 |
| `lastOpenedAt` | `Date?` | No | `nil` | 建立時必為 `nil`；Slice 1 主 App 最小畫面若無 Detail 頁，可先不觸發更新（不得偽造） |

### Category（最小可擴充，Slice 1 僅需系統分類）

| Field | Type | Required | Default |
|---|---|---|---|
| `id` | `UUID` | Yes | 固定值：系統分類「未整理」使用穩定常數 ID |
| `name` | `String` | Yes | `"未整理"` |
| `isSystem` | `Bool` | Yes | `true`（唯一必建資料） |

Slice 1 **不**實作分類新增／改名／刪除／排序，僅保證「未整理」在資料庫初始化／migration 時一定存在，符合 Developer Handoff BR-003／BR-004。

### Tag / BookmarkTag

Slice 1 不需要標籤 UI，但為避免未來 Migration 是 breaking change，建議在 Schema 階段就建立 `tags` / `bookmark_tags` 空表結構（GRDB migration 中建立，不在 Domain Model 或 UI 曝露操作）。是否要在這個 Slice 就建表，或留到下個 Slice 一起做，**列為待 Jenny／小居 確認的技術選擇**（兩者都不違反「不過度實作」原則，差別只在 Migration 順序）。

## 4. 跨程序寫入協調設計

- **持久化引擎**：GRDB `DatabasePool`（讀多寫少、支援多執行緒／多連線讀取，寫入序列化）。
- **WAL**：開啟 SQLite WAL journal mode，確保 App Group 目錄可正常建立 `-wal` / `-shm`。
- **每個 process 各自開自己的 connection**：主 App 與 Extension 不共用同一個 `DatabasePool` 實例（本來就無法跨 process 共用記憶體物件），但共用同一份 GRDB `DatabaseMigrator` migration 定義（放在 `DengDengKanCore`，用同一份程式碼在兩邊各自 migrate，避免 schema 定義漂移）。
- **交易**：所有寫入使用 `dbPool.write { db in ... }`（GRDB 預設會包成交易，失敗即整體 rollback，不留半筆資料）。Extension 的寫入是「建立 Bookmark」單一交易，不包含任何網路／Metadata 動作。
- **busy timeout + 有界重試**：連線層設定 busy timeout（草案沿用 Technical Architecture 曾提出的 1500ms，需在實作時以實測校準，不視為定案數字），加上最多 2 次、指數退避的重試，作為輔助手段，**不作為唯一一致性保證**——一致性保證的主體是 WAL + 明確交易邊界。
- **Migration 鎖**：使用 App Group 目錄下的 lock file（`NSFileCoordinator` 或 `flock`）確保同時啟動的 App／Extension 不會同時執行 migration；未取得鎖的一方只做 schema 相容性檢查，不搶著升級 schema。
- **失敗語意**：Extension 寫入失敗時，UI 停留、允許重試，**不得**先顯示「已收藏」再背景寫入；未 commit 成功一律視為失敗。
- **重啟一致性**：App 冷啟動時不做任何「假設資料存在」的捷徑，一律重新開啟 `DatabasePool` 並讀取，驗證資料庫檔案／WAL/SHM 是否可正常開啟（對應 Developer Handoff 的 `integrity_check` 要求，Slice 1 至少做最基本的開檔驗證，完整 `PRAGMA integrity_check` 排程可留到後續 Slice）。

以上內容需在正式進入 Xcode 實作時，寫入 `等等看_Technical_Architecture_Proposal_v1.0.md` 或新的技術文件中定案（本文件目前僅為設計草案，尚未經 Jenny／小居 正式核准為 Architecture 決策）。

## 5. 最小分享收藏流程（對應驗收路徑）

```
Safari／其他 App
  → 系統分享 → 選《等等看》
  → Share Extension 收到 NSExtensionItem
  → URLValidator：僅接受 http/https，格式錯誤／非法 scheme 一律安全拒絕並顯示錯誤
  → ShareImportUseCase：組出最小 Bookmark（category = 未整理, metadataState = pending）
  → Repository.write（GRDB 交易）
  → 成功 → 顯示「幫你記住了」，關閉 Extension
  → 失敗 → 保留面板、顯示錯誤、允許重試，不建立半筆資料
  → 主 App 開啟／回前景 → 重新讀取 Repository → 最小收藏列表可見新項目
```

- URL 重複：**允許重複**，不在 Slice 1 建立去重規則（依 ADR-0001 Open Items，待產品決定）。
- 非 URL 內容：Extension activation rule 層先過濾；萬一仍收到非法內容，UseCase 驗證失敗並安全拒絕，不寫入。

## 6. 主 App 最小畫面

- App 啟動畫面（沿用品牌 Splash 精神，不做高保真動畫）。
- 最小收藏列表（`List`/`LazyVStack`，讀 Repository）。
- 空狀態（沿用 PRD 空狀態文案：「還沒有收藏任何內容」）。
- 收藏基本資訊顯示：標題或 URL 替代文字、來源（若有）、建立時間。
- 下拉重新整理或 `onAppear`／`scenePhase` 變化時重新讀取，反映 Extension 新增資料。
- 設定頁：僅占位入口（例如導到一個空的 `SettingsPlaceholderView`），不實作備份／匯出功能。

明確不做：High Fidelity UI 還原、洞洞板、Daily Recall、正式首頁重新設計。

## 7. 測試計畫對應

| # | 測試 | 對應 Domain/Layer |
|---|---|---|
| 1 | Bookmark 建立與 Codable 轉換 | Domain Model |
| 2 | Repository 新增與讀取 | Repository + GRDB |
| 3-6 | URL 驗證（http/https 接受、無效字串拒絕、非支援 scheme 拒絕） | URLValidator |
| 7 | Share import use case 成功 | UseCase |
| 8 | 寫入失敗不產生部分資料 | Repository（模擬交易中途失敗） |
| 9 | App Group store 可由主 App／Extension 共用 | 整合測試：兩個獨立 `DatabasePool` 指向同一 App Group 路徑 |
| 10 | 重啟／重建 repository 後資料仍存在 | 整合測試：關閉並重新開啟 `DatabasePool` |
| 11 | 至少 1,000 筆寫入／讀取效能 | 效能測試 |
| 12 | 模擬主 App／Extension 競爭寫入 | 併發測試：兩個 `DatabasePool` 實例平行寫入同一 DB 檔 |

測試不得依賴正式使用者資料，皆使用臨時目錄／in-memory 或 temp file DB。

## 8. 預計新增／修改檔案清單

```
DengDengKan.xcodeproj/                          [新增]
DengDengKan/                                    [新增] 主 App Target
  DengDengKanApp.swift
  Views/RootView.swift
  Views/BookmarkListView.swift
  Views/SettingsPlaceholderView.swift
DengDengKanShareExtension/                      [新增] Share Extension Target
  ShareViewController.swift 或 SwiftUI ShareView.swift
  Info.plist（NSExtensionActivationRule）
  DengDengKanShareExtension.entitlements
DengDengKan.entitlements                        [新增] 主 App App Group entitlement
Packages/DengDengKanCore/                       [新增] local Swift Package
  Sources/DengDengKanCore/Domain/Bookmark.swift
  Sources/DengDengKanCore/Domain/Category.swift
  Sources/DengDengKanCore/Repository/BookmarkRepository.swift (protocol)
  Sources/DengDengKanCore/Persistence/GRDBBookmarkRepository.swift
  Sources/DengDengKanCore/Persistence/AppGroupDatabase.swift
  Sources/DengDengKanCore/Persistence/Migrations.swift
  Sources/DengDengKanCore/UseCase/ShareImportUseCase.swift
  Sources/DengDengKanCore/Validation/URLValidator.swift
  Package.swift
DengDengKanCoreTests/                           [新增]
  BookmarkModelTests.swift
  BookmarkRepositoryTests.swift
  URLValidatorTests.swift
  ShareImportUseCaseTests.swift
  AppGroupConcurrencyTests.swift
docs/adr/0001-phase1-slice1-persistence.md      [已建立於本階段]
docs/engineering/phase1-slice1-project-plan.md  [本文件]
```

以下待實作完成後才會更新：
`等等看_Technical_Architecture_Proposal_v1.0.md`、
`等等看_Developer_Handoff_v1.0.md`、
`docs/README_Documentation.md`。
`docs/DECISION_LOG.md` 已於 2026-07-22 由 Work 同步至 rev 1.4，本階段不需再變動，僅在正式採納持久化 ADR 或其他新決策時，由對應角色新增條目。

## 9. 執行狀態總覽

| # | 項目 | 狀態 | 說明 |
|---|---|---|---|
| 1 | Repository／文件同步確認 | ✅ 已完成 | `origin/main` 已 merge 進工作分支，`DECISION_LOG.md` rev 1.4 確認存在 |
| 2 | 持久化候選比較 | ✅ 已完成 | `docs/adr/0001-phase1-slice1-persistence.md`，**Draft**，待審閱 |
| 3 | 開發占位識別值 | ✅ 已核准（Jenny，開發用） | 見第 0 節 |
| 4 | 專案／Target／分層架構規劃 | ✅ 已完成 | 見第 1–2 節 |
| 5 | Domain Model 欄位規劃 | ✅ 已完成 | 見第 3 節 |
| 6 | 跨程序寫入協調設計 | ✅ 已完成 | 見第 4 節，數值待實作校準 |
| 7 | 最小分享收藏流程設計 | ✅ 已完成 | 見第 5 節 |
| 8 | 測試計畫（12 類測試對應） | ✅ 已完成 | 見第 7 節 |
| 9 | 預計檔案清單 | ✅ 已完成 | 見第 8 節 |
| 10 | Xcode 執行步驟 | ✅ 已完成 | 見第 10 節（B1–B9） |
| 11 | Xcode Project／Target／Build／Test／模擬器驗證 | ⏳ 待辦 | 需 macOS＋Xcode 環境；Jenny 已確認可接手 |

## 10. Xcode 執行步驟（B1–B9，供 macOS＋Xcode 環境執行）

> 每一步驟附「驗證方式」，請照順序執行、不要跳步。所有 identifier 沿用第 0 節開發占位值，除非 Jenny 另行提供正式值。撰寫時尚未建立任何 `.xcodeproj`、Target 或 Swift 實作檔案，以下步驟不假設它們已存在。

### B1. 建立 Xcode Project
1. Xcode ▸ File ▸ New ▸ Project ▸ iOS App。
2. Product Name：`DengDengKan`；Interface：SwiftUI；Language：Swift；Bundle Identifier：`com.mumuworks.dengdengkan`；Minimum Deployments：iOS 17.0。
3. Team：先選 None／個人帳號（暫不處理正式 signing）。
4. 存放路徑：Repository 根目錄。
- **驗證**：Xcode 可正常開啟專案，Scheme 選單出現 `DengDengKan`。

### B2. 建立 Share Extension Target
1. File ▸ New ▸ Target ▸ Share Extension。
2. 命名 `DengDengKanShareExtension`，Bundle Identifier 需為 `com.mumuworks.dengdengkan.ShareExtension`（Xcode 通常自動用「主App.ShareExtension」，確認一致）。
3. Embed in Application：`DengDengKan`。
- **驗證**：專案 Navigator 出現新 Target，`xcodebuild -list` 顯示兩個 Target。

### B3. 建立 local Swift Package（共用層）
1. File ▸ New ▸ Package，命名 `DengDengKanCore`，存放於 `Packages/DengDengKanCore`。
2. 依第 8 節檔案清單，在 Package 內建立 `Domain`、`Repository`、`Persistence`、`UseCase`、`Validation` 資料夾與對應檔案骨架（此時才由接手工程師依第 3 節 Domain Model／Repository 設計實際寫 Swift 程式碼）。
3. 將 `DengDengKanCore` 加入 `DengDengKan` 與 `DengDengKanShareExtension` 兩個 Target 的 Frameworks and Libraries。
- **驗證**：`swift build`（在 Package 目錄內）或 Xcode Build 兩個 Target 皆能解析到 `DengDengKanCore` symbol。

### B4. App Group Capability
1. 於 Apple Developer 帳號建立 App Group `group.com.mumuworks.dengdengkan`（若尚未有可用 Team，先請 Jenny 提供或建立）。
2. 主 App Target 與 Share Extension Target 的 Signing & Capabilities 都加入 App Groups，勾選該 group。
3. 確認自動產生的 `.entitlements` 檔案內容一致（兩個 Target 的 App Group identifier 必須完全相同）。
- **驗證**：兩個 Target 的 entitlements 檔內 `com.apple.security.application-groups` 陣列都包含 `group.com.mumuworks.dengdengkan`。

### B5. 持久化選型落地（先確認 ADR）
1. 提交 `docs/adr/0001-phase1-slice1-persistence.md` 給 Jenny／小居審閱；**核准前不得執行本步驟以下動作**。
2. 核准後（若維持 GRDB.swift 結論）：於 `Package.swift` 加入 GRDB.swift dependency，pin 版本並提交 `Package.resolved`。
3. 依第 4 節實作 `AppGroupDatabase`、`Migrations`（`DatabaseMigrator`）、`GRDBBookmarkRepository`。
4. 若審閱結果改採其他方案，回頭修改 ADR 狀態為 Accepted（記錄實際結論）並依新方案調整本步驟。
- **驗證**：`DengDengKanCoreTests` 內的 Repository／Migration 測試可執行且通過（見 B7）。

### B6. 依規劃建立 Swift 原始碼骨架
依第 3–6 節與第 8 節檔案清單，建立：
- 主 App：`DengDengKanApp.swift`、`RootView.swift`、`BookmarkListView.swift`、`SettingsPlaceholderView.swift`。
- Share Extension：`ShareViewController.swift`／SwiftUI Share View、Info.plist 的 `NSExtensionActivationRule`（僅接受 1 個 URL 附件）。
- Core：`Bookmark.swift`、`Category.swift`、`BookmarkRepository.swift` protocol、`ShareImportUseCase.swift`、`URLValidator.swift`。
- **驗證**：`xcodebuild build` 主 App／Extension 兩個 Target 皆成功。

### B7. 建立並執行測試
1. 建立 `DengDengKanCoreTests` Target，依賴 `DengDengKanCore`。
2. 依第 7 節建立 12 類測試檔案。
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
- **驗證**：對照第 11 節驗收清單逐項打勾。

### B9. 完成後回報
依原始任務要求的格式回報：ADR 最終結論、實際檔案清單、Build 結果、Test 結果、已知限制、待 Jenny 決策事項、`git diff` 摘要。**不得**自行 Commit／Push／建 PR／Merge，除非 Jenny 明確同意。

## 11. 驗收清單（交給下一個可執行 Xcode 的工程環境）

- [ ] Xcode Project 可正常開啟，無遺失檔案參照。
- [ ] 主 App Target 可 Build（Debug, iOS Simulator）。
- [ ] Share Extension Target 可 Build。
- [ ] `DengDengKanCoreTests` 可執行且全數通過（含第 7 節列出的 12 類測試）。
- [ ] 從 Safari 分享一個合法 https URL，可透過《等等看》Share Extension 成功建立收藏。
- [ ] 開啟主 App 後可在最小收藏列表看到該筆收藏。
- [ ] 分享非 URL 內容或無效字串時，不建立資料、顯示明確錯誤。
- [ ] 模擬 App／Extension 同時寫入不產生資料損毀或半筆資料。
- [ ] App 強制關閉重啟後，先前收藏仍存在。
- [ ] 除 GRDB.swift 外無其他未經 ADR 核准的第三方依賴。
- [ ] 未出現 CloudKit、登入、Server、StoreKit、Analytics SDK、廣告 SDK。
- [ ] `git diff` 僅包含本 Slice 必要內容（不含未經確認的 signing/profile 檔案）。

## 12. 待 Jenny／小居 決策事項彙總

1. ADR-0001（GRDB.swift 持久化）是否核准；核准後才可加入 GRDB dependency。
2. Tags／BookmarkTag 空表是否在 Slice 1 就建立 schema（技術選項，不影響 Slice 1 功能範圍）。
3. App Group／Bundle ID 何時轉為正式值、由誰持有 Apple Developer Team。
4. Xcode Project 建立、Build、Test、模擬器驗證由 Jenny 的 macOS＋Xcode 環境接手（依第 10 節 B1–B9 執行），本 Claude Code session（Linux）不執行這部分。

## 13. 交接備註

- 若接手工程師發現本文件的設計與 Xcode 實際狀況有落差（例如 Swift Package 與 Xcode Target 依賴設定的實際限制），應視為正常的設計落地調整，非規格衝突；但若涉及 Domain Model 欄位、Bundle ID／App Group 正式值、持久化最終選型以外的重大變更，仍需依 `AI_TEAM_WORKFLOW.md` 的 Stop Rule 停下確認。
