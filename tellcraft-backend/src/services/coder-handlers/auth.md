
## Auth Handler
```typescript
// Register: INSERT + bcrypt hash + return userId
const hashedPassword = await bcrypt.hash(input.password, 10)
const [user] = await sql`INSERT INTO users (...) VALUES (...) RETURNING *`
return { __status: 201, userId: user.id, message: 'Registration successful' }

// Login: bcrypt.compare + JWT
const [user] = await sql`SELECT * FROM users WHERE email = ${input.email}`
if (!user) throw new Error('User not found')
const valid = await bcrypt.compare(input.password, user.password_hash)
if (!valid) throw new Error('Invalid password')
const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
return { __status: 200, userId: user.id, accessToken, message: 'Login successful' }

// Logout: return directly
return { __status: 200, message: 'Logout successful' }
```
Key points: register / login MUST return `userId` + `message`. Login MUST return `accessToken`.