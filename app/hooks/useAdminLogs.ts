'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { clearAdminLogs, getAdminLogs, type ParsedLogLine } from '@/app/lib/vps-api'

const MAX_LINES = 2000
const MIN_POLL_INTERVAL = 3000   // 有新數據時 3s
const MAX_POLL_INTERVAL = 30000  // 閒置時最慢 30s
const BACKOFF_FACTOR = 1.5

interface UseAdminLogsOptions {
  enabled: boolean
  source?: 'all' | 'out' | 'error'
}

interface UseAdminLogsReturn {
  lines: ParsedLogLine[]
  isConnected: boolean
  isPaused: boolean
  pause: () => void
  resume: () => void
  clear: () => Promise<boolean>
  clearLocal: () => void
}

export function useAdminLogs(options: UseAdminLogsOptions): UseAdminLogsReturn {
  const { enabled, source = 'all' } = options
  const [lines, setLines] = useState<ParsedLogLine[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const isPausedRef = useRef(false)
  const lastTimestampRef = useRef<string>('')
  const initialLoadDone = useRef(false)

  // HTTP 輪詢（走 VPS API proxy，避免 Mixed Content / CORS 問題）
  useEffect(() => {
    if (!enabled) return

    let active = true
    initialLoadDone.current = false

    // 初始載入
    async function loadInitial() {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        if (active) setIsConnected(false)
        return
      }
      const result = await getAdminLogs({ token, lines: 200, source })
      if (!active) return

      if (result.success && result.data?.lines) {
        const newLines = result.data.lines
        setLines(newLines)
        setIsConnected(true)
        initialLoadDone.current = true
        // 記錄最新時間戳
        if (newLines.length > 0) {
          lastTimestampRef.current = newLines[newLines.length - 1].timestamp
        }
      } else {
        setIsConnected(false)
      }
    }

    loadInitial()

    // 自適應退避輪詢：有新數據 → 3s，無新數據 → ×1.5 退避到 30s
    let pollInterval = MIN_POLL_INTERVAL
    let timerId: ReturnType<typeof setTimeout>

    async function poll() {
      if (!active) return

      if (isPausedRef.current || !initialLoadDone.current) {
        timerId = setTimeout(poll, pollInterval)
        return
      }

      const token = localStorage.getItem('auth_token')
      if (!token) {
        setIsConnected(false)
        timerId = setTimeout(poll, pollInterval)
        return
      }

      const since = lastTimestampRef.current
      const result = await getAdminLogs({
        token,
        lines: 100,
        source,
        since: since || undefined,
      })

      if (!active) return

      if (result.success && result.data?.lines) {
        setIsConnected(true)
        const newLines = result.data.lines

        if (newLines.length > 0) {
          // 有新數據 → 重置為快速輪詢
          pollInterval = MIN_POLL_INTERVAL
          lastTimestampRef.current = newLines[newLines.length - 1].timestamp

          setLines(prev => {
            const existingRaws = new Set(prev.slice(-200).map(l => l.raw))
            const deduped = newLines.filter(l => !existingRaws.has(l.raw))
            if (deduped.length === 0) return prev
            const merged = [...prev, ...deduped]
            return merged.length > MAX_LINES ? merged.slice(-MAX_LINES) : merged
          })
        } else {
          // 無新數據 → 退避
          pollInterval = Math.min(pollInterval * BACKOFF_FACTOR, MAX_POLL_INTERVAL)
        }
      } else {
        setIsConnected(false)
        pollInterval = Math.min(pollInterval * BACKOFF_FACTOR, MAX_POLL_INTERVAL)
      }

      timerId = setTimeout(poll, pollInterval)
    }

    timerId = setTimeout(poll, MIN_POLL_INTERVAL)

    return () => {
      active = false
      clearTimeout(timerId)
    }
  }, [enabled, source])

  const pause = useCallback(() => {
    isPausedRef.current = true
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    isPausedRef.current = false
    setIsPaused(false)
  }, [])

  const clearLocal = useCallback(() => {
    setLines([])
    lastTimestampRef.current = ''
    initialLoadDone.current = false
  }, [])

  const clear = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) return false

    let clearResult = await clearAdminLogs({ token, source })

    // 清空失敗時重試一次（短暫網路抖動或代理超時）
    if (!clearResult.success) {
      await new Promise(resolve => setTimeout(resolve, 300))
      clearResult = await clearAdminLogs({ token, source })
    }

    const refreshed = await getAdminLogs({ token, lines: 200, source })
    if (refreshed.success && refreshed.data?.lines) {
      setLines(refreshed.data.lines)
      if (refreshed.data.lines.length > 0) {
        lastTimestampRef.current = refreshed.data.lines[refreshed.data.lines.length - 1].timestamp
      } else {
        lastTimestampRef.current = ''
      }
      setIsConnected(true)
    } else {
      setLines([])
      lastTimestampRef.current = ''
      setIsConnected(false)
    }

    // 清空後維持輪詢啟用，讓新日誌可即時顯示
    initialLoadDone.current = true
    return clearResult.success
  }, [source])

  return { lines, isConnected, isPaused, pause, resume, clear, clearLocal }
}
