#!/bin/bash
# ============================================================
# 一鍵推送所有模板預覽到 VPS
# 使用方式：
#   方式 1（API）: VPS_URL=http://54.238.4.117:8080 AUTH_TOKEN=xxx ./push-all-previews.sh api
#   方式 2（SQL）: DATABASE_URL=xxx ./push-all-previews.sh sql
#   方式 3（SSH）: ./push-all-previews.sh ssh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MODE="${1:-sql}"
VPS_URL="${VPS_URL:-http://54.238.4.117:8080}"
SUCCESS=0
FAIL=0
SKIP=0

echo "============================================"
echo "  模板預覽批量推送"
echo "  模式: $MODE"
echo "============================================"

# 收集所有要推送的 SQL 檔案
# 優先使用 v2 版本（如果存在）
declare -A PUSH_FILES

for f in "$SCRIPT_DIR"/preview-*.sql; do
  basename=$(basename "$f")

  # 提取 slug（去除 preview- 前綴、序號、-v2 後綴、.sql）
  # 格式: preview-NNN-slug.sql 或 preview-NNN-slug-v2.sql 或 preview-slug-v2.sql
  slug=$(echo "$basename" | sed -E 's/^preview-([0-9]+-)?//' | sed -E 's/(-v2)?\.sql$//')

  # 提取序號（如果有）
  num=$(echo "$basename" | grep -oE '^preview-[0-9]+' | sed 's/preview-//')

  is_v2=false
  [[ "$basename" == *"-v2.sql" ]] && is_v2=true

  key="${num:-nonum}-${slug}"

  # v2 優先
  if $is_v2; then
    PUSH_FILES[$key]="$f"
  elif [[ -z "${PUSH_FILES[$key]}" ]]; then
    PUSH_FILES[$key]="$f"
  fi
done

echo "找到 ${#PUSH_FILES[@]} 個模板要推送"
echo ""

push_via_sql() {
  local file="$1"
  if [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" -f "$file" 2>&1
  elif [ -n "$PGHOST" ]; then
    psql -f "$file" 2>&1
  else
    echo "ERROR: 需要設定 DATABASE_URL 或 PGHOST"
    return 1
  fi
}

push_via_ssh() {
  local file="$1"
  cat "$file" | ssh docker3.archien.me "psql \$DATABASE_URL" 2>&1
}

push_via_api() {
  local file="$1"

  # 從 SQL 提取 template_id 和 html_content
  local template_id=$(grep -oP "(?<=')[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=')" "$file" | head -1)

  if [ -z "$template_id" ]; then
    echo "  ERROR: 無法提取 template_id"
    return 1
  fi

  # 提取 $HTML$ 之間的內容
  local html_content=$(sed -n '/\$HTML\$/,/\$HTML\$/p' "$file" | sed '1d;$d')

  # 透過 API 推送
  local response=$(curl -s -X PUT "${VPS_URL}/api/templates/preview/${template_id}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d "$(jq -n --arg html "$html_content" '{html_content: $html}')" 2>&1)

  echo "  Response: $response"
  echo "$response" | grep -q '"success":true'
}

for key in $(echo "${!PUSH_FILES[@]}" | tr ' ' '\n' | sort); do
  file="${PUSH_FILES[$key]}"
  basename=$(basename "$file")
  size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)

  echo -n "[$((SUCCESS + FAIL + SKIP + 1))/${#PUSH_FILES[@]}] $basename (${size}B)... "

  case "$MODE" in
    sql)
      if push_via_sql "$file"; then
        echo "OK"
        ((SUCCESS++))
      else
        echo "FAIL"
        ((FAIL++))
      fi
      ;;
    ssh)
      if push_via_ssh "$file"; then
        echo "OK"
        ((SUCCESS++))
      else
        echo "FAIL"
        ((FAIL++))
      fi
      ;;
    api)
      if push_via_api "$file"; then
        echo "OK"
        ((SUCCESS++))
      else
        echo "FAIL"
        ((FAIL++))
      fi
      ;;
    *)
      echo "未知模式: $MODE"
      exit 1
      ;;
  esac
done

echo ""
echo "============================================"
echo "  推送完成: ${SUCCESS} 成功 / ${FAIL} 失敗 / ${SKIP} 跳過"
echo "============================================"

# 驗證
if [ "$MODE" = "sql" ] || [ "$MODE" = "ssh" ]; then
  echo ""
  echo "驗證寫入結果："
  VERIFY_SQL="SELECT t.slug, length(tp.html_content) as html_size, tp.version
    FROM template_previews tp
    JOIN templates t ON t.id = tp.template_id
    ORDER BY t.slug;"

  if [ "$MODE" = "sql" ]; then
    psql "$DATABASE_URL" -c "$VERIFY_SQL"
  else
    echo "$VERIFY_SQL" | ssh docker3.archien.me "psql \$DATABASE_URL"
  fi
fi
