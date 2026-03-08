'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { clearAdminLogs, getAdminLogs, type ParsedLogLine } from '@/app/lib/vps-api'

const MAX_LINES = 2000
const POLL_INTERVAL = 3000

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

    // 輪詢新日誌
    const interval = setInterval(async () => {
      if (!active || isPausedRef.current || !initialLoadDone.current) return

      const token = localStorage.getItem('auth_token')
      if (!token) {
        setIsConnected(false)
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
          // 更新最新時間戳
          lastTimestampRef.current = newLines[newLines.length - 1].timestamp

          setLines(prev => {
            // 用 raw 去重（同一秒內可能有多行相同時間戳）
            const existingRaws = new Set(prev.slice(-200).map(l => l.raw))
            const deduped = newLines.filter(l => !existingRaws.has(l.raw))
            if (deduped.length === 0) return prev
            const merged = [...prev, ...deduped]
            return merged.length > MAX_LINES ? merged.slice(-MAX_LINES) : merged
          })
        }
      } else {
        setIsConnected(false)
      }
    }, POLL_INTERVAL)

    return () => {
      active = false
      clearInterval(interval)
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
