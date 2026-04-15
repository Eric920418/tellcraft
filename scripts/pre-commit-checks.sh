#!/bin/bash
# ============================================================
# pre-commit-checks.sh — 防雷清單自動守衛
#
# 從 CLAUDE.md 防雷清單轉化的靜態 grep 檢查。
# 每條規則對應一個已知的踩坑經驗。
# 在 pre-commit hook 和 CI 中執行。
#
# 原則：零 false positive — 只有現在 codebase 沒有 violation 的 pattern 才加入。
# ============================================================

set -euo pipefail

ERRORS=0
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check() {
  local description="$1"
  local pattern="$2"
  local scope="$3"  # directory to search
  local include="$4"  # --include glob
  local exclude="${5:-}"  # optional grep -v pattern

  local cmd="grep -rn '$pattern' '$scope' --include='$include'"
  if [ -n "$exclude" ]; then
    cmd="$cmd | grep -v '$exclude'"
  fi

  local matches
  matches=$(eval "$cmd" 2>/dev/null || true)

  if [ -n "$matches" ]; then
    echo -e "${RED}FAIL${NC} $description"
    echo "$matches" | head -10
    echo ""
    ERRORS=$((ERRORS + 1))
  fi
}

echo "Running pre-commit checks..."
echo ""

# ── 1. Dated Sonnet/Opus model IDs ──
# CLAUDE.md: 一律用 claude-sonnet-4-6（不加日期後綴），claude-sonnet-4-6-20250514 不存在會 404
# Note: claude-haiku-4-5-20251001 IS correct (Haiku requires date suffix)
check \
  "Dated Sonnet/Opus model ID (use claude-sonnet-4-6 or claude-opus-4-6 without date)" \
  'claude-sonnet-4-6-[0-9]\|claude-opus-4-6-[0-9]' \
  "$ROOT_DIR" \
  '*.ts' \
  'node_modules\|__tests__\|\.next\|dist'

# ── 2. Tailwind v3 @tailwind syntax ──
# CLAUDE.md: Tailwind v4 用 @import "tailwindcss"，不是 v3 的 @tailwind
check \
  "@tailwind v3 syntax (use @import \"tailwindcss\" for Tailwind v4)" \
  '@tailwind' \
  "$ROOT_DIR" \
  '*.css' \
  'node_modules\|\.next'

# ── 3. accept-data-loss ──
# CLAUDE.md + 全域指令: 禁止 accept-data-loss
check \
  "accept-data-loss is globally forbidden" \
  'accept-data-loss' \
  "$ROOT_DIR" \
  '*.ts' \
  'node_modules\|__tests__\|\.next\|pre-commit-checks'

# ── 4. Google Fonts <link> or @import in source code ──
# CLAUDE.md: 字體只能用 next/font，禁止 <link> / @import Google Fonts
# Exclude: test files, reference-analyzer (parses external pages' DOM)
check \
  "Google Fonts link/import (use next/font instead)" \
  'fonts\.googleapis\.com' \
  "$ROOT_DIR/app" \
  '*.tsx' \
  'node_modules\|__tests__'

# ── 5. Deprecated templates directory ──
# CLAUDE.md: app/components/templates/ 已廢棄，PreviewPanel 用 WebContainers 渲染
# Note: TemplateSubmitModal.tsx still exists, skip this for now
# (uncomment when migration complete)
# check \
#   "Import from deprecated app/components/templates/" \
#   "from.*components/templates" \
#   "$ROOT_DIR/app" \
#   '*.tsx' \
#   'node_modules\|TemplateSubmitModal'

# ── 6. Hardcoded model strings outside constants file ──
# CLAUDE.md: 全 codebase 用 semantic-gateway.ts 定義的常數而非手打
# Only check tellcraft-backend (frontend has its own llm.ts with intentional model strings)
HARDCODED_MODELS=$(grep -rn "'claude-sonnet-4-6'\|\"claude-sonnet-4-6\"" "$ROOT_DIR/tellcraft-backend/src/" --include='*.ts' 2>/dev/null \
  | grep -v 'anthropic.ts' \
  | grep -v '__tests__' \
  | grep -v 'node_modules' \
  | grep -v '// MODEL' \
  | grep -v 'dist/' \
  || true)
if [ -n "$HARDCODED_MODELS" ]; then
  echo -e "${RED}FAIL${NC} Hardcoded model ID 'claude-sonnet-4-6' (use MODEL.SONNET from lib/anthropic.ts)"
  echo "$HARDCODED_MODELS" | head -10
  echo ""
  ERRORS=$((ERRORS + 1))
fi

# ── 7. recordTelemetry without .catch ──
# CLAUDE.md: recordTelemetry / recordTelemetryBatch 的呼叫端一定要接 .catch(() => {})
# Heuristic: find files that call recordTelemetry but have fewer .catch than calls
for f in $(grep -rl 'recordTelemetry\|recordTelemetryBatch\|recordFailure' "$ROOT_DIR/tellcraft-backend/src/" --include='*.ts' 2>/dev/null \
  | grep -v '__tests__' \
  | grep -v 'skill-telemetry.ts' \
  | grep -v 'node_modules' \
  | grep -v 'dist/' \
  || true); do
  # Count actual calls: must have '(' on the line (exclude import/export/type declarations)
  CALL_COUNT=$(grep 'recordTelemetry\|recordTelemetryBatch\|recordFailure' "$f" 2>/dev/null \
    | grep '(' \
    | grep -v 'import \|export \|from \|type \|interface \|function ' \
    | wc -l | tr -d ' ')
  CATCH_COUNT=$(grep -c '\.catch' "$f" 2>/dev/null || echo 0)
  if [ "$CALL_COUNT" -gt "$CATCH_COUNT" ] && [ "$CALL_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}WARN${NC} $f: $CALL_COUNT telemetry calls but only $CATCH_COUNT .catch() — verify all calls are fire-and-forget"
  fi
done

# ── 8. 新增 sanitize pattern 但沒註冊提示 ──
# CLAUDE.md: 每次改 prompt 或加 code rule 後必須執行 register-prompt-change.ts 註冊
# 偵測 staged diff 是否新增 SANITIZE_PATTERN_MAP entry（格式 [/regex/, 'pattern-key']）
# 不阻擋 commit（作者可能稍後在 VPS 跑註冊），只印 WARN + 指令範本
TELEMETRY_FILE="tellcraft-backend/src/services/skill-telemetry.ts"
if git diff --cached --name-only 2>/dev/null | grep -q "^${TELEMETRY_FILE}$"; then
  NEW_PATTERNS=$(git diff --cached --unified=0 "$TELEMETRY_FILE" 2>/dev/null \
    | grep -E "^\+[[:space:]]*\[/.+/," \
    | grep -oE "'[a-z0-9-]+'" \
    | tr -d "'" \
    | sort -u || true)
  if [ -n "$NEW_PATTERNS" ]; then
    echo -e "${YELLOW}WARN${NC} 偵測到新增 sanitize pattern — 部署到 VPS 後必須執行註冊，否則週報無法追蹤效應："
    echo ""
    for pattern in $NEW_PATTERNS; do
      echo "  pnpm tsx src/scripts/register-prompt-change.ts \\"
      echo "    --pattern ${pattern} \\"
      echo "    --skill <deployer|uiux|quality_gate|coder|iteration> \\"
      echo "    --action <sanitize_rule|qg_rule|prompt_fewshot> \\"
      echo "    --target <target_file> \\"
      echo "    --note \"<why>\""
      echo ""
    done
    echo "  （WARN 只提示，不阻擋 commit。若這條是重新命名既有 pattern，忽略即可）"
    echo ""
  fi
fi

# ── Summary ──
echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo -e "${GREEN}All pre-commit checks passed.${NC}"
else
  echo -e "${RED}$ERRORS check(s) failed. Fix the issues above before committing.${NC}"
  exit 1
fi
