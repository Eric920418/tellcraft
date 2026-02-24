# Tellcraft

> **用對話打造你的軟體產品** | [tellcraft.com](https://tellcraft.com)

Tellcraft 是一個 AI 驅動的自動化開發平台。用戶只需描述需求，AI 會自動釐清細節、生成程式碼、部署上線。

## 核心理念

```
描述需求 → AI 釐清 → 確認規格 → 自動生成 → 一鍵部署
```

## 當前開發進度

- **狀態**：✅ Phase 1-9 + Server Actions + VPS Backend + 前端 Chat 串接 + 認證系統 + 訪客體驗改善 + 儀表板系統 + BDD Spec 完整修復 + 專案版本管理 + **UIUX 生成邏輯重構** + **Design Tier** + **專案自動命名** + **PreviewPanel iframe 重構** + **Quality Gate 品質檢查** + **Code Preview 即時渲染** + **串流實時預覽** + **BDD→UI 翻譯 + Variant 創意概念** + **Fast Mode 快速建站** + **智能模板匹配** + **Fast Build 藍圖進度** + **BDD Q&A 3D 蓋房子動畫** + **對話回退 + 錯誤恢復** + **BDD Spec Skill v2.0.0 同步** + **LLM 自動重試 + 錯誤訊息人性化** + **BDD Phase 4/5 後端補完** + **Phase 0 Event Storming**
- **釐清項目**：28 項全部解決
- **Server Actions**：30+ 已實作
- **詳情**：[`.clarify/overview.md`](.clarify/overview.md)

### Phase 0 Event Storming（2026-02-24）

BDD Skill 新增前置的 Event Storming 階段，對複雜業務需求自動啟動 DFS 結構化探索，產出 Commands/ReadModels/Actors/Aggregates/Rules 知識地圖，作為後續 PRD Discovery 的高品質輸入。

**新增檔案**：
- `tellcraft-backend/src/services/event-storming.ts` — ES 核心服務（型別定義 + 7 個公開函數），全部使用 Haiku，~$0.002/次
- `tellcraft-backend/migrations/006_add_es_document.sql` — bdd_sessions 新增 es_document_content 欄位

**修改檔案**：
- `tellcraft-backend/src/workers/orchestrator.ts` — `executeBddSpecSkill()` 入口新增 ES 偵測 + `handleContinueFlow()` 新增 `es_init`/`es_explore` phase 路由 + 6 個 ES handler 函數
- `tellcraft-backend/src/types/flow-state.ts` — FlowState 新增 `esKnowledgeMap` 欄位
- `tellcraft-backend/src/db/client.ts` — columnMap + getBddSession SELECT 新增 es_document_content
- `tellcraft-backend/src/services/bdd-session.ts` — updateBddSession 型別新增 esDocumentContent
- `app/page.tsx` — Message.stage union 新增 `es_init` | `es_explore`

**狀態機流轉**：`executeBddSpecSkill → shouldRunEventStorming? → YES: es_init → es_explore（DFS 循環）→ all_complete → prd_discovery | NO: prd_discovery`

**降級策略**：ES 是增值前置階段，任何 LLM 失敗都跳過 ES 直接進 Discovery，不阻塞後續流程。用戶可隨時「跳過 ES，直接釐清」。

### BDD Phase 4/5 後端補完（2026-02-24）

BDD Skill 後端 Phase 4（Actions Design）和 Phase 5（ISA Config）補完，加上驗證腳本整合，使 BDD 規格完成後自動生成 actions.yml 和 isa_codegen.yml。

**新增檔案**：
- `tellcraft-backend/src/services/feature-validation.ts` — Feature Files 驗證 + 自動修復迴圈（child_process 調用 `bdd-spec/scripts/` 腳本，最多 3 輪 LLM 修復）
- `tellcraft-backend/src/services/actions-design.ts` — Phase 4：LLM 驅動（Sonnet）從 Feature Files + Schema 生成 actions.yml（含 YAML 解析 + summary 一致性驗證 + 1 次修復重試）
- `tellcraft-backend/src/services/isa-config.ts` — Phase 5：100% 規則式生成 ISA Config（零 LLM），掃描 5 種步驟模式 → executor 映射模板 + 覆蓋率驗證

**修改檔案**：
- `tellcraft-backend/src/workers/orchestrator.ts` — `completeSpecPhase()` 插入 3 步自動執行（驗證 → Actions Design → ISA Config），進度消息顯示，完成消息列出實際產出物
- `app/page.tsx` — Message.stage union 新增 `spec_validating` / `spec_actions_design` / `spec_isa_config`

**降級策略**：Phase 4/5 是增值產出，不是 UIUX 前置條件。任何步驟失敗都降級跳過，絕不阻塞 UIUX 流程。

### LLM 自動重試 + 錯誤訊息人性化（2026-02-24）

所有 `callClaude()` 函數新增自動重試機制，解決 Anthropic API 暫時性過載（`overloaded_error`）導致用戶操作失敗的問題。

**修復項目**：
- **`uiux-generation.ts` callClaude**：`overloaded_error` / `rate_limit_error` / 網路錯誤自動重試最多 3 次（指數退避 2s→4s→8s）
- **`spec-discovery.ts` callClaude**：同上重試機制（HTTP fetch 版本，檢查 status 429/529/503）
- **`formulation.ts` callClaude**：同上重試機制
- **`bdd-to-ui-spec.ts` translateBddToUISpec**：同上重試機制（Haiku SDK stream 版本）
- **錯誤訊息人性化**：`humanizeError()` 將原始 JSON 錯誤轉為用戶可讀的中文提示（如「AI 伺服器目前繁忙，請稍等 1-2 分鐘後再試」）
- **`iteration-skill.ts`**：迭代失敗訊息直接使用 `callClaude` 返回的人性化錯誤

**核心改動**：
- `tellcraft-backend/src/services/uiux-generation.ts`：`isRetryableError()` + `humanizeError()` + callClaude retry loop
- `tellcraft-backend/src/services/spec-discovery.ts`：`isRetryableStatus()` + `isRetryableFetchError()` + retry loop
- `tellcraft-backend/src/services/formulation.ts`：同上
- `tellcraft-backend/src/services/bdd-to-ui-spec.ts`：retry loop 包裹 stream 調用
- `tellcraft-backend/src/services/iteration-skill.ts`：移除冗餘的錯誤前綴

### BDD Spec Skill v2.0.0 同步（2026-02-24）

將 `.claude/skills/bdd-spec/SKILL.md` 從 v1.0.0 完全改寫為 v2.0.0，同步 `bdd-spec/skill.md` 的所有新功能。

**修復項目**：
- **SKILL.md 完全改寫**：新增 Event Storming（Phase 0）、四類規則分類、提案優先模式、草稿批量生成、需求變更管理（Phase 6）、Staging Area 機制
- **參數解析指示**：新增 Level 0 參數解析區塊，指示 Claude 讀取 `bdd-spec/arguments-template.yml` 並替換 `${VARIABLE_NAME}`
- **路徑前綴修正**：`bdd-spec/skill.md` 和 `SKILL.md` 中所有 `instructions/`、`scripts/`、`rules/`、`resources/` 路徑加上 `bdd-spec/` 前綴（約 20 處）
- **壞連結修復**：`02-clarify.md`、`03-formulation.md`、`04-actions-design.md` 中 7 處 `./formulation-rules.md` → `../rules/formulation-rules.md`
- **清理過期檔案**：刪除 `bdd-spec/dev/` 目錄（do-implement.md + now-implement-system.md）

### 對話回退 + 錯誤恢復（2026-02-24）

解決 UIUX 設計流程中「點錯無法回頭」和「錯誤後卡死」兩個問題。

**決策點回退**：
- `PHASE_BACKTRACK_MAP`：定義 4 條回退路徑（design_clarify/template_selection/brief_confirm → design_preference，variant_selection → brief_confirm）
- `handleGoBack()`：通用回退函數，清理下游 FlowState 欄位 + 重發目標 phase 選項消息
- `hasGoBackIntent()`：關鍵字檢測（返回/重選/重來/go back，排除「返回修改」）
- 所有設計階段消息末尾追加 ghost 樣式「← 返回」quickReply 按鈕
- `__go_back__` 特殊值由 `handleContinueFlow` 入口統一攔截

**錯誤恢復**：
- 5 個 phase handler（design_preference/design_clarify/brief_confirm/template_selection/variant_selection）包 try-catch
- `handlePhaseError()`：捕獲後顯示錯誤訊息 + 「重試」/「返回」按鈕，保持當前 phase 不變
- `__retry__` 特殊值提示用戶重新輸入

**FlowState 新欄位**：`lastStablePhase`（記錄穩定決策點，供未來擴展）

### Fast Build 藍圖進度 + BDD Q&A 3D 蓋房子動畫（2026-02-24）

解決兩個 UX 死角：Fast Build 60-90 秒等待期間和 BDD Q&A 最多 30 題的疲勞感。**已用 Remotion 重構動畫驅動層**。

**Remotion 改造**（取代 motion/react + GSAP）：
- **`app/components/remotion/`**（新建目錄）：所有 Remotion composition
  - `shared/springs.ts`：共用 spring 預設（smooth/snappy/bouncy/heavy/precise）
  - `shared/utils.ts`：delayedSpring/pulse/loopValue/clampInterpolate helpers
  - `fast-build/`：FastBuildComposition + BlueprintGrid + PhaseNode + ConnectingLine + ProgressBar + StepText + constants
  - `building-scene/`：BuildingComposition（ThreeCanvas）+ BuildingMeshes + FrameDrivenAnimations + CameraController + Particles + BuildingFallback2D + constants
- **`app/components/FastBuildPlayer.tsx`**（取代 FastBuildProgress.tsx）：`@remotion/player` Player 包裝器，phase 變化時 seekTo 目標幀
- **`app/components/building-scene/BuildingPlayer.tsx`**（取代 BuildingScene.tsx）：`@remotion/player` Player 包裝器，progress 變化時 seekTo(progress*30)
- **`app/components/building-scene/index.ts`**（修改）：導出 BuildingPlayer（dynamic import，SSR: false）
- 動畫全部由 `useCurrentFrame()` + `spring()` + `interpolate()` 驅動，禁用 CSS transition / useFrame / GSAP
- 3D 場景用 `@remotion/three` 的 `<ThreeCanvas>` 取代原生 R3F `<Canvas>`
- 刪除舊檔案：FastBuildProgress.tsx、BuildingScene.tsx、buildingTimeline.ts、BuildingFallback.tsx
- 後端不動：orchestrator.ts、orchestrator-utils.ts 的消息格式完全不變

**Fast Build 幀佈局**（300 幀 @ 30fps = 10 秒）：idle[0-30] → Phase1 Structure[30-130] → Phase2 Animation[130-230] → Phase3 RWD[230-300]

**Building Scene 幀佈局**（900 幀 @ 30fps = 30 秒，每題 30 幀）：地基[0-149] → 牆體[150-299] → 門窗[300-449] → 內裝[450-599] → 屋頂[600-749] → 完工[750-899]

**新增依賴**：`remotion` `@remotion/player` `@remotion/three` `@remotion/transitions`（保留 `three` `@react-three/fiber` `@react-three/drei` `gsap` `framer-motion`）

### 迭代更新 Skill 拆分 + 撤銷功能（2026-02-16）

將迭代修改/回滾邏輯從 orchestrator.ts 獨立為 `iteration-skill.ts`，並新增撤銷功能。

**架構改動**：
- **`types/flow-state.ts`**（新建）：FlowState 介面 + `IterationHistoryEntry` + `GeneratedCode` 型別
- **`workers/orchestrator-utils.ts`**（新建）：`sendMessage`/`saveFlowState`/`getFlowState`/`deleteFlowState`/`makeStreamingCallback`/`generatedCodeToFileRows` 共用函數
- **`services/iteration-skill.ts`**（新建）：`executeIteration`（迭代修改）、`executeUndoIteration`（撤銷）、`executeRollbackQuery`（回滾查詢）、`executeRollbackSelection`（回滾選擇）
- **`services/registry.ts`**（修改）：新增 `'iteration'` SkillName + INTERNAL_SKILLS
- **`workers/orchestrator.ts`**（修改）：刪除 ~550 行，路由簡化為 `hasDeployIntent`/`hasRollbackIntent`/`hasUndoIntent` helper + 對應 Skill 呼叫

**新功能**：
- **撤銷上一次迭代**：關鍵字「撤銷/undo/復原/上一步/還原修改」觸發，恢復 `uiuxPreIterationCode` 快照（只能撤銷一步）
- **迭代歷史**：每次迭代記錄 `{ timestamp, feedback, filesChanged }` 到 FlowState（最多 20 條）
- **撤銷按鈕**：迭代完成後 quickReplies 動態顯示「撤銷修改」ghost 按鈕（僅當有快照時）

| 指標 | 改動前 | 改動後 |
|------|--------|--------|
| orchestrator.ts 行數 | 4475 | 3926 |
| 迭代邏輯位置 | 散佈 orchestrator 3 函數 + 5 分支 | 集中 `iteration-skill.ts` |
| sendMessage 可用性 | orchestrator 私有 | `orchestrator-utils.ts` 全域共用 |
| 撤銷功能 | 數據存了但沒觸發路徑 | 完整支援 |

### 智能模板匹配系統（2026-02-15）

BDD 規格完成後，自動分析需求並匹配合適的設計模板，取代固定顯示全部模板的舊邏輯。

**核心改動**：
- **DB 擴展**：`template_category` ENUM 從 4→8（新增 portfolio/dashboard/blog/event），模板新增 `industry[]`/`use_cases[]`/`component_types[]` 匹配維度 + GIN 索引
- **三層評分引擎**（`template-matcher.ts`，零 LLM 成本）：
  - Layer 1: 關鍵詞匹配（40 分）— 需求文本 vs 模板 industry/use_cases/tags
  - Layer 2: Category 匹配（30 分）— `inferProductType()` → category 映射
  - Layer 3: UISpec 匹配（30 分）— 頁面/元件重疊度（可選）
- **條件路由**：有匹配 → 顯示「討論式設計 / 使用模板(N個推薦)」；無匹配 → 只顯示「開始設計」
- **篩選顯示**：`showTemplatePicker()` 只查詢匹配的模板 ID，按分數排序
- **前端 Bug 修復**：`TemplatePicker.tsx` 新增 `initialTemplates` prop，後端已傳入篩選結果時不再呼叫 API 重新載入全部

| 檔案 | 動作 |
|------|------|
| `migrations/005_expand_templates.sql` | 新建 — ENUM 擴展 + 新欄位 + GIN 索引 |
| `template-matcher.ts` | 新建 — 三層匹配引擎 |
| `scripts/seed-templates-v2.sql` | 新建 — 更新現有模板 + 後續模板骨架 |
| `orchestrator.ts` | 修改 — FlowState.matchedTemplateIds + completeSpecPhase 匹配 + showTemplatePicker 篩選 |
| `TemplatePicker.tsx` | 修改 — initialTemplates prop + 動態分類選項 |
| `UiuxChatSection.tsx` | 修改 — 傳遞 initialTemplates + filteredMode |
| `templates.ts` | 修改 — TemplateCategory 擴展 8 個 + CATEGORY_LABELS/ICONS |
| `templates route` | 修改 — API 返回 industry/useCases/componentTypes |

```bash
# 部署步驟
psql "$DATABASE_URL" -f tellcraft-backend/migrations/005_expand_templates.sql
psql "$DATABASE_URL" -f tellcraft-backend/scripts/seed-templates-v2.sql
```

### Fast Mode 快速建站（2026-02-09）

新增「快速模式」，用戶輸入一句話描述 → 跳過 BDD/Design Discovery/Brief/Variants → 直接 3 階段自動生成（Structure → Animation → RWD）→ 60-90 秒內看到完整預覽。

**流程**：
```
用戶描述 → detectDesignTier（規則式）→ 默認 DesignSystem → inferInteractionHint → Structure+Interaction(streaming) → Animation(streaming) → RWD(streaming) → 靜態 QG → Preview
3 次 LLM | 0 次用戶交互 | 60-90 秒
```

**設計決策**：
- 完全不修改精細模式（fine mode）的任何邏輯
- 2 個 phase：`fast_need_more_info`（描述太短等待補充）+ `fast_generating`（生成中），完成後 → `uiux_complete`，複用所有迭代/部署/回滾
- `mode === 'fast'` 時跳過 Classifier，零額外 LLM 成本
- 前端 HeroSection 新增 Fast/Fine 模式切換器 + Fast mode 最低 15 字前端驗證

**新增文件**：
- `tellcraft-backend/src/services/fast-build-generation.ts` — tier 偵測、產品推斷、默認 DesignSystem

**修改文件**：
- `tellcraft-backend/src/services/uiux-generation.ts` — 7 個 private 函數改為 export
- `tellcraft-backend/src/services/registry.ts` — 新增 `fast-build` skill
- `tellcraft-backend/src/workers/orchestrator.ts` — `executeFastBuildSkill` + `fast_generating` phase
- `tellcraft-backend/src/routes/conversation.ts` — API 接受 `mode` 參數
- `app/lib/vps-api.ts` — `sendMessage` 新增 `mode` 參數
- `app/page.tsx` — HeroSection 模式切換器 + ChatSection 傳遞 mode

### BDD→UI 翻譯 + Variant 創意概念（2026-02-08）

解決兩個根本問題：(1) Variant 創意概念在生成過程中丟失；(2) ISA 格式的 BDD spec 不適合前端 LLM 消費。

**BDD→UI 翻譯**：Pipeline 開始前，用 Haiku 將 BDD Feature Files 翻譯為結構化的 `UIRequirementsSpec`（頁面/操作/欄位），取代原始 BDD spec 注入生成 prompt。翻譯結果快取在 FlowState，失敗時自動降級。

**Variant 創意概念**：用戶選擇 variant 後，從 `DesignVariant` 提取 `VariantConcept`（name/description/keyFeatures/signatureElement），注入所有生成函數的 prompt（Structure/Animation/RWD/Refine），確保創意方向貫穿整個設計。

**新增文件**：
- `tellcraft-backend/src/services/bdd-to-ui-spec.ts` — BDD→UI 翻譯 service

**修改文件**：
- `tellcraft-backend/src/services/uiux-generation.ts` — 新增 `VariantConcept` 類型 + `extractVariantConcept()`；`generateStructure/Animations/Rwd/refineCode` 支援概念注入
- `tellcraft-backend/src/workers/orchestrator.ts` — FlowState 新增 `uiuxUISpec`/`uiuxVariantConcept`；Pipeline 整合翻譯 + 概念傳遞

### Quality Gate 品質檢查（2026-02-06）

UIUX Implementation 三階段（Structure → Animation → RWD）完成後自動觸發品質檢查，不需用戶手動觸發。

**檢查類別**：
- **A11y**：focus-visible、aria-label、form labels、img alt、heading hierarchy
- **Performance**：只動畫 transform/opacity、reduced-motion、no transition-all、animation duration
- **Code Quality**：motion/react import、Tailwind v4 syntax、next/font、no h-screen、no emoji icons

**自動修復**：發現 critical 問題時用 Haiku 自動修復，最多 3 輪，只修問題不改設計。

**SEO 不在此 Skill 範圍內**：SEO（metadata export、semantic HTML、html lang 等）將獨立為單獨的 SEO Skill，不包含在 Quality Gate 中。

**核心改動**：
- `quality-gate.ts`：新增品質檢查 service（靜態分析 + LLM 修復）
- `orchestrator.ts`：RWD 完成後觸發 `executeQualityGate()`，FlowState 新增 `uiuxQualityReport`
- `registry.ts`：註冊 `quality-gate` skill
- `QualityGateReport.tsx`：前端品質報告組件
- `UiuxChatSection.tsx`：渲染 `quality_gate_report` richContent

### Code Preview 即時渲染（2026-02-06）

UIUX Implementation 階段生成的 React TSX 代碼，透過 Sandpack（`@codesandbox/sandpack-react`）在瀏覽器內用真實 React bundler 渲染。支援桌面/平板/手機三種裝置切換。

**Sandpack 預覽架構**（取代原有 1105 行 regex TSX→HTML 轉換器）：
- `app/lib/sandpack-utils.ts`：檔案路徑映射 + import 重寫 + Next.js shim + 依賴掃描 + 差異比對
- `app/components/uiux/SandpackPreview.tsx`：Sandpack wrapper，支援 streaming 增量更新（`useSandpack().sandpack.updateFile()`）
- `app/page.tsx`：`renderPreviewPanel()` 使用 `dynamic(() => import(...), { ssr: false })` 懶載入 Sandpack

**Sandpack vs Vercel 部署一致性修復（2026-02-23）**：
預覽和部署是兩條不同管線（Sandpack CDN vs Next.js build），以下機制確保兩端行為一致：
- `cleanTailwindV4Syntax()`：與部署端 `deployer.ts` 對齊的 Tailwind v4→v3 轉換（支援巢狀 `@theme {}`、`@custom-variant`、`@apply font-*`）
- CSS 變數 fallback 安全網：tailwindConfig 引用 `var(--radius-*)` / `var(--color-*)` 時自動注入 `:root {}` fallback
- `lib/fonts.ts` shim 自動生成：代碼引用 `@/lib/fonts` 但未生成該檔案時，自動產生空 shim（字體由 CDN `<link>` 注入）
- Layout `<head>` 內 `<style>` 標籤保留：移除 `<head>` 前先提取 `<style>` 內容（CSS 變數、動畫 keyframes）
- Google Fonts `<link>` JSX 清理：移除 JSX 中殘留的 `<link href="fonts.googleapis.com">`（Sandpack 由 index.html CDN 處理）
- 依賴版本鎖定：`SANDPACK_KNOWN_DEPS` 版本號與部署端 `KNOWN_PACKAGES` 對齊（`motion: '^11.0.0'` 而非 `'latest'`）
- 未知依賴 fallback：`scanDependencies()` 對不在已知列表的套件使用 `'latest'`（不再靜默丟棄）
- **deployer_code_sync 持久化**：部署端 build 修復後的代碼現在寫入 DB（之前只透過 Socket 推送，重開對話會丟失）
- **消息格式化修復**：`hasHistory` 自動恢復和對話列表切換兩個路徑補上了 `richContent`/`layoutHint`/`quickReplies` 映射
- **IntersectionObserver polyfill**：Sandpack iframe 中 `IntersectionObserver` 不正確觸發，導致 motion/react `whileInView` 元素停在 `opacity:0` 初始狀態。注入 polyfill 強制所有 `observe()` 立即回報元素可見
- **Tailwind CDN config JS 注入**：config 從 HTML `<script>` 改為 `index.tsx` JS 中設定（Sandpack 不一定執行自訂 HTML script），移除 `externalResources` 避免雙重載入

**比起舊 regex 轉換器的改進**：
- 動畫真實渲染（motion/react 在 Sandpack 內真正執行）
- 事件處理正確綁定（onClick、useState 等不再被 strip）
- 組件模組解析精確（Sandpack 原生模組系統，不需 regex 內聯）
- 錯誤可見（Sandpack 顯示具體編譯錯誤，不再靜默失敗）

**Deployer Next.js 15 Async Params 修復（2026-02-24）**：
- `sanitizeCodeForDeploy` 新增修復 6：自動偵測 page/layout 中的同步 `params: { id: string }` 寫法，轉換為 `params: Promise<{ id: string }>`，函式加 `async`，插入 `const { id } = await params`
- `fixBuildErrors` prompt 新增規則 9：教 LLM 識別 `PageProps` 類型衝突並使用 Next.js 15 的 async params 寫法修復
- `buildStreamingHandler` 的 `lastEmitTime` 初始化從 `0` 改為 `Date.now()`，修復首次 emit 時 `timeSinceLastEmit` 顯示為 56 年的計時器 bug

**Tailwind Config 策略（2026-02-10）**：
`generateTailwindConfig()` 使用**硬編碼值**（不依賴 CSS 變數），確保 Tailwind v3 編譯輸出的 CSS 是自給自足的：
- `borderRadius.full: '9999px'`（而非 `'var(--radius-full)'`），避免 CSS 變數遺失導致圓角消失
- `colors.primary: '#2563eb'`（而非 `'var(--color-primary)'`），同理
- 三處 `content` 路徑（`generateTailwindConfig`、`wrapInNextJs` 有/無 config 分支）全部同步為 10 個目錄
- Deployer 安全網：`wrapInNextJs` 檢測舊 config 中的 `var(--radius-` 引用，若 styles 缺少定義則注入 fallback `:root {}`
- **Sandpack 端同步**：`sandpack-utils.ts` 也有相同的 CSS 變數 fallback 邏輯

**RWD 響應式安全網（2026-02-06）**：
`generateRwd()` LLM 經常不產出 Tailwind 響應式前綴（sm:/md:/lg:），後端安全網自動注入基本響應式 class：
- 後端：`ensureResponsiveClasses()`（`uiux-generation.ts`）— 在 `generateRwd()` 解析後檢測，無響應式 class 時注入
- 預覽端：Sandpack 使用 Tailwind CDN JIT，響應式 class 自動生效
- 模式：`grid-cols-3` → `grid-cols-1 md:grid-cols-3`、`text-3xl` → `text-xl md:text-3xl` 等

### 串流實時預覽（2026-02-08）

UIUX 代碼生成時，右側預覽面板不再等完整生成後才顯示，而是利用 LLM 串流逐步解析已完成的 code block，即時推送到前端渲染。用戶可以看到網頁從 header 逐步被構建出來。

**實現原理**：
- `callClaude()` 新增 `onTextDelta` 回調，`stream.on('text')` 累積文字
- `parseCompletedFileBlocks()` 只匹配已閉合的 code block（有 ``` 結尾）
- Throttle 雙條件觸發：新區塊完成 + 時間間隔 >= 1500ms（避免 iframe 重載過頻）
- 後端 `makeStreamingCallback` 將 partial preview 存入 Redis（key: `streaming:preview:{conversationId}`，TTL 30s）
- 前端透過現有的 HTTP 輪詢（`GET /api/conversation/:id/messages`）取得 `streamingPreview` 欄位
- 串流期間輪詢間隔自動降至 1.5s（正常 3-15s），確保即時性
- 最終 `code_preview` 訊息到達後清除 streaming state，恢復完整預覽
- 注意：不使用 WebSocket 直連（Mixed Content 問題：HTTPS 頁面無法連接 ws:// 端點）

**視覺效果**：
- 生成中顯示 phase 標籤（結構生成中... / 動畫增強中... / 響應式適配中...）+ pulse dot
- 元素漸入 stagger 動畫
- 完成後恢復 DeviceSwitcher

**核心改動**：
- `tellcraft-backend/src/services/uiux-generation.ts`：`callClaude` 加 `onTextDelta`、新增 `parseCompletedFileBlocks`、三函數加 `onPartialCode`
- `tellcraft-backend/src/workers/orchestrator.ts`：`makeStreamingCallback` 存 Redis + emit Socket.io
- `tellcraft-backend/src/routes/conversation.ts`：messages 端點返回 `streamingPreview`（從 Redis 讀取）
- `app/components/uiux/SandpackPreview.tsx`：Sandpack 增量更新（`useSandpack().sandpack.updateFile()`），取代舊 regex 轉換器
- `app/page.tsx`：透過 HTTP 輪詢取得 streaming preview（不再用獨立 WebSocket 連接）

### Classifier 分層防禦 + 智慧引導（2026-02-08）

Classifier 升級為三層防禦架構，避免非正常輸入白白消耗 LLM Token：

**Layer 1 — Prefilter（零 LLM 成本）**：`tellcraft-backend/src/services/prefilter.ts`
- 空消息/純空白 → 拒絕
- 消息長度 > 5000 字 → 拒絕
- Prompt injection 模式偵測（regex）→ 拒絕
- 用戶級 Rate Limiting（Redis，60 秒 10 條上限）→ 冷卻提示
- Route 層（`conversation.ts`）也有基本 trim + 長度驗證

**Layer 2 — Meta Intent 分類（Haiku 分類，模板回覆）**：`classifier.ts`
- `onboarding`：打招呼、問平台功能 → 歡迎引導
- `chitchat`：閒聊、無關對話 → 友善引導回產品
- `abuse`：亂打字、垃圾訊息 → 簡潔引導
- `unknown` / `clarification_needed` → 範例引導（不再盲入 bdd-spec）

**Layer 3 — Skill Intent（正常流程）**：行為不變
- `bdd-spec` / `deployer` / `uiux` / `domain-*` → 建 task → 執行 Skill

**核心改動**：
- `prefilter.ts`（新建）：`prefilterMessage(message, userId, redis)` 前置過濾
- `classifier.ts`：新增 `MetaIntent` type、`isSkillIntent()` helper、Haiku prompt 擴展、`ruleBasedClassification()` 加入 meta-intent 偵測
- `conversation.ts`：`POST /:id/message` 和 `POST /:id/reply` 加入 trim + 長度驗證
- `orchestrator.ts`：`handleProcessMessage()` 重構執行順序（prefilter → classify → meta/skill 分流），meta-intent 不建 task 直接模板回覆；`handleContinueFlow()` 頂部加 prefilter

### 專案自動命名（2026-02-06）

專案不再用「專案 2/6/2025」這種日期格式命名。Classifier 分類意圖時同步生成語義化專案名稱（如「寵物電商平台」、「健身預約系統」），Orchestrator 收到後自動更新 project name。

**核心改動**：
- `classifier.ts`：`ClassificationResult` 新增 `suggestedProjectName`，Haiku prompt 加入專案命名規則，rule-based fallback 也加入 `deriveProjectName()` 函數
- `orchestrator.ts`：`handleProcessMessage()` Step 3.5 — 分類後自動更新專案名稱（只更新仍為日期格式的名稱，處理名稱衝突）

### Design Tier：功能型 vs 創意型（2026-02-06）

新增 Design Tier 概念，讓 AI 根據產品類型自動推薦「功能型」或「創意型」設計模式，生成函數根據 tier 切換不同約束集。

**功能型（functional）**：dashboard/SaaS/後台，禁止漸層/glow/多色，動畫克制，標準佈局
**創意型（creative）**：landing page/品牌官網/作品集，允許漸層、多色、獨特字體、大膽佈局、豐富動畫

**核心改動**：
- `uiux-generation.ts`：新增 `DesignTier` type + `getCraftFoundations()`（共用品質底線）+ `getStructureConstraints()`/`getAnimationConstraints()`/`getVariantPromptHint()` 約束集函數
- `DesignBrief` 新增 `recommendedTier`/`tierReason`/`domainKeywords`/`signature` 欄位
- 4 個生成函數（`generateDesignVariants`/`generateStructure`/`generateAnimations`/`generateRwd`）新增 `designTier` 參數
- `orchestrator.ts`：FlowState 新增 `uiuxDesignTier`，Design Brief 展示 tier 推薦，調整時可切換 tier
- `generateDesignBrief`：加入 Domain Exploration（產品世界探索）+ Signature Element 概念
- `generateDesignVariants`：加入 Anti-Default 哲學（Swap Test、Infinite Expression）
- `generateStructure`：注入 Professional UI 規則（icon 用 SVG 禁 emoji、cursor-pointer、對比度值、佈局細節）+ WCAG 無障礙基本功（lang 屬性、Skip Link、Heading 層級、aria-live）
- `generateRwd`：注入 Pre-Delivery Checklist（排版/互動/對比度/佈局/效能/無障礙自檢清單）
- Vercel Web Interface Guidelines 精華：禁 transition-all、focus-visible 取代 focus、overscroll-behavior contain、min-w-0、img width/height、touch-action manipulation
- `baseline-ui.md`：新增 Craft Foundations 表格 + 補充禁止清單 + Interaction/Animation/Layout 規則補充

### 修復 generateStructure 缺少產品上下文（2026-02-06）

**問題**：生成的頁面與產品毫無關聯（記帳 app 出現「關於」頁面、像 landing page 不像 app）。

**根因**：
1. `getTemplateAndBddSpec()` 忽略 FlowState 的 `uiuxPreparedTemplate`，fallback 寫死 `['home', 'about']`
2. `generateStructure` 的 userMessage 不含產品描述、用戶設計偏好、Design Brief
3. BDD 規格是後端 API 格式，prompt 沒引導 LLM 推導前端需求

**修復**：
- `executeCodePhaseStructure` 優先使用 `state.uiuxPreparedTemplate`（包含用戶設計偏好 + 正確頁面結構）
- `getTemplateAndBddSpec` fallback 從 `['home', 'about']` 改為 `['home']`，並返回 `originalRequirements`
- `generateStructure` 新增 `productContext` 參數，注入：產品描述、設計偏好（feeling/reference/color/layout）、Design Brief
- **BDD 規格驅動頁面推導**：頁面列表僅作為起始建議，LLM 從 Feature Files 自行推導最終頁面結構（增刪合併重命名皆可），不再硬編頁面規則

### UIUX Skill 全面審計與修復（2026-02-06）

全面檢查 UIUX Skill 的文檔與程式碼一致性，修復 12 項問題：

**Critical/High**：
- **phase routing bug**：`handleContinueFlow` 缺少 `uiux_variant_selection`、`uiux_generating_variants`、`uiux_code_generation`、`uiux_complete` 四個 phase，導致變體選擇和代碼生成確認流程完全斷裂
- **adjustDesignBrief 丟失資料**：brief 調整後 `domainKeywords` 和 `signature` 欄位丟失，LLM 也看不到這些欄位
- **02-design-lab.md 完全過時**：描述的是不存在的本地文件系統工作流，重寫為 WebSocket + variant picker 正確流程
- **03-implementation.md 完全過時**：缺少三階段生成說明、Tailwind v3 語法、Inter 字體範例、弱自檢清單，全部重寫

**Medium**：
- `generateRwd()` 接受 `designTier` 但未使用 — 加入 tier-aware RWD 提示
- `richContent.type` union 缺少 `variant_picker`/`code_preview`，用 `as 'template_picker'` hack — 擴充 type 並移除 hack
- Variant B prompt 只列 Card/List/Table 三種泛型佈局 — 改為 Anti-Default 風格
- `parseGeneratedFiles()` 只處理 `.tsx` — 加入 `.ts` 支援（utility、types）
- Fallback CSS 用 Tailwind v3 語法 — 更新為 `@import "tailwindcss"`
- `generateStructure()` 無障礙規則重複 4 處 — 合併去重
- 缺少 font loading 策略 — 加入 next/font 規則

**Low**：
- `skill.md` Phase 3 流程圖沒有三階段生成 — 更新
- Design Memory 範例用 Inter 字體 — 修正

**第二輪審計（同日）**：
- Font Loading 範例仍用 Inter 字體 — 改為 DM_Sans
- Variants JSON 範例 fontFamily 仍用 Inter — 改為 DM Sans
- Structure prompt 自相矛盾（禁 transition 又指定 transition-colors）— 移到 Animation prompt
- `handleCodePhaseRedo` 重做時沒恢復上一階段代碼 — 加入 `uiuxStructureCode`/`uiuxAnimationCode` 快照機制
- Variant D prompt 列舉 Modal/Inline/Drawer 泛型模式 — 改為 Anti-Default 風格

### UIUX 生成邏輯重構：5 變體選擇 + Design System（2026-02-05）

重構 UIUX 生成邏輯，從「逐個獨立生成」改為「Design System 驅動的統一生成」，確保風格一致性。

**問題**：
| 問題 | 影響 |
|------|------|
| 模板選擇後無處理 | orchestrator 收到選擇訊息沒有後續邏輯 |
| 逐個獨立生成 | 每個組件單獨調用 LLM，風格各自為政 |
| temperature 0.7 太高 | 導致每次生成風格都飄 |
| 沒有 Design System | designDefaults 存在但沒轉換為 CSS variables |

**解決方案**：
1. **5 變體生成**：一次 LLM 調用生成 5 個設計方向（Hierarchy/Layout/Density/Interaction/Expressive）
2. **Design System 驅動**：統一的 CSS variables + Tailwind extend
3. **三階段代碼生成**：拆分成結構→動畫→響應式，每階段可確認或重做
4. **降低 temperature**：UIUX 相關函數從 0.7 改為 0.2

**新的生成流程（三階段）**：
```
BDD Spec 完成
    ↓
詢問：「你有自己的設計想法嗎？」
    ↓
┌─────────────────────────────┬────────────────────────┐
│ A. 有想法                    │ B. 沒想法              │
│    ↓                        │    ↓                   │
│ 設計釐清（4 個問題）         │ 顯示模板選擇器         │
│ - 產品感覺                   │                        │
│ - 參考網站                   │                        │
│ - 顏色偏好                   │                        │
│ - 佈局風格                   │                        │
└─────────────────────────────┴────────────────────────┘
    ↓
Design Brief 確認（AI 設計顧問）
    ↓ 總結設計方向 + 專業建議 + 推薦 Design Tier（functional/creative）
    ↓ 用戶確認或調整（最多 3 輪，可切換 tier）
    ↓
生成 5 變體 → 用戶選擇/合併變體
    ↓
階段 1: generateStructure() - 桌面版結構+互動（HTML 結構、基礎 CSS、完整互動邏輯）
    ↓ 用戶確認
階段 2: generateAnimations() - 動畫增強（入場動畫、hover、狀態轉換）
    ↓ 用戶確認
階段 3: generateRwd() - 響應式設計（移動端適配、漢堡選單）
    ↓
完成
```

**三階段設計優勢**：
- 每次 LLM 調用更專注，品質更高
- 用戶可在每一步確認結果或要求重做
- 減少一次性生成過多內容導致的風格不一致

**新增/修改文件**：
| 文件 | 說明 |
|------|------|
| `tellcraft-backend/src/services/uiux-generation.ts` | **新增** UIUX 生成服務 |
| `tellcraft-backend/src/workers/orchestrator.ts` | 添加模板選擇和變體處理 |
| `tellcraft-backend/src/services/bdd-session.ts` | 添加 UIUX 欄位類型 |
| `tellcraft-backend/src/db/client.ts` | 添加 UIUX 欄位映射 |
| `tellcraft-backend/migrations/add_uiux_columns.sql` | **新增** 資料庫遷移 |
| `app/components/uiux/VariantPicker.tsx` | **新增** 變體選擇組件 |
| `app/components/uiux/CodePreview.tsx` | **新增** 程式碼預覽組件 |
| `app/components/uiux/UiuxChatSection.tsx` | 支援 variant_picker 和 code_preview |
| `app/lib/llm.ts` | 降低 temperature 到 0.2 |

**資料庫遷移**（執行前請確保 DATABASE_URL 已配置）：
```bash
cd tellcraft-backend
psql "$DATABASE_URL" -f migrations/add_uiux_columns.sql
```

**新增欄位**：
- `uiux_template_id` - 用戶選擇的模板
- `design_variants` - 5 個設計變體
- `selected_variant_ids` - 用戶選擇的變體 ID
- `final_design_system` - 最終合併的 Design System
- `generated_pages` / `generated_components` / `generated_styles` - 生成的代碼

**project_files 表**（獨立代碼存儲，支援多 Skill 來源）：
```bash
psql "$DATABASE_URL" -f migrations/004_add_project_files.sql
```

- 每個 Skill 生成的檔案獨立存儲，一檔一行
- `skill_source`: `uiux` / `code` / `merge`（未來 Code Skill 和合併用）
- `file_type`: `page` / `component` / `style` / `config`
- UPSERT on `(project_id, skill_source, file_path)` — 每階段更新同一檔案
- Deployer 優先從 `project_files` 讀取，舊專案 fallback 到 `bdd_sessions`
- API: `GET /api/project/:id/files?skill_source=uiux`

---

### 模板內容編輯功能 + 專案級持久化（2026-02-06）

新增模板編輯模式，讓用戶可以點擊模板中的元素直接修改內容和樣式，並**自動保存到專案**。

**功能**：
- 點擊「編輯模式」按鈕進入編輯狀態
- hover 元素顯示虛線邊框提示可編輯
- 點擊元素顯示藍色實線邊框 + 右側 PropertyEditor
- 支援修改：文字內容、顏色、字體大小、字重、間距、圓角
- 即時預覽修改效果
- **自動保存**：編輯後 1 秒自動保存到後端（debounced）
- **專案級客製化**：每個專案的編輯結果獨立存儲，不影響公共模板

**架構**：
```
用戶編輯 → 即時預覽 → debounce 1s → 保存到 projects.template_overrides
                                            ↓
下次載入 ← 讀取 template_overrides ← 應用到 DOM
```

**數據庫遷移**（需執行）：
```bash
psql "$DATABASE_URL" -f tellcraft-backend/migrations/003_add_template_overrides.sql
```

**新增/修改文件**：
| 文件 | 修改 |
|------|------|
| `003_add_template_overrides.sql` | **新增** projects.template_overrides JSONB 欄位 |
| `tellcraft-backend/src/routes/project.ts` | 添加 GET/PUT /api/project/:id/template-overrides |
| `app/lib/vps-api.ts` | 添加 getTemplateOverrides / saveTemplateOverrides 函數 |
| `PreviewPanel.tsx` | 添加 projectId prop、載入/保存邏輯、保存狀態指示器 |
| `UiuxChatSection.tsx` | 傳遞 projectId 給 PreviewPanel |
| `app/page.tsx` | 傳遞 projectId 給 PreviewPanel |
| `SaasPro.tsx` | 添加 `data-editable` 和 `data-type` 屬性 |
| `SaasMinimal.tsx` | 同上 |
| `LandingStartup.tsx` | 同上 |
| `LandingCorporate.tsx` | 同上 |
| `EcommerceModern.tsx` | 同上 |
| `globals.css` | 編輯模式樣式（hover、選中邊框） |

**數據格式**（projects.template_overrides）：
```json
{
  "hero-title": { "text": "我的標題", "fontSize": "48px", "color": "#ff0000" },
  "hero-cta": { "text": "立即購買", "backgroundColor": "#ff5500" }
}
```

---

### 修復：UIUX variant 選擇後洩漏到 BDD 流程（2026-02-06）

用戶選擇設計變體時（如「我要E」），訊息未被 variant selection regex 匹配，穿透 UIUX 階段 block，洩漏到 `processUserReply`（BDD 流程），導致錯誤進入規格生成。

**修復**：
- `orchestrator.ts`：擴展路由 regex（`我要/我選/選 [A-E]`、單字母、階段兜底）
- `handleVariantSelection`：擴展解析 regex + 最終 fallback 提取
- UIUX 階段 catch-all：未匹配的訊息回傳操作提示，不再洩漏到 BDD

### PreviewPanel 改用 iframe 渲染後端 HTML（2026-02-06）

將 PreviewPanel 從 React 組件直接渲染改回 iframe 模式，但這次是載入後端高品質 HTML（透過 `/api/templates/preview/{slug}` → VPS API）。

**為什麼改回 iframe**：之前用 React 組件渲染，但那些組件是舊的 slate 灰階版本，且與後端重新設計的 HTML 脫節。改用 iframe 直接載入後端 HTML，確保用戶看到的就是最新設計。

**編輯能力保留**：
- 注入編輯橋接腳本（`EDIT_BRIDGE_SCRIPT`），透過 `postMessage` 雙向通訊
- 自動標記可編輯元素（`h1-h6`, `p`, `button`, `a`, `span` 等），無需手動加 `data-editable`
- 編輯結果存為 per-project overrides（只有該用戶看得到，其他人看原版）
- PropertyEditor 側欄不變，支援文字、顏色、字體、間距等屬性編輯

**核心改動**：
- `PreviewPanel.tsx`：移除 `TemplateComponents` / `isSupportedTemplate` 引用，改用 `fetch` + `iframe srcdoc` 渲染
- `app/components/templates/` 目錄現為死代碼（React 模板組件不再被引用）
- 訊息前綴 `tc_` 避免與其他 postMessage 來源衝突
- iframe `key` 不含 device，避免切換裝置時 iframe 重載

### 模板預覽重新設計（2026-02-06）

用 Opus 本地重寫 5 個模板預覽 HTML，遵守 baseline-ui.md 規則。每個模板有獨立色彩系統（CSS 變數）、自訂字型、Signature element、入場動畫、prefers-reduced-motion 支援、Skip Link 和 focus-visible。

| 模板 | Tier | 字型 | 深度策略 | Signature |
|------|------|------|----------|-----------|
| saas-minimal | Functional | IBM Plex Sans | Borders-only | Sparkline 迷你折線圖 + 非對稱 metrics |
| saas-pro | Functional (Dark) | JetBrains Mono + Inter | Subtle shadows | Terminal log viewer + bento grid |
| landing-startup | Creative | Plus Jakarta Sans + Inter | Layered shadows | Diagonal clip-path hero + zigzag features + pricing tilt |
| landing-corporate | Creative (穩重) | Noto Sans TC | Subtle shadows | Counter-up stats + accent underline + overlapping team cards |
| ecommerce-modern | Functional | Inter + Playfair Display | Borders-only | Split 50/50 hero + hover quick-add overlay + masonry grid |

### 模板預覽系統統一為 DB-only（2026-02-16）

移除舊的「預生成」機制（磁碟 HTML 檔 + 前端內嵌 HTML），統一所有模板預覽為 DB `template_previews` 表。

**刪除**：
- `tellcraft-backend/src/data/template-previews/` 目錄（5 個 HTML 檔）
- `tellcraft-backend/src/scripts/init-template-previews.ts` 同步腳本
- 前端 `route.ts` 內嵌 ~560 行 HTML（簡化為純 VPS 代理）
- `package.json` 的 `copy-assets` 和 `init-previews` scripts

**簡化**：
- 後端 preview endpoint 移除磁碟文件檢查，直接查 DB
- Admin list 移除 `has_pregenerated` 欄位，status 只有 `cached` / `none`
- 前端 Admin 頁面移除「預生成」綠色徽章

**現狀**：所有 35 個模板預覽統一存在 `template_previews` 表，透過 Claude Code 生成 SQL 更新。

---

### 修復 LLM Usage 按對話分組顯示「無對話」問題（2026-02-05）

修復 `/dashboard/admin/usage` 頁面按「對話」分組時只顯示一項「無對話」的問題。

**問題根因**：
- `recordLlmUsage()` 函數只有 5 個參數（model, inputTokens, outputTokens, costUsd, purpose）
- INSERT 語句未包含 `user_id` 和 `conversation_id` 欄位
- 所有 LLM 使用記錄的 `user_id` 和 `conversation_id` 都是 NULL

**修復方案**：
| 修改檔案 | 說明 |
|----------|------|
| `tellcraft-backend/src/db/client.ts` | `recordLlmUsage()` 新增 `userId` 和 `conversationId` 可選參數 |
| `tellcraft-backend/src/services/classifier.ts` | 新增 `LlmTrackingContext` interface，`classifyIntent()` 新增 `trackingContext` 參數 |
| `tellcraft-backend/src/services/prd-discovery.ts` | `runPrdDiscovery()` 第二參數改為 `trackingContext` |
| `tellcraft-backend/src/services/formulation.ts` | 所有函數新增 `trackingContext` 參數（`generateSchemaSql`, `identifyFeatures`, `generateSingleFeature`, `fixMultipleFeatures`, `runFormulation`）|
| `tellcraft-backend/src/services/spec-discovery.ts` | `runSpecDiscovery()` 新增 `trackingContext` 參數 |
| `tellcraft-backend/src/workers/orchestrator.ts` | 所有 LLM 服務調用傳入 `{ userId, conversationId }` |

**效果**：新的 LLM 使用記錄會關聯到對話，管理員可以按對話查看 token 消耗。

---

### 專案版本管理功能（2026-02-05）

實現完整的專案版本管理功能，將「專案」從單純的對話容器改造成「可迭代的產品」：

**Phase 1：基礎操作按鈕**

| 功能 | 說明 |
|------|------|
| **繼續對話** | 回到最近未完成的對話，按鈕在有進行中對話時顯示 |
| **新增迭代** | 創建新對話開始新一輪迭代，按鈕在專案已部署/失敗時顯示 |
| **對話卡片可點擊** | 點擊對話記錄可直接跳轉到該對話 |

**Phase 2：版本歷史列表**

| 功能 | 說明 |
|------|------|
| **版本時間線** | 顯示所有版本的時間線，包含狀態、時間、變更摘要 |
| **版本標籤** | 可編輯的版本標籤（如 v1.0.0, MVP 版本等）|
| **版本對比** | 選擇兩個版本進行 Schema 和 Feature Files 差異對比 |

**Phase 3：版本回滾**

| 功能 | 說明 |
|------|------|
| **快照存儲** | 生成成功時自動保存 Schema 和 Features 快照 |
| **回滾操作** | 回滾會創建新版本，不覆蓋現有數據 |
| **確認彈窗** | 回滾前顯示警告，提醒可能影響生產數據 |

**Phase 4：版本對比**

| 功能 | 說明 |
|------|------|
| **Schema Diff** | 顯示 SQL Schema 的行差異（新增/刪除/修改）|
| **Features Diff** | 顯示 Feature Files 的變更（新增/刪除/修改）|
| **語法高亮** | 新增行綠色、刪除行紅色高亮 |

**資料庫變更**（需執行 migration）：
```sql
-- 執行 spec/data/migrations/001_add_version_management.sql
```

**新增檔案**：
- `app/components/dashboard/VersionHistory.tsx` - 版本歷史組件
- `spec/data/migrations/001_add_version_management.sql` - Schema migration

**修改檔案**：
- `app/dashboard/projects/[id]/page.tsx` - 新增操作按鈕和版本歷史區塊
- `tellcraft-backend/src/routes/project.ts` - 新增版本管理 API
- `tellcraft-backend/src/routes/operations.ts` - 生成時保存快照
- `app/lib/vps-api.ts` - 新增版本管理 API 函數
- `spec/data/schema.sql` - 記錄 Schema 變更

---

### 進度條時隱藏 Typing Indicator（2026-02-05）

優化用戶提交需求進入對話模式時的 UI，避免重複顯示：

| 修改項目 | 說明 |
|----------|------|
| **隱藏重複指示器** | 當有進度條顯示時（`init_progress` / `formulation_progress`），隱藏 typing indicator（三個跳動圓點）|
| **平常對話正常顯示** | 非進度訊息時，typing indicator 正常顯示 |

**修改檔案**：
- `app/page.tsx` - typing indicator 條件增加進度訊息檢查

---

### 手機版響應式修復（2026-02-05）

修復手機版 Header 爆版（溢出）問題，並優化為精緻設計：

| 修復項目 | 說明 |
|----------|------|
| **進度膠囊設計** | 圓形進度環 + 當前階段名稱，取代簡陋的小圓點 |
| **返回按鈕精緻化** | 圓角方形背景 + hover 箭頭位移動畫 + 點擊縮放回饋 |
| **漢堡選單動畫** | 三條線條平滑變形為 X，使用 cubic-bezier 彈性曲線 |
| **遮罩層優化** | 背景模糊 + 漸變透明度過渡 |
| **整體風格** | 延續 Swiss Design 極簡感，精煉而非簡化 |

**視覺細節**：
- 進度環使用 SVG stroke-dashoffset 動態填充
- 漢堡線條寬度 1.5px，間距講究
- 按鈕 border-radius 12px 統一圓角
- 陰影層次：hover 時 4px blur → 12px blur

**修改檔案**：
- `app/page.tsx` - 進度膠囊 SVG 進度環設計
- `app/globals.css` - 精緻動畫樣式（cubic-bezier 曲線）
- `app/components/dashboard/DashboardShell.tsx` - 漢堡選單動畫邏輯
- `app/components/dashboard/Sidebar.tsx` - 支援 className prop

---

### 效能優化（2026-01-31）

**第二輪：Server Component 重構**

Dashboard 從 Client Component 改為 Server Component，消除瀑布式載入：

| 變更 | 說明 |
|------|------|
| `dashboard/layout.tsx` | 改為 Server Component，server 端直接查詢用戶資料 |
| `dashboard/page.tsx` | 改為 Server Component，server 端並行查詢所有資料 |
| `DashboardShell.tsx` | 新增 Client Component，處理 Sidebar 和互動 |
| `DashboardContent.tsx` | 新增 Client Component，處理動畫和 UI |

**效果**：原本需要 2 次瀑布式載入（layout → page），現在 server 端一次完成。

---

**第一輪：查詢優化**

| 問題 | 位置 | 修復方式 | 改善 |
|------|------|---------|------|
| Middleware 每次查 DB | `middleware.ts` | is_admin 用 cookie 快取 5 分鐘 | -500ms |
| Admin N+1 查詢 | `admin.ts:listAllUsers` | 批量查詢 user_id → 記憶體計數 | -1.5s |
| 序列 await 迴圈 | `index.ts:migrateAnonymousAccount` | Promise.all 並行處理 | -800ms |
| Layout 瀑布式請求 | `dashboard/layout.tsx` | getCurrentUser 直接返回 isAdmin | -150ms |
| select('*') 計數 | 多處 | 改用 select('id') | -200ms |

### VPS API 遷移（2026-02-05 ✅ 完成）

將 Server Actions 的資料庫操作從直連 VPS PostgreSQL 遷移到 VPS HTTP API：

**架構變更**：
```
Before: Vercel Server Actions ──直連──> VPS PostgreSQL (超時問題)
After:  Vercel Server Actions ──HTTP──> VPS Express API ──> PostgreSQL
```

**遷移結果**：
| 檔案 | 狀態 | 說明 |
|------|------|------|
| `app/actions/admin.ts` | ✅ 完成 | 管理員功能 |
| `app/actions/templates.ts` | ✅ 完成 | 模板操作 |
| `app/actions/index.ts` | ✅ 完成 | 103 → 0 個 db.from() 呼叫 |
| `app/lib/db.ts` | 🗑️ 可刪除 | 不再直連資料庫 |

**已遷移的核心函數**：
- 任務管理：`createTask`, `confirmTaskPlan`, `cancelTask`, `retryTask`
- 會話管理：`initializeSession`, `initializeSessionFromAuth`
- 對話操作：`sendMessageAndTrigger`, `replyToConversation`, `getConversationMessages`
- 專案操作：`createProject`, `getProjectDetail`, `getProjectReminder`, `deployProjectFromDb`
- BDD Session：`createBddSession`, `getBddSession`, `updateBddSession` 等
- 用戶功能：`getUserConversations`, `getUserStats`, `getUserProjects`
- 其他：`registerSkill`, `configureWebhook`, `exportData`, `transferResources`

**新增的 VPS 路由**：
- `/api/bdd/*` - BDD Session API（10+ 端點）
- `/api/operations/*` - 綜合操作 API（任務、生成、部署、對話等）
- `/api/session/*` - 會話初始化 API

**新增的 vps-api.ts 函數**：
- `createTaskFull`, `confirmTaskPlan`, `cancelTask`, `retryTask`
- `getConversationMessagesWithTask`, `replyToConversation`
- `getProjectReminder`, `updateProjectStatus`

---

### 多輪 PRD Discovery（2026-02-04 重構）

實現動態多輪釐清，根據用戶回答動態調整後續問題：

```
Round 1: runPrdDiscovery(需求描述, existingItems=[])
    ↓ LLM 使用 A1-D2 檢查清單分析
    ↓ 生成 3-5 個釐清問題
    ↓ 用戶回答 → 每 5 題確認一次
    ↓
Round 2: runPrdDiscovery(需求描述, existingItems=[已回答的問題])
    ↓ LLM 根據已有答案，邏輯推論排除不相關問題
    ↓ 生成 0-5 個追問（不重複、動態調整）
    ↓
Round 3: 如果還有新問題，最後一輪
    ↓
進入 Formulation（無論是否達到輪數上限）
```

**終止條件**（滿足任一即停止）：

| 條件 | 設定值 | 說明 |
|------|--------|------|
| 最大輪數 | 3 輪 | 絕對封頂，避免無限問答 |
| 累計問題數 | 15 題 | 避免問太多讓用戶疲勞 |
| LLM 返回 0 題 | - | 需求已足夠清楚 |
| 用戶輸入「完成釐清」| - | 主動結束 |

**三層去重機制**（2026-02-14 新增）：

| 層級 | 實現 | 成本 | Fallback |
|------|------|------|----------|
| L1 Bug Fix | `existingItems` 現在包含 `resolvedItems` + `clarifyItems`（待答），修復舊版只傳 resolved 的漏洞 | 0 | - |
| L2 Decision Summary | `generateDecisionSummary()` 用 Haiku 將已答 Q&A 壓縮為結構化主題摘要，注入 PRD Discovery prompt 最前方 | ~$0.003/輪 | 返回 null，不注入 |
| L3 Post-generation Dedup | `deduplicateQuestions()` 用 Haiku 對新生成問題做語意去重，過濾與既有問題重複的 | ~$0.001/輪 | 返回原始問題 |

- 相關檔案：`clarify-dedup.ts`（L2+L3）、`prd-discovery.ts`（L2 注入）、`orchestrator.ts`（調用整合）
- 每輪額外成本 ~$0.004（vs Sonnet ~$0.05/輪，忽略不計）
- 三層全部降級安全：任一失敗退化為修復前的行為

---

### Server Actions DB 遷移（2026-02-04 Stage 1-3 部分完成）

**Stage 1：Admin Server Actions 完全遷移至 VPS API** ✅

`app/actions/admin.ts` 不再直連 VPS PostgreSQL，改為呼叫 VPS HTTP API：

| 變更項目 | 說明 |
|----------|------|
| `app/actions/admin.ts` | 移除 `import { db }`，改用 `vps-api.ts` 函數 |
| `app/lib/auth.ts` | 新增 `getAuthToken()` 函數取得 JWT Token |
| `app/lib/vps-api.ts` | 新增 `listAllProjects`, `listAllConversations` |
| `tellcraft-backend/src/routes/dashboard.ts` | 新增 `GET /api/dashboard/admin/projects`, `GET /api/dashboard/admin/conversations`, `GET /api/dashboard/admin/conversations/:id/messages` |

**Stage 2-3：User 和 Project 函數部分遷移** 🔄

| 變更項目 | 說明 |
|----------|------|
| `tellcraft-backend/src/routes/user.ts` | 新增 User API（`GET /api/user/me`, `POST /api/user/migrate`）|
| `app/lib/vps-api.ts` | 新增 `getCurrentUserFromVps`, `migrateAnonymousAccount`, `updateProject` |
| `app/actions/index.ts` | 遷移 4 個函數：`getCurrentUserAction`, `migrateAnonymousAccount`, `getUserStats`, `getUserProjects` |

**已遷移函數對應**：
- `getAdminStats()` → `vpsApi.getAdminStats()` ✅
- `listAllUsers()` → `vpsApi.listAllUsers()` ✅
- `listAllProjects()` → `vpsApi.listAllProjects()` ✅
- `listAllConversations()` → `vpsApi.listAllConversations()` ✅
- `getUserDetail()` → `vpsApi.getUserDetail()` ✅
- `getLLMUsageStats()` → `vpsApi.getLLMUsageStats()` ✅
- `getAuditLogs()` → `vpsApi.getAuditLogs()` ✅
- `setUserAdmin()` → `vpsApi.setUserAdmin()` ✅
- `getCurrentUserAction()` → `vpsApi.getCurrentUserFromVps()` ✅
- `migrateAnonymousAccount()` → `vpsApi.migrateAnonymousAccount()` ✅
- `getUserStats()` → `vpsApi.getDashboardStats()` ✅
- `getUserProjects()` → `vpsApi.getProjects()` ✅

**待遷移（Stage 4-5）**：
- `app/actions/index.ts` 仍有 ~100 處 db 調用（專案操作、對話操作、BDD Session 等）
- `app/actions/templates.ts`（模板相關）
- `app/actions/storage.ts`（儲存相關）

---

### VPS API 遷移（2026-02-04）

**修復 Vercel 無法連接 VPS PostgreSQL**：

問題：Vercel Serverless 無法連接 VPS 的 PostgreSQL（`listen_addresses = 'localhost'`），導致所有使用 `db` 的 Server Actions 超時。

解決方案：將前端核心功能遷移到 VPS HTTP API，通過 API 而非直連資料庫：

| 新增/修改 | 說明 |
|----------|------|
| `tellcraft-backend/src/routes/session.ts` | 新增 Session API（初始化會話、對話列表、專案提醒）|
| `tellcraft-backend/src/routes/dashboard.ts` | 新增 Dashboard API（用戶統計、管理員統計、LLM 用量）|
| `app/lib/vps-api.ts` | 新增 `initializeSession`, `getUserConversations`, `getProjectReminder`, `getDashboardStats`, `getAdminStats`, `getLLMUsageStats` |
| `app/page.tsx` | 從 Server Actions 改用 VPS API（`vpsInitializeSession`, `vpsGetConversationMessages`, `vpsReplyToConversation`, `vpsSendMessage`）|
| `app/dashboard/page.tsx` | 改用 `getDashboardStats` VPS API |
| `app/dashboard/admin/page.tsx` | 改用 `getAdminStats` VPS API |
| `app/dashboard/admin/usage/page.tsx` | 改用 `getLLMUsageStats` VPS API |

**修復 Admin Usage 頁面 React Error #300**：

| 修復項目 | 描述 |
|----------|------|
| **問題根因** | React Error #300 "Rendered fewer hooks than expected" - SSR/客戶端 hydration 不一致 |
| **Chart.tsx** | `LineChart` 中 `if (data.length === 0) return null` 改為渲染空 SVG，避免 hooks 數量變化 |
| **DateRangePicker.tsx** | `defaultPresets` 從模塊級別移到 `useMemo` 中，確保日期在客戶端計算 |
| **usage/page.tsx** | `dateRange` 初始值改用函數初始化 `useState(getDefaultDateRange)`，避免 SSR/客戶端不一致 |

**清理過時腳本**：
- 刪除 `scripts/create-uiux-test.ts`（使用已移除的 inngest）
- 刪除 `scripts/skip-to-uiux.ts`（使用已移除的 inngest）

---

### 修復記錄（2026-02-01）

**修復 BDD-Spec Formulation 階段決策丟失問題**：

| 修復項目 | 描述 |
|----------|------|
| **問題根因** | `fixMultipleFeatures` 在修復 Feature Files 格式時沒有接收用戶的釐清決策，導致 AI 修復時可能產出違反用戶回答的規格 |
| **修改函數簽名** | `fixMultipleFeatures` 新增 `resolvedItems: ClarifyItem[]` 參數 |
| **修改 prompt** | 將用戶的釐清決策（Q/A）加入 userMessage，並在 systemPrompt 強調「必須嚴格遵守用戶決策」|
| **更新調用點** | orchestrator.ts 調用時傳入 `session.data?.resolvedItems || []` |

**影響範圍**：
- `app/lib/llm.ts`：`fixMultipleFeatures` 函數
- `tellcraft-backend/src/workers/orchestrator.ts`：調用點

---

**修復 Feature Files 生成被截斷問題**：

| 修復項目 | 描述 |
|----------|------|
| **分批生成** | 從一次生成所有 Features 改為逐個生成，避免超過 max_tokens 限制 |
| **兩階段流程** | Step 1: `identifyFeatures` 列出所有功能名稱；Step 2: `generateSingleFeature` 逐個生成 |
| **跨 Feature 一致性** | 每個 Feature 生成時傳入已生成 Features 的輸入/輸出摘要，確保接口命名一致 |
| **容錯處理** | 單個 Feature 生成失敗不會中斷整個流程，繼續生成其他 Features |
| **進度顯示** | 顯示當前生成的 Feature 名稱（產出功能規格 2/8: 建立訂單）|

**跨 Feature 一致性機制**：
```
生成 Feature 1: 建立訂單
    → 提取摘要: inputs=userId,items / outputs=orderId,totalAmount

生成 Feature 2: 查詢訂單
    → 告訴 LLM: "建立訂單 輸出 orderId，請使用相同命名"
    → 提取摘要: inputs=orderId / outputs=order details

生成 Feature 3: 取消訂單
    → 告訴 LLM: "建立訂單 輸出 orderId，查詢訂單 輸入 orderId..."
```

**問題根因**：Claude Sonnet 4.6 max output 是 8192 tokens，一次生成所有 Features 會被截斷導致 JSON 解析失敗。

---

**修復 Spec Clarify 無限循環問題（保持全面釐清）**：

| 修復項目 | 描述 |
|----------|------|
| **語意去重驅動** | 每輪結束都做 re-discovery，但經過 `filterDuplicateQuestions` 語意去重 |
| **自然終止** | 去重後沒有新問題 → 才結束。確保全面釐清不遺漏 |
| **極端保險** | 最多 10 輪（正常情況語意去重會讓它自然結束，這只是防萬一）|
| **進度顯示** | 動態顯示輪數和進度（規格釐清第 2 輪 3/5）|
| **修復 step name** | 舊邏輯 step name 重複導致返回緩存結果，新邏輯每輪 step name 唯一 |

**核心改變**：
- 舊邏輯：`consecutiveEmptyRounds < 2`（每次發現新問題就重置，導致無限循環問類似問題）
- 新邏輯：每輪做 re-discovery + 語意去重。去重後有新問題才繼續，沒有就結束

### 先前修復（2026-01-31）

修復 BDD Spec Skill 的多項問題：

| 修復項目 | 描述 |
|----------|------|
| **Phase 3 Spec Clarify** | 實現完整迭代釐清循環，不再跳過 |
| **真實驗證腳本** | 使用 `validateFeatureContent()` 函數驗證 Feature 格式 |
| **自癒機制** | 修復後真正重新驗證，不再假設通過 |
| **反悔機制** | 「修改 N」指令調用 `revertAnswer` 將項目移回待處理 |

### Token 優化（2026-01-31）

優化 LLM Token 使用效率：

| 優化項目 | 節省估算 | 說明 |
|----------|----------|------|
| **批量 Feature 修復** | ~2500-5000 tokens/次 | 原本逐個 Feature 調用 LLM，改為一次批量修復 |
| **語意去重過濾** | 節省重複問答 token | Discovery 後用 Haiku 過濾語意重複問題，避免浪費 token 問相同問題 |
| **刪除死代碼** | 維護成本 | 移除 `processAnswer`、`translateToWhiteText`、`generateSpecSummary` |

**LLM 函數變更**（`app/lib/llm.ts`）：
- ✅ 新增 `fixMultipleFeatures()` - 一次 LLM 調用批量修復多個 Feature
- ✅ 新增 `filterDuplicateQuestions()` - 用 Haiku 判斷語意相似度過濾重複問題
- ❌ 刪除 `processAnswer()` - 未使用
- ❌ 刪除 `translateToWhiteText()` - 未使用
- ❌ 刪除 `generateSpecSummary()` - 未使用

**現有 LLM 函數**：
- `validateFeatureContent()` - 驗證單個 Feature 內容（本地 Regex，不調用 LLM）
- `validateMultipleFeatures()` - 批量驗證多個 Feature（本地 Regex，不調用 LLM）

### UX 改進（2026-01-31）

| 改進項目 | 說明 |
|----------|------|
| **完成訊息措辭** | 不再要求用戶輸入「生成程式碼」，改為直接確認「這樣對嗎？」|
| **Markdown 渲染** | 聊天介面支援 Markdown 格式美化（表格、粗體、列表等）|
| **釐清摘要格式化** | 決策記錄分段顯示，每題用分隔線隔開，Q/A 用粗體標記 |
| **問題格式簡化** | 釐清問題只顯示問題和選項，移除進度/優先級/定位等冗餘資訊 |
| **自動恢復對話** | 重開網頁時自動恢復最近對話，無需手動選擇 |
| **問題去重** | `addClarifyItems` 加入正規化去重，避免語意相似問題重複出現 |
| **語意去重** | Discovery 後用 Claude Haiku 過濾語意重複問題（`filterDuplicateQuestions`）|
| **確認檢查點格式** | 改用列表格式，完整顯示問題和答案（含選項描述）|

**新增套件**：
- `react-markdown` - Markdown 渲染
- `remark-gfm` - GitHub Flavored Markdown（表格、刪除線等）

**新增 LLM 函數**：
- `generateClarifySummary()` - 生成格式化的釐清摘要（資料模型、功能規格、決策記錄）

**驗證規則**：
- E001: 缺少 Action 註解
- E002: 缺少 Summary 註解
- E003: 缺少 Feature 宣告
- E004: Summary 與 Feature 名稱不一致
- E005: Rule 缺少前置/後置標註
- E006: When 步驟格式錯誤（應為 `{summary}, call table:`）
- E007: Then 步驟格式錯誤
- E008: 沒有 Example

### 認證系統（VPS 自建 OAuth）

支援 Google 和 LINE OAuth 登入，使用 VPS 自建 JWT 認證（已從 Supabase Auth 遷移）：

```
登入頁 → Vercel Proxy → VPS OAuth → JWT Token → localStorage → useAuth Hook
```

**架構**：
- `app/hooks/useAuth.ts` - Client-side JWT auth hook
- `app/auth/login/page.tsx` - 登入頁面
- `app/auth/callback/page.tsx` - JWT token 處理
- `app/api/auth/google/` - Google OAuth Vercel proxy
- `app/api/auth/line/` - LINE OAuth Vercel proxy
- `app/api/auth/me/route.ts` - 驗證 token proxy
- `tellcraft-backend/src/routes/auth.ts` - VPS OAuth 處理

**OAuth 流程**（以 Google 為例）：
```
1. 用戶點擊「Google 登入」
2. → Vercel /api/auth/google（proxy）
3. → VPS /auth/google（設定 callbackHost）
4. → Google OAuth 授權頁
5. → Vercel /api/auth/google/callback（接收 code）
6. → VPS /auth/google/exchange（用 code 換 JWT）
7. → Vercel /auth/callback（存 token 到 localStorage）
8. → 首頁（useAuth hook 驗證 token）
```

**為什麼用 Vercel Proxy**：
- Google OAuth 不允許 IP 地址作為 callback URI
- HTTPS → HTTP (Mixed Content) 被瀏覽器阻擋
- Vercel proxy 解決這兩個問題

**環境變數**：
```bash
# Vercel 前端
VPS_API_URL=http://54.238.4.117:8080

# VPS 後端
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
LINE_CHANNEL_ID=xxx
LINE_CHANNEL_SECRET=xxx
JWT_SECRET=your-secret-key
```

**Google Cloud Console 配置**：
1. APIs & Services > Credentials > OAuth 2.0 Client IDs
2. Authorized redirect URIs 添加：`https://tellcraft.com/api/auth/google/callback`

**LINE Developers Console 配置**：
1. Channel > LINE Login Settings
2. Callback URL 添加：`https://tellcraft.com/api/auth/line/callback`

**已修復問題（2026-02-03）**：
- **Header 登入後不更新**：`/auth/callback` 使用 `router.replace()` 客戶端導航，不會觸發頁面重新載入，導致 `useAuth` hook 無法讀取新存的 token。修復：改用 `window.location.href` 強制頁面重新載入。

**已修復問題（2026-02-23）**：
- **設為管理員後看不到管理選單**：JWT token 在登入時嵌入 `isAdmin`，管理員透過 admin panel 修改其他用戶的 `is_admin` 後，該用戶的 JWT 仍是舊的。修復：`/api/auth/me` 偵測 DB 與 JWT 的 admin 狀態差異，自動返回刷新的 token；`useAuth()` 收到後更新 localStorage + cookie；`DashboardShell` 用 `useAuth()` 即時覆蓋 server 端 JWT 解析的靜態值。
- **Dashboard 要求重新登入**：middleware 和 Server Components 無法讀取 localStorage。修復：登入時同時設置 httpOnly cookie，middleware 和 layout 改用 cookie 驗證。

**認證雙軌機制**：
| 儲存位置 | 用途 |
|----------|------|
| localStorage (`auth_token`) | 客戶端 `useAuth` hook 使用 |
| Cookie (`auth_token`) | Middleware + Server Components 使用 |

### 前端 Chat 串接 VPS Backend

用戶在首頁輸入需求後，真正觸發 `bdd-spec` skill，實現完整的多輪對話流程：

```
用戶輸入 → initializeSession（匿名用戶）
    → sendMessageAndTrigger → VPS API
    → BullMQ Orchestrator → bdd-spec skill
    → AI 回覆寫入 DB → WebSocket 推送
    → 用戶回覆 → replyToConversation → 恢復流程
```

**專案創建邏輯**（2026-01-31 修復）：

| 最近專案狀態 | 行為 |
|-------------|------|
| `draft` / `generating` | 複用現有專案（進行中的工作可繼續）|
| `deployed` / `testing` / `failed` | 創建新專案（已完成的不覆蓋）|
| 無專案 | 創建新專案 |

**對話恢復邏輯**（2026-01-31 修復）：

| 情況 | 行為 |
|------|------|
| 有未完成對話（`spec_complete=false`）| 自動恢復最近的未完成對話 |
| 只有已完成對話 | 創建新對話 |
| 無對話 | 創建新對話 |

這樣確保用戶重新整理頁面時，能自動恢復未完成的對話。

**專案提醒橫幅**（2026-01-31 新增）：

用戶回到首頁時，顯示提醒橫幅：

| 情況 | 提醒類型 | 顏色 | 訊息 |
|------|----------|------|------|
| 有 draft/generating 專案 + 未完成對話 | `in_progress` | 藍色 | 「你有一個專案正在進行中，點擊繼續」|
| 專案 deployed（24h 內）| `completed` | 綠色 | 「你的專案已上線！點擊查看」|
| 專案 failed（24h 內）| `failed` | 紅色 | 「你的專案生成失敗，點擊重試」|

- 使用 `sessionStorage` 記錄關閉狀態（關閉瀏覽器後重置）
- 支援匿名用戶和已登入用戶

**Chat 相關 Server Actions**：
- `initializeSession` - 創建或獲取匿名用戶的會話（訪客模式，支援恢復指定對話）
- `initializeSessionFromAuth` - 從認證 session 初始化（已登入用戶，支援帳號合併）
- `sendMessageAndTrigger` - 發送消息並觸發 VPS 處理
- `replyToConversation` - 多輪對話時用戶回覆
- `getConversationMessages` - 獲取對話消息（用於輪詢）
- `getUserConversations` - 獲取用戶所有對話列表（用於歷史對話選擇器）
- `migrateAnonymousAccount` - 遷移匿名帳號資料到認證帳號
- `getCurrentUser` - 取得當前認證用戶
- `signOut` - 登出

### 訪客體驗改善

實現訪客對話持久化和帳號合併功能：

**功能特點**：
1. **對話恢復** - 訪客關閉瀏覽器後重新訪問，可選擇繼續之前的對話或開始新對話
2. **Cookie 備份** - 防止 localStorage 被清除時遺失 anonymousId
3. **帳號合併** - 訪客登入後自動將專案和對話遷移到認證帳號
4. **登入提示** - 在適當時機（對話 3 輪後、生成中、部署成功後）提示登入

**相關檔案**：
- `app/api/session/route.ts` - Cookie 備份 anonymousId
- `app/components/ConversationPicker.tsx` - 歷史對話選擇器
- `app/components/LoginPrompt.tsx` - 登入提示（subtle/emphasized 兩種版本）
- `app/auth/post-login/page.tsx` - 登入後帳號合併處理

**流程**：
```
訪客流程：
訪客創建對話 → 關閉瀏覽器 → 重新訪問
    → 顯示對話選擇器 → 「繼續之前的對話」或「開始新對話」

帳號合併流程：
訪客創建專案 → 點擊登入 → OAuth → post-login 頁面
    → migrateAnonymousAccount → 專案/對話遷移 → 跳轉首頁
```

**登入提示觸發時機**：
| 時機 | 版本 | 文案 |
|------|------|------|
| 對話 3 輪後 | subtle（頂部橫幅）| 登入後可隨時恢復這個對話 |
| 生成程式碼中 | subtle | 登入後可在任何裝置查看生成進度 |
| 部署成功後 | emphasized（彈窗）| 你的網站已上線，登入以管理和更新 |

**拒絕後 24 小時內不再提示**

### 儀表板系統

完整的用戶和管理員儀表板系統：

**用戶儀表板**（`/dashboard`）：
- 個人統計（專案數、對話數、部署數、訊息配額）
- 我的專案列表（搜尋、篩選、分頁）
- 專案詳情（對話歷史、部署記錄、生成記錄）
- 對話列表（按時間排序）

**管理員儀表板**（`/dashboard/admin`）：
- 平台總覽統計（用戶、專案、對話、部署、7 天活躍用戶）
- 用戶管理（列表、搜尋、排序、設定管理員權限）
- 用戶詳情（專案、對話、LLM 成本）
- LLM 用量統計（按日/週/月/模型/對話分組、成本追蹤，預設查詢最近 30 天）
- 審計日誌（操作記錄、篩選）

**Supabase 流量優化**（2025-01）：
- 輪詢機制：智慧退避（3-15秒），有新消息重置為 3 秒
- 輪詢停止：對話完成（spec_complete）後自動停止輪詢
- `getConversationMessages`：先檢查 `updated_at`，無更新時跳過載入 messages
- `getProjectDetail`：並行查詢對話、部署、生成記錄（3 次串行 → 1 次並行）
- `getAdminStats`：使用 `select('id')` 取代 `select('*')` 減少流量
- `getUserStats`：合併重複查詢，並行執行減少往返
- `getUserConversations`：使用 JOIN 減少 2 次查詢為 1 次
- `listAllConversations`：使用 JOIN 減少 3 次查詢為 1 次
- `listAllUsers`：並行計數查詢取代返回所有 projects
- `getLLMUsageStats`：預設只查詢最近 30 天
- Admin Users 頁面：搜尋 debounce（300ms）
- Admin Usage 頁面：圖表數據使用 useMemo 快取

**建議的資料庫索引**（在 Supabase SQL Editor 執行）：
```sql
-- 加速 conversations 查詢
CREATE INDEX IF NOT EXISTS idx_conversations_project_updated
  ON conversations(project_id, updated_at DESC);

-- 加速用戶統計
CREATE INDEX IF NOT EXISTS idx_projects_user_id
  ON projects(user_id);

CREATE INDEX IF NOT EXISTS idx_deployments_project_status
  ON deployments(project_id, status);

-- 加速 LLM 使用查詢
CREATE INDEX IF NOT EXISTS idx_llm_usage_created
  ON llm_usage(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_llm_usage_user_created
  ON llm_usage(user_id, created_at DESC);
```

**路由結構**：
```
/dashboard                    # 用戶首頁
/dashboard/projects           # 我的專案
/dashboard/projects/[id]      # 專案詳情
/dashboard/conversations      # 我的對話
/dashboard/admin              # 管理員總覽（需 is_admin）
/dashboard/admin/users        # 用戶管理
/dashboard/admin/users/[id]   # 用戶詳情
/dashboard/admin/usage        # LLM 用量統計
/dashboard/admin/logs         # 審計日誌
/dashboard/admin/conversations/[id]  # 對話檢視器（唯讀，從用戶詳情進入）
```

**權限控制**：
- Middleware 攔截未登入訪問 `/dashboard`
- Middleware 攔截非管理員訪問 `/dashboard/admin`
- Server Actions 使用 `requireAdmin()` 二次驗證

**資料庫變更**：
```sql
-- users 表新增欄位
is_admin BOOLEAN DEFAULT FALSE

-- 新增審計日誌表
CREATE TABLE audit_logs (
  id, user_id, action, entity_type, entity_id, metadata, created_at
)

-- 新增 LLM 用量追蹤表
CREATE TABLE llm_usage (
  id, user_id, conversation_id, model, input_tokens, output_tokens, cost_usd, purpose, created_at
)

-- 管理員 RLS 策略（可查看所有資料）
```

**新增 Server Actions**：
- 管理員 Actions（`app/actions/admin.ts`）：
  - `getAdminStats` - 總覽統計
  - `listAllUsers` - 用戶列表（分頁、搜尋、排序）
  - `listAllProjects` - 專案列表
  - `listAllConversations` - 對話列表
  - `getUserDetail` - 用戶詳情
  - `getLLMUsageStats` - LLM 用量統計
  - `getAuditLogs` - 審計日誌查詢
  - `setUserAdmin` - 設定管理員權限
  - `logAuditEvent` - 記錄審計日誌
- 用戶 Actions（`app/actions/index.ts` 新增）：
  - `getUserStats` - 個人統計
  - `getUserProjects` - 我的專案列表
  - `getProjectDetail` - 專案詳情

**UI 元件**（`app/components/dashboard/`）：
- `Sidebar.tsx` - 側邊導航（根據 is_admin 顯示管理選項）
- `StatsCard.tsx` - 統計卡片（數字 + 趨勢）
- `DataTable.tsx` - 資料表格（分頁、排序、搜尋）
- `Chart.tsx` - 圖表元件（BarChart、LineChart、ProgressBar、DonutChart）
- `DateRangePicker.tsx` - 日期範圍選擇器

## VPS 後端遷移（2026-02-03）

### 遷移原因

| 當前問題 | 原因 | 遷移後 |
|----------|------|--------|
| 事件驅動卡住 | 事件機制複雜，狀態難追蹤 | BullMQ 直接控制，可隨時檢查 |
| Vercel Serverless 超時 | 10-60 秒限制 | VPS 無限制 |
| Supabase 延遲 | 跨區域網路延遲 50-150ms | 本地 PostgreSQL < 1ms |
| RLS 黑箱 | Supabase RLS 難調試 | 自己寫，完全控制 |

### VPS 後端架構

```
┌─────────────────┐         ┌─────────────────────────────────────┐
│  Vercel (前端)   │────────>│  VPS (54.238.4.117:8080)           │
│  tellcraft.com  │  HTTP   │                                     │
└─────────────────┘         │  ┌─────────────────────────────────┐ │
                            │  │  Nginx (Port 8080)              │ │
                            │  │  → localhost:3100               │ │
                            │  └─────────────────────────────────┘ │
                            │              ↓                       │
                            │  ┌─────────────────────────────────┐ │
                            │  │  Tellcraft Backend (3100)       │ │
                            │  │  - Express API                   │ │
                            │  │  - BullMQ Worker                 │ │
                            │  │  - Socket.io WebSocket           │ │
                            │  └─────────────────────────────────┘ │
                            │              ↓                       │
                            │  ┌───────────┐  ┌─────────────────┐ │
                            │  │ PostgreSQL│  │ Redis (6379)    │ │
                            │  │ (5432)    │  │                 │ │
                            │  └───────────┘  └─────────────────┘ │
                            └─────────────────────────────────────┘
```

### 後端專案結構

```
tellcraft-backend/
├── src/
│   ├── index.ts           # Express + WebSocket + BullMQ 入口
│   ├── routes/            # API 路由
│   │   ├── conversation.ts
│   │   ├── project.ts
│   │   └── health.ts
│   ├── types/             # 共用型別
│   │   └── flow-state.ts  # FlowState 介面 + IterationHistoryEntry
│   ├── workers/           # BullMQ Workers
│   │   ├── orchestrator.ts
│   │   └── orchestrator-utils.ts  # 共用基礎設施（sendMessage/saveFlowState 等）
│   ├── services/          # 業務邏輯
│   │   ├── prefilter.ts   # 前置過濾（零 LLM 成本防禦）
│   │   ├── classifier.ts  # 意圖分類（含 Meta Intent）
│   │   ├── registry.ts
│   │   ├── iteration-skill.ts  # 迭代修改 + 撤銷 + 回滾
│   │   └── bdd-session.ts
│   ├── middleware/        # 中間件
│   │   └── auth.ts
│   └── db/                # 資料庫
│       └── client.ts
├── nginx/                 # Nginx 配置
│   └── tellcraft.conf
├── package.json
├── ecosystem.config.js    # PM2 配置
└── .env.example
```

### BullMQ 任務模式

| 功能 | 實現方式 |
|------|----------|
| 執行步驟 | 直接執行 `await fn()` |
| 等待用戶回覆 | Redis 狀態 + 新 Job |
| 延遲執行 | `await delay(ms)` |
| 自動重試 | `attempts: 3` 配置 |
| 觸發任務 | `queue.add()` |

### 前端 API 切換

新增文件：
- `app/lib/vps-api.ts` - VPS API 客戶端
- `app/hooks/useVpsWebSocket.ts` - WebSocket Hook

環境變數：
```bash
# Vercel 前端（Production）
VPS_API_URL=http://54.238.4.117:8080
NEXT_PUBLIC_VPS_API_URL=http://54.238.4.117:8080
NEXT_PUBLIC_VPS_WS_URL=http://54.238.4.117:8080
```

### VPS 部署步驟

**首次設定**（已完成）：
```bash
# 1. SSH 到 VPS
ssh -i ~/Desktop/LightsailDefaultKey-ap-northeast-1.pem ubuntu@54.238.4.117

# 2. Clone repo（使用 SSH key）
git clone git@github.com:Eric920418/tellcraft.git ~/tellcraft-repo

# 3. 配置環境變數
cp ~/tellcraft-repo/tellcraft-backend/.env.example ~/tellcraft-repo/tellcraft-backend/.env
# 編輯 .env

# 4. 安裝依賴並 build
cd ~/tellcraft-repo/tellcraft-backend
pnpm install && pnpm build

# 5. 配置 Nginx
sudo cp nginx/tellcraft.conf /etc/nginx/sites-available/tellcraft
sudo ln -s /etc/nginx/sites-available/tellcraft /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. 啟動服務
pm2 start ecosystem.config.js
pm2 save
```

**日常部署**（一行搞定）：
```bash
# 本地推送後，SSH 到 VPS 執行：
~/deploy.sh

# 或從本地直接執行：
ssh -i ~/Desktop/LightsailDefaultKey-ap-northeast-1.pem ubuntu@54.238.4.117 '~/deploy.sh'
```

**deploy.sh 內容**：
```bash
#!/bin/bash
set -e
cd ~/tellcraft-repo && git pull origin main
cd tellcraft-backend && pnpm install && pnpm build
pm2 restart tellcraft-backend
curl -s http://localhost:8080/health
```

### 驗證步驟

```bash
# 健康檢查
curl http://54.238.4.117:8080/health
# 預期: {"status":"ok","timestamp":"...","services":{"database":"connected","redis":"connected"}}

# WebSocket 測試（瀏覽器 console）
const socket = io('http://54.238.4.117:8080')
socket.on('connect', () => console.log('Connected!'))
```

---

## 技術棧

| 服務 | 用途 | 狀態 |
|------|------|------|
| Next.js 16 | Server Actions + Turbopack | ✅ |
| React 19.2 | UI 框架 | ✅ |
| Framer Motion | 動畫效果 | ✅ |
| next-themes | 深色/淺色模式 | ✅ |
| @supabase/ssr | SSR 認證 | ✅ |
| **VPS Backend** | Express + BullMQ + Socket.io | ✅ |
| sdd.os | 規格驅動開發、TDD 迭代 | ⏳ 待整合 |
| Supabase | Auth（JWT 驗證）| ✅ |
| PostgreSQL | 資料庫（VPS 本地）| ✅ |
| Redis | BullMQ 隊列 + 狀態管理 | ✅ |
| Vercel | 前端部署 | ✅ |
| Cloudflare | DNS 託管 | ✅ |
| Porkbun | 網域購買 | ⏳ Mock |

## 首頁設計

極簡風格的互動式首頁，兩種使用路徑：

### 路徑 A：直接輸入
```
Hero 輸入框 → 輸入需求 → 平滑過渡至聊天模式 → 對話開發流程
```

### 路徑 B：了解產品
```
Hero → 往下滾動 → 產品介紹（SEO 友好）→ Testimonials → CTA
```

### 動態效果（reactbits 風格）
- `AnimatedThemeToggler` - 左上角深色/淺色模式切換器（支援 system 預設）
- `TextType` - 主視覺標題打字機效果
- `SplitText` (GSAP) - 文字逐字淡入 + 模糊消散
- `RotatingText` - 使用場景標題輪播動畫
- `GlareHover` - 卡片 hover 光澤掃過效果
- `CardSwap` (GSAP) - 3D 卡片堆疊輪播動畫
- `BlurRevealText` - 滾動觸發的模糊揭示動畫
- `AnimatedCounter` - 數字滾動計數器
- `ScrollIndicator` - 呼吸式向下滾動提示
- FAQ 手風琴展開動畫

### SEO 內容區塊
| 區塊 | SEO 價值 | 內容 |
|------|----------|------|
| Use Cases | 長尾關鍵字 | 4 種使用場景（新創/電商/接案/中小企業）|
| How It Works | 流程說明 | 5 步驟完整開發流程 |
| Stats | 信任指標 | 4 項關鍵數據 |
| Comparison | 比較表格 | 傳統開發 vs Tellcraft 6 項對比 |
| FAQ | Google 精選摘要 | 8 個常見問題（手風琴式）|
| Testimonials | 社會證明 | 3 則用戶評價輪播 |
| Footer | 網站結構 | 完整導航連結 |
- 訊息氣泡進場動畫、打字指示器脈衝動畫

## 規格產出

| 產出 | 路徑 |
|------|------|
| SQL Schema | `spec/data/schema.sql` |
| Entity Mapping | `spec/data/entity_to_table_mapping.yml` |
| Feature Files (14) | `spec/features/*.feature` |
| Actions 定義 | `spec/actions/actions.yml` |
| ISA 配置 | `isa_codegen.yml` |

### Feature Files 清單

#### 核心功能（8 個）

| Feature | Server Action | 關聯決議 |
|---------|---------------|----------|
| 建立專案 | createProject | - |
| 發送訊息 | sendMessage | #7 對話計費 |
| 生成程式碼 | generateCode | #4 自癒機制 |
| 部署專案 | deployProject | #5 備用 Org |
| 迭代修改 | updateProject | #1 狀態轉換, #6 破壞性變更 |
| 取消訂閱 | cancelSubscription | #8 暫停期, #14 暫停頁 |
| 導出資料 | exportData | #13 SQL dump |
| 移轉資源 | transferResources | #12 自助移轉 |

#### Orchestrator 功能（6 個）

| Feature | Server Action | 關聯決議 |
|---------|---------------|----------|
| 建立任務 | createTask | #22 Task 屬於 Project |
| 確認計劃 | confirmTaskPlan | #24 超時處理 |
| 取消任務 | cancelTask | #23 保留已完成步驟, #28 通知 |
| 重試任務 | retryTask | #23 從失敗點重試 |
| 註冊技能 | registerSkill | #26 skill_executions 總表 |
| 配置Webhook | configureWebhook | #28 Webhook + 內建通知 |

### Orchestrator 架構決議

| # | 決議 | 選項 |
|---|------|------|
| 22 | Task 與 Project 關係 | Task 屬於 Project |
| 23 | 執行失敗回滾策略 | 不回滾，保留已完成步驟 |
| 24 | 人工審核超時處理 | 超時提醒 + 延長等待 + 自動取消 |
| 25 | 並行執行支援 | 不支援，依序執行 |
| 26 | skill_executions 與現有表 | 總表 + 細節表 1:1 關聯 |
| 27 | 任務優先級 | plan + task_type 混合 |
| 28 | 外部通知機制 | Webhook + 內建通知 |

### Skill 整合狀態

| Skill | 狀態 | 觸發方式 | LLM 模型 | 說明 |
|-------|------|---------|---------|------|
| `bdd-spec` | ✅ 完成 | Classifier 直接觸發 | Sonnet | 完整 5 階段：PRD Discovery/Clarify → Formulation → Spec Discovery/Clarify（上限 30 題，6 輪） |
| `uiux` | ✅ 完成 | BDD 完成後狀態機自動進入 | Sonnet | 3 階段：Design Discovery → Design Lab → Implementation。雙軌 Discovery + Design Brief 確認 + Design Tier + Variant 概念注入 |
| `quality-gate` | ✅ 完成 | UIUX RWD 完成後自動觸發 | Haiku（修復） | 靜態檢查 A11y/Performance/Code Quality，critical 問題 LLM 自動修復（最多 3 輪） |
| `fast-build` | ✅ 完成 | 前端 mode=fast 跳過 Classifier | Sonnet（3 次） | 一句話 → 規則式推斷 → inferInteractionHint → Structure+Interaction → Animation → RWD → 靜態 QG → 60-90 秒出結果 |
| `deployer` | ✅ 完成 | Classifier 直接觸發 | Haiku（build 修復） | sanitize 預檢 + 本地 Build 驗證（最多 3 輪 LLM 修復）+ Vercel 部署 + 對話內迭代 + 版本回滾 |
| `coder` | ❌ 未實作 | Classifier 能識別但無處理邏輯 | — | 僅 Registry 定義，orchestrator 回「尚未實現」 |
| `domain-manager` | ⚠️ 前端獨立 | Classifier 能識別但未接入 Orchestrator | — | 前端 Server Actions 有完整實作（`app/actions/domain.ts`），但未整合到 Orchestrator 狀態機 |
| `domain-purchase` | ⚠️ 前端獨立 | 同上 | — | Porkbun API 整合在 `app/actions/porkbun.ts`，未接入 Orchestrator |
| `domain-dns` | ⚠️ 前端獨立 | 同上 | — | Cloudflare API 整合在 `app/actions/cloudflare.ts`，未接入 Orchestrator |

### 內部 Service 層

| Service | LLM 模型 | 調用者 | 職責 |
|---------|---------|--------|------|
| `classifier.ts` | Haiku | 每條新訊息 | 意圖分類（規則式 + LLM）。設計類關鍵詞自動導向 bdd-spec |
| `prefilter.ts` | 無 | 每條訊息（最先） | 空訊息/長度/Prompt Injection/Rate Limit 檢查 |
| `bdd-to-ui-spec.ts` | Haiku | UIUX Pipeline 內部 | ISA BDD Feature Files → `UIRequirementsSpec`（結構化 UI 需求），快取在 FlowState |
| `prd-discovery.ts` | Sonnet | bdd-spec Skill | PRD 需求發掘（多輪），接受 DecisionSummary 注入 |
| `clarify-dedup.ts` | Haiku（2 次） | bdd-spec Skill | Decision Summary 生成 + Post-generation 語意去重 |
| `spec-discovery.ts` | Sonnet | bdd-spec Skill | 規格品質檢查（S1-S6 六類問題） |
| `formulation.ts` | Sonnet（5 次） | bdd-spec Skill | 生成 Schema + Features + EntityMapping + Actions + ISA |
| `fast-build-generation.ts` | 無 | fast-build Skill | 規則式 tier 偵測/產品推斷/預設 DesignSystem（零 LLM） |

### BDD Spec Skill 完整流程

BDD Spec Skill 實現完整的 5 階段規格產出流程，使用 `bdd_sessions` 資料表追蹤會話狀態：

```
Phase 1: PRD Discovery + Clarify（多輪動態釐清）
    ↓ 使用 A1-A6, B1-B5, C1-C2, D1-D2 檢查清單掃描
    ↓ 每輪最多 5 題，每 5 題批量確認（支援反悔修改）
    ↓ 回答後 LLM 根據答案動態生成追問（最多 6 輪 / 30 題）
    ↓ 無新問題或達到上限後進入下一階段

Phase 2: Formulation（一個 API = 一個 Feature）
    ↓ 產出 schema.sql + entity_to_table_mapping.yml
    ↓ 識別 Features：每個 actionName 對應一個獨立 Feature
    ↓   - create_{entity}, get_{entity}, list_{entities}
    ↓   - update_{entity}, delete_{entity}
    ↓   - {action}_{entity}（狀態轉換如 cancel_order）
    ↓ 產出 feature files（sdd.os ISA Gherkin 格式）
    ↓ 執行驗證腳本（lint + validate）
    ↓ 自癒機制（最多 3 次修復）

Phase 3: Spec Discovery + Clarify（2026-02-05 實作完成）
    ↓ 對產出的 Feature Files 進行品質審查
    ↓ 檢查項目（S1-S6）：
    ↓   - S1: 規則完整性（前置/後置條件）
    ↓   - S2: Example 覆蓋度
    ↓   - S3: 邊界條件覆蓋
    ↓   - S4: 格式正確性（sdd.os ISA）
    ↓   - S5: 跨 Feature 一致性
    ↓   - S6: Schema 對應
    ↓ 終止條件：最多 2 輪 / 10 題 / 0 問題
    ↓ 根據用戶回答修復 Features

Phase 4: Actions Design
    ↓ 產出 spec/actions/actions.yml

Phase 5: ISA Config
    ↓ 產出 isa_codegen.yml
```

**bdd_sessions 資料表**（`scripts/create-bdd-sessions.sql`）：
```sql
-- 核心欄位
current_phase TEXT     -- prd_discovery, prd_clarify, formulation, spec_discovery, spec_clarify, actions_design, isa_config, completed
current_round INT      -- 當前輪次
consecutive_empty_rounds INT  -- 連續空輪數（終止條件）

-- 釐清項目狀態
clarify_items JSONB    -- 待處理項目 [{ id, question, category, priority, status }]
staging_items JSONB    -- 暫存區（待確認）
resolved_items JSONB   -- 已解決

-- 規格內容
schema_sql_content TEXT
entity_mapping_content TEXT
features_content JSONB  -- [{ name, content }]
actions_yml_content TEXT
isa_config_content TEXT
```

**檢查清單**：
| 類別 | 檢查項目 |
|------|----------|
| A1-A6 | 領域與資料模型（Entity 定義、屬性完整性、關聯性、約束條件、命名規範、擴展性）|
| B1-B5 | 功能模型（CRUD 完整性、業務規則、狀態轉換、權限控制、錯誤處理）|
| C1-C2 | 術語一致性（專有名詞定義、跨功能一致性）|
| D1-D2 | 品質檢查（效能考量、安全性）|

**相關 Server Actions**（`app/actions/index.ts`）：
- `createBddSession` - 創建 BDD 會話
- `getBddSession` - 獲取會話狀態
- `updateBddSession` - 更新會話
- `answerClarifyItem` - 回答釐清項目
- `confirmBatch` - 批量確認
- `revertAnswer` - 反悔修改
- `skipClarifyItem` - 跳過項目
- `addClarifyItems` - 新增發現項目
- `getCurrentClarifyItem` - 獲取當前待處理項目
- `getBddSessionProgress` - 獲取進度統計

**相關 LLM 函數**（`app/lib/llm.ts`）：
- `runPrdDiscovery` - PRD Discovery（使用檢查清單）
- `translateToWhiteText` - 白話翻譯
- `generateSchemaSql` - 產出 SQL Schema
- `generateFeatureFiles` - 產出 Feature Files
- `runSpecDiscovery` - Spec Discovery
- `generateActionsYml` - 產出 Actions 規格
- `generateIsaConfig` - 產出 ISA 配置
- `fixFeatureFormat` - 自癒修復
- `validateFeatureContent` - 驗證 Feature 格式（E001-E008）
- `validateMultipleFeatures` - 批量驗證

**UIUX LLM 函數**（`app/lib/llm.ts`）：
- `generatePageComponent` - 生成頁面元件
- `generateUiComponent` - 生成 UI 元件（Button, Card, Input 等）
- `generateLayoutComponent` - 生成 Layout 元件（Header, Footer, Sidebar）
- `generateGlobalStyles` - 生成全域樣式
- `generateFullFrontend` - 批量生成完整前端

### UIUX 模板系統（2026-02-01）

實現模板引導式設計流程，包含分屏佈局和互動預覽：

```
用戶確認 BDD Spec → 進入 UIUX 階段 → 分屏佈局
┌────────────────┬─────────────────────────────┐
│   聊天區塊     │      預覽面板               │
│   (30% 寬)     │      (70% 寬)               │
│                │                             │
│  [模板選擇]    │   [模板預覽/iframe]         │
│  [AI 引導]     │   [設備切換 D/T/M]          │
│                │   [互動編輯器]              │
└────────────────┴─────────────────────────────┘
```

**核心元件**（`app/components/uiux/`）：
- `SplitLayout.tsx` - 可拖曳分屏佈局（30%/70%）
- `PreviewPanel.tsx` - 預覽面板 + iframe + 設備切換
- `DeviceSwitcher.tsx` - 設備切換器（desktop/tablet/mobile）
- `TemplatePicker.tsx` - 模板選擇器（網格 + 分類）
- `TemplateCard.tsx` - 模板卡片（預覽圖 + 標籤）
- `InteractivePreview.tsx` - 互動預覽（postMessage 通訊）
- `PropertyEditor.tsx` - 屬性編輯器（文字/顏色/間距）
- `UiuxChatSection.tsx` - UIUX 階段聊天介面
- `QuickReplies.tsx`（`app/components/`）- 可點擊快速回覆按鈕（primary/secondary/ghost 三種樣式）

**訊息結構擴展**：
```typescript
interface Message {
  // 現有欄位
  layoutHint?: 'default' | 'split' | 'full_preview'
  richContent?: {
    type: 'template_picker' | 'design_preview' | 'code_preview'
    data: Record<string, unknown>
  }
  // Quick Reply 可點擊選項（只渲染在最後一條助手訊息上）
  quickReplies?: { label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }[]
}
```

**模板資料**（`app/lib/templates.ts`）：
- 5 個初始模板：saas-minimal, saas-pro, landing-startup, landing-corporate, ecommerce-modern
- 分類：saas, landing, ecommerce, content
- Server Actions：`getTemplates()`, `getTemplateById()`, `getRecommendedTemplates()`

**iframe 互動協議**（`public/scripts/interactive-preview.js`）：
```typescript
// 父視窗 → iframe
iframe.postMessage({ type: 'ENABLE_SELECTION_MODE' }, '*')
iframe.postMessage({ type: 'UPDATE_ELEMENT', elementId, changes }, '*')

// iframe → 父視窗
window.parent.postMessage({ type: 'ELEMENT_SELECTED', element }, '*')
window.parent.postMessage({ type: 'STYLES_UPDATED', elementId }, '*')
```

**資料庫變更**（`spec/data/schema.sql`）：
```sql
CREATE TYPE template_category AS ENUM ('saas', 'landing', 'ecommerce', 'content');
CREATE TABLE templates (
  id, name, slug, category, description, thumbnail_url, preview_image_url,
  tags, design_defaults, page_structure, is_active, is_featured, sort_order
);
```

### UIUX Skill 完整流程

UI/UX Skill 實現完整的 3 階段前端介面開發流程：

```
bdd-spec（規格確定）
         ↓
       uiux（前端）
         ↓
     deployer

# TODO: coder 開發完成後改為並行執行：
# bdd-spec → [coder + uiux 並行] → deployer
```

**UIUX 3 階段流程**：

```
Phase 1: Design Discovery（雙軌流程 + Brief 確認）
    ↓ 詢問「你對外觀有想法嗎？」
    ↓
    ├─ Path A（有想法）→ 4 步釐清問卷
    │    feeling → reference → color → layout
    │    ↓ inferCategoryFromIdeas() + inferDesignDefaultsFromIdeas()
    │    ↓ 建立虛擬 TemplateData
    │
    └─ Path B（沒想法）→ 模板選擇器
         ↓ 用戶直接選擇模板
    ↓
    Design Brief 確認（AI 設計顧問總結 + 建議 + 推薦 Design Tier，最多 3 輪調整）
    ↓ Design Tier: functional（功能型）或 creative（創意型）

Phase 2: Design Lab
    ↓ 根據 Design Tier 切換約束集生成 5 個設計變體
    ↓ 用戶選擇或合併變體（支援 "選擇變體 A" / "合併 A+C" 格式）

Phase 3: Implementation（三階段生成，約束隨 tier 變化）
    ↓ Stage 1: Structure+Interaction（桌面版結構+完整互動，creative tier 允許漸層/多色/大膽佈局）
    ↓ Stage 2: Animations（motion/react 動畫，creative tier 允許更豐富動畫）
    ↓ Stage 3: RWD（響應式設計，失敗時 fallback 到 Stage 2）
    ↓
    Quality Gate（自動觸發）
    ↓ 靜態檢查 A11y / Performance / SEO / Code Quality
    ↓ 有 critical 問題 → LLM 自動修復（最多 3 輪）
    ↓ 品質報告 → 完成
```

**設計變體的 5 個設計軸**：
- **A: Hierarchy Focus** - 重新結構化內容層級
- **B: Layout Model** - 不同佈局方式（card vs list vs table）
- **C: Density** - 密度變化（compact vs spacious）
- **D: Interaction** - 互動模式（modal vs inline vs drawer）
- **E: Expressive** - 品牌表達方向

**相關檔案**：
- `uiux-skill/skill.md` - Skill 定義
- `uiux-skill/instructions/` - 3 階段執行指南
- `uiux-skill/rules/baseline-ui.md` - UI 技術約束
- `app/actions/storage.ts` - Supabase Storage 整合

**儲存架構**：
```
UIUX 產出程式碼
      ↓
打包成 JSON（code-package.json）
      ↓
上傳到 Supabase Storage（generations bucket）
      ↓
URL 存入 generations.generated_code_url
      ↓
部署時下載 → 部署到 Vercel
```

### Domain Skills（拆分降低風險）

| Skill | 功能 | 觸發詞 |
|-------|------|--------|
| `domain-manager` | 入口，詢問用戶選擇 | 網域、domain、自訂網址 |
| `domain-purchase` | 購買網域（Porkbun 註冊） | 買網域、購買網域 |
| `domain-dns` | 設定 DNS + 綁定 Vercel | 設定 DNS、自有網域 |

```
用戶：「設定網域」
    ↓
domain-manager（入口）
    ↓
┌─────────────────────────────────────┐
│  1. 免費網域 → 直接完成             │
│  2. 購買網域 → domain-purchase      │
│  3. 自有網域 → domain-dns           │
└─────────────────────────────────────┘

購買網域流程（domain-purchase）：
查詢可用性 → 收集 Registrant 資訊 → Porkbun 註冊 → 完成
    ↓
「輸入『設定 DNS』來完成設定」

DNS 設定流程（domain-dns）：
建立 Cloudflare Zone → 更新 Nameserver → 設定 DNS 記錄 → 綁定 Vercel → 完成
```

**相關 API**：
- `porkbun.ts` - 網域購買/查詢 API
- `cloudflare.ts` - DNS 管理 API
- `domain.ts` - 網域工作流程整合

**待完成**：
- [ ] sdd.os 整合（規格驅動開發執行環境）
- [ ] Supabase Storage 版本管理
- [x] Vercel Deployments API 整合（`deployProjectFromDb` 橋接真正的 Vercel/Supabase API）
- [x] Domain Manager Skill（獨立於部署的網域管理）
- [ ] 完整測試覆蓋
- [x] Porkbun API 串接（網域購買功能待付款整合）
- [x] BDD Spec 整合真正 LLM（Claude API）

## 系統架構

### 整體架構：Vercel 前端 + VPS 後端

```
┌─────────────────────────────────────────────────────────────┐
│              用戶請求（tellcraft.com / Vercel）              │
└─────────────────────────┬───────────────────────────────────┘
                          ↓ HTTP / WebSocket
┌─────────────────────────────────────────────────────────────┐
│                    VPS Backend                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Intent    │→ │   Skill     │→ │   BullMQ    │         │
│  │ Classifier  │  │  Registry   │  │  Worker     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  - 接收用戶請求                                              │
│  - 任務排隊（BullMQ）                                        │
│  - 狀態追蹤（Redis）                                         │
│  - 等待用戶回覆                                              │
│  - 錯誤重試                                                  │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   Server Actions（30+）                      │
│  createProject · sendMessage · generateCode · deployProject │
│  initializeSession · sendMessageAndTrigger · replyToConv... │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                        外部服務                              │
│         Vercel · Supabase · Cloudflare · sdd.os             │
└─────────────────────────────────────────────────────────────┘
```

### 為什麼用 VPS？

| 問題 | Vercel Serverless | VPS Backend |
|------|-------------------|-------------|
| 執行時間限制 | 10-60 秒 | 無限制 |
| 狀態管理 | 無狀態 | Redis + PostgreSQL |
| 長時間 LLM 任務 | 超時失敗 | 正常完成 |
| 調試 | 困難 | PM2 + 日誌 |

### 並發處理策略（2026-02-08 優化）

**多層限流架構**：
```
用戶請求 → BullMQ Worker (concurrency: 20) → LLM Semaphore (max: 10) → Anthropic API
                                             → Deploy Semaphore (max: 3) → npm install + next build
```

| 層級 | 配置 | 環境變數 | 用途 |
|------|------|----------|------|
| Worker 並發 | 20 | `WORKER_CONCURRENCY` | BullMQ 同時處理的 Job 數 |
| LLM 限流 | 10 | `LLM_MAX_CONCURRENT` | 同時進行的 Anthropic API 呼叫 |
| 部署限流 | 3 | `DEPLOY_MAX_CONCURRENT` | 同時執行的 npm install + next build |
| DB 連接池 | 50 | `DB_POOL_MAX` | PostgreSQL 最大連接數 |

**基礎設施配置**：
- PM2 `max_memory_restart: 4G`（防 OOM）
- Express body limit `50mb`（大型代碼傳輸）
- Socket.io `pingTimeout: 60s`、`maxHttpBufferSize: 5MB`
- Redis 重連策略（指數退避，上限 2s）

**監控端點**：
- `GET /health/stats` — 記憶體、LLM/Deploy 並發、DB 連接池、/tmp build 目錄數
- `POST /health/cleanup-tmp` — 手動清理超過 30 分鐘的孤兒 build 目錄
- 啟動時 + 每 10 分鐘自動清理 /tmp 孤兒 build 目錄

**預估容量**：安全並發 30-40 人，峰值 50 人（需 4 核 8GB+ VPS）

### 多租戶架構（Multi-Tenant SaaS）

每個用戶的專案都有獨立的 Supabase + Vercel，但都在 Tellcraft 組織下：

```
Tellcraft 組織
│
├── 主 Supabase（tellcraft 平台本身）
│   ├── users, projects, conversations...（平台資料）
│   └── generations bucket（暫存生成的程式碼，50MB 限制）
│
├── 用戶 A 的 Supabase Project（動態建立）
│   └── 用戶 A 的業務資料（訂單、用戶、產品...）
├── 用戶 B 的 Supabase Project
│   └── 用戶 B 的業務資料
└── ...

Tellcraft Vercel Team
├── tellcraft.com（平台本身）
├── 用戶 A 的 Vercel Project（動態建立）
│   └── 綁定用戶 A 的 Supabase
├── 用戶 B 的 Vercel Project
│   └── 綁定用戶 B 的 Supabase
└── ...
```

### 程式碼生成與部署流程

```
UIUX Skill 生成程式碼
      ↓
暫存到 generations bucket（主 Supabase Storage）
路徑：/{projectId}/{generationId}/code-package.json
      ↓
部署時：
  1. 用 Supabase Management API 建立用戶專屬 Project（如果還沒有）
  2. 用 Vercel API 建立用戶專屬 Project（如果還沒有）
  3. 從 generations 拉程式碼 → Vercel Deployments API 部署
  4. 設定環境變數（用戶 Supabase URL + Key）
      ↓
完成後：generations 暫存檔可保留 7 天後清理
```

### 為什麼用 Supabase Storage 而非 Git

| 面向 | Git | Supabase Storage |
|------|-----|------------------|
| 管理 100 用戶 | ❌ 100 個 repo 很亂 | ✅ 一個 bucket + 路徑分離 |
| Rate Limit | ❌ GitHub API 有限制 | ✅ 無限制 |
| 費用 | ❌ Private repo 要錢 | ✅ 便宜 |
| 版本控制 | ✅ 原生支援 | ⚠️ 用 generationId 追蹤 |

### 部署方式：Vercel Deployments API

不需要 Git，直接用 API 部署：

```typescript
const response = await fetch('https://api.vercel.com/v13/deployments', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
  },
  body: JSON.stringify({
    name: 'user-project-123',
    files: [
      { file: 'pages/index.tsx', data: btoa(generatedCode) },
      { file: 'package.json', data: btoa(packageJson) },
    ],
    projectSettings: { framework: 'nextjs' },
  }),
})
```

## 執行流程

```
用戶：「幫我建一個訂單管理系統」
  ↓
┌─────────────────────────────────────────┐
│ VPS: Intent Classification              │
│ → 識別為 bdd-spec Skill                 │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ VPS: 多輪對話釐清需求                   │
│ → Redis 狀態管理 + WebSocket 推送       │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ VPS: 規格生成                           │
│ → 生成 BDD Feature Files + Schema       │
│ → 自癒機制，最多 3 次                   │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ VPS: 存儲 + 部署                        │
│ → 存到 Supabase Storage                 │
│ → Vercel Deployments API 部署           │
│ → 通知用戶                              │
└─────────────────────────────────────────┘
  ↓
用戶收到：https://user-project.vercel.app
```

## 快速開始

```bash
# 前端
pnpm install
pnpm dev

# 後端（另開終端）
cd tellcraft-backend
pnpm install
pnpm dev
```

- 前端：http://localhost:3000
- 後端：http://localhost:3100
- 測試頁面：http://localhost:3000/test

## 安全設置

### 必要環境變數
- **`JWT_SECRET`**（前後端皆需）：JWT 簽名金鑰，啟動時未設置會直接報錯。**禁止使用 fallback 值**。
- **`ALLOWED_CALLBACK_HOSTS`**（後端）：OAuth callback 白名單，逗號分隔（預設 `https://tellcraft.com`）

### 安全機制
- **Helmet + CORS**：所有 HTTP 回應自動加入安全標頭
- **Rate Limiting**：全域 300 req/15min，認證端點 20 req/15min
- **Socket.io 認證**：連接時驗證 JWT token 或 anonymousId，subscribe 時驗證對話所有權
- **OAuth State 簽名**：HMAC-SHA256 防 CSRF，token 透過 URL hash fragment 傳遞（不進 server log）
- **Token 黑名單**：登出後 token 加入 Redis 黑名單（7 天 TTL），所有認證端點檢查
- **Token Refresh 限制**：超過 24 小時的 token 不可刷新
- **IDOR 防護**：conversation/session API 加入所有權驗證，BDD/operations 強制登入
- **requireAdmin 中間件**：admin 路由統一走 DB `is_admin` 查詢，SQL ORDER BY 使用白名單映射
- **路徑遍歷防護**：deployer `writeFilesToTempDir` 驗證 `path.resolve` 不逃逸；VPS proxy 白名單路徑前綴
- **匿名用戶範圍**：只允許 session/initialize + 發送消息，其餘操作需登入

## UI 元件

### SpecGenerationView - AI 規格生成等待畫面

全屏沉浸式等待體驗，用於「生成規格」階段。當 AI 正在生成 BDD 規格文件時，取代原本無聊的聊天介面。

**設計概念**：「觀測站」— 用戶透過高科技監控台觀察 AI 大腦運作。

**視覺特色**：
- 深邃太空感背景 + 網格底紋
- 神經網絡連線動畫（5 節點圍繞中心核心）
- 浮動粒子系統
- 掃描線效果

**功能**：
- 5 個階段進度：分析需求 → 釐清細節 → 建立資料模型 → 生成功能規格 → 品質檢查
- 動態標題文字（思考/分析/建構/生成 輪播）
- 當前階段脈動動畫 + 完成標記
- 底部提示輪播

**使用方式**：
```tsx
import { SpecGenerationView } from '@/app/components/SpecGenerationView'

// 基本使用（自動 demo 模式，每 3 秒推進一階段）
<SpecGenerationView />

// 控制階段（0-4 對應 5 個階段）
<SpecGenerationView currentStage={2} />

// 完成回調
<SpecGenerationView onComplete={() => console.log('done')} />
```

**檔案位置**：`app/components/SpecGenerationView.tsx`

## 專案結構

```
app/
├── actions/           # Server Actions（API 封裝）
│   ├── index.ts       # 核心 + Chat + Auth Actions
│   └── admin.ts       # 管理員 Actions
├── lib/
│   ├── vps-api.ts     # VPS API 客戶端
│   ├── llm.ts         # LLM 函數
│   └── supabase/      # Supabase clients（client.ts, server.ts）
├── hooks/
│   ├── useAuth.ts     # JWT 認證 hook
│   └── useVpsWebSocket.ts  # WebSocket hook
├── components/        # UI 元件
│   ├── dashboard/     # 儀表板元件
│   │   ├── Sidebar.tsx
│   │   ├── StatsCard.tsx
│   │   ├── DataTable.tsx
│   │   ├── Chart.tsx
│   │   └── DateRangePicker.tsx
│   ├── ConversationPicker.tsx  # 歷史對話選擇器
│   ├── LoginPrompt.tsx         # 登入提示
│   └── ...                     # 其他動效元件
├── dashboard/         # 儀表板頁面
│   ├── layout.tsx     # 共用版面（側邊欄）
│   ├── page.tsx       # 用戶首頁
│   ├── projects/      # 專案管理
│   ├── conversations/ # 對話列表
│   └── admin/         # 管理員頁面
│       ├── page.tsx   # 管理員總覽
│       ├── users/     # 用戶管理
│       ├── usage/     # LLM 用量
│       └── logs/      # 審計日誌
├── auth/
│   ├── login/         # 登入頁面
│   ├── callback/      # OAuth callback
│   └── post-login/    # 登入後帳號合併處理
├── api/
│   ├── auth/          # OAuth 路由（google/, line/）
│   └── session/       # Session Cookie 備份
└── test/              # 測試頁面

middleware.ts     # Session refresh + 路由保護 + 管理員權限

spec/
├── data/              # Schema + Entity Mapping
├── features/          # BDD Feature Files (14)
└── actions/           # Actions 定義

bdd-spec/              # BDD Skill 定義
├── skill.md           # Skill 元數據
├── instructions/      # 5 階段執行指南
├── rules/             # 格式規範
└── scripts/           # 驗證腳本

uiux-skill/            # UI/UX Skill 定義
├── skill.md           # Skill 元數據
├── instructions/      # 3 階段執行指南
│   ├── 01-design-discovery.md  # 雙軌流程（有想法→4步釐清 / 沒想法→模板選擇）
│   ├── 02-design-lab.md        # 5 變體生成 + 選擇合併
│   └── 03-implementation.md    # 三階段程式碼生成（Structure → Animation → RWD）
└── rules/             # UI 規範
    └── baseline-ui.md

prompts/               # BDD Skill（Claude Code 用）
```

## 相關文件

- [釐清狀態](.clarify/overview.md)
- [BDD Skill](prompts/skill.md)
- [格式規範](prompts/rules/formulation-rules.md)
