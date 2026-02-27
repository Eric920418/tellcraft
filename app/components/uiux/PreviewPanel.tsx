'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import DeviceSwitcher, { DeviceType, getDeviceWidth } from './DeviceSwitcher'
import PropertyEditor from './PropertyEditor'
import { useAuth } from '../../hooks/useAuth'
import { getTemplateOverrides, saveTemplateOverrides, uploadImage } from '../../lib/vps-api'

// ============================================================
// PreviewPanel - 預覽面板元件
// 使用 iframe 渲染後端 HTML，支援即時編輯
// ============================================================

interface PreviewPanelProps {
  templateSlug?: string                   // 模板 slug
  previewImageUrl?: string                // 靜態預覽圖 URL（fallback）
  templateName?: string                   // 模板名稱
  isLoading?: boolean                     // 是否正在載入
  error?: string                          // 錯誤訊息
  projectId?: string                      // 專案 ID（用於持久化編輯）
}

// Debounce hook
function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay]) as T

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

// 元素資訊（用於互動編輯）
export interface ElementInfo {
  id: string
  tagName: string
  text?: string
  styles: Record<string, string>
  rect: { x: number; y: number; width: number; height: number }
  editableType?: 'text' | 'container' | 'image'
  path?: string
}

// 編輯橋接腳本 — 注入到 iframe 內部
// 負責：自動標記可編輯元素（文字/容器/圖片）、處理點擊、接收父視窗的更新指令
const EDIT_BRIDGE_SCRIPT = `
<script>
(function() {
  var editMode = false;
  var selectedId = null;

  // 自動標記可編輯元素（文字類）
  function tagEditableElements() {
    var selectors = 'h1, h2, h3, h4, h5, h6, p, button, a, span, li, label, figcaption, blockquote, dt, dd';
    var elements = document.querySelectorAll(selectors);
    var counts = {};

    elements.forEach(function(el) {
      var text = (el.textContent || '').trim();
      if (!text || el.closest('script, style, noscript, svg')) return;
      if (el.getAttribute('data-editable')) return;
      if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.tagName === 'LI') {
        // 保留，即使有子元素
      } else if (el.children.length > 0) {
        var hasEditableChild = el.querySelector('h1,h2,h3,h4,h5,h6,p,button,a,span');
        if (hasEditableChild && el.tagName !== 'P') return;
      }

      var tag = el.tagName.toLowerCase();
      counts[tag] = (counts[tag] || 0);
      el.setAttribute('data-editable', tag + '-' + counts[tag]);
      el.setAttribute('data-editable-type', 'text');
      el.setAttribute('data-original-text', el.textContent || '');
      counts[tag]++;
    });
  }

  // 標記容器元素
  function tagContainerElements() {
    var selectors = 'section, header, footer, nav, main, article, aside, div.hero, div.card, div.container';
    var elements = document.querySelectorAll(selectors);
    var counts = {};

    elements.forEach(function(el) {
      if (el.closest('script, style, noscript, svg')) return;
      if (el.getAttribute('data-editable')) return;
      // 只標記有實質內容的容器
      if (!el.textContent || !el.textContent.trim()) return;

      var tag = el.tagName.toLowerCase();
      var key = 'container-' + tag;
      counts[key] = (counts[key] || 0);
      el.setAttribute('data-editable', key + '-' + counts[key]);
      el.setAttribute('data-editable-type', 'container');
      counts[key]++;
    });
  }

  // 標記圖片元素
  function tagImageElements() {
    var images = document.querySelectorAll('img');
    var count = 0;

    images.forEach(function(el) {
      if (el.closest('script, style, noscript, svg')) return;
      if (el.getAttribute('data-editable')) return;

      el.setAttribute('data-editable', 'img-' + count);
      el.setAttribute('data-editable-type', 'image');
      el.setAttribute('data-original-src', el.src || '');
      el.setAttribute('data-original-alt', el.alt || '');
      count++;
    });
  }

  // 計算元素路徑 breadcrumb
  function getElementPath(el) {
    var parts = [];
    var current = el;
    while (current && current !== document.body && parts.length < 5) {
      var tag = current.tagName.toLowerCase();
      if (current.id) {
        parts.unshift(tag + '#' + current.id);
        break;
      } else if (current.className && typeof current.className === 'string') {
        var cls = current.className.split(' ').filter(function(c) { return c && !c.startsWith('data-') && c.length < 20; }).slice(0, 2).join('.');
        parts.unshift(cls ? tag + '.' + cls : tag);
      } else {
        parts.unshift(tag);
      }
      current = current.parentElement;
    }
    return parts.join(' > ');
  }

  // 提取計算樣式（根據 editable type 返回不同屬性集）
  function extractStyles(el) {
    var cs = window.getComputedStyle(el);
    var type = el.getAttribute('data-editable-type') || 'text';
    var base = {
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      padding: cs.padding,
      margin: cs.margin,
      borderRadius: cs.borderRadius
    };

    if (type === 'text') {
      base.textAlign = cs.textAlign;
      base.lineHeight = cs.lineHeight;
      base.letterSpacing = cs.letterSpacing;
      base.textDecoration = cs.textDecoration;
      base.textTransform = cs.textTransform;
    }

    if (type === 'container') {
      base.textAlign = cs.textAlign;
      base.lineHeight = cs.lineHeight;
      base.borderWidth = cs.borderWidth;
      base.borderColor = cs.borderColor;
      base.borderStyle = cs.borderStyle;
      base.boxShadow = cs.boxShadow;
      base.opacity = cs.opacity;
      base.display = cs.display;
      base.flexDirection = cs.flexDirection;
      base.justifyContent = cs.justifyContent;
      base.alignItems = cs.alignItems;
      base.gap = cs.gap;
      base.flexWrap = cs.flexWrap;
      base.overflow = cs.overflow;
      base.width = cs.width;
      base.maxWidth = cs.maxWidth;
      base.height = cs.height;
    }

    if (type === 'image') {
      base.objectFit = cs.objectFit;
      base.imgSrc = el.src || '';
      base.imgAlt = el.alt || '';
      base.width = cs.width;
      base.height = cs.height;
    }

    return base;
  }

  // 注入編輯模式的即時高亮樣式
  var styleEl = document.createElement('style');
  styleEl.id = 'edit-bridge-styles';
  styleEl.textContent = '';
  document.head.appendChild(styleEl);

  function updateEditStyles() {
    if (!editMode) {
      styleEl.textContent = '';
      return;
    }
    styleEl.textContent =
      '[data-editable] {' +
        'cursor: pointer !important;' +
        'outline: 2px dashed transparent;' +
        'outline-offset: 2px;' +
        'transition: outline-color 0.15s ease;' +
      '}' +
      '[data-editable]:hover {' +
        'outline-color: #94a3b8 !important;' +
      '}' +
      '[data-editable-type="container"]:hover {' +
        'outline-color: #f59e0b !important;' +
      '}' +
      '[data-editable-type="image"]:hover {' +
        'outline-color: #10b981 !important;' +
      '}' +
      (selectedId
        ? '[data-editable="' + selectedId + '"] { outline: 2px solid #3b82f6 !important; outline-offset: 2px; }'
        : '');
  }

  // 點擊處理
  document.addEventListener('click', function(e) {
    if (!editMode) return;

    var target = e.target.closest('[data-editable]');
    if (!target) {
      selectedId = null;
      updateEditStyles();
      window.parent.postMessage({ type: 'tc_elementDeselected' }, '*');
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    var id = target.getAttribute('data-editable');
    selectedId = id;
    updateEditStyles();

    var rect = target.getBoundingClientRect();
    var editableType = target.getAttribute('data-editable-type') || 'text';
    window.parent.postMessage({
      type: 'tc_elementSelected',
      data: {
        id: id,
        tagName: target.tagName,
        text: editableType !== 'image' ? (target.textContent || '') : undefined,
        styles: extractStyles(target),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        editableType: editableType,
        path: getElementPath(target)
      }
    }, '*');
  }, true);

  // 接收父視窗指令
  window.addEventListener('message', function(e) {
    var msg = e.data;
    if (!msg || !msg.type) return;

    if (msg.type === 'tc_setEditMode') {
      editMode = msg.enabled;
      if (!editMode) selectedId = null;
      updateEditStyles();
    }

    if (msg.type === 'tc_applyUpdate') {
      var el = document.querySelector('[data-editable="' + msg.elementId + '"]');
      if (!el) return;
      var changes = msg.changes;
      if (changes.text !== undefined) {
        el.textContent = changes.text;
      }
      if (changes.imgSrc !== undefined && el.tagName === 'IMG') {
        el.src = changes.imgSrc;
      }
      if (changes.imgAlt !== undefined && el.tagName === 'IMG') {
        el.alt = changes.imgAlt;
      }
      Object.keys(changes).forEach(function(key) {
        if (key !== 'text' && key !== 'imgSrc' && key !== 'imgAlt') {
          el.style[key] = changes[key];
        }
      });
    }

    if (msg.type === 'tc_applyOverrides') {
      var overrides = msg.overrides;
      Object.keys(overrides).forEach(function(elementId) {
        var el = document.querySelector('[data-editable="' + elementId + '"]');
        if (!el) return;
        var changes = overrides[elementId];
        if (changes.text !== undefined) {
          el.textContent = changes.text;
        }
        if (changes.imgSrc !== undefined && el.tagName === 'IMG') {
          el.src = changes.imgSrc;
        }
        if (changes.imgAlt !== undefined && el.tagName === 'IMG') {
          el.alt = changes.imgAlt;
        }
        Object.keys(changes).forEach(function(key) {
          if (key !== 'text' && key !== 'imgSrc' && key !== 'imgAlt') {
            el.style[key] = changes[key];
          }
        });
      });
    }

    if (msg.type === 'tc_resetElement') {
      var el = document.querySelector('[data-editable="' + msg.elementId + '"]');
      if (!el) return;
      // 恢復原始文字
      var origText = el.getAttribute('data-original-text');
      if (origText !== null) {
        el.textContent = origText;
      }
      // 恢復原始圖片
      if (el.tagName === 'IMG') {
        var origSrc = el.getAttribute('data-original-src');
        var origAlt = el.getAttribute('data-original-alt');
        if (origSrc !== null) el.src = origSrc;
        if (origAlt !== null) el.alt = origAlt;
      }
      // 清除所有 inline styles
      el.removeAttribute('style');
    }

    if (msg.type === 'tc_deselectElement') {
      selectedId = null;
      updateEditStyles();
    }
  });

  // DOM 載入後標記元素並通知父視窗
  function onReady() {
    tagEditableElements();
    tagContainerElements();
    tagImageElements();
    window.parent.postMessage({ type: 'tc_iframeReady' }, '*');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
</script>
`

export default function PreviewPanel({
  templateSlug,
  previewImageUrl,
  templateName,
  isLoading = false,
  error,
  projectId,
}: PreviewPanelProps) {
  const t = useTranslations('uiux')
  const [device, setDevice] = useState<DeviceType>('desktop')
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 認證狀態
  const { token, isAuthenticated } = useAuth()

  // HTML 內容狀態
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [htmlLoading, setHtmlLoading] = useState(false)
  const [htmlError, setHtmlError] = useState<string | null>(null)
  const [iframeReady, setIframeReady] = useState(false)

  // 編輯模式狀態
  const [editMode, setEditMode] = useState(false)
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null)
  const [elementOverrides, setElementOverrides] = useState<Record<string, Record<string, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [overridesLoaded, setOverridesLoaded] = useState(false)

  // Undo/Redo 歷史
  const [overrideHistory, setOverrideHistory] = useState<Record<string, Record<string, string>>[]>([{}])
  const [historyIndex, setHistoryIndex] = useState(0)

  // ── 載入後端 HTML ────────────────────────────────
  useEffect(() => {
    if (!templateSlug) {
      setHtmlContent(null)
      return
    }

    setHtmlLoading(true)
    setHtmlError(null)
    setIframeReady(false)

    fetch(`/api/templates/preview/${templateSlug}`)
      .then(res => {
        if (!res.ok) throw new Error(t('templateLoadFailed'))
        return res.text()
      })
      .then(html => {
        // 注入編輯橋接腳本（插入在 </body> 之前）
        const injected = html.replace('</body>', EDIT_BRIDGE_SCRIPT + '\n</body>')
        setHtmlContent(injected)
      })
      .catch(err => {
        console.error('[PreviewPanel] 載入 HTML 失敗:', err)
        setHtmlError(err.message || t('templateLoadFailed'))
      })
      .finally(() => {
        setHtmlLoading(false)
      })
  }, [templateSlug])

  // ── 載入已保存的 overrides ────────────────────────
  useEffect(() => {
    if (!projectId || !token || !isAuthenticated) {
      setOverridesLoaded(true)
      return
    }

    const loadOverrides = async () => {
      try {
        const result = await getTemplateOverrides({ projectId, token })
        if (result.success && result.data?.overrides) {
          setElementOverrides(result.data.overrides)
        }
      } catch (err) {
        console.error('[PreviewPanel] 載入 template overrides 失敗:', err)
      } finally {
        setOverridesLoaded(true)
      }
    }

    loadOverrides()
  }, [projectId, token, isAuthenticated])

  // ── iframe ready 後：應用 overrides + 同步 editMode ──
  useEffect(() => {
    if (!iframeReady || !iframeRef.current?.contentWindow) return

    // 同步編輯模式
    iframeRef.current.contentWindow.postMessage({
      type: 'tc_setEditMode',
      enabled: editMode,
    }, '*')

    // 應用已保存的 overrides
    if (overridesLoaded && Object.keys(elementOverrides).length > 0) {
      iframeRef.current.contentWindow.postMessage({
        type: 'tc_applyOverrides',
        overrides: elementOverrides,
      }, '*')
    }
  }, [iframeReady, overridesLoaded, elementOverrides, editMode])

  // ── 同步編輯模式到 iframe ────────────────────────
  useEffect(() => {
    if (!iframeRef.current?.contentWindow || !iframeReady) return
    iframeRef.current.contentWindow.postMessage({
      type: 'tc_setEditMode',
      enabled: editMode,
    }, '*')
  }, [editMode, iframeReady])

  // ── 監聽 iframe postMessage ────────────────────────
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const msg = e.data
      if (!msg || typeof msg.type !== 'string') return
      // 只處理 tc_ 前綴的訊息，避免與其他來源衝突
      if (!msg.type.startsWith('tc_')) return

      if (msg.type === 'tc_iframeReady') {
        setIframeReady(true)
      }

      if (msg.type === 'tc_elementSelected') {
        setSelectedElement(msg.data as ElementInfo)
      }

      if (msg.type === 'tc_elementDeselected') {
        setSelectedElement(null)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // ── 保存到後端（debounced）────────────────────────
  const saveToBackend = useCallback(async (overrides: Record<string, Record<string, string>>) => {
    if (!projectId || !token || !isAuthenticated) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const result = await saveTemplateOverrides({ projectId, overrides, token })
      if (!result.success) {
        setSaveError(result.error || t('saveFailed'))
      }
    } catch (err) {
      console.error('[PreviewPanel] 保存 template overrides 失敗:', err)
      setSaveError(t('saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }, [projectId, token, isAuthenticated])

  const debouncedSave = useDebounce(saveToBackend, 1000)

  const deviceWidth = getDeviceWidth(device)

  // ── 監聽容器大小 ────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const updateSize = () => {
      if (!containerRef.current) return
      const sidebarWidth = editMode && selectedElement ? 280 : 0
      setContainerSize({
        width: containerRef.current.clientWidth - 48 - sidebarWidth,
        height: containerRef.current.clientHeight - 48,
      })
    }

    const observer = new ResizeObserver(() => updateSize())
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [editMode, selectedElement])

  const scale = Math.min(containerSize.width / deviceWidth, 1)
  const scaledHeight = containerSize.height
  const innerHeight = scaledHeight / scale

  // ── 更新元素內容和樣式 ────────────────────────────
  const handleElementUpdate = useCallback((elementId: string, changes: Record<string, string>) => {
    const newOverrides = {
      ...elementOverrides,
      [elementId]: { ...elementOverrides[elementId], ...changes }
    }
    setElementOverrides(newOverrides)

    // 推入 Undo/Redo 歷史（截斷 redo 分支）
    setOverrideHistory(prev => {
      const truncated = prev.slice(0, historyIndex + 1)
      return [...truncated, JSON.parse(JSON.stringify(newOverrides))]
    })
    setHistoryIndex(prev => prev + 1)

    // 通知 iframe 即時更新 DOM
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'tc_applyUpdate',
        elementId,
        changes,
      }, '*')
    }

    // 同步更新 selectedElement 狀態
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement(prev => prev ? {
        ...prev,
        text: changes.text !== undefined ? changes.text : prev.text,
        styles: { ...prev.styles, ...changes }
      } : null)
    }

    // 自動保存到後端
    debouncedSave(newOverrides)
  }, [selectedElement, elementOverrides, historyIndex, debouncedSave])

  // ── Undo/Redo ────────────────────────────────────
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < overrideHistory.length - 1

  const applyHistoryState = useCallback((overrides: Record<string, Record<string, string>>) => {
    setElementOverrides(overrides)
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'tc_applyOverrides',
        overrides,
      }, '*')
    }
    debouncedSave(overrides)
  }, [debouncedSave])

  const handleUndo = useCallback(() => {
    if (!canUndo) return
    const newIndex = historyIndex - 1
    setHistoryIndex(newIndex)
    applyHistoryState(overrideHistory[newIndex])
  }, [canUndo, historyIndex, overrideHistory, applyHistoryState])

  const handleRedo = useCallback(() => {
    if (!canRedo) return
    const newIndex = historyIndex + 1
    setHistoryIndex(newIndex)
    applyHistoryState(overrideHistory[newIndex])
  }, [canRedo, historyIndex, overrideHistory, applyHistoryState])

  // ── 重置單一元素 ────────────────────────────────
  const handleResetElement = useCallback((elementId: string) => {
    const newOverrides = { ...elementOverrides }
    delete newOverrides[elementId]
    setElementOverrides(newOverrides)

    // 推入歷史
    setOverrideHistory(prev => {
      const truncated = prev.slice(0, historyIndex + 1)
      return [...truncated, JSON.parse(JSON.stringify(newOverrides))]
    })
    setHistoryIndex(prev => prev + 1)

    // 通知 iframe 重置元素
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'tc_resetElement',
        elementId,
      }, '*')
    }

    setSelectedElement(null)
    debouncedSave(newOverrides)
  }, [elementOverrides, historyIndex, debouncedSave])

  // ── 圖片上傳 ────────────────────────────────────
  const handleUploadImage = useCallback(async (file: File): Promise<string | null> => {
    if (!token || !isAuthenticated) return null

    const result = await uploadImage({
      file,
      token,
      onProgress: () => {}, // PropertyEditor 內部自行管理進度
    })

    if (result.success && result.data?.url) {
      return result.data.url
    }

    console.error('[PreviewPanel] 圖片上傳失敗:', result.error)
    return null
  }, [token, isAuthenticated])

  // ── 鍵盤快捷鍵（Cmd+Z / Cmd+Shift+Z）────────────
  useEffect(() => {
    if (!editMode) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editMode, handleUndo, handleRedo])

  // ── 切換設備 ────────────────────────────────────
  const handleDeviceChange = useCallback((newDevice: DeviceType) => {
    setDevice(newDevice)
    setSelectedElement(null)
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'tc_deselectElement' }, '*')
    }
  }, [])

  // ── 切換編輯模式 ────────────────────────────────
  const handleToggleEditMode = useCallback(() => {
    if (editMode) {
      setSelectedElement(null)
    }
    setEditMode(!editMode)
  }, [editMode])

  const actualLoading = isLoading || htmlLoading
  const actualError = error || htmlError

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* 工具列 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--white)',
        }}
      >
        {/* 左側：模板名稱 + 編輯模式按鈕 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {templateName && (
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--black)',
              }}
            >
              {templateName}
            </span>
          )}
          {templateSlug && (
            <span
              style={{
                fontSize: 12,
                color: 'var(--gray-400)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {deviceWidth}px
            </span>
          )}
          {/* 編輯模式按鈕 — 有 HTML 內容時顯示 */}
          {htmlContent && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleToggleEditMode}
                style={{
                  marginLeft: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  background: editMode ? 'var(--black)' : 'var(--gray-100)',
                  color: editMode ? 'var(--white)' : 'var(--gray-600)',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                {editMode ? t('finishEditing') : t('editMode')}
              </motion.button>
              {/* Undo/Redo 按鈕 — 編輯模式時顯示 */}
              {editMode && (
                <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
                  <motion.button
                    whileHover={canUndo ? { scale: 1.1 } : undefined}
                    whileTap={canUndo ? { scale: 0.9 } : undefined}
                    onClick={handleUndo}
                    disabled={!canUndo}
                    title={t('undoTitle')}
                    style={{
                      padding: 6,
                      background: 'none',
                      border: 'none',
                      cursor: canUndo ? 'pointer' : 'default',
                      opacity: canUndo ? 1 : 0.3,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-600)" strokeWidth="2" aria-hidden="true">
                      <path d="M3 10h10a5 5 0 015 5v2" />
                      <polyline points="7,14 3,10 7,6" />
                    </svg>
                  </motion.button>
                  <motion.button
                    whileHover={canRedo ? { scale: 1.1 } : undefined}
                    whileTap={canRedo ? { scale: 0.9 } : undefined}
                    onClick={handleRedo}
                    disabled={!canRedo}
                    title={t('redoTitle')}
                    style={{
                      padding: 6,
                      background: 'none',
                      border: 'none',
                      cursor: canRedo ? 'pointer' : 'default',
                      opacity: canRedo ? 1 : 0.3,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-600)" strokeWidth="2" aria-hidden="true">
                      <path d="M21 10H11a5 5 0 00-5 5v2" />
                      <polyline points="17,14 21,10 17,6" />
                    </svg>
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 中間：設備切換器 */}
        <DeviceSwitcher activeDevice={device} onDeviceChange={handleDeviceChange} />

        {/* 右側：保存狀態 + 縮放比例 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* 保存狀態指示器 */}
          {editMode && projectId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isSaving && (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      border: '1.5px solid var(--gray-300)',
                      borderTopColor: 'var(--gray-500)',
                    }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{t('saving')}</span>
                </>
              )}
              {!isSaving && saveError && (
                <span style={{ fontSize: 11, color: '#ef4444' }}>{saveError}</span>
              )}
              {!isSaving && !saveError && Object.keys(elementOverrides).length > 0 && (
                <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{t('saved')}</span>
              )}
            </div>
          )}
          {/* 縮放比例 */}
          <div style={{ width: 50, textAlign: 'right' }}>
            {scale < 1 && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--gray-400)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {Math.round(scale * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 主內容區域 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 預覽區域 */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            overflow: 'hidden',
            background: 'var(--gray-50)',
          }}
        >
          <AnimatePresence mode="wait">
            {actualLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                  color: 'var(--gray-500)',
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '2px solid var(--gray-200)',
                    borderTopColor: 'var(--gray-500)',
                  }}
                />
                <span style={{ fontSize: 14 }}>{t('loadingTemplate')}</span>
              </motion.div>
            )}

            {actualError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  color: 'var(--gray-500)',
                  textAlign: 'center',
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12" y2="16" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 14 }}>{actualError}</span>
              </motion.div>
            )}

            {/* iframe 渲染後端 HTML — key 不含 device 避免切換裝置時 iframe 重載 */}
            {!actualLoading && !actualError && htmlContent && (
              <motion.div
                key={`template-${templateSlug}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'relative',
                  width: deviceWidth * scale,
                  height: scaledHeight,
                  overflow: 'hidden',
                  borderRadius: 8,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                  background: 'var(--white)',
                }}
              >
                {/* 編輯模式提示 — 未選中元素時顯示 */}
                {editMode && !selectedElement && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 100,
                      padding: '8px 16px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      color: 'white',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      pointerEvents: 'none',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    {t('clickToEdit')}
                  </div>
                )}
                {/* iframe */}
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlContent}
                  style={{
                    width: deviceWidth,
                    height: innerHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    border: 'none',
                    display: 'block',
                  }}
                  sandbox="allow-scripts allow-same-origin"
                  title={templateName || t('templatePreview')}
                />
              </motion.div>
            )}

            {!actualLoading && !actualError && !htmlContent && previewImageUrl && (
              <motion.div
                key="image"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  borderRadius: 8,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImageUrl}
                  alt={templateName || t('previewAlt')}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    display: 'block',
                  }}
                />
              </motion.div>
            )}

            {!actualLoading && !actualError && !htmlContent && !previewImageUrl && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                  color: 'var(--gray-400)',
                  textAlign: 'center',
                }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span style={{ fontSize: 14 }}>{t('selectTemplateToPreview')}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 編輯側欄 */}
        <AnimatePresence>
          {editMode && selectedElement && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                borderLeft: '1px solid var(--border-color)',
                background: 'var(--white)',
                overflow: 'hidden',
              }}
            >
              <PropertyEditor
                element={selectedElement}
                onUpdate={handleElementUpdate}
                onClose={() => setSelectedElement(null)}
                onReset={handleResetElement}
                onUploadImage={isAuthenticated ? handleUploadImage : undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
