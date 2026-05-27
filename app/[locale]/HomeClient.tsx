'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ErrorBoundary from '@/app/components/ErrorBoundary'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import { useLocalePath } from '@/app/hooks/useLocalePath'
import { AnimatedThemeToggler } from '@/app/components/AnimatedThemeToggler'
import LocaleSwitcher from '@/app/components/LocaleSwitcher'
import GlowButton from '@/app/components/GlowButton'
import { getUserConversations } from '@/app/lib/vps-api'
import { useAuth, getAuthToken } from '@/app/hooks/useAuth'
import LoginPrompt from '@/app/components/LoginPrompt'
import OnboardingOverlay from '@/app/components/chat/OnboardingOverlay'
import ProjectReminder from '@/app/components/ProjectReminder'
import { smoothEasing } from '@/app/lib/chat-utils'

import {
  HeroSection,
  TemplatesShowcaseSection,
  UseCasesSection,
  HowItWorksSection,
  StatsSection,
  ComparisonSection,
  ShowcaseSection,
  FAQSection,
  TestimonialSection,
  CTASection,
  PrecisionPricingSection,
  Footer,
} from '@/app/components/landing'
import Link from 'next/link'

import ChatSection from '@/app/components/chat/ChatSection'
import SmoothScroll from '@/app/components/SmoothScroll'

function HomeContent() {
  const tChat = useTranslations('chat')
  const tAuth = useTranslations('auth')
  const tLogin = useTranslations('login')
  const locale = useLocale()
  const localePath = useLocalePath()
  const searchParams = useSearchParams()
  const [isChatActive, setIsChatActive] = useState(false)
  const [heroInput, setHeroInput] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [resumeConversationId, setResumeConversationId] = useState<string | null>(null)
  const [anonymousId, setAnonymousId] = useState<string | undefined>(undefined)
  const [buildMode, setBuildMode] = useState<'fast' | 'fine' | 'clone'>('fast')
  const [heroImages, setHeroImages] = useState<File[]>([])
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false)
  const [openedFromUrl, setOpenedFromUrl] = useState(false)
  const [recentProjects, setRecentProjects] = useState<Array<{ id: string; name: string; status: string; latestConversationId: string | null }>>([])
  const [isDashboardLoading, setIsDashboardLoading] = useState(false)

  // VPS JWT Auth Hook
  const auth = useAuth()

  // 頁面載入時強制滾動到頂部（禁用瀏覽器滾動恢復）
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)
  }, [])

  // 獲取 anonymousId（用於提醒組件）
  useEffect(() => {
    const id = localStorage.getItem('tellcraft_anonymous_id') || undefined
    setAnonymousId(id)
  }, [])

  // 已登入時取得最近對話過的專案（用於 Hero 快捷入口）
  useEffect(() => {
    if (!auth.isAuthenticated) return
    const token = getAuthToken()
    if (!token) return
    getUserConversations({ token }).then((result) => {
      if (result.success && result.data) {
        // 依對話 updatedAt 排序，去重後取前 3 個專案
        const seen = new Set<string>()
        const projects = result.data.conversations
          .filter(c => { if (seen.has(c.projectId)) return false; seen.add(c.projectId); return true })
          .slice(0, 3)
          .map(c => ({ id: c.projectId, name: c.projectName, status: '', latestConversationId: c.id }))
        setRecentProjects(projects)
      }
    }).catch(() => {})
  }, [auth.isAuthenticated])

  // 檢查 URL 參數，如果有 conversation 則恢復對話
  useEffect(() => {
    const conversationId = searchParams.get('conversation')
    if (conversationId) {
      setResumeConversationId(conversationId)
      setIsChatActive(true)
      setOpenedFromUrl(true)
    }
  }, [searchParams])

  // 精細模式付款完成跳回 chat 時帶 ?orderId=（/pay/success → router.push(?orderId=...)）
  // 傳給 ChatSection，每次 sendMessage 都帶到 backend；後端只第一次寫入 FlowState
  const precisionOrderId = searchParams.get('orderId') || undefined

  // 瀏覽器返回鍵監聯
  useEffect(() => {
    const handlePopState = () => {
      if (isChatActive) {
        setIsChatActive(false)
        setHeroInput('')
        setInitialMessage('')
        setResumeConversationId(null)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isChatActive])

  // 對話模式時禁用首頁滾動
  useEffect(() => {
    if (isChatActive) {
      const scrollY = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    } else {
      const scrollY = document.body.style.top
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
    }
  }, [isChatActive])

  const handleSignOut = () => {
    auth.logout()
    window.location.reload()
  }

  const handleDashboard = async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      window.location.href = localePath('/auth/login?next=/dashboard')
      return
    }

    setIsDashboardLoading(true)
    try {
      const res = await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (res.ok) {
        window.location.href = localePath('/dashboard')
      } else {
        localStorage.removeItem('auth_token')
        window.location.href = localePath('/auth/login?next=/dashboard')
      }
    } catch {
      window.location.href = localePath('/dashboard')
    } finally {
      setIsDashboardLoading(false)
    }
  }

  const handleLoginFromHero = useCallback(() => {
    const anonymousId = localStorage.getItem('tellcraft_anonymous_id')
    const loginUrl = anonymousId
      ? localePath(`/auth/login?anonymousId=${encodeURIComponent(anonymousId)}`)
      : localePath('/auth/login')
    window.location.href = loginUrl
  }, [localePath])

  const handleStartChat = useCallback(() => {
    const hasText = heroInput.trim().length > 0
    const hasImages = buildMode === 'clone' && heroImages.length > 0
    if (hasText || hasImages) {
      if (!auth.isAuthenticated && !auth.isLoading) {
        const guestUsed = localStorage.getItem('tellcraft_guest_fast_used') === 'true'
        if (guestUsed) {
          setShowGuestLimitModal(true)
          return
        }
      }
      setInitialMessage(hasText ? heroInput : (locale === 'zh' ? '復刻這個網站' : 'Clone this site'))
      setIsChatActive(true)
      window.history.pushState({ tellcraftChat: true }, '')
    }
  }, [heroInput, heroImages, buildMode, auth.isAuthenticated, auth.isLoading, locale])

  const handleBackToHome = useCallback(() => {
    setIsChatActive(false)
    setHeroInput('')
    setInitialMessage('')
    setHeroImages([])
    setResumeConversationId(null)
    setOpenedFromUrl(false)
    if (window.history.state?.tellcraftChat || openedFromUrl) {
      window.history.back()
    } else {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [openedFromUrl])

  const handleFocusInput = useCallback(() => {
    const input = document.querySelector('textarea')
    if (input) {
      input.focus()
    }
  }, [])

  const handleContinueFromReminder = useCallback((conversationId: string) => {
    setResumeConversationId(conversationId)
    setIsChatActive(true)
    window.history.pushState({ tellcraftChat: true }, '')
  }, [])

  return (
    <>
      {/* 展示頁面啟用 smooth scroll 重量感（chat 模式不啟用） */}
      {!isChatActive && <SmoothScroll />}

      {/* Project Reminder */}
      {!isChatActive && (
        <ProjectReminder
          anonymousId={anonymousId}
          onContinue={handleContinueFromReminder}
        />
      )}

      {/* Theme Toggler - Fixed Top Left */}
      <AnimatePresence mode="wait">
        {!isChatActive && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.35, ease: smoothEasing }}
            style={{
              position: 'fixed',
              top: 20,
              left: 20,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--header-glass)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 12,
              padding: '6px 12px',
              border: '1px solid var(--header-border)',
            }}
          >
            <AnimatedThemeToggler />
            <LocaleSwitcher />
            <Link
              href={`/${locale}/pricing`}
              prefetch={false}
              style={{
                fontSize: 13,
                color: 'var(--gray-700)',
                textDecoration: 'none',
                padding: '4px 10px',
                borderLeft: '1px solid var(--gray-300)',
                lineHeight: 1.4,
                whiteSpace: 'nowrap',
              }}
            >
              {locale === 'zh' ? '方案' : 'Pricing'}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Button - Fixed Top Right */}
      <AnimatePresence mode="wait">
        {!isChatActive && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.35, ease: smoothEasing }}
            className="landing-auth-area"
            style={{
              position: 'fixed',
              top: 20,
              right: 20,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'var(--header-glass)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 12,
              padding: '6px 14px',
              border: '1px solid var(--header-border)',
            }}
          >
        {auth.isLoading ? (
          <div style={{ width: 80, height: 36 }} />
        ) : auth.isAuthenticated && auth.user ? (
          <div className="landing-user-info" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {auth.user.avatarUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={auth.user.avatarUrl}
                alt=""
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '1px solid var(--border-color)',
                }}
              />
            )}
            <span className="landing-user-name" style={{ fontSize: 14, color: 'var(--gray-600)' }}>
              {auth.user.name || auth.user.email?.split('@')[0] || tChat('defaultUserName')}
            </span>
            <GlowButton onClick={handleDashboard} variant="outline" size="sm">
              {isDashboardLoading ? '...' : tAuth('dashboardButton')}
            </GlowButton>
            <GlowButton onClick={handleSignOut} variant="outline" size="sm">
              {tAuth('logoutButton')}
            </GlowButton>
          </div>
        ) : (
          <GlowButton href="/auth/login" variant="outline" size="sm">
            {tAuth('loginButton')}
          </GlowButton>
        )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <HeroSection
        onStartChat={handleStartChat}
        inputValue={heroInput}
        onInputChange={setHeroInput}
        isChatActive={isChatActive}
        buildMode={buildMode}
        onBuildModeChange={setBuildMode}
        isAuthenticated={auth.isAuthenticated || auth.isLoading}
        onLoginRequired={handleLoginFromHero}
        recentProjects={recentProjects}
        onResumeProject={handleContinueFromReminder}
        heroImages={heroImages}
        onHeroImagesChange={setHeroImages}
      />

      {/* Chat Overlay */}
      <ErrorBoundary>
        <ChatSection
          isActive={isChatActive}
          initialMessage={initialMessage}
          resumeConversationId={resumeConversationId}
          onBack={handleBackToHome}
          buildMode={buildMode}
          initialImages={heroImages}
          precisionOrderId={precisionOrderId}
        />
      </ErrorBoundary>

      {/* 付款完 onboarding modal — 帶 ?orderId= 進來時顯示一次（sessionStorage 記憶） */}
      {precisionOrderId && <OnboardingOverlay orderId={precisionOrderId} />}

      {/* Guest Limit Modal */}
      {showGuestLimitModal && (
        <LoginPrompt
          variant="emphasized"
          message={tLogin('guestLimitTitle')}
          subMessage={tLogin('guestLimitMessage')}
          onLogin={handleLoginFromHero}
          onDismiss={() => setShowGuestLimitModal(false)}
        />
      )}

      {/* Landing Sections */}
      <TemplatesShowcaseSection />
      <UseCasesSection />
      <HowItWorksSection />
      <StatsSection />
      <ComparisonSection />
      <ShowcaseSection />
      <FAQSection />
      <TestimonialSection />
      <PrecisionPricingSection />
      <CTASection onStartChat={handleFocusInput} />
      <Footer />
    </>
  )
}

// useSearchParams 的 Suspense 邊界收窄到此處
export default function HomeClient() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  )
}
