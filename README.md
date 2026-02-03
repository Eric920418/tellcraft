# Tellcraft

> **用對話打造你的軟體產品** | [tellcraft.com](https://tellcraft.com)

Tellcraft 是一個 AI 驅動的自動化開發平台。用戶只需描述需求，AI 會自動釐清細節、生成程式碼、部署上線。

## 核心理念

```
描述需求 → AI 釐清 → 確認規格 → 自動生成 → 一鍵部署
```

## 當前開發進度

- **狀態**：✅ Phase 1-9 + Server Actions + Inngest Orchestrator + 前端 Chat 串接 + 認證系統 + 訪客體驗改善 + 儀表板系統 + BDD Spec 完整修復
- **釐清項目**：28 項全部解決
- **Server Actions**：30+ 已實作
- **詳情**：[`.clarify/overview.md`](.clarify/overview.md)

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

### 釐清流程簡化（2026-01-31）

將無限迭代改為最多 2 輪，用戶體驗大幅改善：

**舊流程**（問題：無限循環、不可預期）：
```
Discovery → 問5題 → 問完 → Re-discovery → 問5題 → ... → 連續2輪沒新問題 → 結束
```

**新流程**（改善：可預期、最多3輪）：
```
第一輪 Discovery（一次產出所有問題）
    ↓
告知用戶「總共 N 題」
    ↓
每5題確認一次，顯示進度 (5/30)
    ↓
全部答完 → 分析是否有遺漏
    ↓
├─ 0 題 → 進入 Formulation
├─ 1-10 題 → 第二輪 → 進入 Formulation
└─ >10 題 → 第二輪 → 答完 → 再分析 → 第三輪（最後）→ 進入 Formulation
```

| 改善項目 | 說明 |
|----------|------|
| **問題總數可見** | 一開始告知用戶「總共 N 題」|
| **進度顯示** | 每題顯示 (5/30) 進度 |
| **動態輪數** | 第二輪 ≤10 題結束；>10 題進入第三輪 |
| **第三輪保險** | 複雜需求有第三輪兜底，但絕對封頂 |
| **語意去重** | 每輪都過濾重複問題 |

### Modal 集成 - BDD Spec 規格生成（2026-02-01）

**問題**：Vercel Serverless 有執行時間限制（10-60秒），19 個 Features 無法一次生成，JSON 被截斷導致解析失敗。

**解決方案**：集成 Modal 無伺服器平台，使用異步回調模式執行長時間 LLM 任務。

| 項目 | 說明 |
|------|------|
| **Modal 函數** | `modal_functions/formulation.py` - 包含 `generate_spec` 端點和 `formulation_worker` 異步 worker |
| **回調端點** | `app/api/modal/callback/route.ts` - 接收 Modal 完成回調，發送 Inngest 事件 |
| **Inngest 事件** | `modal/formulation-complete` - Modal 完成後觸發的事件 |
| **Orchestrator** | 使用 `step.waitForEvent` 等待 Modal 完成（最多 30 分鐘） |
| **環境變數** | `MODAL_FORMULATION_URL` - Modal HTTP endpoint URL |
| **Fallback** | 未配置 Modal 時自動使用原有的分批生成邏輯 |

**異步回調架構**：
```
Inngest                           Modal                          Vercel
  │                                 │                              │
  │  1. 觸發 Modal（不等待）         │                              │
  │ ────────────────────────────>   │                              │
  │  2. 立即返回 {accepted: true}   │                              │
  │ <────────────────────────────   │                              │
  │                                 │                              │
  │  3. waitForEvent (最多 30 分鐘) │                              │
  │  ...                            │  4. formulation_worker 執行  │
  │                                 │     （Schema + Features）     │
  │                                 │                              │
  │                                 │  5. 完成後調用 callback      │
  │                                 │ ──────────────────────────>  │
  │                                 │                              │
  │  6. 收到事件，繼續流程          │       (Inngest 事件)          │
  │ <──────────────────────────────────────────────────────────────│
```

**Modal 優勢**：
- 無執行時間限制（可運行 30+ 分鐘）
- 一次生成所有 Features，確保跨 Feature 一致性
- 按秒計費，只付實際使用時間
- 包含驗證和自癒修復（最多 3 次）
- 使用 `.spawn()` 真正異步執行，避免 Vercel 超時

**兩階段 Feature 生成**：
```
Phase 1: identify_features_with_interfaces()
    → 一次識別所有 Features 並定義統一接口
    → 確保 orderId, userId 等命名跨 Feature 一致

Phase 2: generate_single_feature_with_interface()
    → 根據統一接口逐個生成 Feature 內容
    → 每個 Feature 遵守預定義的接口規範
```

**部署步驟**：
```bash
# 1. 安裝 Modal CLI
pip install modal
modal token set  # 打開瀏覽器登入

# 2. 創建 secrets
modal secret create tellcraft-secrets \
  ANTHROPIC_API_KEY=sk-ant-xxx

# 3. 部署
python3 -m modal deploy modal_functions/formulation.py

# 4. 設置環境變數
MODAL_FORMULATION_URL=https://your-username--tellcraft-formulation-generate-spec.modal.run
```

**成本估算**：每次規格生成約 $0.20（Modal ~$0.05 + Claude API ~$0.15）

**Rate Limit 處理**：
- `callClaude()` 函數內建重試機制（最多 3 次）
- 遇到 rate_limit_error 自動等待 30-120 秒後重試
- 使用 `retry-after` header 或指數退避策略

**多輪對話修復**（2026-02-01）：
- 問題：前端無法正確識別是否需要使用 `replyToConversation`，導致 `waitForEvent` 永遠收不到事件
- 原因：`getConversationMessages` 只查詢 `tasks` 表，但 orchestrator 沒有創建 task 記錄
- 解決：`getConversationMessages` 現在也查詢 `bdd_sessions` 表，如果有活躍的 session 則返回其 ID 作為 `currentTaskId`

**UIUX 分屏模式修復**（2026-02-01）：
- 問題：前端沒有進入分屏模式（SplitLayout）
- 原因：`page.tsx` 中 `formattedMessages` 轉換時沒有包含 `layoutHint` 和 `richContent` 欄位
- 解決：添加 `layoutHint` 和 `richContent` 欄位到消息轉換中

**決策繼承修復**（2026-02-01）：
- 問題：新 session 會重新問用戶已經否定的功能相關問題（如已回答「不需要帳號系統」，新 session 仍問帳號相關問題）
- 原因：`createBddSession` 每次創建全新 session，不繼承之前的決策
- 解決：
  1. `createBddSession` 現在會查詢同一對話之前的 session，繼承其 `resolved_items`
  2. `prd-discovery` 步驟將繼承的決策傳給 `runPrdDiscovery`
  3. LLM prompt 增強：如果用戶回答「不需要」某功能，完全跳過該功能相關的所有問題

**UIUX 階段流程修復**（2026-02-01）：
- 問題：在 UIUX 模板選擇階段回答後，系統又重新開始釐清流程（重新問 15 個問題）
- 原因：
  1. Formulation 完成後 session phase 變成 'completed'
  2. `getConversationMessages` 查詢時排除 'completed' 的 session，找不到活躍 session
  3. 沒有 `currentTaskId` 返回，前端認為對話已完成
  4. 用戶回覆觸發 `user/request`（新請求）而非 `user/reply`（回覆）
- 解決：
  1. 新增 `update-phase-uiux` step，在 UIUX 階段開始前將 session phase 設為 'uiux'
  2. `BddPhase` 類型新增 'uiux' 值
  3. 修改 `isComplete` 邏輯：只有當 `spec_complete=true` **且**沒有活躍 session 時才返回 `true`

**Discovery 邏輯推論修復**（2026-02-02）：
- 問題：用戶回答「分類是固定的，不可新增修改」後，系統仍然問「刪除分類後怎麼辦」
- 原因：
  1. prompt 只處理顯式的「不需要」，沒有理解邏輯推論
  2. 15 個問題一次性生成，問題間沒有邏輯依賴
- 解決（雙重保險）：
  1. **生成時**：增強 `runPrdDiscovery` prompt，新增「邏輯推論」規則
  2. **回答後**：新增 `filterIrrelevantQuestions` 函數，每回答一題就檢查剩餘問題是否仍相關
     - 在 orchestrator 中，每次 `answerClarifyItem` 後調用
     - 使用 Claude Haiku（便宜快速）判斷邏輯相關性
     - 過濾掉邏輯上被排除的問題（如「固定分類」→ 過濾「刪除分類」問題）

**決策繼承查詢修復**（2026-02-02）：
- 問題：新 session 繼承決策時，查詢返回空 session 而非有內容的 session
- 原因：`.not('resolved_items', 'is', null)` 只過濾 NULL，空陣列 `[]` 不是 null
- 解決：改用 `.find()` 找第一個 `resolved_items.length > 0` 的 session

**Modal Callback 308 重定向修復**（2026-02-02）：
- 問題：Modal callback 發送失敗 `HTTP Error 308: Permanent Redirect`，導致 Inngest 收不到完成事件
- 原因：Python `urllib` 不自動處理 308 重定向，Vercel 的 URL 正規化導致重定向
- 解決：改用 `requests` 庫，設置 `allow_redirects=True` 自動處理重定向

**Inngest waitForEvent 匹配修復**（2026-02-02）：
- 問題：Modal callback 成功但 Inngest 仍卡在 `wait-modal-formulation-complete`
- 原因：`match: 'data.sessionId'` 嘗試匹配原始事件的 sessionId，但 `user/request` 事件沒有 sessionId
- 解決：改為 `match: 'data.conversationId'`

**Discovery 架構重構**（2026-02-02）：
- 問題：一次生成 15 個問題，問題之間沒有邏輯依賴，導致後面的問題與前面的答案矛盾
- 解決：
  1. **小批量生成**：從 15 題改為 5 題，每批回答完後根據答案重新生成下一批
  2. **簡化 prompt**：移除所有具體例子，只保留通用原則，讓 LLM 自己推理
  3. **動態數量**：不再承諾具體問題數，因為數量會根據回答動態調整
  4. **即時過濾**：每回答一題就檢查剩餘問題是否仍相關，並告知用戶跳過了幾題

**「其他」選項自訂答案修復**（2026-02-02）：
- 問題：用戶回答「D. 不用提醒」時，系統只記錄「D」，丟失了「不用提醒」的說明
- 解決：
  1. `validateAnswer` 改為保留完整答案，格式為 `D: 不用提醒`
  2. `getFullAnswer` 正確解析並顯示自訂說明

**移除「其他」選項，改為提示**（2026-02-02）：
- 問題：「D. 其他」選項讓用戶不知道可以自己輸入，可能只選 D 卻什麼都沒打
- 解決：
  1. prompt 不再要求 LLM 生成「其他」選項
  2. 問題底部加上提示：「_（或直接輸入您的答案）_」

---

### 最新修復（2026-02-01）

**修復 BDD-Spec Formulation 階段決策丟失問題**：

| 修復項目 | 描述 |
|----------|------|
| **問題根因** | `fixMultipleFeatures` 在修復 Feature Files 格式時沒有接收用戶的釐清決策，導致 AI 修復時可能產出違反用戶回答的規格 |
| **修改函數簽名** | `fixMultipleFeatures` 新增 `resolvedItems: ClarifyItem[]` 參數 |
| **修改 prompt** | 將用戶的釐清決策（Q/A）加入 userMessage，並在 systemPrompt 強調「必須嚴格遵守用戶決策」|
| **更新調用點** | orchestrator.ts 調用時傳入 `session.data?.resolvedItems || []` |

**影響範圍**：
- `app/lib/llm.ts`：`fixMultipleFeatures` 函數
- `app/inngest/functions/orchestrator.ts`：調用點

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

**問題根因**：Claude Sonnet 4.5 max output 是 8192 tokens，一次生成所有 Features 會被截斷導致 JSON 解析失敗 → Inngest 重試 → 無限循環。

---

**修復 Spec Clarify 無限循環問題（保持全面釐清）**：

| 修復項目 | 描述 |
|----------|------|
| **語意去重驅動** | 每輪結束都做 re-discovery，但經過 `filterDuplicateQuestions` 語意去重 |
| **自然終止** | 去重後沒有新問題 → 才結束。確保全面釐清不遺漏 |
| **極端保險** | 最多 10 輪（正常情況語意去重會讓它自然結束，這只是防萬一）|
| **進度顯示** | 動態顯示輪數和進度（規格釐清第 2 輪 3/5）|
| **修復 Inngest step name** | 舊邏輯 step name 重複導致返回緩存結果，新邏輯每輪 step name 唯一 |

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
- **Dashboard 要求重新登入**：middleware 和 Server Components 無法讀取 localStorage。修復：登入時同時設置 httpOnly cookie，middleware 和 layout 改用 cookie 驗證。

**認證雙軌機制**：
| 儲存位置 | 用途 |
|----------|------|
| localStorage (`auth_token`) | 客戶端 `useAuth` hook 使用 |
| Cookie (`auth_token`) | Middleware + Server Components 使用 |

### 前端 Chat 串接 Inngest

用戶在首頁輸入需求後，真正觸發 `bdd-spec` skill，實現完整的多輪對話流程：

```
用戶輸入 → initializeSession（匿名用戶）
    → sendMessageAndTrigger → triggerUserRequest
    → Inngest Orchestrator → bdd-spec skill
    → AI 回覆寫入 DB → 前端輪詢取得
    → 用戶回覆 → triggerUserReply → Inngest 恢復
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
- `sendMessageAndTrigger` - 發送消息並觸發 Inngest
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
| Inngest waitForEvent 卡住 | 事件機制複雜，狀態難追蹤 | BullMQ 直接控制，可隨時檢查 |
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
│   ├── workers/           # BullMQ Workers
│   │   └── orchestrator.ts
│   ├── services/          # 業務邏輯
│   │   ├── classifier.ts
│   │   ├── registry.ts
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

### Inngest → BullMQ 對照

| Inngest | BullMQ |
|---------|--------|
| `step.run('name', fn)` | 直接執行 `await fn()` |
| `step.waitForEvent()` | Redis 狀態 + 新 Job |
| `step.sleep()` | `await delay(ms)` |
| 自動重試 | `attempts: 3` 配置 |
| 事件觸發 | `queue.add()` |

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
| **VPS Backend** | Express + BullMQ + Socket.io | ✅ 完成 |
| Inngest | ~~事件驅動任務編排~~ | ❌ 已棄用，改用 BullMQ |
| Modal | sdd.os 執行環境（手腳）| ⏳ 待整合 |
| sdd.os | 規格驅動開發、TDD 迭代 | ⏳ 待整合 |
| Supabase | Auth（JWT 驗證）| ✅ |
| PostgreSQL | 資料庫（VPS 本地）| ✅ 完成 |
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

| Skill | 狀態 | 說明 |
|-------|------|------|
| `bdd-spec` | ✅ 完成 | 完整 5 階段流程：PRD Discovery/Clarify → Formulation → Spec Discovery/Clarify → Actions Design → ISA Config |
| `coder` | ⏳ 開發中 | 後端 API 生成，待開發完成後與 uiux 並行執行 |
| `uiux` | 🧪 可測試 | 4 階段前端設計流程 + LLM 程式碼生成 + Supabase Storage 儲存（目前單獨執行） |
| `deployer` | ✅ 完成 | 整合 Vercel Deployments API，部署後自動詢問網域設定 |
| `domain-manager` | ✅ 完成 | 網域管理入口，支援三種選擇 |
| `domain-purchase` | ✅ 完成 | Porkbun 網域註冊 |
| `domain-dns` | ✅ 完成 | Cloudflare Zone + Vercel 綁定 |

### BDD Spec Skill 完整流程

BDD Spec Skill 實現完整的 5 階段規格產出流程，使用 `bdd_sessions` 資料表追蹤會話狀態：

```
Phase 1: PRD Discovery + Clarify
    ↓ 使用 A1-A6, B1-B5, C1-C2, D1-D2 檢查清單掃描
    ↓ 每次問一題（白話翻譯）
    ↓ 每 5 題批量確認（支援反悔修改）
    ↓ 連續 2 輪無新問題後進入下一階段

Phase 2: Formulation
    ↓ 產出 schema.sql + entity_to_table_mapping.yml
    ↓ 產出 feature files（sdd.os ISA Gherkin 格式）
    ↓ 執行驗證腳本（lint + validate）
    ↓ 自癒機制（最多 3 次修復）

Phase 3: Spec Discovery + Clarify
    ↓ 對產出的 Feature Files 再次 Discovery
    ↓ 檢查規則完整性、Example 覆蓋度、邊界條件

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

**訊息結構擴展**：
```typescript
interface Message {
  // 現有欄位
  layoutHint?: 'default' | 'split' | 'full_preview'
  richContent?: {
    type: 'template_picker' | 'design_preview' | 'code_preview'
    data: Record<string, unknown>
  }
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

UI/UX Skill 實現完整的 4 階段前端介面開發流程：

```
bdd-spec（規格確定）
         ↓
       uiux（前端）    ← 目前只執行這個
         ↓
     deployer

# TODO: coder 開發完成後改為並行執行：
# bdd-spec → [coder + uiux 並行] → deployer
```

**4 階段流程**：

```
Phase 1: Design Discovery
    ↓ 多輪問答釐清設計偏好
    ↓ 產品類型、視覺風格、配色、Dark Mode

Phase 2: Design Lab
    ↓ 生成 5 個設計變體（不同設計軸）
    ↓ 用戶選擇或合併變體

Phase 3: Implementation
    ↓ 產出 Next.js + Tailwind CSS 程式碼
    ↓ SSR 優先、RWD、motion/react

Phase 4: Quality Gate
    ↓ 無障礙檢查（WCAG 2.2 AA）
    ↓ 效能檢查（只動畫 transform/opacity）
    ↓ SEO 檢查（Metadata、Open Graph）
    ↓ 自癒機制（最多 3 次修復）
```

**設計變體的 5 個設計軸**：
- **A: Hierarchy Focus** - 重新結構化內容層級
- **B: Layout Model** - 不同佈局方式（card vs list vs table）
- **C: Density** - 密度變化（compact vs spacious）
- **D: Interaction** - 互動模式（modal vs inline vs drawer）
- **E: Expressive** - 品牌表達方向

**相關檔案**：
- `uiux-skill/skill.md` - Skill 定義
- `uiux-skill/instructions/` - 4 階段執行指南
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
- [ ] Modal 整合（sdd.os 執行環境）
- [ ] Supabase Storage 版本管理
- [x] Vercel Deployments API 整合（`deployProjectFromDb` 橋接真正的 Vercel/Supabase API）
- [x] Domain Manager Skill（獨立於部署的網域管理）
- [ ] 完整測試覆蓋
- [x] Porkbun API 串接（網域購買功能待付款整合）
- [x] BDD Spec 整合真正 LLM（Claude API）

## 系統架構

### 整體架構：Inngest 是大腦，Modal 是手腳

```
┌─────────────────────────────────────────────────────────────┐
│              用戶請求（tellcraft.com / Vercel）              │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Inngest（大腦）                           │
│  - 接收用戶請求                                              │
│  - 任務排隊 + 優先級                                         │
│  - 狀態追蹤                                                  │
│  - 等待用戶確認（waitForEvent）                              │
│  - 錯誤重試                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Intent    │→ │   Skill     │→ │  Workflow   │         │
│  │ Classifier  │  │  Registry   │  │  Executor   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────┬───────────────────────────────────┘
                          ↓ 觸發
┌─────────────────────────────────────────────────────────────┐
│                    Modal（手腳）                             │
│  - 執行 sdd.os（規格驅動開發）                               │
│  - TDD 迭代循環（測試 → 實作 → 測試）                        │
│  - 生成程式碼                                                │
│  - 長時間運行（最多 30 分鐘）                                │
└─────────────────────────┬───────────────────────────────────┘
                          ↓ 完成後回報
┌─────────────────────────────────────────────────────────────┐
│                 Inngest（繼續編排）                          │
│  - 存到 Supabase Storage                                    │
│  - 呼叫 Vercel Deployments API 部署                         │
│  - 通知用戶完成                                              │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   Server Actions（18 個）                    │
│  createProject · sendMessage · generateCode · deployProject │
│  updateProject · cancelSubscription · exportData · ...      │
│  initializeSession · sendMessageAndTrigger · replyToConv... │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                        外部服務                              │
│       Vercel · Supabase · Cloudflare · Modal · sdd.os       │
└─────────────────────────────────────────────────────────────┘
```

### 為什麼這樣分工？

| 元件 | 職責 | 原因 |
|------|------|------|
| **Inngest** | 任務編排、狀態追蹤、等待事件 | 免費額度 25,000 runs/月，擅長編排 |
| **Modal** | 執行 sdd.os、TDD 迭代 | 按秒計費，支援長時間運行 |
| **Vercel** | 前端 + API + 用戶專案部署 | Serverless，自動擴展 |
| **Supabase** | 資料庫 + Storage | 統一存儲，便宜 |

### 並發處理策略

當 100 個用戶同時開發時：

```typescript
// Inngest 自動排隊 + 並發控制
inngest.createFunction(
  {
    id: 'handle-user-request',
    concurrency: {
      limit: 50,  // 同時最多處理 50 個請求
    },
  },
  // ...
)
```

- **Inngest**：自動排隊、優先級調度（付費用戶優先）
- **Modal**：按需啟動 Worker，閒置不花錢
- **LLM API**：多 Key 輪換分散 rate limit

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

## Inngest 配置

### 部署設定

| 項目 | 值 |
|------|-----|
| 平台 | Vercel |
| Endpoint | `https://tellcraft.com/api/inngest` |
| App ID | `tellcraft` |
| Integration | Vercel Integration（自動注入環境變數）|

### 環境變數（Vercel）

```bash
INNGEST_EVENT_KEY=xxx      # 從 Inngest Dashboard 取得
INNGEST_SIGNING_KEY=xxx    # 從 Inngest Dashboard 取得
```

### Vercel Integration 設定

1. 啟用 Inngest Vercel Integration
2. 設定 Custom Production Domain：`tellcraft.com`
3. 關閉 Vercel Deployment Protection（否則 Inngest 無法同步）

### 驗證 Inngest 連線

```bash
curl https://tellcraft.com/api/inngest
# 應返回：
# {
#   "has_event_key": true,
#   "has_signing_key": true,
#   "function_count": 1
# }
```

## 舊架構（參考）

```
┌─────────────────────────────────────────────────────────────┐
│                    Inngest Orchestrator                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Intent    │→ │   Skill     │→ │  Workflow   │         │
│  │ Classifier  │  │  Registry   │  │  Executor   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 執行流程

```
用戶：「幫我建一個訂單管理系統」
  ↓
┌─────────────────────────────────────────┐
│ Inngest: Intent Classification          │
│ → 識別為 bdd-spec Skill                 │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Inngest: 多輪對話釐清需求               │
│ → waitForEvent（最長 24 小時）          │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Inngest: 規格確認                       │
│ → 生成 BDD Feature Files + Schema       │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Modal: 執行 sdd.os                      │
│ → TDD 迭代（測試 → 實作 → 測試）        │
│ → 自癒機制，最多 3 次                   │
│ → 完成後回報 Inngest                    │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Inngest: 存儲 + 部署                    │
│ → 存到 Supabase Storage                 │
│ → Vercel Deployments API 部署           │
│ → 通知用戶                              │
└─────────────────────────────────────────┘
  ↓
用戶收到：https://user-project.vercel.app
```

## 快速開始

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 另開終端，啟動 Inngest Dev Server
npx inngest-cli@latest dev
```

- 應用：http://localhost:3000
- Inngest Dashboard：http://localhost:8288
- 測試頁面：http://localhost:3000/test

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
├── inngest/           # Orchestrator（任務編排）
├── lib/
│   └── supabase/      # Supabase clients（client.ts, server.ts）
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
│   ├── auth/line/     # LINE OAuth 路由
│   ├── inngest/       # Inngest webhook endpoint
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
├── instructions/      # 4 階段執行指南
│   ├── 01-design-discovery.md
│   ├── 02-design-lab.md
│   ├── 03-implementation.md
│   └── 04-quality-gate.md
├── rules/             # UI 規範
│   └── baseline-ui.md
└── resources/         # 模板和範例

prompts/               # BDD Skill（Claude Code 用）
```

## 相關文件

- [釐清狀態](.clarify/overview.md)
- [BDD Skill](prompts/skill.md)
- [格式規範](prompts/rules/formulation-rules.md)
