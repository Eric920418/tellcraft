
## 更新操作 Handler
```typescript
const entityId = input.id || input.xxxId
if (!entityId) throw new Error('缺少 ID 參數')

// 前置（狀態）驗證：必須存在且屬於當前使用者
const existing = await sql`SELECT * FROM table_name WHERE id = ${entityId} AND user_id = ${userId}`
if (existing.length === 0) throw new Error('不存在或不屬於當前使用者')

// UPDATE + RETURNING *（必須展開 row 到回傳物件）
const [row] = await sql`
  UPDATE table_name SET col = ${val}, updated_at = NOW()
  WHERE id = ${entityId}
  RETURNING *
`
return { __status: 200, ...row }
```
重點：__status: 200，RETURNING * 展開到 return。