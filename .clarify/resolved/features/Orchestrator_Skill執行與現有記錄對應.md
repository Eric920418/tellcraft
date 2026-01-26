# 釐清問題

新增的 skill_executions 表與現有的 generations、deployments 表是什麼關係？

# 定位

資料模型：skill_executions 與現有表的關係

# 決議

**選項 A：skill_executions 是總表，generations/deployments 是細節表**

- skill_executions 記錄所有 Skill 執行的通用資訊
- generations 表保留，記錄程式碼生成的細節（generated_code_url 等）
- deployments 表保留，記錄部署的細節（vercel_deployment_id 等）
- 透過 skill_execution_id 外鍵關聯
- 這樣既有統一的執行追蹤，又保留各 Skill 特有的細節

# 解決日期

2026-01-23
