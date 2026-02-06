# Phase 3: Implementation

## 目標

根據確定的設計方向，產出 Next.js + Tailwind CSS 前端程式碼。

---

## 輸入

- 確定的設計方向（來自 Phase 2）
- Design Brief
- BDD 規格（如有）
- 專案現有的組件和樣式

---

## 技術規範

### Framework: Next.js App Router

```tsx
// 優先使用 Server Components
// app/page.tsx
export default function HomePage() {
  return <main>...</main>;
}

// 只在需要互動時使用 Client Components
// components/InteractiveButton.tsx
'use client';
export function InteractiveButton() { ... }
```

### Styling: Tailwind CSS

Tailwind CSS utility-first 原則：

```tsx
// ✅ 正確：utility-first
<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">

// ❌ 錯誤：自定義 CSS
<button className={styles.button}>
```

### Responsive: Mobile-first

```tsx
// Mobile-first breakpoints
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Mobile: 100%, Tablet: 50%, Desktop: 33% */}
</div>
```

Breakpoints:
- `sm:` 640px+
- `md:` 768px+
- `lg:` 1024px+
- `xl:` 1280px+
- `2xl:` 1536px+

### Animation: motion/react

```tsx
import { motion } from 'motion/react';

<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
```

約束：
- 只動畫 `transform` 和 `opacity`
- 微互動 ≤ 200ms
- 頁面轉場 ≤ 300ms
- **MUST** 處理 `prefers-reduced-motion`

### Components: Accessible Primitives

使用無障礙組件庫（優先順序）：
1. 專案現有的組件
2. Base UI
3. Radix
4. React Aria

```tsx
// ✅ 使用 Base UI
import { Button } from '@base-ui-components/react';

// ❌ 不要自己實作鍵盤/focus 行為
<div onClick={...} onKeyDown={...}>
```

---

## 程式碼結構

### 頁面結構

```
app/
├── page.tsx                    # 首頁
├── layout.tsx                  # 共用 layout
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── dashboard/
│   ├── page.tsx
│   └── layout.tsx
└── [feature]/
    └── page.tsx
```

### 組件結構

```
components/
├── ui/                         # 基礎 UI 組件
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── index.ts
├── forms/                      # 表單組件
│   ├── LoginForm.tsx
│   └── SearchForm.tsx
├── layout/                     # 佈局組件
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
└── [feature]/                  # 功能特定組件
    └── FeatureCard.tsx
```

### 樣式結構

```
styles/
├── globals.css                 # 全域樣式
└── tokens.css                  # Design tokens (CSS variables)
```

---

## 實作清單

### 1. 全域樣式

```css
/* styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Design tokens from Phase 2 */
    --color-primary: theme('colors.blue.500');
    --color-background: theme('colors.white');
    --color-foreground: theme('colors.slate.900');

    /* Spacing scale */
    --spacing-base: 4px;

    /* Typography */
    --font-sans: 'Inter', system-ui, sans-serif;
  }

  .dark {
    --color-background: theme('colors.slate.900');
    --color-foreground: theme('colors.slate.50');
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 2. Layout 組件

```tsx
// components/layout/RootLayout.tsx
export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

注意：
- 使用 `min-h-dvh` 而非 `min-h-screen`
- 使用 `safe-area-inset` 處理 fixed 元素

### 3. 互動組件

每個互動組件必須有完整狀態：

```tsx
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base
        "inline-flex items-center justify-center font-medium rounded-lg transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        // Variant
        variant === 'primary' && "bg-primary text-white hover:bg-primary/90",
        variant === 'secondary' && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === 'ghost' && "hover:bg-accent hover:text-accent-foreground",
        // Size
        size === 'sm' && "h-8 px-3 text-sm",
        size === 'md' && "h-10 px-4",
        size === 'lg' && "h-12 px-6 text-lg",
        // States
        (disabled || loading) && "opacity-50 cursor-not-allowed",
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
}
```

### 4. 表單處理

```tsx
// 使用 Server Actions
'use server';

export async function submitForm(formData: FormData) {
  // 驗證
  // 處理
  // 重新驗證
}
```

```tsx
// 表單組件
<form action={submitForm}>
  <Input
    name="email"
    aria-describedby="email-error"
    aria-invalid={hasError}
  />
  {hasError && (
    <span id="email-error" role="alert" className="text-destructive text-sm">
      {errorMessage}
    </span>
  )}
</form>
```

### 5. Metadata

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    template: '%s | Site Name',
    default: 'Site Name',
  },
  description: 'Site description',
  openGraph: {
    title: 'Site Name',
    description: 'Site description',
    url: 'https://example.com',
    siteName: 'Site Name',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },
};
```

---

## 自我檢查

實作完成後，在提交前自我檢查：

### 視覺品質
- [ ] 沒有使用 emoji 作為 icon（使用 SVG）
- [ ] 所有可點擊元素有 `cursor-pointer`
- [ ] Hover 狀態提供清晰視覺反饋
- [ ] Light/Dark mode 對比度足夠

### 互動
- [ ] 所有互動元素可鍵盤操作
- [ ] Focus states 可見
- [ ] Transitions smooth（150-300ms）

### RWD
- [ ] 375px（Mobile）正常顯示
- [ ] 768px（Tablet）正常顯示
- [ ] 1024px（Desktop）正常顯示
- [ ] 1440px（Large）正常顯示
- [ ] 沒有水平捲動

### 無障礙
- [ ] 所有圖片有 alt text
- [ ] 表單輸入有 labels
- [ ] 顏色不是唯一指標
- [ ] `prefers-reduced-motion` 有處理

---

## 輸出

產出檔案清單：

```json
{
  "pages": [
    "app/page.tsx",
    "app/dashboard/page.tsx",
    "app/[feature]/page.tsx"
  ],
  "components": [
    "components/ui/Button.tsx",
    "components/ui/Card.tsx",
    "components/layout/Header.tsx"
  ],
  "styles": [
    "styles/globals.css"
  ]
}
```

---

## 下一步

Implementation 完成後，UIUX Skill 流程結束。產出的程式碼可供部署。
