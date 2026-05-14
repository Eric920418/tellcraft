
## Search Handler
```typescript
// Trim + length check — empty query returns all OR throws depending on BDD expectation
const rawQuery = String(input.query ?? input.keyword ?? input.q ?? '').trim()
if (rawQuery.length > 200) throw new Error('Search query too long (max 200 chars)')

// ILIKE for case-insensitive partial match — Postgres-specific, more efficient than LOWER() comparisons
// Parameterized via tag template (sql`...${value}...`) — NO manual string concat (SQL injection risk!)
const pattern = `%${rawQuery}%`

const rows = rawQuery
  ? await sql`
      SELECT * FROM table_name
      WHERE user_id = ${userId}
        AND (title ILIKE ${pattern} OR description ILIKE ${pattern})
      ORDER BY
        -- Exact match first, then partial
        CASE WHEN title ILIKE ${rawQuery} THEN 0 ELSE 1 END,
        created_at DESC
      LIMIT 100
    `
  : await sql`
      SELECT * FROM table_name WHERE user_id = ${userId}
      ORDER BY created_at DESC LIMIT 100
    `

function _c(row: any) {
  if (!row) return row
  const r: any = {}
  for (const [k, v] of Object.entries(row)) {
    r[k.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase())] = v
  }
  return r
}

const result = Array.from(rows).map(_c)
;(result as any).__status = 200
return result
```

Key points:
- **NEVER** concat user input into SQL string: `\`... WHERE title LIKE '%${q}%'\`` is **SQL injection**. Always use tag template `sql\`... ILIKE ${pattern}\`` so neon driver parameterizes.
- ILIKE `%pattern%` — Postgres case-insensitive。MySQL 用戶請改 `LOWER(title) LIKE LOWER(?)`，但本平台只用 Postgres。
- Max query length 200 防 DoS（單 char `%` 比對全表）
- Empty query handling 要看 BDD spec：若 scenario 「Empty query returns all」→ fallback 查全部；若 「Empty query causes failure」→ throw
- `LIMIT 100` 固定（搜尋常數），不接受 user 傳的 pageSize 防搜尋大量資料
- ORDER BY 用「精確匹配優先」演算法（title 完全等於 query 排最前）
