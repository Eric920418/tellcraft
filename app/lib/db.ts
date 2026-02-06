/**
 * 資料庫連接層
 * 連接 VPS PostgreSQL (54.238.4.117:5432)
 */
import vpsDb, {
  from,
  query,
  queryOne,
  transaction,
  getClient,
} from './vps-db'

// VPS PostgreSQL 資料庫客戶端
export const db = {
  from,
  auth: {
    admin: {
      createUser: async (options: { email: string; email_confirm?: boolean; user_metadata?: Record<string, unknown> }) => {
        const id = crypto.randomUUID()
        const { error } = await from('users').insert({
          id,
          email: options.email,
          plan: 'free',
          subscription_status: 'active',
          message_count_this_period: 0,
          created_at: new Date().toISOString(),
        })

        if (error) {
          return { data: null, error }
        }
        return { data: { user: { id, email: options.email } }, error: null }
      },
      listUsers: async () => {
        const { data, error } = await from('users').select('*')
        if (error) {
          return { data: null, error }
        }
        return { data: { users: data || [] }, error: null }
      },
    },
  },
  // Storage stub - TODO: 實作 VPS 檔案存儲
  storage: {
    listBuckets: async (): Promise<{ data: { name: string }[] | null; error: { message: string } | null }> => {
      console.warn('[Storage] VPS storage not implemented - listBuckets')
      return { data: [], error: null }
    },
    createBucket: async (_name: string, _options?: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }> => {
      console.warn('[Storage] VPS storage not implemented - createBucket')
      return { data: null, error: null }
    },
    from: (bucket: string) => ({
      upload: async (path: string, _file: unknown, _options?: Record<string, unknown>): Promise<{ data: { path: string } | null; error: { message: string } | null }> => {
        console.warn(`[Storage] VPS storage not implemented - upload to ${bucket}/${path}`)
        return { data: { path }, error: null }
      },
      download: async (path: string): Promise<{ data: Blob | null; error: { message: string } | null }> => {
        console.warn(`[Storage] VPS storage not implemented - download ${bucket}/${path}`)
        return { data: null, error: { message: 'Storage not implemented' } }
      },
      remove: async (paths: string[]): Promise<{ data: unknown; error: { message: string } | null }> => {
        console.warn(`[Storage] VPS storage not implemented - remove ${paths.join(', ')}`)
        return { data: null, error: null }
      },
      createSignedUrl: async (path: string, _expiresIn: number): Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }> => {
        console.warn(`[Storage] VPS storage not implemented - createSignedUrl ${path}`)
        return { data: { signedUrl: '' }, error: null }
      },
      getPublicUrl: (path: string): { data: { publicUrl: string } } => {
        console.warn(`[Storage] VPS storage not implemented - getPublicUrl ${path}`)
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

export default vpsDb
