'use client'

import { useEffect, useRef, useState } from 'react'
import { getOrBootContainer, setPreloadPromise } from './useWebContainer'
import { buildSkeletonFiles } from '@/app/lib/webcontainer-utils'

export type PreloaderStatus = 'idle' | 'booting' | 'installing' | 'ready' | 'error'

// Stages that indicate code generation is in progress or imminent.
// Triggering early (e.g., on variant selection) gives more overlap with generation time.
const PRELOAD_TRIGGER_STAGES = new Set([
  // Fine mode: design confirmed → code generation imminent
  'uiux_code_generation',
  'uiux_variant_selection',
  'uiux_generating_variants',
  // Fast mode: goes directly to generation
  'fast_generating',
  // Generation in progress (fallback if earlier triggers were missed)
  'uiux_pipeline_progress',
  'uiux_structure_generating',
  'uiux_animation_generating',
  'uiux_rwd_generating',
])

// Module-level flag — only trigger once per page load.
// The WebContainer singleton persists across conversations, so BASE_DEPS stay installed.
let hasTriggered = false

export function useWebContainerPreloader(
  currentStage: string | undefined,
): { status: PreloaderStatus } {
  const [status, setStatus] = useState<PreloaderStatus>('idle')
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (hasTriggered) return
    if (!currentStage || !PRELOAD_TRIGGER_STAGES.has(currentStage)) return
    hasTriggered = true

    const promise = (async (): Promise<boolean> => {
      try {
        console.log('[Preloader] Triggered on stage:', currentStage)
        if (mountedRef.current) setStatus('booting')

        const container = await getOrBootContainer()

        // Mount skeleton files (package.json with BASE_DEPS + minimal Next.js project)
        const skeleton = buildSkeletonFiles()
        await container.mount(skeleton)

        if (mountedRef.current) setStatus('installing')
        console.log('[Preloader] Installing BASE_DEPS...')

        // Install BASE_DEPS (next, react, react-dom, motion, tailwindcss, postcss, autoprefixer)
        const installProcess = await container.spawn('npm', ['install', '--no-audit', '--no-fund'])

        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            if (data.includes('added') || data.includes('packages')) {
              console.log('[Preloader]', data.trim().slice(0, 80))
            }
          }
        })).catch(() => {})

        const exitCode = await installProcess.exit

        if (exitCode !== 0) {
          console.error('[Preloader] npm install failed, exit code:', exitCode)
          if (mountedRef.current) setStatus('error')
          return false
        }

        console.log('[Preloader] BASE_DEPS pre-installed successfully')
        if (mountedRef.current) setStatus('ready')
        return true
      } catch (err) {
        console.error('[Preloader] Error:', err)
        if (mountedRef.current) setStatus('error')
        return false
      }
    })()

    setPreloadPromise(promise)
  }, [currentStage])

  return { status }
}
