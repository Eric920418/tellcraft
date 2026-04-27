
## Update Handler

⚠️ **CRITICAL**: This project uses `@neondatabase/serverless` (Neon's `neon()` driver).
**It does NOT support the postgres.js-style `sql(obj)` dynamic field spread**.
For optional/partial UPDATE fields, use the `COALESCE(${input.x}, x)` pattern.

```typescript
// Use the EXACT parameter name from the Feature When table header. Do NOT use `input.id || input.xxxId`.
const entityId = input.<ExactHeaderNameFromFeature>
if (!entityId) throw new Error('<ExactHeaderNameFromFeature> is required')

// Precondition (state) validation: must exist and belong to the current user
const existing = await sql`SELECT * FROM table_name WHERE id = ${entityId} AND user_id = ${userId}`
if (existing.length === 0) throw new Error('not found or not owned by current user')

// ✅ Partial UPDATE — pass each input field through COALESCE so undefined keeps the original value
const [row] = await sql`
  UPDATE table_name SET
    title       = COALESCE(${input.title},       title),
    description = COALESCE(${input.description}, description),
    sort_order  = COALESCE(${input.sortOrder},   sort_order),
    updated_at  = NOW()
  WHERE id = ${entityId}
  RETURNING *
`
return { __status: 200, ...row }
```

❌ **NEVER write** the postgres.js-style spread — Neon throws SQL syntax error:
```typescript
// ❌ FORBIDDEN: SET ${sql(updateData)} — works in postgres.js, breaks in Neon
const updateData = { title: input.title, ... }
await sql`UPDATE x SET ${sql(updateData)} WHERE id = ${id}`  // syntax error!
```

Key points: `__status: 200`; use COALESCE for partial updates; spread `RETURNING *` into the return object.