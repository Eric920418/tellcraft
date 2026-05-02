#!/usr/bin/env bash
# 冪等 migration runner — 自動跑 migrations/ 內所有未套用的 SQL。
#
# 設計原則：
# 1. 用 _migrations 表追蹤已套用檔名，重複呼叫不會重做
# 2. 每個 migration 包在 transaction（-1 旗標），失敗自動 rollback
# 3. 失敗即終止，不繼續往下跑（避免 schema 半套用狀態）
# 4. 第一次部署需先呼叫 bootstrap 把 001~034 標記為已套用（防止重做炸表）
#
# 使用：
#   DATABASE_URL=postgres://... bash scripts/migrate.sh
#   DATABASE_URL=postgres://... bash scripts/migrate.sh --dry-run                 # 預覽待跑
#   DATABASE_URL=postgres://... bash scripts/migrate.sh --bootstrap               # 把所有 migrations 標記為已套用（不執行）
#   DATABASE_URL=postgres://... bash scripts/migrate.sh --bootstrap-up-to=034     # 只把 ≤034 標記為已套用，035+ 留給後續正常跑

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="${SCRIPT_DIR}/../migrations"
: "${DATABASE_URL:?DATABASE_URL 未設定，無法執行 migration}"

MODE="${1:-apply}"

if ! command -v psql >/dev/null 2>&1; then
  echo "❌ psql 命令不存在，請安裝 postgresql-client"
  exit 1
fi

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "❌ Migrations 目錄不存在：$MIGRATIONS_DIR"
  exit 1
fi

# 建立 tracking 表（idempotent）
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
CREATE TABLE IF NOT EXISTS _migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SQL

BOOTSTRAP_UP_TO=""
case "$MODE" in
  --bootstrap)
    echo "📦 Bootstrap mode: 把 migrations/ 內所有 .sql 標記為已套用（不執行）"
    echo "   ⚠️ 警告：若有 migrations 尚未實際套用到 VPS，此模式會誤標為已套用 → 永遠不跑"
    echo "   建議用 --bootstrap-up-to=NNN 指定只標記到某編號"
    for sql_file in "$MIGRATIONS_DIR"/*.sql; do
      filename=$(basename "$sql_file")
      psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c \
        "INSERT INTO _migrations (filename) VALUES ('$filename') ON CONFLICT DO NOTHING"
      echo "   ✓ marked $filename"
    done
    echo "✅ Bootstrap 完成。"
    exit 0
    ;;
  --bootstrap-up-to=*)
    BOOTSTRAP_UP_TO="${MODE#--bootstrap-up-to=}"
    if ! [[ "$BOOTSTRAP_UP_TO" =~ ^[0-9]+$ ]]; then
      echo "❌ --bootstrap-up-to 需要數字，例如 --bootstrap-up-to=034"
      exit 1
    fi
    echo "📦 Bootstrap up to: 把編號 ≤ $BOOTSTRAP_UP_TO 的 migrations 標記為已套用"
    echo "   編號 > $BOOTSTRAP_UP_TO 的會被留下，下次 \`migrate.sh\` 正常跑"
    marked=0
    for sql_file in "$MIGRATIONS_DIR"/*.sql; do
      filename=$(basename "$sql_file")
      # 抽出檔名前的數字編號（例如 035_add_design_memory.sql → 035）
      num=$(echo "$filename" | sed -E 's/^([0-9]+).*/\1/')
      if ! [[ "$num" =~ ^[0-9]+$ ]]; then
        echo "   ⚠️ skip $filename（無編號）"
        continue
      fi
      # 比較數字大小（去除前導零）
      num_clean=$(echo "$num" | sed 's/^0*//')
      [ -z "$num_clean" ] && num_clean=0
      target_clean=$(echo "$BOOTSTRAP_UP_TO" | sed 's/^0*//')
      [ -z "$target_clean" ] && target_clean=0
      if [ "$num_clean" -le "$target_clean" ]; then
        psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c \
          "INSERT INTO _migrations (filename) VALUES ('$filename') ON CONFLICT DO NOTHING"
        echo "   ✓ marked $filename"
        marked=$((marked + 1))
      else
        echo "   → skip $filename（> $BOOTSTRAP_UP_TO，留給正常 apply）"
      fi
    done
    echo "✅ Bootstrap up-to 完成（標記 $marked 個）。下一步：bash scripts/migrate.sh 套用 > $BOOTSTRAP_UP_TO 的 migration。"
    exit 0
    ;;
  --dry-run)
    echo "🔍 Dry-run: 預覽待套用的 migration（不執行）"
    DRY_RUN=1
    ;;
  apply|"")
    DRY_RUN=0
    ;;
  *)
    echo "❌ 未知 mode：$MODE"
    echo "   支援：apply (預設) / --bootstrap / --bootstrap-up-to=NNN / --dry-run"
    exit 1
    ;;
esac

# 主迴圈：按檔名排序套用
applied_count=0
skipped_count=0
for sql_file in "$MIGRATIONS_DIR"/*.sql; do
  filename=$(basename "$sql_file")

  # 檢查是否已套用
  is_applied=$(psql "$DATABASE_URL" -tA -c \
    "SELECT 1 FROM _migrations WHERE filename = '$filename'" 2>/dev/null || echo "")

  if [ "$is_applied" = "1" ]; then
    skipped_count=$((skipped_count + 1))
    continue
  fi

  if [ "${DRY_RUN:-0}" = "1" ]; then
    echo "   [dry-run] 待套用：$filename"
    applied_count=$((applied_count + 1))
    continue
  fi

  echo "▶ 套用 $filename..."
  # -1：整個檔案包在 transaction；ON_ERROR_STOP：第一個錯誤即中止
  if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f "$sql_file"; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c \
      "INSERT INTO _migrations (filename) VALUES ('$filename')"
    echo "  ✅ 完成 $filename"
    applied_count=$((applied_count + 1))
  else
    echo "  ❌ 失敗 $filename — transaction 已 rollback"
    echo ""
    echo "💡 排查建議："
    echo "   1. 檢查上方 psql 錯誤訊息"
    echo "   2. 若是 'relation already exists' 等狀態 drift："
    echo "      → 手動跑 \`INSERT INTO _migrations (filename) VALUES ('$filename')\` 標為已套用"
    echo "   3. 若是 SQL bug：修 migration 檔後重跑 migrate.sh"
    exit 1
  fi
done

echo ""
echo "📊 結果：套用 $applied_count 個、跳過（已套用） $skipped_count 個"
[ "$applied_count" = "0" ] && [ "${DRY_RUN:-0}" = "0" ] && echo "✨ 所有 migration 都已是最新狀態"
exit 0
