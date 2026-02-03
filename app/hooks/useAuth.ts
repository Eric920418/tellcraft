'use client'

import { useState, useEffect, useCallback } from 'react'

// 使用 Vercel proxy 避免 Mixed Content 問題
const AUTH_API_URL = '/api/auth'

export interface AuthUser {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  plan?: string
  isAdmin?: boolean
}

export interface AuthState {
  isLoading: boolean
  isAuthenticated: boolean
  user: AuthUser | null
  token: string | null
}

/**
 * VPS JWT Auth Hook
 * 從 localStorage 讀取 token，驗證並獲取用戶資訊
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    token: null,
  })

  const checkAuth = useCallback(async () => {
    if (typeof window === 'undefined') {
      setState(prev => ({ ...prev, isLoading: false }))
      return
    }

    const token = localStorage.getItem('auth_token')

    if (!token) {
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
      })
      return
    }

    try {
      const response = await fetch(`${AUTH_API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        // Token 無效，清除
        localStorage.removeItem('auth_token')
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          token: null,
        })
        return
      }

      const data = await response.json() as { user: AuthUser }

      setState({
        isLoading: false,
        isAuthenticated: true,
        user: data.user,
        token,
      })
    } catch (error) {
      console.error('[Auth] Failed to verify token:', error)
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
      })
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const logout = useCallback(async () => {
    // 清除 localStorage
    localStorage.removeItem('auth_token')

    // 清除 httpOnly cookie
    try {
      await fetch('/api/auth/set-cookie', { method: 'DELETE' })
    } catch {
      // 忽略錯誤，繼續登出流程
    }

    setState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null,
    })
  }, [])

  const refreshAuth = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }))
    checkAuth()
  }, [checkAuth])

  return {
    ...state,
    logout,
    refreshAuth,
  }
}

/**
 * 獲取當前 token（用於 API 請求）
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

/**
 * 設置 auth token
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('auth_token', token)
}

/**
 * 清除 auth token
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
}
