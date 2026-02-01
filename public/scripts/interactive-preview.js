/**
 * Interactive Preview Script
 * 注入到預覽 iframe 中，實現元素選擇和即時編輯
 */

/* global document, window, Node */

(function () {
  'use strict';

  let selectionMode = false;
  let highlightOverlay = null;
  let originalStyles = new Map();

  // 建立高亮遮罩
  function createHighlightOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'tellcraft-highlight-overlay';
    overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      border: 2px solid #3B82F6;
      background: rgba(59, 130, 246, 0.1);
      z-index: 99999;
      transition: all 0.15s ease;
      opacity: 0;
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  // 更新高亮位置
  function updateHighlight(element) {
    if (!highlightOverlay) {
      highlightOverlay = createHighlightOverlay();
    }

    if (!element) {
      highlightOverlay.style.opacity = '0';
      return;
    }

    const rect = element.getBoundingClientRect();
    highlightOverlay.style.top = rect.top + 'px';
    highlightOverlay.style.left = rect.left + 'px';
    highlightOverlay.style.width = rect.width + 'px';
    highlightOverlay.style.height = rect.height + 'px';
    highlightOverlay.style.opacity = '1';
  }

  // 取得元素資訊
  function getElementInfo(element) {
    const computedStyle = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    // 生成穩定的 ID
    const id = element.id || generateElementId(element);

    return {
      id,
      tagName: element.tagName,
      text: element.textContent?.trim().substring(0, 100) || undefined,
      styles: {
        color: computedStyle.color,
        backgroundColor: computedStyle.backgroundColor,
        fontSize: computedStyle.fontSize,
        fontWeight: computedStyle.fontWeight,
        padding: computedStyle.padding,
        margin: computedStyle.margin,
        borderRadius: computedStyle.borderRadius,
      },
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
    };
  }

  // 生成元素 ID（基於 DOM 路徑）
  function generateElementId(element) {
    const path = [];
    let current = element;

    while (current && current !== document.body) {
      let index = 0;
      let sibling = current.previousElementSibling;

      while (sibling) {
        if (sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousElementSibling;
      }

      path.unshift(`${current.tagName.toLowerCase()}[${index}]`);
      current = current.parentElement;
    }

    return 'tc-' + path.join('/');
  }

  // 根據 ID 找到元素
  function findElementById(id) {
    // 先嘗試原生 ID
    const nativeElement = document.getElementById(id);
    if (nativeElement) return nativeElement;

    // 解析生成的 ID
    if (!id.startsWith('tc-')) return null;

    const path = id.substring(3).split('/');
    let current = document.body;

    for (const segment of path) {
      const match = segment.match(/(\w+)\[(\d+)\]/);
      if (!match) return null;

      const [, tagName, indexStr] = match;
      const index = parseInt(indexStr, 10);

      const children = Array.from(current.children).filter(
        (child) => child.tagName.toLowerCase() === tagName
      );

      if (index >= children.length) return null;
      current = children[index];
    }

    return current;
  }

  // 儲存原始樣式
  function saveOriginalStyle(element, property) {
    const key = `${generateElementId(element)}:${property}`;
    if (!originalStyles.has(key)) {
      originalStyles.set(key, element.style[property] || '');
    }
  }

  // 更新元素樣式
  function updateElement(elementId, changes) {
    const element = findElementById(elementId);
    if (!element) return false;

    Object.entries(changes).forEach(([property, value]) => {
      if (property === 'text' && element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
        saveOriginalStyle(element, 'textContent');
        element.textContent = value;
      } else {
        saveOriginalStyle(element, property);
        element.style[property] = value;
      }
    });

    // 通知父視窗
    window.parent.postMessage({
      type: 'STYLES_UPDATED',
      elementId,
    }, '*');

    return true;
  }

  // 重置所有變更
  function resetChanges() {
    originalStyles.forEach((value, key) => {
      const [id, property] = key.split(':');
      const element = findElementById(id);
      if (element) {
        if (property === 'textContent') {
          element.textContent = value;
        } else {
          element.style[property] = value;
        }
      }
    });
    originalStyles.clear();
  }

  // 處理滑鼠移動（高亮）
  function handleMouseMove(e) {
    if (!selectionMode) return;
    updateHighlight(e.target);
  }

  // 處理點擊（選擇）
  function handleClick(e) {
    if (!selectionMode) return;

    e.preventDefault();
    e.stopPropagation();

    const element = e.target;
    const elementInfo = getElementInfo(element);

    // 發送到父視窗
    window.parent.postMessage({
      type: 'ELEMENT_SELECTED',
      element: elementInfo,
    }, '*');
  }

  // 處理來自父視窗的訊息
  function handleMessage(event) {
    const { type, elementId, changes } = event.data || {};

    switch (type) {
      case 'ENABLE_SELECTION_MODE':
        selectionMode = true;
        document.body.style.cursor = 'crosshair';
        window.parent.postMessage({ type: 'SELECTION_MODE_ENABLED' }, '*');
        break;

      case 'DISABLE_SELECTION_MODE':
        selectionMode = false;
        document.body.style.cursor = '';
        updateHighlight(null);
        break;

      case 'UPDATE_ELEMENT':
        if (elementId && changes) {
          updateElement(elementId, changes);
        }
        break;

      case 'RESET_CHANGES':
        resetChanges();
        break;
    }
  }

  // 初始化
  function init() {
    // 事件監聽
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    window.addEventListener('message', handleMessage);

    // 通知父視窗已就緒
    window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
  }

  // 頁面載入完成後初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
