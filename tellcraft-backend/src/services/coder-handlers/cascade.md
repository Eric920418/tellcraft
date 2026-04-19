
## Cascade Delete / Update Handler
When deleting a parent entity that has child records referencing it via FK, handle the children in the same transaction:
```typescript
const result = await sql.begin(async (tx) => {
  // ⚠️ Check the Schema DDL first: deleted_at → soft delete; otherwise → hard delete
  // If the Schema has ON DELETE CASCADE, hard-deleting the parent auto-deletes children — no manual handling needed.
  const [parent] = await tx`
    DELETE FROM parent_table WHERE id = ${entityId} RETURNING *
  `
  if (!parent) throw new Error('not found')

  // If the BDD test mentions "Uncategorized" and the Schema has no CASCADE:
  // const [defaultCategory] = await tx`SELECT id FROM categories WHERE name = 'Uncategorized' LIMIT 1`
  // await tx`UPDATE child_table SET parent_id = ${defaultCategory?.id} WHERE parent_id = ${entityId}`
  return parent
})
return { __status: 200, ...result }
```
Rules:
- Check the Schema DDL first: if the FK has `ON DELETE CASCADE`, just `DELETE` the parent (children auto-delete).
- If the Schema has a `deleted_at` column, use `UPDATE SET deleted_at = NOW()` instead of `DELETE`.
- If the BDD test mentions an "Uncategorized" fallback, look up that default category's id first and reassign the FK.
- Use `sql.begin()` to guarantee atomicity.