'use client'

/**
 * usePreviewDeployment — Vercel preview iframe 替換 WebContainer 的 lifecycle hook
 *
 * 後端 Phase 0-2 (commit c84690c4) 在 phase handler 完成時 enqueue quickPreviewDeploy →
 * Vercel build → socket.io 推 preview:{progress,ready,failed} → 此 hook 收後更新 state
 * → ChatPreviewPanel 渲染 iframe src=url
 *
 * Lifecycle：
 *   1. Mount：fetch /api/conversation/:id/preview/latest 拿最新一次 preview（若有 ready 直接顯示）
 *   2. Socket listener：connect 既有 io，listen preview:progress / preview:ready / preview:failed
 *   3. 不主動 trigger deploy — 由後端 phase handler 自動 enqueue
 *
 * 設計：fail-soft — socket 連不上 / fetch 失敗都不阻塞主流程
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { io as ioClient, type Socket } from 'socket.io-client'
import { getAuthToken } from '@/app/hooks/useAuth'

export type PreviewStatus = 'idle' | 'building' | 'ready' | 'failed'

export interface PreviewDeploymentState {
  url: string | null
  status: PreviewStatus
  etaSeconds: number
  progressPercent: number
  progressStep: string
  error: string | null
  lkgUrl: string | null
  deploymentId: string | null
}

const DEFAULT_STATE: PreviewDeploymentState = {
  url: null,
  status: 'idle',
  etaSeconds: 150,  // 2.5 min default ETA
  progressPercent: 0,
  progressStep: '',
  error: null,
  lkgUrl: null,
  deploymentId: null,
}

interface PreviewLatestResponse {
  status: 'none' | 'building' | 'ready' | 'failed'
  url: string | null
  deploymentId?: string
  error?: string | null
  lkgUrl: string | null
  createdAt?: string
}

interface PreviewProgressEvent {
  conversationId: string
  percent: number
  step: string
}

interface PreviewReadyEvent {
  conversationId: string
  url: string
  deploymentId: string
  cached?: boolean
}

interface PreviewFailedEvent {
  conversationId: string
  error: string
  lkgUrl: string | null
}

export function usePreviewDeployment(conversationId: string | undefined): PreviewDeploymentState {
  const [state, setState] = useState<PreviewDeploymentState>(DEFAULT_STATE)
  const socketRef = useRef<Socket | null>(null)

  // Initial fetch：拿最近一次 preview
  useEffect(() => {
    if (!conversationId) return

    let cancelled = false
    const token = getAuthToken()

    fetch(`/api/vps/api/conversation/${conversationId}/preview/latest`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then(r => r.ok ? r.json() as Promise<PreviewLatestResponse> : null)
      .then(data => {
        if (cancelled || !data) return
        if (data.status === 'none') {
          setState({ ...DEFAULT_STATE })
          return
        }
        setState({
          url: data.status === 'ready' ? data.url : null,
          status: data.status === 'ready' ? 'ready' : data.status === 'failed' ? 'failed' : 'building',
          etaSeconds: 150,
          progressPercent: data.status === 'ready' ? 100 : data.status === 'building' ? 30 : 0,
          progressStep: data.status === 'ready' ? '預覽就緒' : data.status === 'building' ? '部署中...' : '',
          error: data.error ?? null,
          lkgUrl: data.lkgUrl,
          deploymentId: data.deploymentId ?? null,
        })
      })
      .catch(() => { /* silent fail */ })

    return () => { cancelled = true }
  }, [conversationId])

  // Socket.io listener
  useEffect(() => {
    if (!conversationId) return

    const wsUrl = process.env.NEXT_PUBLIC_VPS_WS_URL || '/'
    const socket = ioClient(wsUrl, {
      transports: ['websocket', 'polling'],
      query: { conversationId },
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join', `conversation:${conversationId}`)
    })

    socket.on('preview:progress', (event: PreviewProgressEvent) => {
      if (event.conversationId !== conversationId) return
      setState(prev => ({
        ...prev,
        status: 'building',
        progressPercent: event.percent,
        progressStep: event.step,
        etaSeconds: Math.max(0, 150 - Math.floor((event.percent / 100) * 150)),
      }))
    })

    socket.on('preview:ready', (event: PreviewReadyEvent) => {
      if (event.conversationId !== conversationId) return
      setState(prev => ({
        ...prev,
        url: event.url,
        status: 'ready',
        progressPercent: 100,
        progressStep: event.cached ? '使用快取版本' : '預覽就緒',
        etaSeconds: 0,
        error: null,
        deploymentId: event.deploymentId,
      }))
    })

    socket.on('preview:failed', (event: PreviewFailedEvent) => {
      if (event.conversationId !== conversationId) return
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: event.error,
        lkgUrl: event.lkgUrl,
        progressPercent: 0,
        progressStep: '',
      }))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [conversationId])

  // ETA 倒數
  useEffect(() => {
    if (state.status !== 'building') return
    const interval = setInterval(() => {
      setState(prev => prev.status === 'building'
        ? { ...prev, etaSeconds: Math.max(0, prev.etaSeconds - 1) }
        : prev,
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [state.status])

  return state
}

/**
 * Cross-origin postMessage 白名單 — 限制 *.vercel.app 才接收 edit bridge tc_* 訊息
 * 用於 ChatPreviewPanel 主視窗 listener，避免 evil iframe 偽造訊息
 */
export const VERCEL_PREVIEW_ORIGIN_REGEX = /^https:\/\/[a-z0-9-]+(-[a-z0-9-]+)*\.vercel\.app$/

export function isVercelPreviewOrigin(origin: string): boolean {
  return VERCEL_PREVIEW_ORIGIN_REGEX.test(origin)
}

/**
 * 給 ChatPreviewPanel 用：是否啟用 Vercel preview iframe（vs WebContainer）
 * Gate: NEXT_PUBLIC_ENABLE_VERCEL_PREVIEW='true'
 */
export function useIsVercelPreviewEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_VERCEL_PREVIEW === 'true'
}

/** 給其他 hook 用：retry 觸發（暫時用 reload 整個對話狀態的 hack；未來加 explicit retry endpoint） */
export function useRetryPreview(): () => void {
  return useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.reload()  // 簡化版：reload 觸發 phase handler 重生
    }
  }, [])
}
