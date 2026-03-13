#!/bin/bash

# DEPRECATED: 此 script 依賴已移除的 sdd.os Python codegen 框架（PR #180）。
# `python3 -m sdd_os.isa_linters.isa.cli` 已不可用。保留作為歷史參考。

# ISA Linter - 檢驗所有 feature files
# 此 script 會檢驗當前目錄下所有的 .isa.feature 檔案

# 設定顏色輸出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 取得 script 所在目錄
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 設定 sdd.os 專案根目錄
SDD_OS_ROOT="$SCRIPT_DIR/../../../../../../.."

# 設定 backend 目錄作為 workspace（plugin_python_path 相對於此目錄）
BACKEND_DIR="$SCRIPT_DIR/../../../.."

# 設定相關路徑（相對於 BACKEND_DIR）
ISA_YML_PATH="isa_codegen.yml"
FEATURES_DIR="src/test/resources/features"

echo "=========================================="
echo "ISA Linter - Feature Files 檢驗"
echo "=========================================="
echo "SDD.os 根目錄: $SDD_OS_ROOT"
echo "Backend 目錄: $BACKEND_DIR"
echo "ISA 配置檔: $ISA_YML_PATH"
echo "Features 目錄: $FEATURES_DIR"
echo "=========================================="
echo ""

# 檢查 ISA YML 檔案是否存在
if [ ! -f "$BACKEND_DIR/$ISA_YML_PATH" ]; then
    echo -e "${RED}錯誤: 找不到 isa_codegen.yml 檔案${NC}"
    echo "路徑: $BACKEND_DIR/$ISA_YML_PATH"
    exit 1
fi

# 切換到 SDD.os 專案根目錄
cd "$SDD_OS_ROOT" || exit 1

# 設定 PYTHONPATH 確保能找到 src 模組
export PYTHONPATH="$SDD_OS_ROOT:$PYTHONPATH"

# 執行 ISA Linter
echo "開始檢驗所有 feature files..."
echo ""

python3 -m sdd_os.isa_linters.isa.cli \
    --workspace "$BACKEND_DIR" \
    --isa-yml "$ISA_YML_PATH" \
    --features-dir "$FEATURES_DIR"

# 取得執行結果
LINT_RESULT=$?

echo ""
echo "=========================================="
if [ $LINT_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ 所有檢驗通過！${NC}"
else
    echo -e "${RED}✗ 檢驗失敗，請修正上述錯誤${NC}"
fi
echo "=========================================="

exit $LINT_RESULT

