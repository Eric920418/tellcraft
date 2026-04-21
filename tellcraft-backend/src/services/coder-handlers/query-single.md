
## Single-Record Query Handler
```typescript
// Use the EXACT parameter name from the Feature When table header.
// Examples: `input.sectionId`, `input.itemId`, `input.orderId`.
// Do NOT use `input.id || input.xxxId` fallback — that breaks exact param matching.
const entityId = input.<ExactHeaderNameFromFeature>
if (!entityId) throw new Error('<ExactHeaderNameFromFeature> is required')
const [row] = await sql`SELECT * FROM table_name WHERE id = ${entityId}`
if (!row) throw new Error('not found')
return { __status: 200, ...row }
```