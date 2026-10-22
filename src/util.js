// Small helpers shared by the panel and its tabs.

import { getConfig } from './config.js';

function* ancestors(element) {
    for (let el = element; el && el !== document.documentElement; el = el.parentElement) yield el;
}

// Logo from the config (an SVG string), or the default mark.
export function logo() {
    const custom = getConfig().logo;
    return custom ? custom.replace('<svg', '<svg class="pp__mark" aria-hidden="true"') : ICONS.mark;
}

// Elements the panel's checks and lists ignore.
export function isIgnored(element) {
    const selectors = ['.pp', '.pp-flash', '.pp-hover', '.pp-grid', ...getConfig().ignoreSelectors];
    return Boolean(element.closest(selectors.join(', ')));
}

export const ICONS = {
    // Default logo (a paper plane); replace it via config.logo.
    mark: '<svg class="pp__mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 11.2L21 3.5l-5.6 17.2-4.3-6.6z M11.1 14.1L21 3.5" /></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3 3.9M6.4 6.4C3.9 8.1 2.5 12 2.5 12s3.5 7 9.5 7a9.7 9.7 0 0 0 4.6-1.2" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>',
    bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3L5 14h6l-1 7 8-11h-6z" /></svg>',
    expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6" /><path d="M10 20H4v-6" /><path d="M20 4l-6 6" /><path d="M4 20l6-6" /></svg>',
    shrink: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14h6v6" /><path d="M20 10h-6V4" /><path d="M14 10l6-6" /><path d="M10 14l-6 6" /></svg>',
    collapse: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18L18 6M6 6l12 12" /></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a1 1 0 0 1 1-1h10" /></svg>',
    refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></svg>',
    swap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4L3 8l4 4" /><path d="M3 8h14" /><path d="M17 20l4-4-4-4" /><path d="M21 16H7" /></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>',
    external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l12 8-12 8z" /></svg>',
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 4v16M15 4v16" /></svg>',
    target: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></svg>'
};

export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

export function normalizeUrl(href) {
    try {
        const url = new URL(href, window.location.href);
        return url.origin + url.pathname.replace(/\/+$/, '');
    } catch (e) {
        return href;
    }
}

export function truncate(text, max) {
    const value = String(text ?? '');
    return value.length > max ? value.slice(0, max - 1).trimEnd() + '…' : value;
}

// Short CSS-like description of an element, for lists in the panel.
export function describe(element) {
    let label = element.tagName.toLowerCase();
    if (element.id) label += `#${element.id}`;
    const pattern = getConfig().contentIdPattern;
    if (pattern) {
        const ce = Array.from(ancestors(element)).find((el) => el !== element && el.id && pattern.test(el.id));
        if (ce) label = `${ce.id} › ${label}`;
    }
    return label;
}

let flashBox = null;
let flashTimer = null;

// Scroll an element into view and briefly draw a highlight box around it.
export function flash(element) {
    if (!element || !element.isConnected) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (!flashBox) {
        flashBox = document.createElement('div');
        flashBox.className = 'pp-flash';
        document.body.appendChild(flashBox);
    }
    clearTimeout(flashTimer);

    // Position after the smooth scroll has (mostly) settled.
    setTimeout(() => {
        const rect = element.getBoundingClientRect();
        Object.assign(flashBox.style, {
            top: `${rect.top - 4}px`,
            left: `${rect.left - 4}px`,
            width: `${rect.width + 8}px`,
            height: `${rect.height + 8}px`
        });
        flashBox.classList.add('is-visible');
        flashTimer = setTimeout(() => flashBox.classList.remove('is-visible'), 1600);
    }, 350);
}

// Persistent hover outline (Dev tab lists).
let hoverBox = null;

export function outline(element) {
    if (!hoverBox) {
        hoverBox = document.createElement('div');
        hoverBox.className = 'pp-hover';
        document.body.appendChild(hoverBox);
    }
    if (!element || !element.isConnected) {
        hoverBox.classList.remove('is-visible');
        return;
    }
    const rect = element.getBoundingClientRect();
    Object.assign(hoverBox.style, {
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`
    });
    hoverBox.classList.add('is-visible');
}

export function pill(status, text) {
    return `<span class="pp__pill is-${status}">${escapeHtml(text)}</span>`;
}
