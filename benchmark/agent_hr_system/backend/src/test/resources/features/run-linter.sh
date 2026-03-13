# DEPRECATED: 此 script 依賴已移除的 sdd.os Python codegen 框架（PR #180），且包含 hardcoded 個人路徑。
# 保留作為歷史參考。
cd "/Users/johnnypan/Projects/人生mono/VibeFormula.AI" && for file in "打卡記錄.isa.feature" "打卡刪除.isa.feature" "請假申請.isa.feature" "查詢當日工時摘要.isa.feature" "查詢打卡紀錄.isa.feature"; do
  echo "========== 測試: $file =========="
  python3 -m src.linters.isa.cli \
    --workspace "Benchmark/特務人資系統" \
    --isa-yml "spec/isa/isa.yml" \
    --feature "backend/src/test/resources/features/$file"