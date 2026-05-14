
## Pagination Handler
```typescript
// Parse with safe defaults — page/pageSize from request, clamp to reasonable bounds
const page = Math.max(1, parseInt(String(input.page ?? '1'), 10) || 1)
const pageSizeRaw = parseInt(String(input.pageSize ?? '20'), 10) || 20
const pageSize = Math.min(100, Math.max(1, pageSizeRaw))  // 1..100, prevent abuse
const offset = (page - 1) * pageSize

// Count + paged rows in a single round-trip when possible
const [{ total }] = await sql`
  SELECT COUNT(*)::int AS total FROM table_name WHERE user_id = ${userId}
`
const rows = await sql`
  SELECT * FROM table_name
  WHERE user_id = ${userId}
  ORDER BY created_at DESC
  LIMIT ${pageSize} OFFSET ${offset}
`

function _c(row: any) {
  if (!row) return row
  const r: any = {}
  for (const [k, v] of Object.entries(row)) {
    r[k.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase())] = v
  }
  return r
}

return {
  __status: 200,
  items: Array.from(rows).map(_c),
  total,
  page,
  pageSize,
  totalPages: Math.ceil(total / pageSize),
}
```

Key points:
- `page` 預設 1，最小 1；`pageSize` 預設 20，clamp 在 1-100（防 DoS：`pageSize=999999` 不行）
- **MUST** include both `items` (camelCased array) AND `total` / `page` / `pageSize` / `totalPages` in response
- `OFFSET ${offset}` — Postgres `OFFSET (page-1)*pageSize`，**頁碼從 1 開始不是 0**
- Use **`COUNT(*)::int`** explicit cast — neon driver 預設回 string，會讓 totalPages 計算錯
- `ORDER BY` 必須穩定（用 `created_at DESC, id ASC` 避免 tie-break 抖動）
- 不要回 raw `rows`（snake_case），務必 `_c()` 轉 camelCase 對齊 BDD expectations
