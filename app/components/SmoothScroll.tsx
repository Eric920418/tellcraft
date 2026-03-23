'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Lenis smooth scroll — 讓頁面滾動有慣性和重量感。
 * 只用在首頁和模板頁等展示頁面，不用在 chat/dashboard 等操作頁面。
 */
export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,            // 滾動慣性持續時間（越大越「重」）
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // 指數衰減
      touchMultiplier: 1.5,     // 觸控裝置的靈敏度
      infinite: false,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return null
}
