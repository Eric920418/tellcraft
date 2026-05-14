
## Auth Guard Handler
```typescript
// 1. Identity check — was userId resolved from JWT? (set by route middleware before action call)
// SpecFormula passes UID via (UID="$varName") in WHEN step → resolved to userId in input
if (!input.userId || typeof input.userId !== 'string' || input.userId.trim() === '') {
  const err: any = new Error('Authentication required')
  err.__status = 401  // 401 Unauthorized — no/invalid credentials
  throw err
}
const userId = input.userId

// 2. Authorization check — does this user own/access the target resource?
// Pattern: SELECT ... WHERE id = ${targetId} AND user_id = ${userId}
const [resource] = await sql`
  SELECT * FROM table_name WHERE id = ${input.id} AND user_id = ${userId}
`
if (!resource) {
  // 403 Forbidden — credentials valid but resource doesn't belong to user
  // Use generic error message to prevent information disclosure (don't reveal if resource exists for other user)
  const err: any = new Error('Resource not found or not accessible')
  err.__status = 404  // Use 404 not 403 to avoid leaking existence
  throw err
}

// 3. Role-based check (if applicable) — admin-only actions
if (input.requireAdmin && resource.role !== 'admin') {
  const err: any = new Error('Admin privileges required')
  err.__status = 403  // 403 Forbidden — credentials valid but role insufficient
  throw err
}

// ...proceed with action logic
```

Key points:
- **401 vs 403 vs 404 區分清楚**：
  - 401 = no/invalid credentials（沒 JWT 或過期）
  - 403 = credentials valid but role insufficient（你是合法 user 但不是 admin）
  - 404 = resource not found or not owned by you — **don't use 403 here** 避免 information disclosure（用 403 等於告訴攻擊者「這個 id 存在但你不能存取」）
- Throw `Error` 帶 `__status` property — route handler catch 後 read `err.__status` 設 HTTP status code
- `input.userId` 是 SpecFormula 從 `(UID="$varName")` Actor 注入的，**Server Action 內部不要做 JWT 解析**（JWT 驗證在 middleware 完成）
- 多層權限：先 401，再 404/403（順序很重要，401 必須最先 check）
- 不要在 error message 洩漏 resource 內容（如「This task belongs to user X」）— generic message only
