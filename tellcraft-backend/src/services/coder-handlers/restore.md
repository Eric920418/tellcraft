
## 復原操作 Handler
```typescript
const entityId = input.id || input.xxxId
if (!entityId) throw new Error('缺少 ID 參數')

// 確認已被軟刪除
const [existing] = await sql`SELECT * FROM table_name WHERE id = ${entityId} AND deleted_at IS NOT NULL`
if (!existing) throw new Error('該記錄未被刪除或不存在')

const [row] = await sql`
  UPDATE table_name SET deleted_at = NULL, updated_at = NOW()
  WHERE id = ${entityId}
  RETURNING *
`
return { __status: 200, ...row }
```
重點：復原 = 將 deleted_at 設為 NULL。必須先確認 deleted_at IS NOT NULL。