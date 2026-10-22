// Configuration, storage keys and small persistence helpers.
// The resolved config is a module singleton: init() sets it, the lazily
// loaded panel and its tabs read it.

const DEFAULTS = {
    // Header title and logo (an SVG string; it is coloured with the accent).
    title: 'Editor',
    logo: null,
    // Theme
    accent: '#4f46e5',
    accentSoft: '#818cf8',
    font: null,

    // Prefix for localStorage keys and cookies. Keep it stable: changing it
    // makes every editor start from scratch.
    storagePrefix: 'pagepilot',

    // When does the panel appear?
    //  - { selector: '#marker', timeout: 4000 }: once this element shows up
    //    (e.g. something your CMS only renders for logged-in editors)
    //  - 'always'
    //  - a function returning true/false (or a Promise of it)
    activation: { selector: null, timeout: 4000 },

    // Element hidden while the panel is active (e.g. a toolbar it replaces).
    replaceSelector: null,
    // Elements the checks and outlines ignore (e.g. a chat widget).
    ignoreSelectors: [],

    // Which tabs, in which order: any of 'page', 'seo', 'checks', 'dev'.
    tabs: ['page', 'seo', 'checks', 'dev'],

    // Language features: tiles, compact language bar, instant language switch.
    // Turn off for single-language sites (the circle then opens the full panel).
    languages: true,

    // Language versions. Without markets, the tiles are built from the page's
    // <link rel="alternate" hreflang> tags alone.
    // markets: [{ key: 'de-de', label: 'Deutsch', name: 'Germany · Deutsch' }]
    markets: null,
    // url -> market key. Default: first path segment (/de-de/... -> "de-de").
    marketFromUrl: null,

    // Environment switch, one group per domain family:
    // [[{ label: 'Live', host: 'www.example.com' }, { label: 'Stage', host: 'stage.example.com' }]]
    environments: [],

    // Elements an editor can hide for themselves (cookie per element):
    // [{ id: 'chat', label: 'Hide chat', hint: '…', selector: '#chat-widget', icon: 'chat' }]
    hideables: [],

    // Hash that carries editor mode + settings to another domain.
    handoffHash: '#pagepilot',
    // Query parameter for an uncached reload (e.g. 'no_cache' for TYPO3); null hides the button.
    noCacheParam: null,
    // Pattern for content element ids, used to label elements (e.g. /^c\d+$/ for TYPO3).
    contentIdPattern: null,

    // Component inspector in the Dev tab (optional):
    // { label: 'Widgets', selector: '[data-widget-ready]', rawSelector: '[data-widget]',
    //   nameOf: (el) => el.dataset.widget, classPrefix: /^widget-/, errorClass: 'widget-error' }
    components: null,

    grid: { container: '.container', columns: 12 },
    // Alt + this key (KeyboardEvent.code) toggles the panel.
    shortcut: 'KeyB',
    // Opt-in instant language switch (Speculation Rules prefetch); needs languages.
    prefetch: true,
    linkCheck: { maxUrls: 100, concurrency: 2, pauseMs: 250 }
};

let config = { ...DEFAULTS };

export function setConfig(user = {}) {
    config = {
        ...DEFAULTS,
        ...user,
        activation: typeof user.activation === 'object' && user.activation !== null
            ? { ...DEFAULTS.activation, ...user.activation }
            : (user.activation ?? DEFAULTS.activation),
        grid: { ...DEFAULTS.grid, ...(user.grid || {}) },
        linkCheck: { ...DEFAULTS.linkCheck, ...(user.linkCheck || {}) }
    };
    return config;
}

export const getConfig = () => config;

// --- Keys -----------------------------------------------------------------------

export const PANEL_ACTIVE_CLASS = 'pp-active';
export const hideClass = (id) => `pp-hide-${id}`;
export const keys = () => ({
    panel: `${config.storagePrefix}_panel`,
    prefetch: `${config.storagePrefix}_prefetch_until`,
    editor: `${config.storagePrefix}_editor_until`,
    hideCookie: (id) => `${config.storagePrefix}_hide_${id}`
});

// --- Cookies / storage ----------------------------------------------------------

export function readCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
}

export function writeCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function readStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

export function writeStorage(key, value) {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
    } catch (e) {
        // Storage blocked (private mode etc.): settings simply do not persist.
    }
}

// --- Hideables (per-editor "hide this element") --------------------------------

export const isHidden = (id) => readCookie(keys().hideCookie(id)) === '1';

export function setHidden(id, hide) {
    writeCookie(keys().hideCookie(id), hide ? '1' : '0', 365);
    document.documentElement.classList.toggle(hideClass(id), hide);
}

export const anyHidden = () => config.hideables.some((h) => isHidden(h.id));

// --- Editor mode on domains without the activation marker -----------------------

const EDITOR_DAYS = 30;

export function editorFlagUntil() {
    const until = Number(readStorage(keys().editor));
    return until > Date.now() ? until : 0;
}

export function setEditorFlag(on) {
    writeStorage(keys().editor, on ? String(Date.now() + EDITOR_DAYS * 864e5) : null);
}

// Settings live per domain. Links from the panel to another domain carry them
// in the hash (#<handoffHash>=<payload>) and the target domain adopts them.
export function buildHandoff() {
    let panel;
    try {
        panel = JSON.parse(readStorage(keys().panel)) || {};
    } catch (e) {
        panel = {};
    }
    const hidden = {};
    config.hideables.forEach((h) => { hidden[h.id] = isHidden(h.id); });
    const payload = JSON.stringify({ p: panel, h: hidden, f: Number(readStorage(keys().prefetch)) || 0 });
    return btoa(unescape(encodeURIComponent(payload))).replace(/=+$/, '');
}

export function applyHandoff(encoded) {
    try {
        const data = JSON.parse(decodeURIComponent(escape(atob(encoded))));
        if (data.p && typeof data.p === 'object') writeStorage(keys().panel, JSON.stringify(data.p));
        if (data.f > Date.now()) writeStorage(keys().prefetch, String(data.f));
        if (data.h && typeof data.h === 'object') {
            Object.entries(data.h).forEach(([id, hide]) => writeCookie(keys().hideCookie(id), hide ? '1' : '0', 365));
        }
    } catch (e) {
        // Malformed payload: ignore, editor mode still applies.
    }
}
