import { describe, it, expect } from 'vitest'
import { RoutingStubAdapter, type RouteDefinition } from '../lib/specformula/http/routing-stub-adapter'
import { TestRequest } from '../lib/specformula/http/test-request'

function makeRoutes(): RouteDefinition[] {
  return [
    { method: 'GET', path: '/api/users', actionName: 'getUsers' },
    { method: 'POST', path: '/api/users', actionName: 'createUser' },
    { method: 'GET', path: '/api/users/{id}', actionName: 'getUser' },
    { method: 'PUT', path: '/api/orders/{id}', actionName: 'updateOrder' },
    { method: 'DELETE', path: '/api/orders/{id}', actionName: 'deleteOrder' },
  ]
}

// ============================================================
// 基本路由匹配
// ============================================================

describe('RoutingStubAdapter 基本路由匹配', () => {
  it('匹配路由應回 501', async () => {
    const adapter = new RoutingStubAdapter(makeRoutes())
    const req = TestRequest.builder('GET', '/api/users').build()
    const res = await adapter.execute(req)
    expect(res.status).toBe(501)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('Not Implemented')
    expect(body.action).toBe('getUsers')
  })

  it('POST 路由匹配應回 501', async () => {
    const adapter = new RoutingStubAdapter(makeRoutes())
    const req = TestRequest.builder('POST', '/api/users')
      .body('{"email":"a@b.com"}')
      .build()
    const res = await adapter.execute(req)
    expect(res.status).toBe(501)
    const body = JSON.parse(res.body)
    expect(body.action).toBe('createUser')
  })

  it('不匹配路由應回 404', async () => {
    const adapter = new RoutingStubAdapter(makeRoutes())
    const req = TestRequest.builder('GET', '/api/nonexistent').build()
    const res = await adapter.execute(req)
    expect(res.status).toBe(404)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('Route not found')
  })
})

// ============================================================
// Method mismatch
// ============================================================

describe('RoutingStubAdapter Method mismatch', () => {
  it('定義了 GET 但用 DELETE 呼叫應回 404', async () => {
    const adapter = new RoutingStubAdapter(makeRoutes())
    // /api/users 只定義 GET 和 POST，用 DELETE 應 404
    const req = TestRequest.builder('DELETE', '/api/users').build()
    const res = await adapter.execute(req)
    expect(res.status).toBe(404)
  })

  it('定義了 PUT 但用 GET 呼叫應回 404', async () => {
    const adapter = new RoutingStubAdapter(makeRoutes())
    // /api/orders/:id 只定義 PUT 和 DELETE，用 GET 應 404
    const req = TestRequest.builder('GET', '/api/orders/123').build()
    const res = await adapter.execute(req)
    expect(res.status).toBe(404)
  })
})

// ============================================================
// Route params（:id）
// ============================================================

describe('RoutingStubAdapter Route params', () => {
  it('帶 route param 的路由應匹配', async () => {
    const adapter = new RoutingStubAdapter(makeRoutes())
    const req = TestRequest.builder('GET', '/api/users/abc-123').build()
    const res = await adapter.execute(req)
    expect(res.status).toBe(501)
    const body = JSON.parse(res.body)
    expect(body.action).toBe('getUser')
  })

  it('PUT 帶 route param 應匹配', async () => {
    const adapter = new RoutingStubAdapter(makeRoutes())
    const req = TestRequest.builder('PUT', '/api/orders/order-456')
      .body('{"status":"shipped"}')
      .build()
    const res = await adapter.execute(req)
    expect(res.status).toBe(501)
    const body = JSON.parse(res.body)
    expect(body.action).toBe('updateOrder')
  })

  it('DELETE 帶 route param 應匹配', async () => {
    const adapter = new RoutingStubAdapter(makeRoutes())
    const req = TestRequest.builder('DELETE', '/api/orders/order-789').build()
    const res = await adapter.execute(req)
    expect(res.status).toBe(501)
    const body = JSON.parse(res.body)
    expect(body.action).toBe('deleteOrder')
  })
})

// ============================================================
// Nested route params（多層路由參數）
// ============================================================

describe('RoutingStubAdapter Nested route params', () => {
  it('嵌套路由參數應正確匹配', async () => {
    const adapter = new RoutingStubAdapter([
      { method: 'GET', path: '/api/{userId}/orders/{orderId}', actionName: 'getUserOrder' },
    ])
    const req = TestRequest.builder('GET', '/api/abc-123/orders/order-456').build()
    const res = await adapter.execute(req)
    expect(res.status).toBe(501)
    const body = JSON.parse(res.body)
    expect(body.action).toBe('getUserOrder')
  })

  it('嵌套路由部分路徑不匹配應回 404', async () => {
    const adapter = new RoutingStubAdapter([
      { method: 'GET', path: '/api/{userId}/orders/{orderId}', actionName: 'getUserOrder' },
    ])
    // 缺少 orderId 層
    const req = TestRequest.builder('GET', '/api/abc-123/orders').build()
    const res = await adapter.execute(req)
    expect(res.status).toBe(404)
  })
})

// ============================================================
// 空路由
// ============================================================

describe('RoutingStubAdapter 空路由', () => {
  it('沒有定義任何路由時所有請求回 404', async () => {
    const adapter = new RoutingStubAdapter([])
    const req = TestRequest.builder('GET', '/api/anything').build()
    const res = await adapter.execute(req)
    expect(res.status).toBe(404)
  })
})

// ============================================================
// Query params（不影響路由匹配）
// ============================================================

describe('RoutingStubAdapter Query params', () => {
  it('帶 query params 的請求仍能匹配路由', async () => {
    const adapter = new RoutingStubAdapter(makeRoutes())
    const req = TestRequest.builder('GET', '/api/users')
      .queryParam('page', '1')
      .queryParam('limit', '10')
      .build()
    const res = await adapter.execute(req)
    expect(res.status).toBe(501)
  })
})
