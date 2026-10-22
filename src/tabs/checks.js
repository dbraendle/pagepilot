// "Checks" tab: link and image checks. Both run only on click.
// The link check is deliberately gentle: same-origin only, a capped number of
// URLs, few requests at a time with a pause in between (config.linkCheck),
// and it stops at the first 429 so an editor never trips a rate limit.

import { ICONS, escapeHtml, truncate, describe, flash, pill, isIgnored } from '../util.js';
import { getConfig } from '../config.js';

const OVERSIZE_FACTOR = 2;
const HEAVY_BYTES = 500 * 1024;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- Links ---------------------------------------------------------------------

function collectLinks() {
    const sameOrigin = new Map(); // url -> [elements]
    const brokenAnchors = [];
    let external = 0;
    let skipped = 0;

    document.querySelectorAll('a[href]').forEach((a) => {
        if (isIgnored(a)) return;
        const raw = a.getAttribute('href').trim();
        if (!raw || /^(mailto:|tel:|javascript:|data:)/i.test(raw)) {
            skipped++;
            return;
        }

        let url;
        try {
            url = new URL(raw, window.location.href);
        } catch (e) {
            brokenAnchors.push({ element: a, detail: 'invalid URL' });
            return;
        }

        const samePage = url.origin === window.location.origin && url.pathname === window.location.pathname && url.search === window.location.search;
        if (samePage && url.hash) {
            const id = decodeURIComponent(url.hash.slice(1));
            // "#top" always scrolls to the top (HTML spec), even without a target.
            if (id && id.toLowerCase() !== 'top' && !document.getElementById(id) && !document.getElementsByName(id).length) {
                brokenAnchors.push({ element: a, detail: url.hash });
            }
            return;
        }

        if (url.origin !== window.location.origin) {
            external++;
            return;
        }

        url.hash = '';
        const key = url.toString();
        if (!sameOrigin.has(key)) sameOrigin.set(key, []);
        sameOrigin.get(key).push(a);
    });

    return { sameOrigin, brokenAnchors, external, skipped };
}

async function checkUrl(url) {
    const request = (method) => fetch(url, { method, redirect: 'manual', credentials: 'same-origin', cache: 'no-store' });
    let response = await request('HEAD');
    if (response.status === 405 || response.status === 501) response = await request('GET');
    if (response.type === 'opaqueredirect') return { kind: 'redirect', status: '3xx' };
    if (response.status === 429) return { kind: 'ratelimit', status: 429 };
    if (response.status >= 400) return { kind: 'broken', status: response.status };
    return { kind: 'ok', status: response.status };
}

function linkLabel(a) {
    const text = a.textContent.replace(/\s+/g, ' ').trim() || a.getAttribute('aria-label') || a.getAttribute('title');
    return text ? `"${text}"` : describe(a);
}

function resultList(items, status) {
    if (!items.length) return '';
    return `<ul class="pp__results">${items.map((item, index) =>
        `<li><button type="button" data-result="${status}:${index}">`
        + pill(status === 'broken' || status === 'anchor' ? 'error' : 'warn', item.status ?? item.detail)
        + `<span class="pp__result-text" title="${escapeHtml(item.url || describe(item.element))}">${escapeHtml(truncate(item.url ? item.url.replace(window.location.origin, '') : linkLabel(item.element), 48))}</span>`
        + (item.elements && item.elements.length > 1 ? `<span class="pp__count">${item.elements.length}×</span>` : '')
        + '</button></li>').join('')}</ul>`;
}

function runLinkCheck(box) {
    const { maxUrls: MAX_LINKS, concurrency: CONCURRENCY, pauseMs: PAUSE_MS } = getConfig().linkCheck;
    const { sameOrigin, brokenAnchors, external } = collectLinks();
    const urls = Array.from(sameOrigin.keys());
    const queue = urls.slice(0, MAX_LINKS);
    const capped = urls.length - queue.length;
    const results = { broken: [], redirect: [], ok: 0 };
    let done = 0;
    let stopped = null;
    let cancelled = false;

    const render = (running) => {
        const progress = running
            ? `<div class="pp__progress"><span style="width:${queue.length ? (done / queue.length) * 100 : 100}%"></span></div>
               <div class="pp__progress-row"><span>Checking ${done}/${queue.length}…</span><button type="button" class="pp__link-btn" data-role="cancel">Cancel</button></div>`
            : '';
        box.innerHTML = `${progress}
            <div class="pp__summary">
                ${pill('ok', `${results.ok} ok`)}
                ${pill(results.redirect.length ? 'warn' : 'ok', `${results.redirect.length} redirect`)}
                ${pill(results.broken.length ? 'error' : 'ok', `${results.broken.length} broken`)}
                ${pill(brokenAnchors.length ? 'error' : 'ok', `${brokenAnchors.length} anchor`)}
                ${pill('muted', `${external} external`)}
            </div>
            ${stopped ? `<p class="pp__note is-warn">${escapeHtml(stopped)}</p>` : ''}
            ${!running && capped > 0 ? `<p class="pp__note">Checked the first ${MAX_LINKS} of ${urls.length} internal URLs.</p>` : ''}
            ${resultList(results.broken, 'broken')}
            ${resultList(brokenAnchors, 'anchor')}
            ${resultList(results.redirect, 'redirect')}
            ${!running ? `<p class="pp__note">External links are not checked (browser CORS). Redirects: update the link to its target.</p>
                <button type="button" class="pp__btn" data-role="rerun">${ICONS.refresh}<span>Run again</span></button>` : ''}`;
    };

    box.onclick = (event) => {
        if (event.target.closest('[data-role="rerun"]')) {
            runLinkCheck(box);
            return;
        }
        if (event.target.closest('[data-role="cancel"]')) {
            cancelled = true;
            stopped = 'Cancelled.';
            return;
        }
        const button = event.target.closest('[data-result]');
        if (!button) return;
        const [status, index] = button.getAttribute('data-result').split(':');
        const list = status === 'anchor' ? brokenAnchors : results[status];
        const item = list[Number(index)];
        flash(item.element || item.elements[0]);
    };

    render(true);

    const worker = async () => {
        while (queue.length > done && !stopped && !cancelled) {
            const index = done++;
            const url = queue[index];
            try {
                const result = await checkUrl(url);
                if (result.kind === 'ratelimit') {
                    stopped = 'Stopped: the server answered 429 (rate limit). Try again in a minute.';
                } else if (result.kind === 'broken') {
                    results.broken.push({ url, status: result.status, elements: sameOrigin.get(url) });
                } else if (result.kind === 'redirect') {
                    results.redirect.push({ url, status: result.status, elements: sameOrigin.get(url) });
                } else {
                    results.ok++;
                }
            } catch (e) {
                results.broken.push({ url, status: 'error', elements: sameOrigin.get(url) });
            }
            render(true);
            await sleep(PAUSE_MS);
        }
    };

    return Promise.all(Array.from({ length: CONCURRENCY }, worker)).then(() => render(false));
}

// --- Images ----------------------------------------------------------------------

function runImageCheck(box) {
    const dpr = window.devicePixelRatio || 1;
    const issues = [];
    let decorative = 0;
    let notLoaded = 0;
    let total = 0;

    document.querySelectorAll('img').forEach((img) => {
        if (isIgnored(img)) return;
        total++;

        if (!img.hasAttribute('alt')) issues.push({ element: img, status: 'error', detail: 'no alt' });
        else if (img.getAttribute('alt').trim() === '') decorative++;

        // naturalWidth is known as soon as the header arrived; `complete` can stay
        // false for slider clones that never finish, so do not rely on it.
        if (!img.naturalWidth) {
            notLoaded++;
            return;
        }

        const rendered = img.getBoundingClientRect().width;
        if (rendered > 0 && img.naturalWidth > rendered * dpr * OVERSIZE_FACTOR && img.naturalWidth - rendered * dpr > 400) {
            issues.push({ element: img, status: 'warn', detail: `${img.naturalWidth}px for ${Math.round(rendered)}px` });
        }

        const entry = performance.getEntriesByName(img.currentSrc || img.src)[0];
        const bytes = entry && (entry.encodedBodySize || entry.transferSize);
        if (bytes > HEAVY_BYTES) {
            issues.push({ element: img, status: 'warn', detail: `${Math.round(bytes / 1024)} KB` });
        }
    });

    // Sliders clone their slides: group identical findings for the same file.
    const grouped = new Map();
    issues.forEach((issue) => {
        const key = `${issue.detail}|${issue.element.currentSrc || issue.element.src}`;
        if (grouped.has(key)) grouped.get(key).count++;
        else grouped.set(key, { ...issue, count: 1 });
    });
    issues.length = 0;
    issues.push(...grouped.values());

    const missingAlt = issues.filter((i) => i.detail === 'no alt').length;
    box.innerHTML = `
        <div class="pp__summary">
            ${pill('muted', `${total} images`)}
            ${pill(missingAlt ? 'error' : 'ok', `${missingAlt} no alt`)}
            ${pill(issues.length - missingAlt ? 'warn' : 'ok', `${issues.length - missingAlt} too big`)}
            ${pill('muted', `${decorative} decorative`)}
        </div>
        ${notLoaded ? `<p class="pp__note">${notLoaded} lazy images not loaded yet – scroll down and run again to include them.</p>` : ''}
        <ul class="pp__results">${issues.map((issue, index) =>
            `<li><button type="button" data-image="${index}">${pill(issue.status, issue.detail)}`
            + `<span class="pp__result-text">${escapeHtml(truncate((issue.element.currentSrc || issue.element.src).split('/').pop(), 40))}</span>`
            + (issue.count > 1 ? `<span class="pp__count">${issue.count}×</span>` : '') + '</button></li>'
        ).join('')}</ul>
        <button type="button" class="pp__btn" data-role="rerun">${ICONS.refresh}<span>Run again</span></button>`;

    box.onclick = (event) => {
        if (event.target.closest('[data-role="rerun"]')) {
            runImageCheck(box);
            return;
        }
        const button = event.target.closest('[data-image]');
        if (button) flash(issues[Number(button.getAttribute('data-image'))].element);
    };
}

export default {
    id: 'checks',
    label: 'Checks',

    render(container) {
        const MAX_LINKS = getConfig().linkCheck.maxUrls;
        container.innerHTML = `
            <section class="pp__section">
                <h2 class="pp__heading">Links</h2>
                <div data-role="links"><p class="pp__note">Checks internal links for 404s and redirects, and in-page anchors. Runs gently in the background (max ${MAX_LINKS} URLs).</p>
                <button type="button" class="pp__btn pp__btn--primary" data-role="run-links">${ICONS.play}<span>Check links</span></button></div>
            </section>
            <section class="pp__section">
                <h2 class="pp__heading">Images</h2>
                <div data-role="images"><p class="pp__note">Missing alt texts, images delivered much larger than shown, heavy files.</p>
                <button type="button" class="pp__btn pp__btn--primary" data-role="run-images">${ICONS.play}<span>Check images</span></button></div>
            </section>`;

        const links = container.querySelector('[data-role="links"]');
        const images = container.querySelector('[data-role="images"]');
        container.querySelector('[data-role="run-links"]').addEventListener('click', () => runLinkCheck(links));
        container.querySelector('[data-role="run-images"]').addEventListener('click', () => runImageCheck(images));
    }
};
