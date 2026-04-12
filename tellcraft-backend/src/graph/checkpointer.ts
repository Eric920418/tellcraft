/**
 * LangGraph PostgreSQL Checkpointer — 持久化 graph interrupt/resume 狀態
 *
 * PostgresSaver 自動建表（idempotent），不需手動 migration。
 * 用 singleton pattern，在 graph 初始化時呼叫 getCheckpointer()。
 */
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import { getEnv } from '../lib/env'
import { createLogger } from '../lib/logger'

const logger = createLogger('graph:checkpointer')

let _checkpointer: PostgresSaver | null = null

/**
 * 取得或初始化 PostgresSaver。
 * setup() 是 idempotent 的，會自動建立 checkpoint tables（如果不存在）。
 */
export async function getCheckpointer(): Promise<PostgresSaver> {
  if (!_checkpointer) {
    const env = getEnv()
    _checkpointer = PostgresSaver.fromConnString(env.DATABASE_URL)
    await _checkpointer.setup()
    logger.info('PostgresSaver checkpointer 已初始化')
  }
  return _checkpointer
}

/**
 * 優雅關閉 checkpointer（關閉 pg pool）。
 * 在 process shutdown 時呼叫。
 */
export async function shutdownCheckpointer(): Promise<void> {
  if (_checkpointer) {
    await _checkpointer.end()
    _checkpointer = null
    logger.info('PostgresSaver checkpointer 已關閉')
  }
}
