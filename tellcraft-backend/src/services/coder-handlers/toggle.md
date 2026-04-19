
## Toggle Handler
```typescript
const entityId = input.id || input.xxxId
if (!entityId) throw new Error('id is required')

// Check current state
const [existing] = await sql`SELECT * FROM table_name WHERE id = ${entityId} AND deleted_at IS NULL`
if (!existing) throw new Error('not found or already deleted')

// Toggle the boolean column (e.g. is_completed)
const [row] = await sql`
  UPDATE table_name SET is_xxx = NOT is_xxx, updated_at = NOW()
  WHERE id = ${entityId}
  RETURNING *
`
return { __status: 200, ...row }
```
Key point: SELECT first to confirm existence and non-deletion, then `UPDATE SET field = NOT field`.