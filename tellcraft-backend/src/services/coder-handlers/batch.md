
## Batch Handler
```typescript
// Input: comma-separated string → split into array.
// Use the EXACT parameter name from the Feature When table header (e.g. `input.orderedItemIds`,
// `input.itemIds`, `input.ids`). Do NOT hardcode — read the Feature's header.
const raw = input.<ExactHeaderNameFromFeature> || ''
const ids = raw.split(',').map(s => s.trim()).filter(Boolean)
if (ids.length === 0) throw new Error('<ExactHeaderNameFromFeature> is required')

// UPDATE each row
for (let i = 0; i < ids.length; i++) {
  await sql`UPDATE table_name SET sort_order = ${i + 1}, updated_at = NOW() WHERE id = ${ids[i]}`
}
return { __status: 200, success: true }
```
Key points: return `{ success: true }`; for PostgreSQL array queries use `ANY(${ids}::uuid[])`.