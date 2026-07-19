# AI Team Workflow

## 工作前置指引

開始工作前，請先閱讀並遵守 docs/AI_TEAM_WORKFLOW.md。

## 固定分工

1. **Jenny**  
   提出需求、確認流程、商業決策與最終驗收。

2. **ChatGPT（小居）**  
   負責需求分析、產品思考、流程設計、系統規格、資料模型、權限規劃、驗收標準與開發路由。

3. **ChatGPT Work**  
   負責 PRD、技術文件、制度文件、大量文件分析、跨檔案比對、市場研究與商業模式分析，不修改 Repository。

4. **GitHub Copilot（小摳）**  
   負責 Repository 掃描、共用元件搜尋、npm／GitHub／Open Source 評估、架構分析、重用方案與 Best Practice 建議，不負責大量 Coding。

5. **Claude Code／Codex（阿克／扣哥）**  
   負責 Coding、Refactor、核准的 Migration、Debug、Test、Commit、Push 與 PR。  
   同一 Repository、同一開發階段只能指定其中一位修改。

6. **GitHub Actions**  
   負責 Build、CI、Lint、Workflow 與 Deploy Check。

## 固定流程

Jenny  
→ ChatGPT（小居）  
→ ChatGPT Work  
→ GitHub Copilot（小摳）  
→ Claude Code／Codex（阿克／扣哥）  
→ GitHub Actions  
→ Jenny 驗收

## AI Team Decision Authority

各角色權限如下：

- Jenny
  - 商業決策
  - 專案優先順序
  - 最終驗收
  - 最終產品決策

- ChatGPT（小居）
  - 需求分析
  - 流程設計
  - 系統規格
  - Architecture
  - Slice 規劃
  - 驗收標準

- ChatGPT Work
  - 文件整理
  - 跨文件一致性
  - 文件版本治理
  - 規格稽核
  - 市場研究

- GitHub Copilot（小摳）
  - Repository 掃描
  - 元件重用分析
  - Open Source 評估
  - Best Practice 建議
  - Git 操作協助

- Claude Code／Codex（阿克／扣哥）
  - Coding
  - Refactor
  - Debug
  - Test
  - Build
  - Commit
  - Push
  - PR

所有 AI 都可以提出建議。

但除 Jenny 最終確認外：

不得自行：

- 修改商業決策
- 修改產品定位
- 新增功能
- 修改 Architecture
- 修改 Slice 範圍

## Stop Rule

若遇到以下任一情況：

1. 文件彼此矛盾
2. 商業決策不一致
3. 規格不足以唯一實作
4. 超出目前 Slice 範圍
5. 必須自行猜測需求
6. 發現可能影響既有架構的重要變更

必須立即停止。

不得自行：

- 新增功能
- 修改 Architecture
- 修改資料模型
- 修改商業流程
- 擴大 Scope

應提出問題，由 Jenny 決定。

## Repository Source of Truth

若不同文件內容互相衝突，依照以下優先順序：

1. DECISION_LOG.md
2. PRD
3. Technical Architecture
4. Design Specification
5. Interaction Specification
6. Developer Handoff
7. README

低順位文件不得覆蓋高順位文件。

若發現衝突：

由 ChatGPT Work 統一整理。

不得自行修改產品方向。

最終由 Jenny 確認。

## Workflow 使用原則

AI Team Workflow 為 Repository 的共同工作流程。

但可依專案階段調整，不要求每次都經過所有角色。

例如：

產品規劃：

Jenny
→ ChatGPT（小居）
→ ChatGPT Work

架構設計：

Jenny
→ ChatGPT（小居）
→ ChatGPT Work
→ GitHub Copilot

程式開發：

Jenny
→ ChatGPT（小居）
→ GitHub Copilot
→ Claude Code／Codex
→ GitHub Actions

文件治理：

Jenny
→ ChatGPT Work

依專案需求選擇適合的流程，不增加不必要的 AI 協作成本。
