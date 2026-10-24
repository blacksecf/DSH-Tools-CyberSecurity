window.__ModuleLoader__.load({
  id: 'dsh-file-search',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useRef, useState } = React;

    const EN = {
      title: 'File Search',
      subtitle: 'Find a file on this computer and copy its full path.',
      placeholder: 'Type a file name, for example report.pdf',
      open: 'Search files',
      openTitle: 'Search files on this computer (Ctrl+Shift+F) · drag to move',
      scanning: 'Scanning',
      indexed: 'indexed',
      ready: 'Index ready',
      limitReached: 'index limit reached',
      results: 'results',
      noQuery: 'Type a file name to start searching.',
      noResults: 'No matching files found.',
      noResultsScanning: 'No matches yet. Results appear as the index is built.',
      preparing: 'Preparing the file index…',
      searchError: 'Search service unavailable. Make sure the plugin is enabled.',
      errorHint: 'Enable it in Settings → Plugins, then reopen this window.',
      copy: 'Copy path',
      copied: 'Full path copied',
      copyFailed: 'Copy failed. Select the path and copy it manually.',
      close: 'Close',
      hint: '↑↓ select · Enter copy · Esc close · drag title bar to move',
      dragWindow: 'Drag the title bar to move this window',
      partial: 'Partial index',
      emptyRoot: 'No readable drive was found.',
      clear: 'Clear search',
    };

    const ZH = {
      title: '文件快搜',
      subtitle: '搜索本机文件，一键复制完整路径。',
      placeholder: '输入文件名，例如：报告.pdf',
      open: '搜索文件',
      openTitle: '搜索本机文件（Ctrl+Shift+F） · 拖动可移动',
      scanning: '正在扫描',
      indexed: '已索引',
      ready: '索引就绪',
      limitReached: '已达索引上限',
      results: '个结果',
      noQuery: '输入文件名开始搜索。',
      noResults: '没有找到匹配的文件。',
      noResultsScanning: '暂时没有匹配，索引建立过程中会陆续出现结果。',
      preparing: '正在准备文件索引…',
      searchError: '搜索服务不可用，请确认插件已启用。',
      errorHint: '请在“设置 → 插件”中启用后重新打开此窗口。',
      copy: '复制路径',
      copied: '已复制完整路径',
      copyFailed: '复制失败，请手动选择路径复制。',
      close: '关闭',
      hint: '↑↓ 选择 · Enter 复制 · Esc 关闭 · 拖动标题栏移动',
      dragWindow: '拖动标题栏移动窗口',
      partial: '部分索引',
      emptyRoot: '没有找到可读取的磁盘。',
      clear: '清空搜索',
    };

    const CSS = `
      .dfs-layer {
        position: fixed;
        inset: 0;
        z-index: 90;
        pointer-events: none;
        font-family: inherit;
        color: var(--dsw-alias-label-primary);
        -webkit-font-smoothing: antialiased;
      }
      .dfs-layer *, .dfs-layer *::before, .dfs-layer *::after { box-sizing: border-box; }
      .dfs-launcher {
        position: fixed;
        right: 22px;
        bottom: 22px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 40px;
        padding: 8px 12px 8px 10px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 999px;
        background: var(--dsw-alias-bg-overlay);
        color: var(--dsw-alias-label-primary);
        box-shadow: 0 8px 28px color-mix(in srgb, var(--dsw-alias-label-primary) 16%, transparent);
        cursor: grab;
        pointer-events: auto;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        font: inherit;
        font-size: 13px;
        line-height: 1;
        transition: transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
      }
      .dfs-launcher:hover {
        border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, var(--dsw-alias-border-l1));
        box-shadow: 0 10px 32px color-mix(in srgb, var(--dsw-alias-label-primary) 20%, transparent);
        transform: translateY(-1px);
      }
      .dfs-launcher.is-dragging {
        cursor: grabbing;
        transform: none;
        transition: none;
      }
      .dfs-launcher:focus-visible,
      .dfs-icon-btn:focus-visible,
      .dfs-clear:focus-visible,
      .dfs-input:focus-visible {
        outline: 2px solid var(--dsw-alias-brand-primary);
        outline-offset: 2px;
      }
      .dfs-launcher-mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent);
        color: var(--dsw-alias-brand-primary);
        flex: none;
      }
      .dfs-launcher-label { font-weight: 600; white-space: nowrap; }
      .dfs-launcher-kbd {
        padding: 3px 6px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 6px;
        color: var(--dsw-alias-label-secondary);
        font-family: inherit;
        font-size: 10px;
        white-space: nowrap;
        background: var(--dsw-alias-bg-layer-2);
      }
      .dfs-backdrop {
        position: fixed;
        inset: 0;
        pointer-events: auto;
        background: color-mix(in srgb, var(--dsw-alias-bg-base) 58%, transparent);
        backdrop-filter: blur(2px);
      }
      .dfs-panel {
        position: fixed;
        top: 9vh;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        width: min(560px, calc(100vw - 32px));
        max-height: min(78vh, 680px);
        overflow: hidden;
        pointer-events: auto;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 16px;
        background: var(--dsw-alias-bg-overlay);
        box-shadow:
          0 30px 90px color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent),
          0 2px 8px color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);
        animation: dfs-enter 160ms cubic-bezier(.2,.7,.2,1);
      }
      @keyframes dfs-enter {
        from { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(.985); }
        to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
      }
      .dfs-head {
        position: relative;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 20px 18px 10px;
        cursor: grab;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
      }
      .dfs-head::before {
        content: '';
        position: absolute;
        top: 7px;
        left: 50%;
        width: 28px;
        height: 3px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--dsw-alias-label-secondary) 32%, transparent);
        transform: translateX(-50%);
        pointer-events: none;
      }
      .dfs-panel.is-dragging .dfs-head { cursor: grabbing; }
      .dfs-panel.is-dragging { user-select: none; -webkit-user-select: none; }
      .dfs-head-main { display: flex; align-items: center; gap: 11px; min-width: 0; }
      .dfs-head-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        flex: none;
        border-radius: 10px;
        color: var(--dsw-alias-brand-primary);
        background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);
      }
      .dfs-title {
        margin: 0;
        font-size: 15px;
        font-weight: 650;
        line-height: 1.25;
        letter-spacing: .01em;
      }
      .dfs-subtitle {
        margin: 3px 0 0;
        color: var(--dsw-alias-label-secondary);
        font-size: 11.5px;
        line-height: 1.35;
      }
      .dfs-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        flex: none;
        padding: 0;
        border: 1px solid transparent;
        border-radius: 8px;
        background: transparent;
        color: var(--dsw-alias-label-secondary);
        cursor: pointer;
      }
      .dfs-icon-btn:hover {
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-primary);
      }
      .dfs-search-wrap { padding: 2px 18px 0; }
      .dfs-search {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 0 12px;
        height: 48px;
        border: 1px solid var(--dsw-alias-border-l2);
        border-radius: 12px;
        background: var(--dsw-alias-bg-layer-1);
        transition: border-color 120ms ease, box-shadow 120ms ease;
      }
      .dfs-search:focus-within {
        border-color: var(--dsw-alias-brand-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent);
      }
      .dfs-search-icon { color: var(--dsw-alias-label-secondary); flex: none; }
      .dfs-input {
        min-width: 0;
        flex: 1;
        height: 100%;
        padding: 0;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--dsw-alias-label-primary);
        font: inherit;
        font-size: 14px;
      }
      .dfs-input::placeholder { color: var(--dsw-alias-label-secondary); opacity: .8; }
      .dfs-clear {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
        border: 0;
        border-radius: 6px;
        color: var(--dsw-alias-label-secondary);
        background: transparent;
        cursor: pointer;
        flex: none;
      }
      .dfs-clear:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .dfs-status {
        display: flex;
        align-items: center;
        gap: 6px;
        min-height: 30px;
        padding: 6px 20px 2px;
        color: var(--dsw-alias-label-secondary);
        font-size: 11.5px;
        line-height: 1.35;
      }
      .dfs-status-root {
        max-width: 230px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--dsw-alias-label-secondary);
        opacity: .9;
      }
      .dfs-status-error { color: var(--dsw-alias-state-error-primary); }
      .dfs-spinner {
        width: 11px;
        height: 11px;
        flex: none;
        border: 1.5px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, transparent);
        border-top-color: var(--dsw-alias-brand-primary);
        border-radius: 50%;
        animation: dfs-spin 800ms linear infinite;
      }
      @keyframes dfs-spin { to { transform: rotate(360deg); } }
      .dfs-body {
        min-height: 188px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .dfs-results {
        flex: 1;
        min-height: 178px;
        margin: 0;
        padding: 4px 8px 6px;
        list-style: none;
        overflow-y: auto;
        overscroll-behavior: contain;
      }
      .dfs-results::-webkit-scrollbar { width: 8px; }
      .dfs-results::-webkit-scrollbar-thumb {
        border: 2px solid transparent;
        border-radius: 8px;
        background: color-mix(in srgb, var(--dsw-alias-label-secondary) 30%, transparent);
        background-clip: padding-box;
      }
      .dfs-result {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 49px;
        padding: 7px 9px;
        border: 1px solid transparent;
        border-radius: 10px;
        cursor: pointer;
        outline: 0;
      }
      .dfs-result.is-selected {
        border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent);
        background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent);
      }
      .dfs-result:hover { background: var(--dsw-alias-bg-layer-2); }
      .dfs-result.is-selected:hover {
        background: color-mix(in srgb, var(--dsw-alias-brand-primary) 11%, transparent);
      }
      .dfs-file-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        flex: none;
        border-radius: 8px;
        color: var(--dsw-alias-label-secondary);
        background: var(--dsw-alias-bg-layer-2);
      }
      .dfs-result-text { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
      .dfs-result-name {
        overflow: hidden;
        color: var(--dsw-alias-label-primary);
        font-size: 13px;
        font-weight: 600;
        line-height: 1.3;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dfs-result-path {
        overflow: hidden;
        color: var(--dsw-alias-label-secondary);
        font-size: 11px;
        line-height: 1.3;
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;
        direction: ltr;
        user-select: text;
      }
      .dfs-result-copy {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        flex: none;
        border-radius: 7px;
        color: var(--dsw-alias-label-secondary);
        opacity: .42;
      }
      .dfs-result.is-selected .dfs-result-copy {
        opacity: 1;
        color: var(--dsw-alias-brand-primary);
        background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);
      }
      .dfs-empty {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 9px;
        min-height: 204px;
        padding: 24px;
        color: var(--dsw-alias-label-secondary);
        text-align: center;
        font-size: 12.5px;
        line-height: 1.55;
      }
      .dfs-empty-mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-secondary);
      }
      .dfs-empty strong {
        display: block;
        color: var(--dsw-alias-label-primary);
        font-size: 13px;
        font-weight: 600;
      }
      .dfs-foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 42px;
        padding: 9px 18px;
        border-top: 1px solid var(--dsw-alias-border-l1);
        color: var(--dsw-alias-label-secondary);
        font-size: 10.5px;
      }
      .dfs-count { white-space: nowrap; }
      .dfs-hint { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dfs-toast {
        position: absolute;
        left: 50%;
        bottom: 54px;
        transform: translateX(-50%);
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: calc(100% - 36px);
        padding: 7px 11px;
        border: 1px solid color-mix(in srgb, var(--dsw-alias-state-success-primary) 30%, var(--dsw-alias-border-l1));
        border-radius: 999px;
        background: var(--dsw-alias-bg-overlay);
        color: var(--dsw-alias-state-success-primary);
        box-shadow: 0 6px 22px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);
        font-size: 11.5px;
        line-height: 1.2;
        white-space: nowrap;
      }
      .dfs-toast.is-error {
        border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 30%, var(--dsw-alias-border-l1));
        color: var(--dsw-alias-state-error-primary);
      }
      @media (max-width: 640px) {
        .dfs-launcher { right: 12px; bottom: 12px; }
        .dfs-launcher-kbd { display: none; }
        .dfs-panel { top: 4vh; width: calc(100vw - 16px); max-height: 88vh; border-radius: 14px; }
        .dfs-head { padding: 18px 14px 8px; }
        .dfs-search-wrap { padding: 2px 14px 0; }
        .dfs-status { padding-left: 16px; padding-right: 16px; }
        .dfs-foot { padding: 8px 14px; }
        .dfs-hint { display: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        .dfs-panel { animation: none; }
        .dfs-launcher { transition: none; }
        .dfs-spinner { animation-duration: 1600ms; }
      }
    `;

    const NUMBER = new Intl.NumberFormat();

    function IconSearch(props) {
      return h('svg', {
        viewBox: '0 0 24 24', width: props.size || 18, height: props.size || 18,
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.8,
        strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': 'true', focusable: 'false', className: props.className,
      },
      h('circle', { cx: 10.8, cy: 10.8, r: 6.1 }),
      h('path', { d: 'm15.4 15.4 4.1 4.1' }));
    }

    function IconClose(props) {
      return h('svg', {
        viewBox: '0 0 24 24', width: props.size || 16, height: props.size || 16,
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.8,
        strokeLinecap: 'round', 'aria-hidden': 'true', focusable: 'false',
      }, h('path', { d: 'M6 6l12 12M18 6 6 18' }));
    }

    function IconFile(props) {
      return h('svg', {
        viewBox: '0 0 24 24', width: props.size || 17, height: props.size || 17,
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.6,
        strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': 'true', focusable: 'false',
      },
      h('path', { d: 'M7 3.5h6.2L18 8.3v12.2H7z' }),
      h('path', { d: 'M13 3.8v4.8h4.7M9.5 12h5M9.5 15.2h5' }));
    }

    function IconCopy(props) {
      return h('svg', {
        viewBox: '0 0 24 24', width: props.size || 15, height: props.size || 15,
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.7,
        strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': 'true', focusable: 'false',
      },
      h('rect', { x: 8.2, y: 8.2, width: 10.4, height: 10.4, rx: 2 }),
      h('path', { d: 'M15.8 8.2V6.6a2 2 0 0 0-2-2H6.6a2 2 0 0 0-2 2v7.2a2 2 0 0 0 2 2h1.6' }));
    }

    function IconCheck(props) {
      return h('svg', {
        viewBox: '0 0 24 24', width: props.size || 15, height: props.size || 15,
        fill: 'none', stroke: 'currentColor', strokeWidth: 2,
        strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': 'true', focusable: 'false',
      }, h('path', { d: 'm5 12.5 4.2 4.2L19 7' }));
    }

    function IconClear(props) {
      return h('svg', {
        viewBox: '0 0 24 24', width: props.size || 14, height: props.size || 14,
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.8,
        strokeLinecap: 'round', 'aria-hidden': 'true', focusable: 'false',
      }, h('path', { d: 'M7 7l10 10M17 7 7 17' }));
    }

    function createFileSearchOverlay(locale, t) {
      return function FileSearchOverlay() {
        const [, setLocaleRevision] = useState(0);
        useEffect(() => {
          if (!locale || typeof locale.subscribe !== 'function') return undefined;
          return locale.subscribe(() => setLocaleRevision((value) => value + 1));
        }, []);

        const [open, setOpen] = useState(false);
      const [query, setQuery] = useState('');
      const [data, setData] = useState(null);
      const [status, setStatus] = useState('idle');
      const [selected, setSelected] = useState(0);
      const [copiedPath, setCopiedPath] = useState('');
      const [copyError, setCopyError] = useState(false);
      const [nonce, setNonce] = useState(0);
      const [panelPos, setPanelPos] = useState(null);
      const [dragging, setDragging] = useState(false);
      const [launcherPos, setLauncherPos] = useState(null);
      const [launcherDragging, setLauncherDragging] = useState(false);
      const inputRef = useRef(null);
      const panelRef = useRef(null);
      const launcherRef = useRef(null);
      const selectedRef = useRef(null);
      const copyTimerRef = useRef(null);
      const dragRef = useRef(null);
      const dragFrameRef = useRef(0);
      const pendingPosRef = useRef(null);
      const launcherDragRef = useRef(null);
      const launcherFrameRef = useRef(0);
      const launcherPendingRef = useRef(null);

      const closePanel = () => {
        setOpen(false);
        setCopiedPath('');
        setCopyError(false);
        setDragging(false);
        dragRef.current = null;
        pendingPosRef.current = null;
        if (dragFrameRef.current) {
          cancelAnimationFrame(dragFrameRef.current);
          dragFrameRef.current = 0;
        }
        if (copyTimerRef.current) {
          clearTimeout(copyTimerRef.current);
          copyTimerRef.current = null;
        }
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(() => launcherRef.current && launcherRef.current.focus());
        }
      };

      const copyPath = async (value) => {
        setCopyError(false);
        try {
          await navigator.clipboard.writeText(value);
          setCopiedPath(value);
          if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
          copyTimerRef.current = setTimeout(() => {
            setCopiedPath((current) => current === value ? '' : current);
            copyTimerRef.current = null;
          }, 1700);
        } catch {
          setCopiedPath('');
          setCopyError(true);
        }
      };

      const commitPendingPosition = () => {
        const next = pendingPosRef.current;
        pendingPosRef.current = null;
        if (next) setPanelPos(next);
      };

      const startDrag = (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        const target = event.target;
        if (target && typeof target.closest === 'function'
          && target.closest('button, input, textarea, select, a, [data-dfs-no-drag]')) return;
        const panel = panelRef.current;
        if (!panel) return;
        const rect = panel.getBoundingClientRect();
        dragRef.current = {
          id: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          originX: rect.left,
          originY: rect.top,
          width: rect.width,
          height: rect.height,
          currentX: rect.left,
          currentY: rect.top,
        };
        pendingPosRef.current = null;
        setPanelPos({ x: rect.left, y: rect.top });
        setDragging(true);
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture is an enhancement; the window still opens.
        }
        event.preventDefault();
      };

      const moveDrag = (event) => {
        const drag = dragRef.current;
        if (!drag || drag.id !== event.pointerId) return;
        const maxX = Math.max(8, window.innerWidth - drag.width - 8);
        const maxY = Math.max(8, window.innerHeight - drag.height - 8);
        const x = Math.min(Math.max(8, drag.originX + event.clientX - drag.startX), maxX);
        const y = Math.min(Math.max(8, drag.originY + event.clientY - drag.startY), maxY);
        drag.currentX = x;
        drag.currentY = y;
        pendingPosRef.current = { x, y };
        if (!dragFrameRef.current) {
          dragFrameRef.current = requestAnimationFrame(() => {
            dragFrameRef.current = 0;
            const next = pendingPosRef.current;
            pendingPosRef.current = null;
            if (next) setPanelPos(next);
          });
        }
        event.preventDefault();
      };

      const endDrag = (event) => {
        const drag = dragRef.current;
        if (!drag || drag.id !== event.pointerId) return;
        dragRef.current = null;
        setDragging(false);
        if (dragFrameRef.current) {
          cancelAnimationFrame(dragFrameRef.current);
          dragFrameRef.current = 0;
        }
        commitPendingPosition();
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // The pointer may already have left the document.
        }
      };

      const loseDrag = (event) => {
        const drag = dragRef.current;
        if (!drag || drag.id !== event.pointerId) return;
        dragRef.current = null;
        setDragging(false);
        if (dragFrameRef.current) {
          cancelAnimationFrame(dragFrameRef.current);
          dragFrameRef.current = 0;
        }
        commitPendingPosition();
      };

      const commitLauncherPosition = () => {
        const next = launcherPendingRef.current;
        launcherPendingRef.current = null;
        if (next) setLauncherPos(next);
      };

      const startLauncherDrag = (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        const launcher = launcherRef.current;
        if (!launcher) return;
        const rect = launcher.getBoundingClientRect();
        launcherDragRef.current = {
          id: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          originX: rect.left,
          originY: rect.top,
          width: rect.width,
          height: rect.height,
          moved: false,
          currentX: rect.left,
          currentY: rect.top,
        };
        launcherPendingRef.current = null;
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture is an enhancement; clicking still opens the panel.
        }
      };

      const moveLauncherDrag = (event) => {
        const drag = launcherDragRef.current;
        if (!drag || drag.id !== event.pointerId) return;
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (!drag.moved) {
          if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
          drag.moved = true;
          setLauncherDragging(true);
        }
        const maxX = Math.max(8, window.innerWidth - drag.width - 8);
        const maxY = Math.max(8, window.innerHeight - drag.height - 8);
        const x = Math.min(Math.max(8, drag.originX + dx), maxX);
        const y = Math.min(Math.max(8, drag.originY + dy), maxY);
        drag.currentX = x;
        drag.currentY = y;
        launcherPendingRef.current = { x, y };
        if (!launcherFrameRef.current) {
          launcherFrameRef.current = requestAnimationFrame(() => {
            launcherFrameRef.current = 0;
            const next = launcherPendingRef.current;
            launcherPendingRef.current = null;
            if (next) setLauncherPos(next);
          });
        }
        event.preventDefault();
      };

      const finishLauncherDrag = (event, openWhenUnmoved) => {
        const drag = launcherDragRef.current;
        if (!drag || drag.id !== event.pointerId) return;
        const moved = drag.moved;
        launcherDragRef.current = null;
        setLauncherDragging(false);
        if (launcherFrameRef.current) {
          cancelAnimationFrame(launcherFrameRef.current);
          launcherFrameRef.current = 0;
        }
        if (moved) commitLauncherPosition();
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // The pointer may already have left the document.
        }
        if (!moved && openWhenUnmoved) setOpen(true);
      };

      const endLauncherDrag = (event) => finishLauncherDrag(event, true);

      const loseLauncherDrag = (event) => finishLauncherDrag(event, false);

      useEffect(() => {
        return () => {
          if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
          if (dragFrameRef.current) cancelAnimationFrame(dragFrameRef.current);
          if (launcherFrameRef.current) cancelAnimationFrame(launcherFrameRef.current);
        };
      }, []);

      useEffect(() => {
        if (!open) return undefined;
        const frame = requestAnimationFrame(() => {
          if (inputRef.current) inputRef.current.focus();
        });
        return () => cancelAnimationFrame(frame);
      }, [open]);

      useEffect(() => {
        if (!open) return undefined;
        launcherDragRef.current = null;
        launcherPendingRef.current = null;
        if (launcherFrameRef.current) {
          cancelAnimationFrame(launcherFrameRef.current);
          launcherFrameRef.current = 0;
        }
        setLauncherDragging(false);
        return undefined;
      }, [open]);

      useEffect(() => {
        if (!open) return undefined;
        const clamp = () => {
          const panel = panelRef.current;
          if (!panel) return;
          const rect = panel.getBoundingClientRect();
          setPanelPos((current) => {
            if (!current) return current;
            const maxX = Math.max(8, window.innerWidth - rect.width - 8);
            const maxY = Math.max(8, window.innerHeight - rect.height - 8);
            const x = Math.min(Math.max(8, current.x), maxX);
            const y = Math.min(Math.max(8, current.y), maxY);
            return x === current.x && y === current.y ? current : { x, y };
          });
        };
        clamp();
        window.addEventListener('resize', clamp);
        return () => window.removeEventListener('resize', clamp);
      }, [open]);

      useEffect(() => {
        if (open) return undefined;
        const clamp = () => {
          const launcher = launcherRef.current;
          if (!launcher) return;
          const rect = launcher.getBoundingClientRect();
          setLauncherPos((current) => {
            if (!current) return current;
            const maxX = Math.max(8, window.innerWidth - rect.width - 8);
            const maxY = Math.max(8, window.innerHeight - rect.height - 8);
            const x = Math.min(Math.max(8, current.x), maxX);
            const y = Math.min(Math.max(8, current.y), maxY);
            return x === current.x && y === current.y ? current : { x, y };
          });
        };
        clamp();
        window.addEventListener('resize', clamp);
        return () => window.removeEventListener('resize', clamp);
      }, [open]);

      useEffect(() => {
        if (!open) return undefined;
        const controller = new AbortController();
        const trimmed = query.trim();
        setStatus('loading');
        const delay = trimmed ? 170 : 0;
        const timer = setTimeout(async () => {
          try {
            const response = await fetch(
              `/plugin-file-search/search?q=${encodeURIComponent(trimmed)}&limit=60`,
              { signal: controller.signal, headers: { Accept: 'application/json' } },
            );
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const body = await response.json();
            if (controller.signal.aborted) return;
            if (!body || body.ok !== true || !Array.isArray(body.results)) {
              throw new Error(body && body.error ? body.error : 'invalid response');
            }
            setData(body);
            setStatus('ready');
            setSelected((current) => body.results.length === 0
              ? 0
              : Math.min(current, body.results.length - 1));
          } catch (error) {
            if (controller.signal.aborted) return;
            setStatus('error');
          }
        }, delay);
        return () => {
          clearTimeout(timer);
          controller.abort();
        };
      }, [open, query, nonce]);

      useEffect(() => {
        if (!open || !data || !data.busy) return undefined;
        const timer = setTimeout(() => setNonce((value) => value + 1), 1100);
        return () => clearTimeout(timer);
      }, [open, data, nonce]);

      useEffect(() => {
        if (open && selectedRef.current) {
          selectedRef.current.scrollIntoView({ block: 'nearest' });
        }
      }, [selected, open, data]);

      useEffect(() => {
        const onKeyDown = (event) => {
          if (event.isComposing) return;
          const key = typeof event.key === 'string' ? event.key.toLowerCase() : '';
          if ((event.ctrlKey || event.metaKey) && event.shiftKey && !event.altKey && key === 'f') {
            event.preventDefault();
            if (open) closePanel();
            else setOpen(true);
            return;
          }
          if (!open) return;
          if (event.key === 'Escape') {
            event.preventDefault();
            closePanel();
            return;
          }
          const results = data && Array.isArray(data.results) ? data.results : [];
          if (event.key === 'ArrowDown') {
            if (document.activeElement !== inputRef.current) return;
            event.preventDefault();
            setSelected((current) => results.length === 0 ? 0 : Math.min(current + 1, results.length - 1));
            return;
          }
          if (event.key === 'ArrowUp') {
            if (document.activeElement !== inputRef.current) return;
            event.preventDefault();
            setSelected((current) => Math.max(0, current - 1));
            return;
          }
          if (event.key === 'Enter' && document.activeElement === inputRef.current) {
            if (results.length === 0) return;
            event.preventDefault();
            const item = results[Math.min(selected, results.length - 1)];
            if (item) void copyPath(item.path);
          }
        };

        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
      }, [open, data, selected]);

      const onPanelKeyDown = (event) => {
        if (event.key !== 'Tab') return;
        const panel = panelRef.current;
        if (!panel) return;
        const nodes = panel.querySelectorAll('input, button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])');
        const focusable = Array.prototype.filter.call(nodes, (node) => node.offsetParent !== null);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };

      const results = data && Array.isArray(data.results) ? data.results : [];
      const total = data && Number.isFinite(data.total) ? data.total : results.length;
      const indexed = data && Number.isFinite(data.indexed) ? data.indexed : 0;
      const busy = Boolean(data && data.busy);
      const hasQuery = query.trim().length > 0;
      const activeRoot = data && typeof data.currentRoot === 'string' ? data.currentRoot : '';

      let statusNode;
      if (status === 'error') {
        statusNode = h('span', { className: 'dfs-status-error' }, t('searchError'));
      } else if (!data) {
        statusNode = h(React.Fragment, null,
          h('span', { className: 'dfs-spinner' }),
          h('span', null, t('scanning')));
      } else if (data.error && indexed === 0) {
        statusNode = h('span', { className: 'dfs-status-error' }, t('emptyRoot'));
      } else if (busy) {
        statusNode = h(React.Fragment, null,
          h('span', { className: 'dfs-spinner' }),
          h('span', null, t('scanning')),
          activeRoot ? h('span', { className: 'dfs-status-root', title: activeRoot }, activeRoot) : null,
          h('span', null, `· ${t('indexed')} ${NUMBER.format(indexed)}`));
      } else if (data.truncated) {
        statusNode = h(React.Fragment, null,
          h('span', null, t('ready')),
          h('span', null, `· ${NUMBER.format(indexed)} ${t('indexed')}`),
          h('span', null, `· ${t('limitReached')}`));
      } else {
        statusNode = h(React.Fragment, null,
          h('span', null, t('ready')),
          h('span', null, `· ${NUMBER.format(indexed)} ${t('indexed')}`));
      }

      let bodyNode;
      if (!hasQuery && status !== 'error') {
        bodyNode = h('div', { className: 'dfs-empty' },
          h('div', { className: 'dfs-empty-mark' }, h(IconSearch, { size: 22 })),
          h('div', null,
            h('strong', null, t('title')),
            h('span', null, t('noQuery'))));
      } else if (status === 'error') {
        bodyNode = h('div', { className: 'dfs-empty' },
          h('div', { className: 'dfs-empty-mark' }, h(IconSearch, { size: 22 })),
          h('div', null,
            h('strong', null, t('searchError')),
            h('span', null, t('errorHint'))));
      } else if (!data) {
        bodyNode = h('div', { className: 'dfs-empty' },
          h('div', { className: 'dfs-empty-mark' }, h('span', { className: 'dfs-spinner' })),
          h('div', null,
            h('strong', null, t('preparing')),
            h('span', null, t('noQuery'))));
      } else if (results.length === 0) {
        bodyNode = h('div', { className: 'dfs-empty' },
          h('div', { className: 'dfs-empty-mark' }, h(IconSearch, { size: 22 })),
          h('div', null,
            h('strong', null, t('noResults')),
            h('span', null, busy ? t('noResultsScanning') : t('noQuery'))));
      } else {
        bodyNode = h('ul', {
          className: 'dfs-results',
          id: 'dfs-results',
          role: 'listbox',
          'aria-label': t('results'),
        }, results.map((item, index) => {
          const isSelected = index === selected;
          return h('li', {
            key: item.path,
            id: `dfs-opt-${index}`,
            ref: isSelected ? selectedRef : null,
            role: 'option',
            'aria-selected': isSelected,
            className: `dfs-result${isSelected ? ' is-selected' : ''}`,
            title: `${item.name}\n${item.path}`,
            onMouseEnter: () => setSelected(index),
            onClick: () => { void copyPath(item.path); },
          },
          h('span', { className: 'dfs-file-icon' }, h(IconFile, { size: 17 })),
          h('span', { className: 'dfs-result-text' },
            h('span', { className: 'dfs-result-name' }, item.name),
            h('span', { className: 'dfs-result-path' }, item.path)),
          h('span', { className: 'dfs-result-copy', 'aria-hidden': 'true' },
            copiedPath === item.path ? h(IconCheck) : h(IconCopy)));
        }));
      }

      const panelStyle = panelPos
        ? {
          left: `${panelPos.x}px`,
          top: `${panelPos.y}px`,
          transform: 'none',
          animation: 'none',
        }
        : undefined;

      const launcherStyle = launcherPos
        ? {
          left: `${launcherPos.x}px`,
          top: `${launcherPos.y}px`,
          right: 'auto',
          bottom: 'auto',
        }
        : undefined;

      return h(React.Fragment, null,
        h('style', null, CSS),
        h('div', { className: 'dfs-layer' },
          !open
            ? h('button', {
              ref: launcherRef,
              type: 'button',
              className: `dfs-launcher${launcherDragging ? ' is-dragging' : ''}`,
              style: launcherStyle,
              title: t('openTitle'),
              'aria-haspopup': 'dialog',
              'aria-expanded': false,
              onPointerDown: startLauncherDrag,
              onPointerMove: moveLauncherDrag,
              onPointerUp: endLauncherDrag,
              onPointerCancel: loseLauncherDrag,
              onLostPointerCapture: loseLauncherDrag,
              onClick: (event) => {
                if (event.detail === 0) setOpen(true);
              },
            },
            h('span', { className: 'dfs-launcher-mark' }, h(IconSearch, { size: 15 })),
            h('span', { className: 'dfs-launcher-label' }, t('open')),
            h('kbd', { className: 'dfs-launcher-kbd' }, 'Ctrl ⇧ F'))
            : h(React.Fragment, null,
              h('div', { className: 'dfs-backdrop', onClick: closePanel }),
              h('div', {
                ref: panelRef,
                className: `dfs-panel${dragging ? ' is-dragging' : ''}`,
                style: panelStyle,
                role: 'dialog',
                'aria-modal': 'true',
                'aria-labelledby': 'dfs-title',
                onKeyDown: onPanelKeyDown,
              },
              h('div', {
                className: 'dfs-head',
                title: t('dragWindow'),
                onPointerDown: startDrag,
                onPointerMove: moveDrag,
                onPointerUp: endDrag,
                onPointerCancel: endDrag,
                onLostPointerCapture: loseDrag,
              },
                h('div', { className: 'dfs-head-main' },
                  h('span', { className: 'dfs-head-icon' }, h(IconSearch, { size: 18 })),
                  h('div', null,
                    h('h2', { className: 'dfs-title', id: 'dfs-title' }, t('title')),
                    h('p', { className: 'dfs-subtitle' }, t('subtitle')))),
                h('button', {
                  type: 'button',
                  className: 'dfs-icon-btn',
                  'aria-label': t('close'),
                  title: t('close'),
                  onClick: closePanel,
                }, h(IconClose))),
              h('div', { className: 'dfs-search-wrap' },
                h('div', { className: 'dfs-search' },
                  h(IconSearch, { className: 'dfs-search-icon', size: 18 }),
                  h('input', {
                    ref: inputRef,
                    className: 'dfs-input',
                    value: query,
                    placeholder: t('placeholder'),
                    'aria-label': t('placeholder'),
                    maxLength: 200,
                    role: 'combobox',
                    'aria-expanded': true,
                    'aria-controls': 'dfs-results',
                    'aria-autocomplete': 'list',
                    'aria-activedescendant': results.length > 0 ? `dfs-opt-${Math.min(selected, results.length - 1)}` : undefined,
                    autoComplete: 'off',
                    spellCheck: false,
                    onChange: (event) => {
                      setQuery(event.target.value);
                      setSelected(0);
                    },
                  }),
                  query
                    ? h('button', {
                      type: 'button',
                      className: 'dfs-clear',
                      'aria-label': t('clear'),
                      title: t('clear'),
                      onClick: () => {
                        setQuery('');
                        setSelected(0);
                        if (inputRef.current) inputRef.current.focus();
                      },
                    }, h(IconClear))
                    : null)),
              h('div', { className: 'dfs-status', 'aria-live': 'polite' }, statusNode),
              h('div', { className: 'dfs-body' }, bodyNode),
              h('div', { className: 'dfs-foot' },
                h('span', { className: 'dfs-count' },
                  results.length > 0
                    ? (total > results.length
                      ? `${results.length} / ${NUMBER.format(total)} ${t('results')}`
                      : `${NUMBER.format(total)} ${t('results')}`)
                    : ''),
                h('span', { className: 'dfs-hint' }, t('hint'))),
              copiedPath
                ? h('div', { className: 'dfs-toast', role: 'status' },
                  h(IconCheck, { size: 13 }),
                  h('span', null, t('copied')))
                : null,
              copyError
                ? h('div', { className: 'dfs-toast is-error', role: 'alert' }, t('copyFailed'))
                : null))));
      };
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => {
          const offEn = ctx.locale.register('file-search', 'en', EN);
          const offZh = ctx.locale.register('file-search', 'zh', ZH);
          const offZhCn = ctx.locale.register('file-search', 'zh-CN', ZH);
          return () => {
            offEn();
            offZh();
            offZhCn();
          };
        });
        const t = ctx.locale.bind('file-search');
        const Overlay = createFileSearchOverlay(ctx.locale, t);
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'file-search',
          order: 60,
        }, Overlay));
      },
    };
  },
});
