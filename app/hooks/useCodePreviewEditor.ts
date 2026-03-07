'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ElementInfo } from '@/app/components/uiux/PreviewPanel'
import { getAuthToken } from '@/app/hooks/useAuth'
import { uploadImage } from '@/app/lib/vps-api'

export function useCodePreviewEditor(conversationId: string | undefined) {
  const [codePreviewEditMode, setCodePreviewEditMode] = useState(false)
  const [codePreviewSelectedElements, setCodePreviewSelectedElements] = useState<ElementInfo[]>([])
  const [codePreviewSelectedElement, setCodePreviewSelectedElement] = useState<ElementInfo | null>(null)
  const [codePreviewOverrides, setCodePreviewOverrides] = useState<Record<string, Record<string, string>>>({})
  const [codePreviewAnnotations, setCodePreviewAnnotations] = useState<Record<string, string>>({})
  const [codePreviewOverrideHistory, setCodePreviewOverrideHistory] = useState<Record<string, Record<string, string>>[]>([{}])
  const [codePreviewHistoryIndex, setCodePreviewHistoryIndex] = useState(0)
  const codePreviewSeqRef = useRef(0)
  const [codePreviewPendingUpdate, setCodePreviewPendingUpdate] = useState<{ elementId: string; changes: Record<string, string> } | null>(null)
  const [codePreviewPendingReset, setCodePreviewPendingReset] = useState<string | null>(null)
  const [codePreviewPendingOverrides, setCodePreviewPendingOverrides] = useState<Record<string, Record<string, string>> | null>(null)

  const handleCodePreviewSelectionChanged = useCallback((elements: ElementInfo[]) => {
    setCodePreviewSelectedElements(elements)
  }, [])

  const getPreviewIframe = useCallback(() => {
    const containers = document.querySelectorAll('[data-preview-container]')
    for (const container of containers) {
      const iframe = container.querySelector('iframe')
      if (iframe?.contentWindow) return iframe
    }
    return null
  }, [])

  const handleRemoveSelectedElement = useCallback((elementId: string) => {
    setCodePreviewSelectedElements(prev => prev.filter(el => el.id !== elementId))
    const iframe = getPreviewIframe()
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'tc_toggleElement', elementId }, '*')
    }
  }, [getPreviewIframe])

  const handleClearSelection = useCallback(() => {
    setCodePreviewSelectedElements([])
    const iframe = getPreviewIframe()
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'tc_clearSelection' }, '*')
    }
  }, [getPreviewIframe])

  const handleCodePreviewElementSelected = useCallback((element: ElementInfo | null) => {
    setCodePreviewSelectedElement(element)
  }, [])

  const handleCodePreviewElementUpdate = useCallback((elementId: string, changes: Record<string, string>) => {
    setCodePreviewPendingUpdate({ elementId, changes })
    setCodePreviewOverrides(prev => {
      const next = { ...prev, [elementId]: { ...(prev[elementId] || {}), ...changes } }
      const seq = ++codePreviewSeqRef.current
      setCodePreviewOverrideHistory(h => {
        const truncated = h.slice(0, codePreviewHistoryIndex + 1)
        const newH = [...truncated, { ...next }]
        if (newH.length > 50) newH.shift()
        return newH
      })
      setCodePreviewHistoryIndex(i => {
        void seq
        return Math.min(i + 1, 49)
      })
      return next
    })
  }, [codePreviewHistoryIndex])

  const handleCodePreviewResetElement = useCallback((elementId: string) => {
    setCodePreviewPendingReset(elementId)
    setCodePreviewOverrides(prev => {
      const next = { ...prev }
      delete next[elementId]
      return next
    })
    setCodePreviewAnnotations(prev => {
      const next = { ...prev }
      delete next[elementId]
      return next
    })
  }, [])

  const codePreviewCanUndo = codePreviewHistoryIndex > 0
  const codePreviewCanRedo = codePreviewHistoryIndex < codePreviewOverrideHistory.length - 1

  const handleCodePreviewUndo = useCallback(() => {
    if (codePreviewHistoryIndex <= 0) return
    const newIdx = codePreviewHistoryIndex - 1
    setCodePreviewHistoryIndex(newIdx)
    const snapshot = codePreviewOverrideHistory[newIdx]
    setCodePreviewOverrides(snapshot)
    setCodePreviewPendingOverrides({ ...snapshot })
  }, [codePreviewHistoryIndex, codePreviewOverrideHistory])

  const handleCodePreviewRedo = useCallback(() => {
    if (codePreviewHistoryIndex >= codePreviewOverrideHistory.length - 1) return
    const newIdx = codePreviewHistoryIndex + 1
    setCodePreviewHistoryIndex(newIdx)
    const snapshot = codePreviewOverrideHistory[newIdx]
    setCodePreviewOverrides(snapshot)
    setCodePreviewPendingOverrides({ ...snapshot })
  }, [codePreviewHistoryIndex, codePreviewOverrideHistory])

  const handleCodePreviewUploadImage = useCallback(async (file: File): Promise<string | null> => {
    const token = getAuthToken()
    if (!token) return null
    const result = await uploadImage({ file, token })
    return result.success ? (result.data?.url || null) : null
  }, [])

  const handleCodePreviewAnnotationChange = useCallback((elementId: string, text: string) => {
    setCodePreviewAnnotations(prev => ({ ...prev, [elementId]: text }))
  }, [])

  const handleCodePreviewElementResized = useCallback((elementId: string, width: number, height: number) => {
    handleCodePreviewElementUpdate(elementId, { width: `${width}px`, height: `${height}px` })
  }, [handleCodePreviewElementUpdate])

  // Keyboard shortcuts: Cmd+Z / Cmd+Shift+Z
  useEffect(() => {
    if (!codePreviewEditMode) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleCodePreviewRedo()
        } else {
          handleCodePreviewUndo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [codePreviewEditMode, handleCodePreviewUndo, handleCodePreviewRedo])

  // localStorage persist overrides
  useEffect(() => {
    if (!conversationId) return
    const key = `tc-overrides-${conversationId}`
    if (Object.keys(codePreviewOverrides).length > 0) {
      localStorage.setItem(key, JSON.stringify(codePreviewOverrides))
    } else {
      localStorage.removeItem(key)
    }
  }, [codePreviewOverrides, conversationId])

  // localStorage persist annotations
  useEffect(() => {
    if (!conversationId) return
    const key = `tc-annotations-${conversationId}`
    if (Object.keys(codePreviewAnnotations).length > 0) {
      localStorage.setItem(key, JSON.stringify(codePreviewAnnotations))
    } else {
      localStorage.removeItem(key)
    }
  }, [codePreviewAnnotations, conversationId])

  // Load localStorage data
  useEffect(() => {
    if (!conversationId) return
    try {
      const oKey = `tc-overrides-${conversationId}`
      const saved = localStorage.getItem(oKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setCodePreviewOverrides(parsed)
        setCodePreviewOverrideHistory([{}, parsed])
        setCodePreviewHistoryIndex(1)
      }
      const aKey = `tc-annotations-${conversationId}`
      const savedA = localStorage.getItem(aKey)
      if (savedA) setCodePreviewAnnotations(JSON.parse(savedA))
    } catch { /* ignore */ }
  }, [conversationId])

  const resetEditor = useCallback(() => {
    setCodePreviewEditMode(false)
    setCodePreviewSelectedElements([])
    setCodePreviewSelectedElement(null)
    setCodePreviewOverrides({})
    setCodePreviewAnnotations({})
    setCodePreviewOverrideHistory([{}])
    setCodePreviewHistoryIndex(0)
    setCodePreviewPendingUpdate(null)
    setCodePreviewPendingReset(null)
    setCodePreviewPendingOverrides(null)
  }, [])

  return {
    codePreviewEditMode,
    setCodePreviewEditMode,
    codePreviewSelectedElements,
    setCodePreviewSelectedElements,
    codePreviewSelectedElement,
    setCodePreviewSelectedElement,
    codePreviewOverrides,
    setCodePreviewOverrides,
    codePreviewAnnotations,
    setCodePreviewAnnotations,
    codePreviewOverrideHistory,
    codePreviewHistoryIndex,
    setCodePreviewHistoryIndex,
    codePreviewPendingUpdate,
    codePreviewPendingReset,
    codePreviewPendingOverrides,
    codePreviewCanUndo,
    codePreviewCanRedo,
    handleCodePreviewSelectionChanged,
    getPreviewIframe,
    handleRemoveSelectedElement,
    handleClearSelection,
    handleCodePreviewElementSelected,
    handleCodePreviewElementUpdate,
    handleCodePreviewResetElement,
    handleCodePreviewUndo,
    handleCodePreviewRedo,
    handleCodePreviewUploadImage,
    handleCodePreviewAnnotationChange,
    handleCodePreviewElementResized,
    resetEditor,
  }
}
