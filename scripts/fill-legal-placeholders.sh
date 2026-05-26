#!/usr/bin/env bash
# ============================================================
# 填入 4 個合規頁的 placeholder（[BUSINESS_LEGAL_NAME] 等）
#
# 用途：取代 app/[locale]/{terms,privacy,refund,contact}/page.tsx 內的
#       5 個 placeholder 為真實值，避免 Stripe 審核看到 [PLACEHOLDER]
#       直接拒件 + 客戶看到「[SUPPORT_EMAIL]」笑出來。
#
# 使用：在 tellcraft repo root 跑
#   bash scripts/fill-legal-placeholders.sh
#
# 設計原則：
# - 互動式提示，跟 setup-stripe-env.sh 同模式
# - perl -i + \Q\E quotemeta，跨平台 + 特殊字元安全（&, /, ', " 都 OK）
# - 不用 bash 4 的 declare -A（macOS 預設 bash 3.2 不支援），用 indexed arrays
# - 套用前 preview 確認，套用後印 git diff 指令
# - 不自動 commit — 內容是你的公司資訊，由你決定何時推
# - Idempotent：placeholder 已替換過再跑也 OK（perl 找不到字串就 noop）
# ============================================================

set -euo pipefail

# ── 顏色 ──
RED=$'\e[0;31m'
GREEN=$'\e[0;32m'
YELLOW=$'\e[1;33m'
CYAN=$'\e[0;36m'
DIM=$'\e[2m'
RESET=$'\e[0m'

err()  { echo "${RED}✗ $*${RESET}" >&2; }
ok()   { echo "${GREEN}✓ $*${RESET}"; }
info() { echo "${CYAN}→ $*${RESET}"; }
warn() { echo "${YELLOW}⚠ $*${RESET}"; }

# ── 前置檢查：必須在 repo root（4 個 page 都存在）──
TARGETS=(
  "app/[locale]/terms/page.tsx"
  "app/[locale]/privacy/page.tsx"
  "app/[locale]/refund/page.tsx"
  "app/[locale]/contact/page.tsx"
)
for f in "${TARGETS[@]}"; do
  if [[ ! -f "$f" ]]; then
    err "找不到 $f — 請在 tellcraft repo root 執行此腳本"
    err "目前目錄：$(pwd)"
    exit 1
  fi
done

# ── perl 是必要工具（macOS / Ubuntu 都預裝）──
command -v perl >/dev/null 2>&1 || { err "需要 perl 但找不到"; exit 1; }

# ============================================================
# Placeholder + 對應提示文案（parallel indexed arrays，相容 bash 3.2+）
# ============================================================

PLACEHOLDERS=(
  "[BUSINESS_LEGAL_NAME]"
  "[SUPPORT_EMAIL]"
  "[BUSINESS_TAX_ID]"
  "[BUSINESS_ADDRESS]"
  "[BUSINESS_OWNER_NAME]"
)

LABELS=(
  "公司全名 (e.g. Tellcraft 有限公司 / Tellcraft Ltd.)"
  "支援 email (e.g. support@tellcraft.com)"
  "統一編號 8 碼 (個人戶可填 N/A 或留空)"
  "公司登記地址 (個人戶可填居住縣市)"
  "負責人本名"
)

# ============================================================
# Step 1：印現有 placeholder 統計（讓用戶知道還要替換幾處）
# ============================================================

echo
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo "${CYAN}合規頁 placeholder 替換工具${RESET}"
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo
info "當前 placeholder 統計（4 個 page 加總）："
for i in "${!PLACEHOLDERS[@]}"; do
  ph="${PLACEHOLDERS[$i]}"
  # grep -F 用 fixed string 不解釋 regex（[] 才不會被當字符類）
  count=$(grep -F -o "$ph" "${TARGETS[@]}" 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$count" -eq 0 ]]; then
    ok "  $ph  (已替換完畢)"
  else
    echo "  ${YELLOW}$ph${RESET}  (${count} 處)"
  fi
done
echo

# ============================================================
# Step 2：互動輸入每個值
# ============================================================

VALUES=()
for i in "${!PLACEHOLDERS[@]}"; do
  ph="${PLACEHOLDERS[$i]}"
  label="${LABELS[$i]}"
  echo "${CYAN}━━ $((i + 1))/${#PLACEHOLDERS[@]} ━━${RESET}"
  echo "$label"
  printf "  $ph = "
  IFS= read -r val
  VALUES+=("$val")
  echo
done

# ============================================================
# Step 3：preview + 確認
# ============================================================

echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo "${CYAN}即將替換：${RESET}"
for i in "${!PLACEHOLDERS[@]}"; do
  ph="${PLACEHOLDERS[$i]}"
  val="${VALUES[$i]}"
  if [[ -z "$val" ]]; then
    echo "  ${DIM}$ph → (空，跳過)${RESET}"
  else
    echo "  $ph → ${GREEN}$val${RESET}"
  fi
done
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo
printf "確認套用到 4 個 page.tsx？ (y/N): "
read -r confirm
if [[ ! "$confirm" =~ ^[Yy] ]]; then
  warn "取消，沒有檔案被修改"
  exit 0
fi

# ============================================================
# Step 4：套用（perl + 環境變數 = 完全跨平台 + 特殊字元安全）
# ============================================================

echo
info "套用中..."
for i in "${!PLACEHOLDERS[@]}"; do
  ph="${PLACEHOLDERS[$i]}"
  val="${VALUES[$i]}"
  [[ -z "$val" ]] && continue

  # 用 env var 傳值給 perl，避免 shell-level 引號轉義地獄
  # perl 內 \Q$ENV{...}\E 是 quotemeta — 字面 match 不解釋為 regex
  export REPLACE_PH="$ph"
  export REPLACE_VAL="$val"
  for f in "${TARGETS[@]}"; do
    perl -i -pe 's/\Q$ENV{REPLACE_PH}\E/$ENV{REPLACE_VAL}/g' "$f"
  done
  unset REPLACE_PH REPLACE_VAL
  ok "$ph 已替換為 $val"
done

# ============================================================
# Step 5：驗證 + 下一步指引
# ============================================================

echo
info "替換後檢查（如果還看到 placeholder = 那欄你跳過了，請重跑）："
remaining=0
for ph in "${PLACEHOLDERS[@]}"; do
  count=$(grep -F -o "$ph" "${TARGETS[@]}" 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$count" -gt 0 ]]; then
    warn "  $ph 還有 $count 處未替換"
    remaining=$((remaining + count))
  fi
done
[[ "$remaining" -eq 0 ]] && ok "全部 placeholder 都已替換 ✓"

echo
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo "${GREEN}下一步（你自己做，內容是公司資訊，由你 commit）${RESET}：${RESET}"
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
cat <<'EOF'

  # 1) 看一下 diff 確認
  git diff app/\[locale\]/{terms,privacy,refund,contact}/page.tsx | less

  # 2) 看 OK 就 commit
  git add app/\[locale\]/{terms,privacy,refund,contact}/page.tsx
  git commit -m "chore(legal): 填入公司資訊到 4 個合規頁"
  git push

  # 3) 部署完成後到 Stripe Dashboard:
  # Settings → Business details → 填這 4 個 URL：
  #   https://tellcraft.com/zh/terms
  #   https://tellcraft.com/zh/privacy
  #   https://tellcraft.com/zh/refund
  #   https://tellcraft.com/zh/contact

EOF
