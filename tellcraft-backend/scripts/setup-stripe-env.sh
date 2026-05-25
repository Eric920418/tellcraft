#!/usr/bin/env bash
# ============================================================
# Stripe 環境變數安裝腳本（互動式，secret 不經 git/log）
#
# 用途：把 STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET 安全寫進 tellcraft-backend/.env
#
# 使用方式：
#   ssh your-vps
#   cd /var/www/tellcraft && git pull
#   cd tellcraft-backend
#   bash scripts/setup-stripe-env.sh
#
# 設計原則：
# - 用 `read -s` 隱藏輸入（terminal 不 echo、不進 bash history）
# - 寫進前先 curl Stripe API 確認 key 可用（fail-fast）
# - 自動備份既有 .env 到 .env.backup-<timestamp>
# - 自動補 .gitignore（萬一 .env 沒被 ignore）
# - 印 key 永遠 mask 為 sk_xxx_xxxx...XXXX（前 8 + 後 4）
# - 不在腳本內 echo 完整 key（即使在 set -x debug mode 也只看到變數名）
# ============================================================

set -eu

# ── 顏色 ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
RESET='\033[0m'

err()  { echo -e "${RED}✗ $*${RESET}" >&2; }
ok()   { echo -e "${GREEN}✓ $*${RESET}"; }
warn() { echo -e "${YELLOW}⚠ $*${RESET}"; }
info() { echo -e "${CYAN}→ $*${RESET}"; }

# ── 前置檢查：必須在 tellcraft-backend/ 跑 ──
if [[ ! -f "package.json" ]] || ! grep -q '"name": *"tellcraft-backend"' package.json 2>/dev/null; then
  err "請在 tellcraft-backend/ 目錄執行此腳本"
  err "目前在：$(pwd)"
  exit 1
fi

# ── mask 函數 ──
mask() {
  local k="$1"
  local len=${#k}
  if [[ $len -lt 12 ]]; then
    echo "***"
  else
    echo "${k:0:8}...${k: -4} (長度 $len)"
  fi
}

# ── upsert env 函數（取代或新增 KEY=VALUE 行）──
upsert_env() {
  local file="$1"
  local key="$2"
  local val="$3"
  # 用 awk 取代避免 sed 跨平台問題；val 含特殊字元也安全
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    awk -v k="$key" -v v="$val" 'BEGIN{FS=OFS="="} $1==k {print k"="v; next} {print}' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  else
    echo "${key}=${val}" >> "$file"
  fi
}

# ============================================================
# Step 1：確認 .env 存在 + 備份
# ============================================================

if [[ -f .env ]]; then
  BACKUP=".env.backup-$(date +%Y%m%d-%H%M%S)"
  cp .env "$BACKUP"
  ok "備份既有 .env → $BACKUP"

  # 警告：既有 STRIPE_* 會被覆蓋
  if grep -qE "^STRIPE_(SECRET_KEY|WEBHOOK_SECRET)=" .env; then
    warn "偵測到既有 STRIPE_* 變數，會被覆蓋（備份在 $BACKUP）"
  fi
else
  touch .env
  ok "新建 .env"
fi

# ============================================================
# Step 2：確認 .gitignore 有擋 .env
# ============================================================

# 找 monorepo 根的 .gitignore（往上 1 層）
GITIGNORE=""
for p in ".gitignore" "../.gitignore"; do
  if [[ -f "$p" ]]; then
    GITIGNORE="$p"
    break
  fi
done

if [[ -n "$GITIGNORE" ]]; then
  if grep -qE "^\.env$|/\.env$|^\.env\*" "$GITIGNORE" 2>/dev/null; then
    ok ".gitignore 已正確擋 .env ($GITIGNORE)"
  else
    warn ".gitignore 沒擋 .env，加入中..."
    echo "" >> "$GITIGNORE"
    echo "# Auto-added by setup-stripe-env.sh" >> "$GITIGNORE"
    echo ".env" >> "$GITIGNORE"
    echo ".env.backup-*" >> "$GITIGNORE"
    ok ".env 跟 .env.backup-* 已加到 $GITIGNORE"
  fi
else
  warn "找不到 .gitignore（你不在 git repo？）— 跳過此檢查"
fi

# ============================================================
# Step 3：互動輸入 STRIPE_SECRET_KEY
# ============================================================

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${CYAN}Stripe Secret Key${RESET}"
echo -e "${DIM}從 https://dashboard.stripe.com/apikeys 取得${RESET}"
echo -e "${DIM}（live mode：sk_live_xxx / test mode：sk_test_xxx）${RESET}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
printf "請貼上 STRIPE_SECRET_KEY（輸入會隱藏，貼完按 Enter）："
read -rs STRIPE_SECRET_KEY
echo ""

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  err "STRIPE_SECRET_KEY 為空，取消"
  exit 1
fi

if [[ ! "$STRIPE_SECRET_KEY" =~ ^sk_(live|test)_ ]]; then
  err "格式錯誤：必須以 sk_live_ 或 sk_test_ 開頭"
  err "你輸入的：$(mask "$STRIPE_SECRET_KEY")"
  exit 1
fi

ok "格式正確：$(mask "$STRIPE_SECRET_KEY")"

# ── 呼叫 Stripe API 驗證 key 可用 ──
info "呼叫 Stripe API (/v1/balance) 確認 key 可用..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 10 \
  https://api.stripe.com/v1/balance \
  -u "${STRIPE_SECRET_KEY}:" 2>/dev/null || echo "000")

case "$HTTP_CODE" in
  200)
    ok "Stripe API 回應 200，key 可用"
    ;;
  401)
    err "Stripe API 回應 401 Unauthorized — key 無效或已被 revoke"
    exit 1
    ;;
  403)
    err "Stripe API 回應 403 Forbidden — restricted key 權限不足"
    err "請改用 Standard Secret key (sk_xxx) 而不是 Restricted key (rk_xxx)"
    exit 1
    ;;
  000)
    err "無法連到 Stripe API（網路問題？）"
    exit 1
    ;;
  *)
    warn "Stripe API 回應非預期 HTTP $HTTP_CODE — 繼續但建議檢查"
    ;;
esac

# ============================================================
# Step 4：互動輸入 STRIPE_WEBHOOK_SECRET
# ============================================================

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${CYAN}Stripe Webhook Signing Secret${RESET}"
echo -e "${DIM}從 https://dashboard.stripe.com/webhooks 取得${RESET}"
echo -e "${DIM}點你 endpoint → Signing secret → Reveal（whsec_xxx）${RESET}"
echo -e "${DIM}沒建 endpoint 的話：先建 endpoint 指向 https://api.tellcraft.com/api/stripe/webhook${RESET}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
printf "請貼上 STRIPE_WEBHOOK_SECRET（輸入會隱藏，沒有按 Enter 跳過）："
read -rs STRIPE_WEBHOOK_SECRET
echo ""

if [[ -z "${STRIPE_WEBHOOK_SECRET:-}" ]]; then
  warn "STRIPE_WEBHOOK_SECRET 為空 — 跳過，但 webhook 會全部 401"
  warn "之後再跑此腳本補設即可"
elif [[ ! "$STRIPE_WEBHOOK_SECRET" =~ ^whsec_ ]]; then
  err "格式錯誤：必須以 whsec_ 開頭"
  err "你輸入的：$(mask "$STRIPE_WEBHOOK_SECRET")"
  exit 1
else
  ok "格式正確：$(mask "$STRIPE_WEBHOOK_SECRET")"
fi

# ============================================================
# Step 5：寫入 .env
# ============================================================

echo ""
info "寫入 .env..."

upsert_env .env "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
ok "STRIPE_SECRET_KEY 已寫入"

if [[ -n "${STRIPE_WEBHOOK_SECRET:-}" ]]; then
  upsert_env .env "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET"
  ok "STRIPE_WEBHOOK_SECRET 已寫入"
fi

# 立即清空變數（最小化記憶體殘留）
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# ============================================================
# Step 6：reload pm2（若可用）
# ============================================================

echo ""
if command -v pm2 &>/dev/null; then
  info "Reload pm2..."
  pm2 reload tellcraft-api tellcraft-worker 2>&1 | tail -3 || warn "pm2 reload 失敗"

  sleep 2
  echo ""
  info "檢查 backend log 是否成功載入 Stripe SDK..."
  if pm2 logs tellcraft-api --lines 30 --nostream 2>&1 | grep -qE "Stripe SDK (初始化成功|loaded)"; then
    ok "Backend 已成功載入 Stripe SDK"
  else
    warn "log 沒看到 'Stripe SDK 初始化成功' — 手動檢查："
    warn "  pm2 logs tellcraft-api --lines 30 | grep -i stripe"
  fi
else
  warn "未偵測到 pm2 — 請手動重啟 backend"
fi

# ============================================================
# Step 7：driveby health check
# ============================================================

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}✓ Stripe env 安裝完成${RESET}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo "下一步驗證（從本機跑）："
echo ""
echo "  # 1) Webhook endpoint 應拒絕無簽名請求"
echo "  curl -X POST https://api.tellcraft.com/api/stripe/webhook \\"
echo "    -H 'content-type: application/json' -d '{}'"
echo "  # 期望：{\"error\":\"Signature verification failed: missing_signature\"}"
echo ""
echo "  # 2) 從 Stripe Dashboard webhook 頁面點「Send test event」"
echo "  #    → 看 Dashboard 顯示 200 OK"
echo "  #    → pm2 logs tellcraft-api | grep stripe-webhook"
echo ""
echo "  # 3) 走完整付款流程：https://tellcraft.com/zh/pay/standard_599"
echo "  #    （test mode 用測試卡 4242 4242 4242 4242）"
echo ""
