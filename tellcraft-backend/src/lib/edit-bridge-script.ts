/**
 * Edit Bridge Script — 注入給 client app 的 iframe 內部，建立 postMessage 協議 (tc_*)
 * 讓主視窗（Tellcraft chat）能編輯客戶 app 內顯示的文字 + 選取元素。
 *
 * 來源：原本只在 app/lib/webcontainer-utils.ts 內定義給 WebContainer 用。
 * Phase 0（替換 WebContainer → Vercel preview）：抽到 backend 給 wrapInNextJs 寫進
 * Vercel preview 的 public/edit-bridge.js — 前後端都能用同一份腳本。
 *
 * 協議訊息列表（tc_*）：
 *   - tc_iframeReady：iframe DOM 初始化完成
 *   - tc_elementSelected / tc_elementDeselected：選取/取消選取元素
 *   - tc_applyUpdate：父視窗下發單一元素修改
 *   - tc_applyOverrides：父視窗下發批次 overrides
 *   - tc_runtimeError：iframe 捕獲的 runtime error 回報
 *   - tc_health：iframe 每 2 秒發送心跳
 *   - tc_setEditMode：父視窗切換編輯模式
 *
 * **postMessage 用 wildcard '*'**：支援跨 origin（WebContainer iframe / Vercel preview iframe 都可）。
 * 主視窗 listener 應加 origin 白名單防意外（見 app/hooks 接收端）。
 */

const EDIT_BRIDGE_SCRIPT = `
(function() {
  'use strict';

  // 防線 2：隱藏 Next.js error overlay（Build Error / Runtime Error 紅色頁面）
  // 讓頁面盡可能渲染出來，而不是被錯誤頁面遮擋
  var style = document.createElement('style');
  style.textContent = 'nextjs-portal { display: none !important; } body > nextjs-portal ~ * { display: block !important; }';
  document.head.appendChild(style);
  // 持續監控：Next.js 會動態插入 error overlay
  var overlayObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.tagName === 'NEXTJS-PORTAL') {
          node.style.display = 'none';
        }
      });
    });
  });
  if (document.body) {
    overlayObserver.observe(document.body, { childList: true });
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      overlayObserver.observe(document.body, { childList: true });
    });
  }

  function postToParent(msg) {
    try { window.parent.postMessage(msg, '*'); } catch(e) {}
    try { if (window.top !== window.parent) window.top.postMessage(msg, '*'); } catch(e) {}
  }

  // Runtime error capture — 靜默捕獲，不顯示給用戶
  window.onerror = function(msg, src, line, col, err) {
    postToParent({ type: 'tc_runtimeError', name: (err && err.name) || 'Error', message: String(msg), path: src });
  };
  window.addEventListener('unhandledrejection', function(e) {
    postToParent({ type: 'tc_runtimeError', name: 'UnhandledRejection', message: e.reason ? (e.reason.message || String(e.reason)) : 'Unknown' });
  });

  let editMode = false;
  let selectedElements = [];

  // Inject selection styles
  var styleEl = document.createElement('style');
  styleEl.textContent = [
    '[data-tc-id].tc-selected { outline: 2px solid #2563eb !important; outline-offset: 2px; }',
    '[data-tc-id].tc-hover { outline: 2px dashed #93c5fd !important; outline-offset: 2px; }',
  ].join('\\n');
  document.head.appendChild(styleEl);

  // Hover handler
  function handleMouseOver(e) {
    if (!editMode) return;
    var target = e.target.closest('[data-tc-id]');
    if (!target || target.classList.contains('tc-selected')) return;
    target.classList.add('tc-hover');
  }
  function handleMouseOut(e) {
    if (!editMode) return;
    var target = e.target.closest('[data-tc-id]');
    if (target) target.classList.remove('tc-hover');
  }

  // Tag counters
  let tagCounters = {};
  function resetCounters() { tagCounters = {}; }
  function getTagId(tagName, parentTag) {
    const base = parentTag ? parentTag + '-' + tagName : tagName;
    tagCounters[base] = (tagCounters[base] || 0);
    const id = base + '-' + tagCounters[base];
    tagCounters[base]++;
    return id;
  }

  // Tag all editable elements
  function tagElements() {
    resetCounters();
    const textTags = ['h1','h2','h3','h4','h5','h6','p','span','button','a','li','label','blockquote'];
    const containerTags = ['section','header','nav','footer','main','article','aside','div'];
    const imageTags = ['img'];

    // Text elements
    textTags.forEach(function(tag) {
      document.querySelectorAll(tag).forEach(function(el) {
        if (el.closest('[data-tc-ignore]')) return;
        if (!el.dataset.tcId) {
          el.dataset.tcId = getTagId(tag);
          el.dataset.tcType = 'text';
        }
      });
    });

    // Container elements (only direct children of body or section-level)
    containerTags.forEach(function(tag) {
      document.querySelectorAll(tag).forEach(function(el) {
        if (el.closest('[data-tc-ignore]')) return;
        const isTopLevel = !el.parentElement || el.parentElement === document.body || el.parentElement.tagName === 'MAIN';
        const isCard = el.classList.contains('card') || el.getAttribute('role') === 'card';
        if (isTopLevel || isCard || tag !== 'div') {
          if (!el.dataset.tcId) {
            el.dataset.tcId = getTagId('container-' + tag);
            el.dataset.tcType = 'container';
          }
        }
      });
    });

    // Images
    imageTags.forEach(function(tag) {
      document.querySelectorAll(tag).forEach(function(el) {
        if (el.closest('[data-tc-ignore]')) return;
        if (!el.dataset.tcId) {
          el.dataset.tcId = getTagId(tag);
          el.dataset.tcType = 'image';
        }
      });
    });
  }

  // Compute styles for an element
  function getElementInfo(el) {
    var computed = window.getComputedStyle(el);
    var rect = el.getBoundingClientRect();
    var info = {
      id: el.dataset.tcId,
      type: el.dataset.tcType,
      tagName: el.tagName.toLowerCase(),
      text: el.dataset.tcType === 'text' ? el.textContent : undefined,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      styles: {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        fontFamily: computed.fontFamily,
        padding: computed.padding,
        margin: computed.margin,
        borderRadius: computed.borderRadius,
      }
    };
    if (el.dataset.tcType === 'text') {
      info.styles.textAlign = computed.textAlign;
      info.styles.lineHeight = computed.lineHeight;
      info.styles.letterSpacing = computed.letterSpacing;
    }
    if (el.dataset.tcType === 'container') {
      info.styles.flexDirection = computed.flexDirection;
      info.styles.gap = computed.gap;
      info.styles.boxShadow = computed.boxShadow;
      info.styles.background = computed.background;
    }
    if (el.dataset.tcType === 'image') {
      info.styles.objectFit = computed.objectFit;
      info.src = el.src;
      info.alt = el.alt;
    }
    return info;
  }

  // Update visual selection outlines
  function syncSelectionOutlines() {
    document.querySelectorAll('.tc-selected').forEach(function(el) {
      if (selectedElements.indexOf(el.dataset.tcId) < 0) el.classList.remove('tc-selected');
    });
    selectedElements.forEach(function(id) {
      var el = document.querySelector('[data-tc-id="' + id + '"]');
      if (el) { el.classList.add('tc-selected'); el.classList.remove('tc-hover'); }
    });
  }

  // Click handler (Shift/Ctrl for multi-select)
  function handleClick(e) {
    if (!editMode) return;
    var target = e.target.closest('[data-tc-id]');
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();

    var id = target.dataset.tcId;
    var info = getElementInfo(target);
    var isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
    var idx = selectedElements.indexOf(id);

    if (idx >= 0) {
      // Deselect
      selectedElements.splice(idx, 1);
      postToParent({ type: 'tc_elementDeselected', data: info });
    } else if (isMulti) {
      // Add to selection
      selectedElements.push(id);
      postToParent({ type: 'tc_elementSelected', data: info });
    } else {
      // Replace selection
      selectedElements = [id];
      postToParent({ type: 'tc_elementSelected', data: info });
    }

    syncSelectionOutlines();
    postToParent({ type: 'tc_selectionChanged', data: selectedElements.map(function(selId) {
      var el = document.querySelector('[data-tc-id="' + selId + '"]');
      return el ? getElementInfo(el) : null;
    }).filter(Boolean) });
  }

  // Message handler
  window.addEventListener('message', function(e) {
    var msg = e.data;
    if (!msg || typeof msg.type !== 'string' || !msg.type.startsWith('tc_')) return;

    if (msg.type === 'tc_setEditMode') {
      editMode = !!msg.enabled;
      if (!editMode) {
        selectedElements = [];
        document.querySelectorAll('.tc-selected').forEach(function(el) { el.classList.remove('tc-selected'); });
        document.querySelectorAll('.tc-hover').forEach(function(el) { el.classList.remove('tc-hover'); });
      }
    }

    if (msg.type === 'tc_applyUpdate') {
      var el = document.querySelector('[data-tc-id="' + msg.elementId + '"]');
      if (el && msg.changes) {
        Object.keys(msg.changes).forEach(function(prop) {
          if (prop === 'text' || prop === 'textContent') {
            el.textContent = msg.changes[prop];
          } else if (prop === 'src' || prop === 'alt') {
            el[prop] = msg.changes[prop];
          } else {
            el.style[prop] = msg.changes[prop];
          }
        });
      }
    }

    if (msg.type === 'tc_resetElement') {
      var el2 = document.querySelector('[data-tc-id="' + msg.elementId + '"]');
      if (el2) { el2.removeAttribute('style'); }
    }

    if (msg.type === 'tc_applyOverrides') {
      if (msg.overrides) {
        Object.keys(msg.overrides).forEach(function(id) {
          var el3 = document.querySelector('[data-tc-id="' + id + '"]');
          if (el3 && msg.overrides[id]) {
            Object.keys(msg.overrides[id]).forEach(function(prop) {
              if (prop === 'text' || prop === 'textContent') {
                el3.textContent = msg.overrides[id][prop];
              } else {
                el3.style[prop] = msg.overrides[id][prop];
              }
            });
          }
        });
      }
    }

    if (msg.type === 'tc_setAnnotations') {
      document.querySelectorAll('.tc-annotation-badge').forEach(function(b) { b.remove(); });
      if (msg.annotations) {
        Object.keys(msg.annotations).forEach(function(id) {
          var el4 = document.querySelector('[data-tc-id="' + id + '"]');
          if (el4) {
            el4.style.position = el4.style.position || 'relative';
            var badge = document.createElement('div');
            badge.className = 'tc-annotation-badge';
            badge.textContent = '\\uD83D\\uDCDD';
            badge.style.cssText = 'position:absolute;top:-8px;right:-8px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:12px;z-index:9999;pointer-events:none;';
            el4.appendChild(badge);
          }
        });
      }
    }

    if (msg.type === 'tc_deselectElement') {
      selectedElements = [];
      postToParent({ type: 'tc_selectionChanged', data: [] });
    }
  });

  // MutationObserver: re-tag after React re-renders
  var observer = new MutationObserver(function() {
    clearTimeout(observer._debounce);
    observer._debounce = setTimeout(tagElements, 300);
  });

  // Initial setup
  function init() {
    document.addEventListener('click', handleClick, true);
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    tagElements();
    observer.observe(document.body, { childList: true, subtree: true });
    postToParent({ type: 'tc_iframeReady' });

    // Health beacon — 每 2 秒通報 iframe 健康狀態
    // 父層 5 秒沒收到 → 觸發 freeze overlay（iframe 卡 build / 白屏 / HMR race 的兜底）
    setInterval(function() {
      try {
        postToParent({
          type: 'tc_health',
          at: Date.now(),
          hasBody: !!(document.body && document.body.children && document.body.children.length > 0),
          url: location && location.pathname,
        });
      } catch (e) { /* noop */ }
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`

export { EDIT_BRIDGE_SCRIPT }
