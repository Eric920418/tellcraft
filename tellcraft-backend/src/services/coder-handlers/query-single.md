
## 單筆查詢 Handler
```typescript
const entityId = input.id || input.xxxId
if (!entityId) throw new Error('缺少 ID 參數')
const [row] = await sql`SELECT * FROM table_name WHERE id = ${entityId}`
if (!row) throw new Error('找不到資料')
return { __status: 200, ...row }
```