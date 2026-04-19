
## List Query Handler
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
Key points:
- Return an Array (do NOT wrap as `{ items: rows }`); set `__status = 200` on the Array itself.
- MUST use `_c()` for snake_to_camel conversion (PostgreSQL returns snake_case, BDD expects camelCase).
- Only add `WHERE deleted_at IS NULL` when the Schema DDL explicitly defines `deleted_at`. If Schema doesn't have it, don't add!
- **Filter/sort parameters are optional**: if `filter`/`status` is absent, return everything (don't throw); if `orderBy` is absent, use a default sort order.
- **Do NOT** write `if (!input.filter) throw`. Use `const filter = input.filter || 'all'` to provide a default.