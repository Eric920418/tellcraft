
## Aggregate / Summary Query Handler
```typescript
// Aggregate queries MUST use COALESCE to guard against NULL; non-aggregate columns MUST appear in GROUP BY.
const rows = await sql`
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as "totalIncome",
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as "totalExpense"
  FROM table_name
  WHERE device_id = ${deviceId}
    AND date_trunc('month', transaction_date) = date_trunc('month', ${month}::date)
`
const result = rows[0] || { totalIncome: 0, totalExpense: 0 }
// Numeric columns MUST be Number()-cast (PostgreSQL returns strings)
return { __status: 200, totalIncome: Number(result.totalIncome), totalExpense: Number(result.totalExpense) }
```
Rules:
- Non-aggregate columns in `SELECT` **must** appear in `GROUP BY`.
- Use `COALESCE(..., 0)` so empty result sets don't return NULL.
- Cast with `Number()` (PostgreSQL `SUM`/`COUNT` returns string).
- Use `date_trunc()` for month comparisons — don't concatenate strings.
- Grouped queries (with `GROUP BY`) return an Array — set `__status` on the array. A single aggregate takes `rows[0]` and returns an Object.
- Return a zero-valued object when there is no data — do NOT return 404.
- Only add `WHERE deleted_at IS NULL` when the Schema has a `deleted_at` column. If not, don't add it!