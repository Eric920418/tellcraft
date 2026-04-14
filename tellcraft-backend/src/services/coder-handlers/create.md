
## 建立操作 Handler
```typescript
// 前置（參數）驗證
if (!input.xxx) throw new Error('xxx 必須提供')

// INSERT + RETURNING *（必須展開 row 到回傳物件）
const [row] = await sql`
  INSERT INTO table_name (id, user_id, ..., created_at, updated_at)
  VALUES (gen_random_uuid(), ${userId}, ..., NOW(), NOW())
  RETURNING *
`
return { __status: 201, ...row }
```
重點：__status: 201，RETURNING * 展開到 return。