/**
 * User API 路由
 * 處理用戶資訊和帳號合併
 */
import { Router, Request, Response } from 'express'
import { query, queryOne } from '../db/client'
import { requireAuth, optionalAuth } from '../middleware/auth'

const router: Router = Router()

/**
 * GET /api/user/me
 * 取得當前認證用戶資訊
 */
router.get('/me', optionalAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.json(null)
    }

    // 查詢完整用戶資訊
    const user = await queryOne<{
      id: string
      email: string
      name: string | null
      avatar_url: string | null
      is_admin: boolean
    }>(
      'SELECT id, email, name, avatar_url, is_admin FROM users WHERE id = $1',
      [req.user.id]
    )

    if (!user) {
      return res.json(null)
    }

    res.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      isAdmin: user.is_admin
    })
  } catch (error) {
    console.error('[User] 獲取用戶資訊失敗:', error)
    res.status(500).json({ error: '獲取用戶資訊失敗' })
  }
})

/**
 * POST /api/user/migrate
 * 遷移匿名帳號到認證帳號
 */
router.post('/migrate', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUserId = req.user!.id
    const { anonymousId } = req.body as { anonymousId: string }

    if (!anonymousId) {
      return res.status(400).json({ error: '缺少 anonymousId' })
    }

    // 1. 查找匿名用戶
    const anonymousUser = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE anonymous_user_id = $1',
      [anonymousId]
    )

    if (!anonymousUser) {
      // 沒有匿名用戶資料，無需遷移
      return res.json({ migratedProjects: 0, migratedConversations: 0 })
    }

    // 如果匿名用戶就是認證用戶，無需遷移
    if (anonymousUser.id === authUserId) {
      return res.json({ migratedProjects: 0, migratedConversations: 0 })
    }

    // 2. 查詢匿名用戶的專案
    const anonymousProjectsResult = await query<{ id: string; name: string }>(
      'SELECT id, name FROM projects WHERE user_id = $1',
      [anonymousUser.id]
    )
    const anonymousProjects = anonymousProjectsResult.rows

    // 3. 查詢認證用戶現有的專案名稱
    const authProjectsResult = await query<{ name: string }>(
      'SELECT name FROM projects WHERE user_id = $1',
      [authUserId]
    )
    const existingNames = new Set(authProjectsResult.rows.map(p => p.name))

    // 4. 遷移專案，處理同名衝突
    let migratedProjects = 0
    let migratedConversations = 0

    // 預處理：計算所有新名稱
    const projectsToMigrate = anonymousProjects.map(project => {
      let newName = project.name

      // 處理同名衝突
      if (existingNames.has(newName)) {
        let suffix = 2
        while (existingNames.has(`${project.name} (${suffix})`)) {
          suffix++
        }
        newName = `${project.name} (${suffix})`
      }

      existingNames.add(newName) // 預先添加避免後續衝突
      return { ...project, newName }
    })

    // 並行執行所有專案更新
    const updateResults = await Promise.all(
      projectsToMigrate.map(async project => {
        try {
          await query(
            `UPDATE projects SET user_id = $1, name = $2, updated_at = NOW() WHERE id = $3`,
            [authUserId, project.newName, project.id]
          )
          return { projectId: project.id, success: true }
        } catch {
          return { projectId: project.id, success: false }
        }
      })
    )

    // 統計成功遷移的專案
    const successfulProjectIds = updateResults
      .filter(r => r.success)
      .map(r => r.projectId)
    migratedProjects = successfulProjectIds.length

    // 一次性查詢所有成功遷移專案的對話數量
    if (successfulProjectIds.length > 0) {
      const convCountResult = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM conversations WHERE project_id = ANY($1)',
        [successfulProjectIds]
      )
      migratedConversations = parseInt(convCountResult?.count || '0', 10)
    }

    // 5. 更新認證用戶，記錄關聯的匿名用戶 ID（如果欄位允許）
    await query(
      'UPDATE users SET anonymous_user_id = $1 WHERE id = $2',
      [anonymousId, authUserId]
    )

    // 6. 標記匿名用戶為 cancelled
    await query(
      `UPDATE users SET subscription_status = 'cancelled', cancelled_at = NOW() WHERE id = $1`,
      [anonymousUser.id]
    )

    res.json({
      migratedProjects,
      migratedConversations
    })
  } catch (error) {
    console.error('[User] 帳號遷移失敗:', error)
    res.status(500).json({ error: '帳號遷移失敗' })
  }
})

export default router
