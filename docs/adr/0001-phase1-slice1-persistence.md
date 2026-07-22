# ADR-0001: Phase 1 / Slice 1 本機持久化方案

## 狀態

**Draft — 待 Jenny／ChatGPT（小居）審閱，尚未寫入 Decision Log。**

`docs/DECISION_LOG.md` 目前未存在於本 Repository（已於 2026-07-22 完整掃描所有 branch／commit 確認），本 ADR 不自行取代 Decision Log，僅作為本 Slice 的工程分析與建議，待 Decision Log 補回後由 Jenny／Work 正式採納或修正。

本 ADR 為重新獨立比較的結果，**不因舊版 `等等看_Technical_Architecture_Proposal_v1.0.md`（ADR-001）曾建議 GRDB 而預設沿用**；若結論相同，屬分析後的巧合而非因襲。

## Context

Phase 1 / Slice 1 需要一個能被「主 App」與「Share Extension」兩個獨立 process 透過 App Group shared container 共同讀寫的本機持久化方案，用來支撐最小可驗收的分享收藏流程：

- Extension 建立一筆最小 Bookmark（`originalURL` + 系統分類「未整理」+ `metadataState = pending`）並原子寫入。
- 主 App 啟動或回前景後必須能立即讀到 Extension 寫入的資料。
- 寫入失敗不得留下半筆資料（no partial writes）。
- App 重啟後資料一致，不遺失、不損毀。
- 需支援至少 1,000～10,000 筆資料的合理讀寫效能（PRD／Developer Handoff 均要求測試涵蓋 10,000 筆量級）。
- 資料層必須可被 Repository protocol 封裝，UI 不得直接碰底層儲存；未來須能從 Domain Model 產生備份（JSON/CSV），不得被資料庫內部格式綁死。
- 目前 Schema 規模小（Bookmark／Category／Tag／BookmarkTag／AppSettings，5 張表以內），是關聯式、非物件圖譜密集的資料。

## Candidates

1. **SwiftData**（iOS 17+，Apple 原生）
2. **Core Data**（Apple 原生，成熟）
3. **原生 SQLite**（透過 SQLite3 C API 或最小包裝）
4. **GRDB.swift**（MIT，第三方，SQLite 封裝）

## Comparison

| 面向 | SwiftData | Core Data | 原生 SQLite | GRDB.swift |
|---|---|---|---|---|
| 1. App Group 跨程序共用 | 可用 `ModelConfiguration(groupContainer:)`，但官方文件對多 process 併發場景著墨少，社群回報 iOS 17 早期版本有 App Group 多 process 崩潰／資料異常案例 | 有成熟 pattern（`NSPersistentStoreDescription` + Persistent History Tracking + remote change 通知），但需自行正確接上 merge 邏輯 | 原生支援，檔案層級即可，SQLite 本身就是為多 process 存取設計 | 原生支援，官方文件有明確「跨 process／App Extension 共用資料庫」章節，直接對應本需求 |
| 2. 跨程序同時讀寫風險 | 中高：抽象層厚，缺乏可調的 busy timeout／連線層級控制，出錯時難以觀察根因 | 中：需自行正確設定 WAL + persistent history + `mergeChanges`／merge policy，任一環節配錯會靜默漏接或重複物件（正是本案最怕的「跨程序寫入不可靠」風險） | 高度取決於實作品質：WAL、busy_timeout、交易邊界全靠手刻，正確可控但無安全網 | 低中：SQLite WAL + busy timeout 由函式庫封裝並文件化，`DatabasePool` 提供 snapshot isolation，不需要維護記憶體物件圖譜跨程序合併 |
| 3. Migration 能力 | 較新：`SchemaMigrationPlan`／`VersionedSchema`，lightweight 遷移容易，複雜遷移案例較少、穩定性待觀察 | 成熟：lightweight + mapping model，但需要 `.xcdatamodeld` 版本檔案，跨 App／Extension target 共用模型檔案容易設定失誤 | 全手寫：`PRAGMA user_version` + 自訂 migration runner，簡單但每個 edge case 自行負責 | `DatabaseMigrator`：版本化、可測試、原生支援跨程序遷移鎖搭配（本案 5 張表規模剛好） |
| 4. Transaction／rollback | 有限：`ModelContext.save()` 近似單一交易，無法細粒度手動控制交易邊界 | 有：`context.rollback()`、`performBackgroundTask` 相對完整 | 完整但手動：`BEGIN/COMMIT/ROLLBACK` 全靠自己 | 完整且符合語意：`Database.write { }` 自動包交易、丟出即 rollback，並支援 `.immediate` 交易模式對應 SQLite busy 語意 |
| 5. 10,000 筆資料合理性 | 可行，NSPredicate/#Predicate 轉譯為 SQL，索引由框架管理 | 可行，NSFetchRequest + NSSortDescriptor 轉 SQL，索引可設定 | 可行，效能上限最高但要自己寫最佳化查詢 | 可行，直接寫可控 SQL + 索引；未來若要 FTS5（Developer Handoff 提及的可選優化）最容易加 |
| 6. 測試便利性 | 中：`ModelConfiguration(isStoredInMemoryOnly: true)` 尚稱方便 | 中：需自建 in-memory `NSPersistentStoreCoordinator`，型樣成熟但樣板多 | 中偏低：需自建 `:memory:` 或暫存檔測試 helper | 高：`DatabaseQueue(path: ":memory:")` 一行建立，測試工具鏈是 GRDB 主打特色之一 |
| 7. 從 Domain Model 產生備份可行性 | 中性——這取決於是否遵守 Repository 抽象，四個方案皆可做到，只要 Persistence 層只回傳 plain Domain struct，不外洩框架型別 | 同上 | 同上 | 同上 |
| 8. 長期維護與第三方依賴 | 零依賴，但框架仍年輕（iOS 17 起），文件與社群案例（尤其 App Group 多 process）相對少 | 零依賴，最成熟、社群知識最普及，但物件圖譜／NSManagedObject 樣板重，多 target 共用 `.xcdatamodeld` 易設錯 | 零依賴，長期最穩定（SQLite 幾乎不做破壞性變更），但所有正確性（連線管理、遷移、交易）都由專案自行背負，長期維護成本最高 | 單一第三方依賴（MIT）；經查證目前（2026-07）仍活躍維護（最新 release 2026-06，累積 38+ 版本、8.6k star），單一維護者需留意 bus factor，但社群採用度高、有多年穩定紀錄 |
| 9. iOS 最低版本限制 | 需 iOS 17+（我們的 baseline 剛好卡在下限，未來若想降版會被 SwiftData 卡住） | 無額外限制 | 無額外限制 | 無額外限制（GRDB 支援回溯到更舊版本，不會限制我們） |
| 10. 是否符合 Phase 1 Slice 1 的簡單需求 | 偏重：多帶了物件圖譜／`@Model` 巨集等超出本 Slice（僅 5 張小表、無複雜關聯圖）所需的抽象 | 偏重：需要 `.xcdatamodeld`、NSManagedObject 樣板、merge policy 設計，超出本 Slice 直接需求 | 剛好但要重造輪子：Migration／Transaction／Test helper 都要自己寫，等於重做 GRDB 已提供的部分 | 貼合：SQL-first、Struct/Codable 友善，剛好對應「小型關聯 schema + 明確交易需求」 |

## Decision

**建議採用 GRDB.swift + SQLite（App Group shared container）。**

## Reasons

1. 本案最核心的風險是「Share Extension 與主 App 跨程序寫入的可靠性」（不得留下半筆資料、重啟後一致）。GRDB 官方文件直接針對「App + App Extension 共用資料庫」場景給出 WAL、busy timeout、連線層級建議，是四個候選中唯一把這個確切情境當一等公民處理的方案。
2. Core Data 雖然原生、成熟，但要達到同等的跨程序可靠性，仍需自行正確接上 Persistent History Tracking + remote-change 通知 + merge policy——這些都是「看起來原生比較安全，但實際上一樣要自己刻對」的地方，任一環節設錯就會出現本任務明確禁止的「部分資料／覆蓋彼此已提交資料」。
3. SwiftData 目前文件與社群對「App Group 多 process 並發」著墨最少、案例最少，risk 判斷上最不成熟，且它是四者中唯一把我們的 iOS 17 deployment target 死死卡在下限、沒有回退空間的方案。
4. 原生 SQLite 技術上可行且最貼近底層，但等於要重新實作 GRDB 已經做好且經過大量專案驗證的 migration runner／transaction API／test helper，增加本案不必要的自製正確性風險與長期維護表面積，違反 PRD 原則「功能少、低學習成本、長期可維護」。
5. GRDB 的 `Database.write { }` 交易語意、`DatabaseMigrator` 與 in-memory 測試支援，剛好對應本 Slice 驗收要求（無部分資料、可測試、可 1,000～10,000 筆驗證）。
6. 備份可攜性（從 Domain Model 產生匯出）在四個方案下都可行，只要遵守 Repository 抽象；因此這不是決定性因素，但 GRDB 讓 Persistence 層與 Domain Model 的映射寫起來最直接（Codable + `FetchableRecord`/`PersistableRecord`），降低意外洩漏框架型別到 Domain 層的風險。

## Trade-offs

- 新增一個第三方依賴（MIT license），需要在 CI／Dependency Scan 中追蹤版本與授權。
- 團隊需要學習 GRDB 的 API 慣例（`DatabaseQueue`/`DatabasePool`、`Record` protocol），雖然學習曲線平緩，但仍是額外知識成本。
- 相較 Core Data／SwiftData，出問題時無法直接依賴 Apple 官方支援管道，需自行查閱 GRDB issue / 文件。

## Rejected Alternatives

| 方案 | 拒絕原因 |
|---|---|
| SwiftData | App Group 多 process 併發案例與文件最不成熟；iOS 17 起跳且無回退空間；本 Slice 明確要求「不能只因為原生就忽略 Share Extension 跨程序可靠性」，SwiftData 正是這個疑慮最大的候選 |
| Core Data | 技術上可達成，但需要自行正確組裝 Persistent History Tracking + merge notification + merge policy 才能達到同等跨程序可靠性，複雜度與出錯風險高於 GRDB；`.xcdatamodeld` 跨 App／Extension target 共用容易設定失誤 |
| 原生 SQLite | 可行但等於重造 GRDB 已提供且經驗證的 migration／transaction／測試機制，增加本案不必要的自製正確性負擔與長期維護成本 |

## Future Review Conditions

以下情況出現時，本 ADR 應重新檢視：

1. GRDB.swift 停止維護、出現重大未修復安全性問題，或授權條款變更。
2. SwiftData 在後續 iOS 版本針對 App Group 多 process 場景提供官方明確保證與成熟案例，且專案願意將最低部署版本綁在該 iOS 版本。
3. Schema 複雜度大幅增加（例如需要複雜物件圖譜、雙向關聯大量增加），使 SQL-first 方案的維護成本超過物件圖譜框架。
4. 需要 CloudKit／跨裝置同步（Phase 2 評估項目）時，須重新評估是否改用 Core Data + CloudKit（`NSPersistentCloudKitContainer`）以取得原生同步整合。

## Open / Deferred Items（不在本 ADR 定案）

- **URL 重複策略**：Phase 1 Slice 1 暫不建立 `url_normalized` 唯一性限制，允許技術上重複收藏同一 URL；正式去重規則待產品決定，不由工程自行建立永久規則。
- App Group identifier 最終命名、Bundle ID 正式值：待 Jenny 最終確認（目前為開發占位值，見專案設計文件）。
- `busy_timeout` 具體數值（草案沿用 Technical Architecture Proposal 曾提出的 1500ms 參考值）與重試次數，將於實作階段以測試驗證後在技術文件中定案，不在本 ADR 先行寫死。
