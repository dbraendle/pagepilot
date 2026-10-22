// The panel itself -- loaded lazily by index.js once activation succeeded.
// A draggable panel in three steps: a small circle, a compact language bar
// and the full panel with tabs. Tabs are rendered on first open, and anything
// beyond a DOM read (link check, raw HTML fetch) runs on click.

import styles from './styles.js';
import { getConfig, keys, readStorage, writeStorage, anyHidden, editorFlagUntil, PANEL_ACTIVE_CLASS, buildHandoff } from './config.js';
import { ICONS, escapeHtml, logo } from './util.js';
import pageTab, { marketKeyFromUrl, renderLanguages, prefetchHint, PREFETCH_REQUIREMENT } from './tabs/page.js';
import { applyPrefetch, prefetchSupported, prefetchUntil, setPrefetch, PREFETCH_EVENT } from './prefetch.js';
import seoTab from './tabs/seo.js';
import checksTab from './tabs/checks.js';
import devTab from './tabs/dev.js';

const TABS = [pageTab, seoTab, checksTab, devTab];
const EDGE_GAP = 12;
const DRAG_THRESHOLD = 4;

function loadState() {
    try {
        return JSON.parse(readStorage(keys().panel)) || {};
    } catch (e) {
        return {};
    }
}

const saveState = (state) => writeStorage(keys().panel, JSON.stringify(state));

function injectStyles(config) {
    if (!document.querySelector('style[data-pagepilot="panel"]')) {
        const style = document.createElement('style');
        style.setAttribute('data-pagepilot', 'panel');
        style.textContent = styles;
        document.head.appendChild(style);
    }
    const root = document.documentElement.style;
    if (config.accent) root.setProperty('--pp-accent', config.accent);
    if (config.accentSoft) root.setProperty('--pp-accent-soft', config.accentSoft);
    if (config.font) root.setProperty('--pp-font', config.font);
}

// Was the panel enabled by a handoff link rather than the activation marker?
function enabledViaLink(config) {
    const { activation } = config;
    const markerPresent = activation === 'always'
        || (activation && activation.selector && document.querySelector(activation.selector));
    return !markerPresent && Boolean(editorFlagUntil());
}

const shortcutLabel = (config) => `Alt+${config.shortcut.replace(/^Key/, '')}`;

function boltTitle() {
    return `Instant language switch\n${prefetchHint()}\n${PREFETCH_REQUIREMENT}`;
}

function buildPanel(config) {
    const root = document.createElement('div');
    root.className = 'pp';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', `${config.title} panel`);

    const market = marketKeyFromUrl(new URL(window.location.href));
    const shortcut = shortcutLabel(config);
    const bolt = config.prefetch && prefetchSupported;

    root.innerHTML = `
        <button type="button" class="pp__fab${anyHidden() ? ' has-badge' : ''}" aria-expanded="false" aria-label="Open ${escapeHtml(config.title)} panel" title="${escapeHtml(config.title)} (${shortcut}) · drag to move">
            ${logo()}
        </button>
        <div class="pp__card pp__card--compact" data-view="compact" hidden>
            <div class="pp__head" title="Drag to move">
                ${logo()}
                <span class="pp__market">${escapeHtml(market)}</span>
                ${bolt ? `<button type="button" class="pp__icon-btn pp__bolt${prefetchUntil() ? ' is-active' : ''}" data-action="prefetch" aria-pressed="${Boolean(prefetchUntil())}" aria-label="Instant language switch" title="${escapeHtml(boltTitle())}">${ICONS.bolt}</button>` : ''}
                <button type="button" class="pp__icon-btn pp__icon-btn--tight" data-action="full" aria-label="Open full panel" title="Full panel">${ICONS.expand}</button>
                <button type="button" class="pp__icon-btn pp__icon-btn--tight" data-action="collapse" aria-label="Collapse panel" title="Collapse (Esc / ${shortcut})">${ICONS.collapse}</button>
            </div>
            <div class="pp__compact-body">${renderLanguages({ compact: true }).html}</div>
        </div>
        <div class="pp__card" data-view="full" hidden>
            <div class="pp__head" title="Drag to move">
                ${logo()}
                <span class="pp__title">${escapeHtml(config.title)}</span>
                <span class="pp__market">${escapeHtml(market)}</span>
                <button type="button" class="pp__icon-btn" data-action="compact" aria-label="Show languages only" title="Languages only">${ICONS.shrink}</button>
                <button type="button" class="pp__icon-btn pp__icon-btn--tight" data-action="collapse" aria-label="Collapse panel" title="Collapse (Esc / ${shortcut})">${ICONS.collapse}</button>
            </div>
            <div class="pp__tabs" role="tablist">
                ${TABS.map((tab) => `<button type="button" role="tab" class="pp__tab" data-tab="${tab.id}" aria-selected="false">${tab.label}</button>`).join('')}
            </div>
            <div class="pp__body">
                ${TABS.map((tab) => `<div class="pp__panel" role="tabpanel" data-panel="${tab.id}" hidden></div>`).join('')}
            </div>
        </div>`;

    return root;
}

function create() {
    if (document.querySelector('.pp')) return;

    const config = getConfig();
    injectStyles(config);
    const state = loadState();
    const root = buildPanel(config);
    const fab = root.querySelector('.pp__fab');
    const cards = Array.from(root.querySelectorAll('[data-view]'));
    const rendered = new Set();

    document.body.appendChild(root);
    document.documentElement.classList.add(PANEL_ACTIVE_CLASS);
    applyPrefetch();

    const bolt = root.querySelector('[data-action="prefetch"]');
    document.addEventListener(PREFETCH_EVENT, () => {
        if (!bolt) return;
        const on = Boolean(prefetchUntil());
        bolt.classList.toggle('is-active', on);
        bolt.setAttribute('aria-pressed', String(on));
        bolt.title = boltTitle();
    });

    const ctx = {
        setBadge: (on) => fab.classList.toggle('has-badge', on),
        viaLink: enabledViaLink(config)
    };

    // --- Position -----------------------------------------------------------

    function clamp(left, top) {
        const rect = root.getBoundingClientRect();
        const maxLeft = Math.max(EDGE_GAP, window.innerWidth - rect.width - EDGE_GAP);
        const maxTop = Math.max(EDGE_GAP, window.innerHeight - rect.height - EDGE_GAP);
        return {
            left: Math.min(Math.max(EDGE_GAP, left), maxLeft),
            top: Math.min(Math.max(EDGE_GAP, top), maxTop)
        };
    }

    function place(left, top) {
        const pos = clamp(left, top);
        root.style.left = `${pos.left}px`;
        root.style.top = `${pos.top}px`;
        return pos;
    }

    function currentPos() {
        const rect = root.getBoundingClientRect();
        return { left: rect.left, top: rect.top };
    }

    function persist(extra = {}) {
        Object.assign(state, currentPos(), extra);
        saveState(state);
    }

    // --- Tabs ---------------------------------------------------------------

    function showTab(id) {
        const tab = TABS.find((t) => t.id === id) || TABS[0];
        root.querySelectorAll('[data-tab]').forEach((button) => {
            button.setAttribute('aria-selected', String(button.getAttribute('data-tab') === tab.id));
        });
        root.querySelectorAll('[data-panel]').forEach((panel) => {
            const active = panel.getAttribute('data-panel') === tab.id;
            panel.hidden = !active;
            if (active && !rendered.has(tab.id)) {
                rendered.add(tab.id);
                try {
                    tab.render(panel, ctx);
                } catch (error) {
                    console.error(`Pagepilot: tab "${tab.id}" failed`, error);
                    panel.innerHTML = '<p class="pp__note is-warn">This tab failed to render – see console.</p>';
                }
            }
        });
        state.tab = tab.id;
        saveState(state);
    }

    // --- Views: closed (circle) / compact (languages) / full -------------------

    // Older saved state only knew open: true/false.
    let view = state.view || (state.open ? 'full' : 'closed');
    let lastOpenView = state.lastOpenView || 'compact';

    function setView(next, { save = true } = {}) {
        // Keep the panel anchored to the corner it sits closest to, so expanding
        // near the bottom/right edge grows inward instead of off-screen.
        const before = root.getBoundingClientRect();
        // Decide by the top-left corner (not the centre), so a tall panel near
        // the top does not flip to bottom anchoring when it shrinks.
        const anchorRight = before.left > window.innerWidth / 2;
        const anchorBottom = before.top > window.innerHeight / 2;

        view = next;
        if (view !== 'closed') lastOpenView = view;
        if (view === 'full' && !rendered.size) showTab(state.tab);

        root.classList.toggle('is-open', view !== 'closed');
        cards.forEach((card) => { card.hidden = card.getAttribute('data-view') !== view; });
        fab.hidden = view !== 'closed';
        fab.setAttribute('aria-expanded', String(view !== 'closed'));

        const after = root.getBoundingClientRect();
        const left = anchorRight ? before.right - after.width : before.left;
        const top = anchorBottom ? before.bottom - after.height : before.top;
        place(left, top);

        if (!save) return; // initial restore: do not steal focus from the page
        persist({ view, lastOpenView, open: undefined });
        if (view === 'full') root.querySelector('.pp__tab[aria-selected="true"]')?.focus({ preventScroll: true });
        else if (view === 'closed') fab.focus({ preventScroll: true });
    }

    const toggle = () => setView(view === 'closed' ? lastOpenView : 'closed');

    // --- Dragging (FAB and card header) ---------------------------------------

    function makeDraggable(handle, onClick) {
        let start = null;

        handle.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) return;
            if (handle !== fab && event.target.closest('button, a, input')) return;
            const pos = currentPos();
            start = { x: event.clientX, y: event.clientY, left: pos.left, top: pos.top, moved: false };
            handle.setPointerCapture(event.pointerId);
        });

        handle.addEventListener('pointermove', (event) => {
            if (!start) return;
            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;
            if (!start.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
            start.moved = true;
            root.classList.add('is-dragging');
            place(start.left + dx, start.top + dy);
        });

        const end = (event) => {
            if (!start) return;
            const { moved } = start;
            start = null;
            root.classList.remove('is-dragging');
            if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
            if (moved) persist();
            else if (onClick && event.type === 'pointerup') onClick();
        };
        handle.addEventListener('pointerup', end);
        handle.addEventListener('pointercancel', end);
    }

    makeDraggable(fab, () => setView(lastOpenView));
    root.querySelectorAll('.pp__head').forEach((head) => makeDraggable(head));

    // --- Keyboard -----------------------------------------------------------------

    // Keyboard access for the FAB (pointer handlers cover mouse/touch clicks).
    fab.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setView(lastOpenView);
        }
    });

    root.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && view !== 'closed') setView('closed');
    });

    // Alt+<shortcut> toggles the panel from anywhere (event.code, so macOS'
    // Option characters do not matter). Ignored while typing in a form field.
    document.addEventListener('keydown', (event) => {
        if (!config.shortcut || !event.altKey || event.ctrlKey || event.metaKey || event.code !== config.shortcut) return;
        if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        event.preventDefault();
        toggle();
    });

    // --- Clicks -------------------------------------------------------------------

    // Links to another domain carry the current settings (see config.js).
    // Rewritten at click time so position and toggles are up to date.
    const handOver = (event) => {
        const link = event.target.closest('a[href]');
        if (!link || link.host === window.location.host) return;
        link.hash = `${config.handoffHash.slice(1)}=${buildHandoff()}`;
    };
    root.addEventListener('auxclick', handOver);

    root.addEventListener('click', (event) => {
        handOver(event);
        const action = event.target.closest('[data-action]')?.getAttribute('data-action');
        if (action === 'collapse') setView('closed');
        if (action === 'compact') setView('compact');
        if (action === 'full') setView('full');
        if (action === 'prefetch') setPrefetch(!prefetchUntil());
        const tab = event.target.closest('[data-tab]');
        if (tab) showTab(tab.getAttribute('data-tab'));
    });

    window.addEventListener('resize', () => {
        const pos = currentPos();
        place(pos.left, pos.top);
    });

    // --- Initial placement ------------------------------------------------------

    if (view !== 'closed') setView(view, { save: false });
    const fallbackTop = window.innerHeight - root.getBoundingClientRect().height - 24;
    place(
        typeof state.left === 'number' ? state.left : 24,
        typeof state.top === 'number' ? state.top : fallbackTop
    );
}

export default { create };
