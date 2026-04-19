
## Single-Record Query Handler
```typescript
const entityId = input.id || input.xxxId
if (!entityId) throw new Error('id is required')
const [row] = await sql`SELECT * FROM table_name WHERE id = ${entityId}`
if (!row) throw new Error('not found')
return { __status: 200, ...row }
```