
## 欄位別名（PostgreSQL snake_case → camelCase）
PostgreSQL 回傳的欄位名是 snake_case（category_id, created_at, transaction_date）。
BDD 測試驗證的欄位名是 camelCase（categoryId, createdAt, transactionDate）。
必須在回傳前轉換，否則測試一定失敗！
```typescript
// 方法 1: SQL AS 別名（推薦）
SELECT category_id as "categoryId", created_at as "createdAt", updated_at as "updatedAt" FROM ...

// 方法 2: 程式碼轉換（適合 RETURNING * 展開場景）
function snakeToCamel(row: any) {
  if (!row) return row
  const result: any = {}
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    result[camelKey] = value
  }
  return result
}
// 用在 INSERT/UPDATE/DELETE RETURNING * 後
const [row] = await sql`UPDATE ... RETURNING *`
return { __status: 200, ...snakeToCamel(row) }

// 列表查詢
const rows = await sql`SELECT * FROM ...`
const camelRows = rows.map(snakeToCamel)
;(camelRows as any).__status = 200
return camelRows
```
重點：BDD requiredResponseFields 列表中的名稱是精確的 camelCase，你的回傳必須完全匹配。