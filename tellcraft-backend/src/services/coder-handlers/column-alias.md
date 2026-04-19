
## Column Aliasing (PostgreSQL snake_case → camelCase)
PostgreSQL returns column names in snake_case (`category_id`, `created_at`, `transaction_date`).
BDD tests verify column names in camelCase (`categoryId`, `createdAt`, `transactionDate`).
You MUST convert before returning, or tests will always fail!
```typescript
// Option 1: SQL AS alias (recommended)
SELECT category_id as "categoryId", created_at as "createdAt", updated_at as "updatedAt" FROM ...

// Option 2: Code-level conversion (ideal for RETURNING * spread scenarios)
function snakeToCamel(row: any) {
  if (!row) return row
  const result: any = {}
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    result[camelKey] = value
  }
  return result
}
// Use after INSERT/UPDATE/DELETE RETURNING *
const [row] = await sql`UPDATE ... RETURNING *`
return { __status: 200, ...snakeToCamel(row) }

// List query
const rows = await sql`SELECT * FROM ...`
const camelRows = rows.map(snakeToCamel)
;(camelRows as any).__status = 200
return camelRows
```
Key point: names in the BDD `requiredResponseFields` list are exact camelCase — your return MUST match exactly.