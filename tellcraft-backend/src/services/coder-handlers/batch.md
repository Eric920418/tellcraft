
## Batch Handler
```typescript
// Input: comma-separated string → split into array
const ids = (input.orderedItemIds || '').split(',').map(s => s.trim()).filter(Boolean)
if (ids.length === 0) throw new Error('orderedItemIds is required')

// UPDATE each row
for (let i = 0; i < ids.length; i++) {
  await sql`UPDATE table_name SET sort_order = ${i + 1}, updated_at = NOW() WHERE id = ${ids[i]}`
}
return { __status: 200, success: true }
```
Key points: return `{ success: true }`; for PostgreSQL array queries use `ANY(${ids}::uuid[])`.