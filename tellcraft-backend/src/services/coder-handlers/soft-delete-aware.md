
## Soft Delete Aware Handler
```typescript
// ALL queries on tables with `deleted_at` column MUST filter out soft-deleted rows.
// Schema check: if DDL contains `deleted_at TIMESTAMP` for this table, apply filter.
// If Schema doesn't have `deleted_at`, DO NOT add the filter (creates SQL error: column does not exist).

// ✅ Correct — soft-delete-aware SELECT
const rows = await sql`
  SELECT * FROM table_name
  WHERE user_id = ${userId}
    AND deleted_at IS NULL
  ORDER BY created_at DESC
`

// ✅ Correct — soft-delete-aware single row lookup
const [resource] = await sql`
  SELECT * FROM table_name
  WHERE id = ${input.id}
    AND deleted_at IS NULL
`
if (!resource) throw new Error('Not found (may be deleted)')

// ✅ Correct — soft-delete-aware UPDATE (prevent updating already-deleted row)
await sql`
  UPDATE table_name SET title = ${input.title}, updated_at = NOW()
  WHERE id = ${input.id} AND deleted_at IS NULL
`

// ✅ Correct — soft delete action (don't hard DELETE; set deleted_at)
await sql`
  UPDATE table_name SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = ${input.id} AND deleted_at IS NULL
`

// ✅ Correct — restore action (clear deleted_at)
await sql`
  UPDATE table_name SET deleted_at = NULL, updated_at = NOW()
  WHERE id = ${input.id} AND deleted_at IS NOT NULL
`
```

Key points:
- **Schema check first**：用 `schema-derivation` 知道這個 table 有沒有 `deleted_at`。沒有 column 就**不要加 filter**（會 SQL error）。
- 所有 SELECT / UPDATE 都要加 `AND deleted_at IS NULL`，否則查到/改到已刪除的 row。
- DELETE action 改用 `UPDATE SET deleted_at = NOW()`（軟刪除），不要 hard `DELETE FROM`。
- Restore action 條件加 `deleted_at IS NOT NULL` 避免「restore 一個沒刪除的 row」這種無意義操作。
- BDD 寫法：BDD scenario「Already deleted X cannot be ...」期望 throw — 由 `WHERE ... AND deleted_at IS NULL` 自然滿足（rowCount=0 → throw not-found）。
- **跨 entity join 也要傳遞**：`JOIN parent ON ...` 也要加 `AND parent.deleted_at IS NULL`。
