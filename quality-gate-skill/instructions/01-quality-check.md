# Phase 4: Quality Gate

## 目標

對產出的前端程式碼進行自動化品質檢查，確保符合無障礙、效能、SEO 標準。

---

## 檢查類別

### Priority 1: Accessibility（CRITICAL）

| 規則 | 檢查方式 | 自動修復 |
|------|----------|----------|
| Color Contrast | 文字 ≥ 4.5:1，UI ≥ 3:1 | 調整色彩值 |
| Focus States | 所有互動元素有可見 focus | 加 `focus-visible:ring-2` |
| ARIA Labels | icon-only buttons 有 aria-label | 補充 `aria-label` |
| Form Labels | 所有 inputs 有 label | 加 `<label>` 或 `aria-label` |
| Keyboard Access | 所有功能可鍵盤操作 | 加 `tabindex`、`onKeyDown` |
| Alt Text | 所有有意義的圖片有 alt | 補充 alt text |
| Heading Hierarchy | 不跳過 heading levels | 調整 h1-h6 |
| Link Purpose | 連結文字有意義 | 改善連結文字 |

### Priority 2: Performance（HIGH）

| 規則 | 檢查方式 | 自動修復 |
|------|----------|----------|
| Animation Properties | 只動畫 transform/opacity | 重寫動畫 |
| Animation Duration | 微互動 ≤ 200ms，轉場 ≤ 300ms | 調整時間 |
| Reduced Motion | 有 prefers-reduced-motion 處理 | 加 media query |
| will-change | 只在 active animation 時使用 | 移除多餘的 will-change |
| Blur/Filter | 不在大表面動畫 blur | 限制 blur 範圍 |

### Priority 3: SEO（HIGH）

| 規則 | 檢查方式 | 自動修復 |
|------|----------|----------|
| Page Title | 每頁有唯一 title | 補充 metadata |
| Meta Description | 有 description | 補充 description |
| Canonical URL | 有 canonical | 加 canonical |
| Open Graph | 有 og:title, og:description, og:image | 補充 OG tags |
| HTML Lang | 有 lang 屬性 | 加 `lang="zh-TW"` |
| Semantic HTML | 使用語意化標籤 | 改用正確標籤 |

### Priority 4: Code Quality（MEDIUM）

| 規則 | 檢查方式 | 自動修復 |
|------|----------|----------|
| No Emoji Icons | 不使用 emoji 作為 icon | 替換為 SVG |
| Cursor Pointer | 可點擊元素有 cursor-pointer | 加 cursor-pointer |
| Consistent Spacing | 使用 Tailwind spacing scale | 統一間距 |
| Z-Index Scale | 使用固定 z-index scale | 調整 z-index |
| No h-screen | 使用 h-dvh 而非 h-screen | 替換 |

---

## 檢查流程

```
┌─────────────────────────────────────────────┐
│  Step 1: 靜態分析                            │
│  - 掃描所有產出的 .tsx/.css 檔案             │
│  - 檢查 Tailwind class patterns              │
│  - 檢查 ARIA attributes                      │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Step 2: 問題分類                            │
│  - Critical（必須修復）                      │
│  - Warning（建議修復）                       │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Step 3: 自動修復                            │
│  - 修復所有 Critical 問題                    │
│  - 最多 3 輪修復                             │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Step 4: 重新驗證                            │
│  - 確認修復成功                              │
│  - 輸出最終報告                              │
└─────────────────────────────────────────────┘
```

---

## 檢查實作

### Accessibility Checker

```typescript
interface AccessibilityIssue {
  rule: string;
  severity: 'critical' | 'warning';
  file: string;
  line: number;
  element: string;
  message: string;
  fix?: string;
}

async function checkAccessibility(files: string[]): Promise<AccessibilityIssue[]> {
  const issues: AccessibilityIssue[] = [];

  for (const file of files) {
    const content = await readFile(file);

    // Check: icon-only buttons without aria-label
    const iconButtonPattern = /<button[^>]*>[\s]*<[^>]*Icon[^>]*\/>[\s]*<\/button>/g;
    // ... 檢查邏輯

    // Check: inputs without labels
    const inputPattern = /<input[^>]*(?!aria-label)[^>]*>/g;
    // ... 檢查邏輯

    // Check: images without alt
    const imgPattern = /<img[^>]*(?!alt=)[^>]*>/g;
    // ... 檢查邏輯
  }

  return issues;
}
```

### Performance Checker

```typescript
interface PerformanceIssue {
  rule: string;
  severity: 'critical' | 'warning';
  file: string;
  line: number;
  message: string;
  fix?: string;
}

async function checkPerformance(files: string[]): Promise<PerformanceIssue[]> {
  const issues: PerformanceIssue[] = [];

  for (const file of files) {
    const content = await readFile(file);

    // Check: animating layout properties
    const layoutAnimationPattern = /animate-\[?(width|height|top|left|margin|padding)/g;
    // ... 檢查邏輯

    // Check: missing prefers-reduced-motion
    const hasReducedMotion = content.includes('prefers-reduced-motion') ||
                             content.includes('motion-reduce');
    if (!hasReducedMotion && content.includes('animate-')) {
      // ... 報告問題
    }

    // Check: animation duration > 300ms
    const durationPattern = /duration-\[(\d+)ms\]/g;
    // ... 檢查邏輯
  }

  return issues;
}
```

### SEO Checker

```typescript
interface SEOIssue {
  rule: string;
  severity: 'critical' | 'warning';
  file: string;
  message: string;
  fix?: string;
}

async function checkSEO(files: string[]): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = [];

  // Check layout.tsx for metadata
  const layoutFile = files.find(f => f.endsWith('layout.tsx'));
  if (layoutFile) {
    const content = await readFile(layoutFile);

    if (!content.includes('export const metadata')) {
      issues.push({
        rule: 'metadata-required',
        severity: 'critical',
        file: layoutFile,
        message: 'Missing metadata export',
        fix: 'Add metadata export with title and description',
      });
    }
  }

  return issues;
}
```

---

## 自動修復實作

### Fix: Missing ARIA Label

```typescript
// Before
<button><Icon /></button>

// After
<button aria-label="描述動作"><Icon /></button>
```

### Fix: Missing Focus State

```typescript
// Before
<button className="bg-blue-500 hover:bg-blue-700">

// After
<button className="bg-blue-500 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
```

### Fix: Missing Reduced Motion

```typescript
// Before
<motion.div animate={{ opacity: 1 }}>

// After
const prefersReducedMotion = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
>
```

### Fix: Layout Animation

```typescript
// Before
<div className="animate-[width_300ms]">

// After
// 使用 transform: scaleX() 替代 width 動畫
<div className="animate-[scaleX_300ms] origin-left">
```

---

## 自癒迴圈

```typescript
const MAX_FIX_ATTEMPTS = 3;

async function runQualityGate(files: string[]): Promise<QualityResult> {
  let attempt = 0;
  let issues: Issue[] = [];

  while (attempt < MAX_FIX_ATTEMPTS) {
    // 檢查
    const accessibilityIssues = await checkAccessibility(files);
    const performanceIssues = await checkPerformance(files);
    const seoIssues = await checkSEO(files);

    issues = [
      ...accessibilityIssues,
      ...performanceIssues,
      ...seoIssues,
    ];

    const criticalIssues = issues.filter(i => i.severity === 'critical');

    if (criticalIssues.length === 0) {
      return { passed: true, issues };
    }

    // 自動修復
    await autoFix(criticalIssues);
    attempt++;
  }

  // 超過最大嘗試次數
  return {
    passed: false,
    issues,
    message: `自動修復失敗，仍有 ${issues.filter(i => i.severity === 'critical').length} 個 critical 問題`,
  };
}
```

---

## 輸出報告

```json
{
  "passed": true,
  "summary": {
    "total_issues": 15,
    "critical": 0,
    "warning": 15,
    "auto_fixed": 8
  },
  "accessibility": {
    "passed": true,
    "issues": [
      {
        "rule": "color-contrast",
        "severity": "warning",
        "file": "components/ui/Card.tsx",
        "line": 12,
        "message": "Text contrast is 4.2:1, recommended 4.5:1"
      }
    ]
  },
  "performance": {
    "passed": true,
    "issues": []
  },
  "seo": {
    "passed": true,
    "issues": []
  }
}
```

---

## 用戶通知

品質檢查完成後通知用戶：

### 全部通過

```
✅ **品質檢查完成**

所有檢查項目都已通過：
- ✅ Accessibility (WCAG 2.2 AA)
- ✅ Performance
- ✅ SEO

前端程式碼已準備好進行部署！
```

### 有 Warning

```
✅ **品質檢查完成**

主要檢查項目已通過：
- ✅ Accessibility
- ✅ Performance
- ✅ SEO

⚠️ 有 3 個建議改善項目（非必要）：
1. Card.tsx:12 - 建議提高文字對比度
2. Button.tsx:8 - 建議加入 loading 狀態
3. Header.tsx:5 - 建議加入 skip link

前端程式碼已準備好進行部署！
```

### 自動修復後通過

```
✅ **品質檢查完成**

發現 5 個問題，已自動修復 5 個：
- 修復：3 個 ARIA label 缺失
- 修復：2 個 focus state 缺失

所有檢查項目現在都已通過！
```

---

## 下一步

品質檢查通過後，前端程式碼已準備好：

1. 可以交給 `deployer` skill 進行部署
2. 可以與 `coder` skill 的後端 API 整合
3. 產生 Design Memory 供未來使用
