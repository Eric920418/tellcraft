/**
 * Runtime Context — 共用 Redis + Socket.io instance
 *
 * LangGraph node 是純函數，不能直接存取 BullMQ worker 的 Redis/Socket.io。
 * 用 singleton pattern 注入 runtime context，在 worker 啟動時設定。
 */
import type { Redis } from 'ioredis'
import type { IoEmitter } from '../types/flow-state'

let _redis: Redis
let _io: IoEmitter

/**
 * 在 BullMQ worker 啟動時呼叫，注入 Redis + Socket.io
 */
export function setGraphContext(redis: Redis, io: IoEmitter): void {
  _redis = redis
  _io = io
}

export function getRedis(): Redis {
  if (!_redis) throw new Error('Graph context not initialized — call setGraphContext() first')
  return _redis
}

export function getIo(): IoEmitter {
  if (!_io) throw new Error('Graph context not initialized — call setGraphContext() first')
  return _io
}
