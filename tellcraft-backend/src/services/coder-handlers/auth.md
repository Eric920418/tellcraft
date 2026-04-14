
## 認證操作 Handler
```typescript
// 註冊：INSERT + bcrypt hash + 回傳 userId
const hashedPassword = await bcrypt.hash(input.password, 10)
const [user] = await sql`INSERT INTO users (...) VALUES (...) RETURNING *`
return { __status: 201, userId: user.id, message: '註冊成功' }

// 登入：bcrypt.compare + JWT
const [user] = await sql`SELECT * FROM users WHERE email = ${input.email}`
if (!user) throw new Error('使用者不存在')
const valid = await bcrypt.compare(input.password, user.password_hash)
if (!valid) throw new Error('密碼不正確')
const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
return { __status: 200, userId: user.id, accessToken, message: '登入成功' }

// 登出：直接回傳
return { __status: 200, message: '登出成功' }
```
重點：註冊/登入必須回 userId + message。登入必須回 accessToken。