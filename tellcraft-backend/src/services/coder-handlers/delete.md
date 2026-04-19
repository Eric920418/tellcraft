
## Delete Handler
```typescript
const entityId = input.id || input.xxxId
if (!entityId) throw new Error('id is required')

// ⚠️ Check the Schema DDL first:
// If the Schema has a `deleted_at` column → soft delete:
//   UPDATE table_name SET deleted_at = NOW(), updated_at = NOW() WHERE id = ${entityId} RETURNING *
// If the Schema has no `deleted_at` column → hard delete:
const [row] = await sql`
  DELETE FROM table_name
  WHERE id = ${entityId}
  RETURNING *
`
return { __status: 200, ...row }
```
Key point: check the Schema DDL for a `deleted_at` column first. If absent, use `DELETE FROM` — do NOT hallucinate soft delete.