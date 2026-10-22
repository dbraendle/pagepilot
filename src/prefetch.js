// Opt-in "instant language switch": while active (one hour, per browser), every
// page an editor opens prefetches its hreflang alternates via Speculation Rules.
// Speculation Rules (Chrome/Edge) are used instead of <link rel="prefetch">
// because CMS pages are often sent with Cache-Control: no-store, which the HTTP
// cache (and therefore link prefetch) may not reuse. Prefetch only -- no prerender,
// so no page scripts or tracking run for the preloaded versions.

import { normalizeUrl } from './util.js';
import { keys, readStorage, writeStorage } from './config.js';

const DURATION_MS = 60 * 60 * 1000;
const SCRIPT_ID = 'pp-speculation';
export const PREFETCH_EVENT = 'pagepilot:prefetch';

export const prefetchSupported = typeof HTMLScriptElement !== 'undefined'
    && typeof HTMLScriptElement.supports === 'function'
    && HTMLScriptElement.supports('speculationrules');

export function prefetchUntil() {
    const until = Number(readStorage(keys().prefetch));
    return until > Date.now() ? until : 0;
}

export function minutesLeft() {
    const until = prefetchUntil();
    return until ? Math.max(1, Math.round((until - Date.now()) / 60000)) : 0;
}

function alternateUrls() {
    const current = normalizeUrl(window.location.href);
    const urls = new Set();
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((link) => {
        const href = link.getAttribute('href');
        if (href && normalizeUrl(href) !== current) urls.add(new URL(href, window.location.href).toString());
    });
    return Array.from(urls);
}

export function applyPrefetch() {
    document.getElementById(SCRIPT_ID)?.remove(); // removing the rules cancels pending prefetches
    if (!prefetchSupported || !prefetchUntil()) return;

    const urls = alternateUrls();
    if (!urls.length) return;

    const script = document.createElement('script');
    script.type = 'speculationrules';
    script.id = SCRIPT_ID;
    script.textContent = JSON.stringify({ prefetch: [{ source: 'list', urls }] });
    document.head.appendChild(script);
}

// Drop the current preloads and fetch the alternates again, e.g. after
// editing translations in the backend. Removing the rules discards unused
// prefetches; re-adding them after a short pause starts fresh requests.
export function refreshPrefetch() {
    document.getElementById(SCRIPT_ID)?.remove();
    return new Promise((resolve) => {
        setTimeout(() => {
            applyPrefetch();
            resolve();
        }, 150);
    });
}

export function setPrefetch(on) {
    writeStorage(keys().prefetch, on ? String(Date.now() + DURATION_MS) : null);
    applyPrefetch();
    document.dispatchEvent(new CustomEvent(PREFETCH_EVENT));
}
