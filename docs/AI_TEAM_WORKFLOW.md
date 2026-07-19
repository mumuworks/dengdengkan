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
