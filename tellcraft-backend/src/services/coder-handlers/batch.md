
## 批次操作 Handler
```typescript
// 輸入：逗號分隔字串 → split 成陣列
const ids = (input.orderedItemIds || '').split(',').map(s => s.trim()).filter(Boolean)
if (ids.length === 0) throw new Error('缺少 orderedItemIds 參數')

// 逐筆 UPDATE
for (let i = 0; i < ids.length; i++) {
  await sql`UPDATE table_name SET sort_order = ${i + 1}, updated_at = NOW() WHERE id = ${ids[i]}`
}
return { __status: 200, success: true }
```
重點：回傳 { success: true }，PostgreSQL array 查詢用 ANY(${ids}::uuid[])。