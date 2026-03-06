'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ParsedLogLine } from '@/app/lib/vps-api'

const WS_URL = process.env.NEXT_PUBLIC_VPS_WS_URL || 'http://54.238.4.117:8080'
const MAX_LINES = 2000

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
  clear: () => void
}

export function useAdminLogs(options: UseAdminLogsOptions): UseAdminLogsReturn {
  const { enabled, source = 'all' } = options
  const socketRef = useRef<Socket | null>(null)
  const [lines, setLines] = useState<ParsedLogLine[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const isPausedRef = useRef(false)
  const bufferRef = useRef<ParsedLogLine[]>([])

  useEffect(() => {
    if (!enabled) return

    const token = localStorage.getItem('auth_token')
    if (!token) return

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      auth: { token },
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('subscribe_admin_logs', { source })
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('admin_log_line', (line: ParsedLogLine) => {
      if (isPausedRef.current) {
        bufferRef.current.push(line)
        if (bufferRef.current.length > MAX_LINES) {
          bufferRef.current = bufferRef.current.slice(-MAX_LINES)
        }
        return
      }
      setLines(prev => {
        const next = [...prev, line]
        return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next
      })
    })

    socket.on('error', (err: { message: string }) => {
      console.error('[AdminLogs] Socket error:', err.message)
    })

    return () => {
      socket.emit('unsubscribe_admin_logs')
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled, source])

  const pause = useCallback(() => {
    isPausedRef.current = true
    setIsPaused(true)
    bufferRef.current = []
  }, [])

  const resume = useCallback(() => {
    setLines(prev => {
      const merged = [...prev, ...bufferRef.current]
      bufferRef.current = []
      return merged.length > MAX_LINES ? merged.slice(-MAX_LINES) : merged
    })
    isPausedRef.current = false
    setIsPaused(false)
  }, [])

  const clear = useCallback(() => {
    setLines([])
    bufferRef.current = []
  }, [])

  return { lines, isConnected, isPaused, pause, resume, clear }
}
