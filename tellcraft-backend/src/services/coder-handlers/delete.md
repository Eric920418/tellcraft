
## 刪除操作 Handler
```typescript
const entityId = input.id || input.xxxId
if (!entityId) throw new Error('缺少 ID 參數')

// ⚠️ 先看 Schema DDL：
// 如果 Schema 有 deleted_at 欄位 → 軟刪除：
//   UPDATE table_name SET deleted_at = NOW(), updated_at = NOW() WHERE id = ${entityId} RETURNING *
// 如果 Schema 沒有 deleted_at 欄位 → 硬刪除：
const [row] = await sql`
  DELETE FROM table_name
  WHERE id = ${entityId}
  RETURNING *
`
return { __status: 200, ...row }
```
重點：先檢查 Schema DDL 是否有 deleted_at 欄位。沒有就用 DELETE FROM，不要腦補 soft delete。