# 多階段構建 Dockerfile for Next.js

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# 安裝 libc6-compat 以支援某些 npm 套件
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 複製 package files
COPY package.json package-lock.json* ./

# 安裝依賴（使用 ci 來確保一致性）
RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# 從 deps 階段複製 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 複製所有原始碼
COPY . .

# 設定環境變數（構建時）
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# 構建 Next.js 應用
# 注意：環境變數 NEXT_PUBLIC_* 需要在構建時提供
RUN npm run build

# ============================================
# Stage 3: Runner（最終映像）
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# 設定環境變數
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 建立 nextjs 使用者（安全性考量）
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 複製必要檔案
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 修改檔案擁有者
RUN chown -R nextjs:nodejs /app

# 切換到 nextjs 使用者
USER nextjs

# 暴露端口
EXPOSE 3000

# 設定環境變數
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 啟動應用
CMD ["node", "server.js"]
