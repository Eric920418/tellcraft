
## 列表查詢 Handler
```typescript
function _c(row: any) {
  if (!row) return row
  const r: any = {}
  for (const [k, v] of Object.entries(row)) {
    r[k.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase())] = v
  }
  return r
}

const rows = await sql`
  SELECT * FROM table_name
  WHERE user_id = ${userId}
  ORDER BY sort_order ASC
`
const result = Array.from(rows).map(_c)
;(result as any).__status = 200
return result
```
重點：
- 回傳 Array（不要包成 { items: rows }），在 Array 上設 __status = 200
- 必須用 _c() 做 snake_to_camel 轉換（PostgreSQL 回傳 snake_case，BDD 期望 camelCase）
- 只有 Schema DDL 明確定義了 deleted_at 欄位時才加 WHERE deleted_at IS NULL。Schema 沒有 deleted_at 就不加！
- **篩選/排序參數都是選填的**：不提供 filter/status 時查全部（不 throw），不提供 orderBy 時用預設排序
- **禁止** `if (!input.filter) throw`，改用 `const filter = input.filter || 'all'` 提供預設值