import type { HttpClientAdapter } from './http-client-adapter'
import type { TestRequest } from './test-request'
import type { TestResponse } from './test-response'
import type { Express, Request, Response } from 'express'
import { SupertestAdapter } from './supertest-adapter'

export interface RouteDefinition {
  method: string   // GET/POST/PUT/DELETE
  path: string     // /api/users/:id 或 /api/users/{id}
  actionName: string
}

/**
 * In-process Express routing stub adapter.
 *
 * 建立極簡 Express app：真實路由定義 + 501 stub handler。
 * 與 StubHttpAdapter 的關鍵區別：
 *   - StubHttpAdapter: 所有請求 → 501（永遠不會 404）
 *   - RoutingStubAdapter: 匹配路由 → 501，不匹配 → 404（捕捉路由定義錯誤）
 *
 * 零外部進程（in-process），~0ms 啟動，透過 supertest 做 HTTP 測試。
 */
export class RoutingStubAdapter implements HttpClientAdapter {
  private adapter: SupertestAdapter | null = null

  constructor(private routes: RouteDefinition[]) {}

  private async ensureAdapter(): Promise<SupertestAdapter> {
    if (this.adapter) return this.adapter

    const expressModule = await import('express')
    const express = expressModule.default
    const app: Express = express()
    app.use(express.json())

    for (const route of this.routes) {
      const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch'
      if (typeof app[method] !== 'function') continue

      // 將 OpenAPI 風格 path（{id}）轉為 Express 風格（:id）
      const expressPath = route.path.replace(/\{(\w+)\}/g, ':$1')
      const actionName = route.actionName

      app[method](expressPath, (_req: Request, res: Response) => {
        res.status(501).json({ error: 'Not Implemented', action: actionName })
      })
    }

    // 404 for unmatched routes — 這是和 StubHttpAdapter 的關鍵區別
    app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Route not found' })
    })

    this.adapter = new SupertestAdapter(app)
    return this.adapter
  }

  async execute(request: TestRequest): Promise<TestResponse> {
    const adapter = await this.ensureAdapter()
    return adapter.execute(request)
  }
}
