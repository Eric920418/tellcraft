
## 切換操作 Handler
```typescript
const entityId = input.id || input.xxxId
if (!entityId) throw new Error('缺少 ID 參數')

// 查找當前狀態
const [existing] = await sql`SELECT * FROM table_name WHERE id = ${entityId} AND deleted_at IS NULL`
if (!existing) throw new Error('不存在或已被刪除')

// 切換布林欄位（如 is_completed）
const [row] = await sql`
  UPDATE table_name SET is_xxx = NOT is_xxx, updated_at = NOW()
  WHERE id = ${entityId}
  RETURNING *
`
return { __status: 200, ...row }
```
重點：先 SELECT 確認存在且未刪除，再 UPDATE SET field = NOT field。