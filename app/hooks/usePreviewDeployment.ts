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
  /** R10：失敗時 backend 抓 Vercel build log 帶過來，UX 摺疊面板顯示前 20 行給用戶 / 開發者 debug */
  errorDetails: string | null
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
  errorDetails: null,
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
  /** R10：backend 抓的 Vercel build log（前 4000 字）*/
  errorDetails?: string
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
          errorDetails: null,  // 初次 fetch 無 errorDetails，socket event 才會帶
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

    // fallback 不能是 '/'：頁面 origin 是 Vercel（沒有 socket server），WS 會永遠連不上
    const wsUrl = process.env.NEXT_PUBLIC_VPS_WS_URL || process.env.NEXT_PUBLIC_VPS_API_URL || 'https://api.tellcraft.com'
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
        errorDetails: event.errorDetails ?? null,
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

  // Polling 補償：socket 斷線（WS URL 配錯 / 防火牆擋 WS）時 preview:ready 永遠收不到 →
  // 轉圈卡死直到重整。building 期間每 10s 輪詢 latest，只在 ready/failed 時套用（不干擾 socket 進度更新）
  useEffect(() => {
    if (!conversationId || state.status !== 'building') return
    const token = getAuthToken()
    const interval = setInterval(() => {
      fetch(`/api/vps/api/conversation/${conversationId}/preview/latest`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
        .then(r => r.ok ? r.json() as Promise<PreviewLatestResponse> : null)
        .then(data => {
          if (!data) return
          if (data.status === 'ready') {
            setState(prev => prev.status === 'building' ? {
              ...prev,
              url: data.url,
              status: 'ready',
              progressPercent: 100,
              progressStep: '預覽就緒',
              etaSeconds: 0,
              error: null,
              deploymentId: data.deploymentId ?? prev.deploymentId,
              lkgUrl: data.lkgUrl,
            } : prev)
          } else if (data.status === 'failed') {
            setState(prev => prev.status === 'building' ? {
              ...prev,
              status: 'failed',
              error: data.error ?? '部署失敗',
              lkgUrl: data.lkgUrl,
              progressPercent: 0,
              progressStep: '',
            } : prev)
          }
        })
        .catch(() => { /* fail-soft：下一輪再試 */ })
    }, 10_000)
    return () => clearInterval(interval)
  }, [conversationId, state.status])

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
 *
 * **預設 ON** — 用戶 2026-05-17 決策全換 Vercel preview，不再走 WebContainer。
 * Kill switch：env 顯式設 `NEXT_PUBLIC_ENABLE_VERCEL_PREVIEW='false'` 才回退 WebContainer
 * （供 emergency rollback 用，正常情況不該設）
 */
export function useIsVercelPreviewEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_VERCEL_PREVIEW !== 'false'
}

/**
 * R10 治本 Layer 6：用戶 explicit retry preview deploy
 * POST /api/conversation/:id/preview/retry → backend enqueue 完整 6 層自動修復流程
 * bypass debounce + rate limit（用戶 explicit consent 不擋）
 */
export function useRetryPreview(conversationId: string | undefined): () => Promise<void> {
  return useCallback(async () => {
    if (!conversationId) return
    const token = getAuthToken()
    try {
      const res = await fetch(`/api/vps/api/conversation/${conversationId}/preview/retry`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('[useRetryPreview] retry failed:', data)
        alert(data.error || '重新部署失敗')
        return
      }
      // 成功 enqueue — socket.io preview:progress / preview:ready event 會更新 state
      // 不 reload 整頁，避免打斷其他對話內容
    } catch (err) {
      console.error('[useRetryPreview] network error:', err)
    }
  }, [conversationId])
}
