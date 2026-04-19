
## Create Handler
```typescript
// Precondition (params) validation
if (!input.xxx) throw new Error('xxx is required')

// INSERT + RETURNING * (MUST spread row into the returned object)
const [row] = await sql`
  INSERT INTO table_name (id, user_id, ..., created_at, updated_at)
  VALUES (gen_random_uuid(), ${userId}, ..., NOW(), NOW())
  RETURNING *
`
return { __status: 201, ...row }
```
Key points: `__status: 201`, spread `RETURNING *` into the return object.