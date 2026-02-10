/**
 * 資料庫連接層（已廢棄）
 * 前端不直連資料庫，所有操作透過 VPS HTTP API
 * 保留 exports 以避免破壞引用鏈
 */

// Stub functions - 所有 DB 操作已遷移到 VPS 後端
/* eslint-disable @typescript-eslint/no-explicit-any */
function notImplemented(method: string): any {
  throw new Error(`[DB] ${method} is deprecated. Use VPS API instead.`)
}

const chainable: any = new Proxy({}, {
  get: (_target, prop) => {
    if (typeof prop === 'string') {
      return (..._args: any[]) => chainable
    }
    return undefined
  },
})

const from = (_table: string): any => chainable

const query = (..._args: any[]): any => notImplemented('query')
const queryOne = (..._args: any[]): any => notImplemented('queryOne')
const transaction = (..._args: any[]): any => notImplemented('transaction')
const getClient = (..._args: any[]): any => notImplemented('getClient')

export const db = {
  from,
  auth: {
    admin: {
      createUser: async () => notImplemented('auth.admin.createUser'),
      listUsers: async () => notImplemented('auth.admin.listUsers'),
    },
  },
  storage: {
    listBuckets: async (): Promise<{ data: { name: string }[] | null; error: { message: string } | null }> => {
      console.warn('[Storage] VPS storage not implemented')
      return { data: [], error: null }
    },
    createBucket: async (..._args: any[]): Promise<{ data: unknown; error: { message: string } | null }> => {
      return { data: null, error: null }
    },
    from: (_bucket: string) => ({
      upload: async (..._args: any[]): Promise<{ data: { path: string } | null; error: { message: string } | null }> => {
        return { data: { path: '' }, error: null }
      },
      download: async (..._args: any[]): Promise<{ data: Blob | null; error: { message: string } | null }> => {
        return { data: null, error: { message: 'Storage not implemented' } }
      },
      remove: async (..._args: any[]): Promise<{ data: unknown; error: { message: string } | null }> => {
        return { data: null, error: null }
      },
      createSignedUrl: async (..._args: any[]): Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }> => {
        return { data: { signedUrl: '' }, error: null }
      },
      getPublicUrl: (..._args: any[]): { data: { publicUrl: string } } => {
        return { data: { publicUrl: '' } }
      },
    }),
  },
}

export { query, queryOne, transaction, getClient }

// 方案對話配額限制
export const PLAN_MESSAGE_LIMITS: Record<string, number> = {
  free: 50,
  creator: 200,
  pro: 1000,
  business: Infinity
}

// 方案專案數量限制
export const PLAN_PROJECT_LIMITS: Record<string, number> = {
  free: 1,
  creator: 1,
  pro: 3,
  business: 10
}

// 方案優先級權重
export const PLAN_PRIORITY_WEIGHTS: Record<string, number> = {
  free: 0,
  creator: 10,
  pro: 20,
  business: 30
}

export default db
