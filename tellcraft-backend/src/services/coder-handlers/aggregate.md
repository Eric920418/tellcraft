
## 聚合/摘要查詢 Handler
```typescript
// 聚合查詢必須用 COALESCE 防止 NULL，非聚合欄位必須 GROUP BY
const rows = await sql`
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as "totalIncome",
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as "totalExpense"
  FROM table_name
  WHERE device_id = ${deviceId}
    AND date_trunc('month', transaction_date) = date_trunc('month', ${month}::date)
`
const result = rows[0] || { totalIncome: 0, totalExpense: 0 }
// 數值欄位必須轉 Number（PostgreSQL 回傳 string）
return { __status: 200, totalIncome: Number(result.totalIncome), totalExpense: Number(result.totalExpense) }
```
規則：
- SELECT 中非聚合函數的欄位**必須**出現在 GROUP BY
- 用 COALESCE(..., 0) 防止空結果回傳 NULL
- 用 Number() 轉型（PostgreSQL SUM/COUNT 回傳 string）
- 用 date_trunc() 做月份比較，不要拼字串
- 分組查詢（GROUP BY）回傳 Array 設 __status；單一聚合取 rows[0] 回傳 Object
- 無資料時回傳零值物件，不要回傳 404
- 只有 Schema 有 deleted_at 欄位時才加 WHERE deleted_at IS NULL。Schema 沒有就不加！