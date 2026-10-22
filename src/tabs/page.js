// "Page" tab: language versions, editor settings and page actions.

import {
    getConfig, PANEL_ACTIVE_CLASS, hideClass, isHidden, setHidden, anyHidden,
    editorFlagUntil, setEditorFlag
} from '../config.js';
import { ICONS, escapeHtml, normalizeUrl } from '../util.js';
import { prefetchSupported, prefetchUntil, minutesLeft, setPrefetch, refreshPrefetch, PREFETCH_EVENT } from '../prefetch.js';

const X_DEFAULT_HINT = 'x-default: the version Google shows to visitors from countries without their own language version';

// Links to another domain carry the handoff hash so the panel shows up there
// even without the activation marker (the panel adds the settings on click).
function withEditorHash(href) {
    const url = new URL(href, window.location.href);
    if (url.host !== window.location.host && !url.hash) url.hash = getConfig().handoffHash;
    return url.toString();
}

export function marketKeyFromUrl(url) {
    const custom = getConfig().marketFromUrl;
    if (custom) return custom(url);
    return (url.pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
}

function collectAlternates() {
    const byMarket = new Map();
    let xDefault = null;

    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((link) => {
        const href = link.getAttribute('href');
        const hreflang = link.getAttribute('hreflang');
        if (!href) return;
        if (hreflang === 'x-default') {
            xDefault = href;
            return;
        }
        const key = marketKeyFromUrl(new URL(href, window.location.href));
        byMarket.set(key, { href, hreflang });
    });

    // A version may be announced only as x-default (no hreflang of its own).
    if (xDefault) {
        const key = marketKeyFromUrl(new URL(xDefault, window.location.href));
        if (!byMarket.has(key)) byMarket.set(key, { href: xDefault, hreflang: 'x-default' });
    }

    return { byMarket, xDefault };
}

export function renderLanguages({ compact = false } = {}) {
    const { byMarket, xDefault } = collectAlternates();
    const current = marketKeyFromUrl(new URL(window.location.href));
    // Without configured markets, show whatever the page announces.
    const markets = getConfig().markets
        || Array.from(byMarket.entries()).map(([key, alt]) => ({ key, label: alt.hreflang, name: alt.hreflang }));
    const known = new Set(markets.map((m) => m.key));

    const tile = (key, label, name, alt, isCurrent, isDefault) => {
        const marker = !isDefault ? ''
            : (compact
                ? `<span class="pp__tile-flag" title="${escapeHtml(X_DEFAULT_HINT)}"></span>`
                : `<span class="pp__tile-tag" title="${escapeHtml(X_DEFAULT_HINT)}">default</span>`);
        const inner = `<span class="pp__tile-key">${escapeHtml(key)}${compact ? '' : marker}</span>`
            + (compact ? marker : `<span class="pp__tile-name">${escapeHtml(label)}</span>`);
        if (!alt) {
            return `<span class="pp__tile is-missing" title="${escapeHtml(name)} · no hreflang link">${inner}</span>`;
        }
        const title = `${name}\nhreflang: ${alt.hreflang}${isDefault && alt.hreflang !== 'x-default' ? ', x-default' : ''}\n${alt.href}`;
        return `<a class="pp__tile${isCurrent ? ' is-current' : ''}" href="${escapeHtml(withEditorHash(alt.href))}" title="${escapeHtml(title)}"${isCurrent ? ' aria-current="page"' : ''}>${inner}</a>`;
    };

    const tiles = markets.map((market) => {
        const alt = byMarket.get(market.key);
        const isDefault = alt && xDefault && normalizeUrl(alt.href) === normalizeUrl(xDefault);
        return tile(market.key, market.label, market.name || market.label, alt, market.key === current, isDefault);
    });

    // Alternates that do not map to a configured market: show them anyway.
    byMarket.forEach((alt, key) => {
        if (!known.has(key)) tiles.push(tile(key || '?', alt.hreflang, alt.hreflang, alt, false, false));
    });

    const count = tiles.length - markets.filter((m) => !byMarket.has(m.key)).length;
    return {
        html: tiles.length
            ? `<div class="pp__tiles${compact ? ' pp__tiles--compact' : ''}">${tiles.join('')}</div>`
            : '<p class="pp__note">No hreflang links on this page.</p>',
        count,
        total: tiles.length
    };
}

function environmentSwitch() {
    const host = window.location.hostname;
    const group = getConfig().environments.find((envs) => envs.some((env) => env.host === host));
    if (!group) return '';
    return group.map((env) => {
        if (env.host === host) {
            return `<span class="pp__seg is-current">${escapeHtml(env.label)}</span>`;
        }
        const url = new URL(window.location.href);
        url.hostname = env.host;
        url.port = '';
        return `<a class="pp__seg" href="${escapeHtml(withEditorHash(url.toString()))}" title="Same page on ${escapeHtml(env.label)} (${escapeHtml(env.host)})">${escapeHtml(env.label)}</a>`;
    }).join('');
}

function noCacheButton() {
    const param = getConfig().noCacheParam;
    if (!param) return '';
    const url = new URL(window.location.href);
    url.searchParams.set(param, '1');
    return `<a class="pp__btn" href="${escapeHtml(url.toString())}" title="Reload with ${escapeHtml(param)}=1 (the CMS renders the page fresh)">${ICONS.refresh}<span>Uncached</span></a>`;
}

export const PREFETCH_REQUIREMENT = 'Chrome/Edge only · "Preload pages" must be on (Settings → Performance)';

export function prefetchHint() {
    if (!prefetchSupported) return 'Not supported in this browser – needs Chrome or Edge';
    const left = minutesLeft();
    return left ? `Preloading language versions · ${left} min left` : 'Preloads all language versions for 1 hour';
}

function hideableRows() {
    return getConfig().hideables.map((h) => `
        <label class="pp__row">
            <span class="pp__row-icon">${ICONS[h.icon] || ICONS.eyeOff}</span>
            <span class="pp__row-text">
                <span class="pp__row-title">${escapeHtml(h.label)}</span>
                <span class="pp__row-hint">${escapeHtml(h.hint || 'Only for you · saved in this browser')}</span>
            </span>
            <input type="checkbox" class="pp__switch-input" data-hideable="${escapeHtml(h.id)}"${isHidden(h.id) ? ' checked' : ''}>
            <span class="pp__switch" aria-hidden="true"></span>
        </label>`).join('');
}

function prefetchRow() {
    if (!getConfig().prefetch) return '';
    return `
        <label class="pp__row${prefetchSupported ? '' : ' is-disabled'}">
            <span class="pp__row-icon">${ICONS.bolt}</span>
            <span class="pp__row-text">
                <span class="pp__row-title">Instant language switch</span>
                <span class="pp__row-hint" data-role="prefetch-hint">${prefetchHint()}</span>
                ${prefetchSupported ? `<span class="pp__row-hint">${escapeHtml(PREFETCH_REQUIREMENT)}</span>` : ''}
            </span>
            <input type="checkbox" class="pp__switch-input" data-role="prefetch"${prefetchUntil() ? ' checked' : ''}${prefetchSupported ? '' : ' disabled'}>
            <span class="pp__switch" aria-hidden="true"></span>
        </label>
        <div class="pp__row-extra" data-role="prefetch-extra"${prefetchUntil() ? '' : ' hidden'}>
            <button type="button" class="pp__btn" data-role="prefetch-refresh" title="Discard the preloaded versions and load them again – use after editing translations">${ICONS.refresh}<span>Refresh preloads</span></button>
            <span class="pp__row-hint">After editing translations</span>
        </div>`;
}

export default {
    id: 'page',
    label: 'Page',

    render(container, ctx) {
        const config = getConfig();
        const languages = renderLanguages();

        const viaLink = ctx.viaLink && editorFlagUntil();
        const editorNote = viaLink ? `
            <section class="pp__section">
                <div class="pp__editor-mode">
                    <span>Editor mode on this domain (enabled via link) until ${new Date(editorFlagUntil()).toLocaleDateString()}</span>
                    <button type="button" class="pp__link-btn" data-role="editor-off">Turn off</button>
                </div>
            </section>` : '';

        const settings = hideableRows() + prefetchRow();
        const env = environmentSwitch();

        container.innerHTML = `${editorNote}
            <section class="pp__section">
                <h2 class="pp__heading">Language versions <span class="pp__count">${languages.count}/${languages.total}</span></h2>
                ${languages.html}
            </section>
            ${settings ? `<section class="pp__section">${settings}</section>` : ''}
            <section class="pp__section">
                <h2 class="pp__heading">Actions</h2>
                <div class="pp__actions">
                    <button type="button" class="pp__btn" data-role="copy-url">${ICONS.copy}<span>Copy URL</span></button>
                    ${noCacheButton()}
                </div>
            </section>
            ${env ? `<section class="pp__section">
                <h2 class="pp__heading">Environment</h2>
                <div class="pp__segmented">${env}</div>
            </section>` : ''}`;

        container.querySelector('[data-role="editor-off"]')?.addEventListener('click', () => {
            setEditorFlag(false);
            document.documentElement.classList.remove(PANEL_ACTIVE_CLASS, ...config.hideables.map((h) => hideClass(h.id)));
            document.querySelector('.pp')?.remove();
        });

        container.querySelectorAll('[data-hideable]').forEach((input) => {
            input.addEventListener('change', () => {
                setHidden(input.getAttribute('data-hideable'), input.checked);
                ctx.setBadge(anyHidden());
            });
        });

        const prefetchInput = container.querySelector('[data-role="prefetch"]');
        if (prefetchInput) {
            const prefetchHintEl = container.querySelector('[data-role="prefetch-hint"]');
            const prefetchExtra = container.querySelector('[data-role="prefetch-extra"]');
            prefetchInput.addEventListener('change', () => setPrefetch(prefetchInput.checked));
            document.addEventListener(PREFETCH_EVENT, () => {
                prefetchInput.checked = Boolean(prefetchUntil());
                prefetchHintEl.textContent = prefetchHint();
                prefetchExtra.hidden = !prefetchUntil();
            });

            const refresh = container.querySelector('[data-role="prefetch-refresh"]');
            refresh.addEventListener('click', () => {
                const label = refresh.querySelector('span');
                label.textContent = 'Refreshing…';
                refreshPrefetch().then(() => {
                    label.textContent = 'Refreshed';
                    setTimeout(() => { label.textContent = 'Refresh preloads'; }, 1500);
                });
            });
        }

        const copy = container.querySelector('[data-role="copy-url"]');
        copy.addEventListener('click', () => {
            const label = copy.querySelector('span');
            const done = (text) => {
                label.textContent = text;
                setTimeout(() => { label.textContent = 'Copy URL'; }, 1500);
            };
            navigator.clipboard?.writeText(window.location.href)
                .then(() => done('Copied'))
                .catch(() => done('Copy failed'));
        });
    }
};
