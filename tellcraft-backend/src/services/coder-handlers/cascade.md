
## 級聯刪除/更新 Handler
當刪除父實體時，如果有子實體透過 FK 引用它，必須同時處理子記錄：
```typescript
const result = await sql.begin(async (tx) => {
  // ⚠️ 先看 Schema DDL：有 deleted_at → 軟刪除；沒有 → 硬刪除
  // 如果 Schema 有 ON DELETE CASCADE，硬刪除 parent 會自動刪子記錄，不需手動處理
  const [parent] = await tx`
    DELETE FROM parent_table WHERE id = ${entityId} RETURNING *
  `
  if (!parent) throw new Error('找不到資料')

  // 如果 BDD 測試提到「未分類」且 Schema 沒有 CASCADE：
  // const [defaultCategory] = await tx`SELECT id FROM categories WHERE name = '未分類' LIMIT 1`
  // await tx`UPDATE child_table SET parent_id = ${defaultCategory?.id} WHERE parent_id = ${entityId}`
  return parent
})
return { __status: 200, ...result }
```
規則：
- 先看 Schema DDL：如果 FK 有 ON DELETE CASCADE，直接 DELETE parent（子記錄自動刪除）
- 如果 Schema 有 deleted_at 欄位，用 UPDATE SET deleted_at = NOW() 代替 DELETE
- 如果 BDD 測試提到「未分類」，先查找未分類類別 ID 來替換 FK
- 用 sql.begin() 確保原子性