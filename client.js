/* ------------------------------------------------------------------ */
/*  Full View plugin — client half                                     */
/* ------------------------------------------------------------------ */

window.__ModuleLoader__.load({
  id: '@local/dsh-full-view',
  factory(require) {
const React = require('react');
const h = React.createElement;

/* ------------------------------------------------------------------ */
/*  Shared overlay state — one overlay at a time, driven by any button */
/* ------------------------------------------------------------------ */
let _listeners = new Set();
let _snapshot = { open: false, html: null };

function notify() { for (const fn of _listeners) fn(); }
function subscribe(fn) { _listeners.add(fn); return () => _listeners.delete(fn); }
function getSnapshot() { return _snapshot; }

function openOverlay(html) {
  if (_snapshot.open && _snapshot.html === html) return;
  _snapshot = { open: true, html: html };
  notify();
}
function closeOverlay() {
  if (!_snapshot.open) return;
  _snapshot = { open: false, html: null };
  notify();
}

/* ------------------------------------------------------------------ */
/*  CSS (inserted once, uses theme tokens)                             */
/* ------------------------------------------------------------------ */
const OVERLAY_CSS = `
/* Full-View overlay backdrop */
.dsh-fv-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--dsw-alias-bg-layer-1);
  overflow-y: auto;
  overscroll-behavior: contain;
  animation: dsh-fv-fadein 150ms ease-out;
}
@keyframes dsh-fv-fadein {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Content card */
.dsh-fv-card {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
  background: var(--dsw-alias-bg-layer-1);
  padding: 64px clamp(16px, 4vw, 64px) 48px;
  color: var(--dsw-alias-label-primary);
  font-size: var(--dsh-content-font-size, 15px);
  line-height: 1.7;
  animation: dsh-fv-slidein 200ms ease-out;
}
@keyframes dsh-fv-slidein {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Close button */
.dsh-fv-close {
  position: fixed;
  top: 16px;
  right: 24px;
  width: 32px;
  height: 32px;
  border-radius: var(--dsw-radius-sm, 6px);
  background: var(--dsw-alias-bg-layer-2);
  border: none;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 120ms, color 120ms;
  z-index: 1;
}
.dsh-fv-close:hover {
  background: var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-primary);
}

/* Cloned content resets */
.dsh-fv-body {
  overflow-wrap: break-word;
  word-break: break-word;
}
.dsh-fv-body > * + * {
  margin-top: 0.5em;
}

/* Hide action rows and turn-tail elements that leaked in */
.dsh-fv-body [data-turn-tail],
.dsh-fv-body [data-slot="conversation.chat.turnTail"],
.dsh-fv-body [data-slot="conversation.chat.assistant-actions"] {
  display: none !important;
}
`;

/* ------------------------------------------------------------------ */
/*  FullViewButton — renders inside assistant-actions                  */
/* ------------------------------------------------------------------ */
function FullViewButton() {
  const ref = React.useRef(null);

  const handleClick = React.useCallback(function () {
    const btn = ref.current;
    if (!btn) return;

    // Walk up to the turn-tail wrapper [data-turn-tail]
    let turnTailEl = btn.closest('[data-turn-tail]');
    if (!turnTailEl) {
      // Fallback: walk up through the actions row
      const actionsRow = btn.closest('[data-clock]');
      if (actionsRow) turnTailEl = actionsRow.closest('[data-turn-tail]');
    }
    if (!turnTailEl) return;

    const turnNum = turnTailEl.getAttribute('data-turn-tail');

    // Find the scroll column that contains all flow items
    const column = turnTailEl.closest('[class*="column"]')
      || turnTailEl.parentElement && turnTailEl.parentElement.parentElement;
    if (!column) return;

    // Collect all assistant-step content elements for this turn
    const steps = column.querySelectorAll(
      '[data-chat-turn="' + turnNum + '"][data-chat-flow-kind="assistant-step"]'
    );

    if (steps.length === 0) return;

    // Clone into a container
    const wrapper = document.createElement('div');
    for (let i = 0; i < steps.length; i++) {
      const clone = steps[i].cloneNode(true);
      // Disable interactive elements in the clone
      var btns = clone.querySelectorAll('button, [role="button"]');
      for (let j = 0; j < btns.length; j++) {
        btns[j].style.pointerEvents = 'none';
      }
      wrapper.appendChild(clone);
    }

    openOverlay(wrapper.innerHTML);
  }, []);

  // Full View icon (expand-arrows)
  const icon = h('svg', {
    viewBox: '0 0 16 16',
    width: '1em',
    height: '1em',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: { display: 'block' }
  },
    h('polyline', { points: '6,2 2,2 2,6' }),
    h('polyline', { points: '10,2 14,2 14,6' }),
    h('polyline', { points: '6,14 2,14 2,10' }),
    h('polyline', { points: '10,14 14,14 14,10' })
  );

  return h('button', {
    ref: ref,
    type: 'button',
    title: 'Full View',
    'aria-label': 'Full View',
    style: {
      width: 'calc(28px + var(--dsh-content-font-delta, 0px))',
      height: 'calc(28px + var(--dsh-content-font-delta, 0px))',
      borderRadius: 'var(--dsw-radius-sm, 6px)',
      color: 'var(--dsw-alias-label-tertiary)',
      cursor: 'pointer',
      background: 'transparent',
      border: 'none',
      display: 'inline-flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '6px',
      transition: 'background 120ms, color 120ms',
    },
    onMouseEnter: function (e) {
      e.currentTarget.style.background = 'var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.06))';
      e.currentTarget.style.color = 'var(--dsw-alias-label-secondary)';
    },
    onMouseLeave: function (e) {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.color = 'var(--dsw-alias-label-tertiary)';
    },
    onClick: handleClick
  }, icon);
}

/* ------------------------------------------------------------------ */
/*  FullViewOverlay — renders in shell.overlay                         */
/* ------------------------------------------------------------------ */
function FullViewOverlay() {
  const state = React.useSyncExternalStore(subscribe, getSnapshot);

  // Keyboard escape handler
  React.useEffect(function () {
    if (!state.open) return;
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeOverlay();
      }
    }
    document.addEventListener('keydown', onKey, true);
    return function () { document.removeEventListener('keydown', onKey, true); };
  }, [state.open]);

  // Prevent body scroll while overlay is open
  React.useEffect(function () {
    if (!state.open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return function () { document.body.style.overflow = prev; };
  }, [state.open]);

  if (!state.open || !state.html) return null;

  // Close icon (X)
  const closeIcon = h('svg', {
    viewBox: '0 0 16 16',
    width: 16,
    height: 16,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round'
  },
    h('line', { x1: 3, y1: 3, x2: 13, y2: 13 }),
    h('line', { x1: 13, y1: 3, x2: 3, y2: 13 })
  );

  return h('div', {
    className: 'dsh-fv-backdrop',
    onClick: function (e) {
      if (e.target === e.currentTarget) closeOverlay();
    }
  },
    h('div', { className: 'dsh-fv-card', role: 'dialog', 'aria-label': 'Full View' },
      h('button', {
        className: 'dsh-fv-close',
        onClick: closeOverlay,
        'aria-label': 'Close',
        title: 'Close (Esc)'
      }, closeIcon),
      h('div', {
        className: 'dsh-fv-body',
        dangerouslySetInnerHTML: { __html: state.html }
      })
    )
  );
}

/* ------------------------------------------------------------------ */
/*  Return the plugin                                                  */
/* ------------------------------------------------------------------ */
return {
  inject: ['slots'],
  apply(ctx) {
    // Insert the stylesheet
    ctx.effect(function () {
      const tag = document.createElement('style');
      tag.dataset.plugin = '@local/dsh-full-view';
      tag.textContent = OVERLAY_CSS;
      document.head.appendChild(tag);
      return function () { tag.remove(); };
    }, 'dsh-full-view: styles');

    // Register the Full View button in the assistant-actions row
    ctx.slots.inject('conversation.chat.assistant-actions', function () {
      return ctx.slots.register({
        name: 'conversation.chat.assistant-actions',
        id: 'full-view',
        order: 50,
      }, FullViewButton);
    });

    // Register the overlay in shell.overlay
    ctx.slots.inject('shell.overlay', function () {
      return ctx.slots.register({
        name: 'shell.overlay',
        id: 'full-view-overlay',
        order: 100,
      }, FullViewOverlay);
    });
  },
};
  },
});
