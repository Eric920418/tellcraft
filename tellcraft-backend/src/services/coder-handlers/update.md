
## Update Handler
```typescript
// Use the EXACT parameter name from the Feature When table header. Do NOT use `input.id || input.xxxId`.
const entityId = input.<ExactHeaderNameFromFeature>
if (!entityId) throw new Error('<ExactHeaderNameFromFeature> is required')

// Precondition (state) validation: must exist and belong to the current user
const existing = await sql`SELECT * FROM table_name WHERE id = ${entityId} AND user_id = ${userId}`
if (existing.length === 0) throw new Error('not found or not owned by current user')

// UPDATE + RETURNING * (MUST spread row into the returned object)
const [row] = await sql`
  UPDATE table_name SET col = ${val}, updated_at = NOW()
  WHERE id = ${entityId}
  RETURNING *
`
return { __status: 200, ...row }
```
Key points: `__status: 200`, spread `RETURNING *` into the return object.