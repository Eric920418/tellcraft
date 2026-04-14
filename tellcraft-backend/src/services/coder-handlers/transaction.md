
## Transaction Handler
```typescript
const result = await sql.begin(async (tx) => {
  const [row] = await tx`INSERT INTO ... RETURNING *`
  await tx`UPDATE ... WHERE ...`
  return row
})
return { __status: 201, ...result }
```