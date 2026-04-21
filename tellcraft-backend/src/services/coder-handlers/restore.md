
## Restore Handler
```typescript
// Use the EXACT parameter name from the Feature When table header. Do NOT use `input.id || input.xxxId`.
const entityId = input.<ExactHeaderNameFromFeature>
if (!entityId) throw new Error('<ExactHeaderNameFromFeature> is required')

// Confirm the record is currently soft-deleted
const [existing] = await sql`SELECT * FROM table_name WHERE id = ${entityId} AND deleted_at IS NOT NULL`
if (!existing) throw new Error('record is not deleted or does not exist')

const [row] = await sql`
  UPDATE table_name SET deleted_at = NULL, updated_at = NOW()
  WHERE id = ${entityId}
  RETURNING *
`
return { __status: 200, ...row }
```
Key point: restore = set `deleted_at = NULL`. MUST confirm `deleted_at IS NOT NULL` first.