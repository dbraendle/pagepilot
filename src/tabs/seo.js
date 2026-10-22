// "SEO" tab: meta checks, Google/social previews, heading outline and
// structured data. Everything here is a cheap read of the current DOM and is
// computed only when the tab is opened.

import { ICONS, escapeHtml, normalizeUrl, truncate, flash, pill, isIgnored } from '../util.js';

const meta = (selector) => (document.querySelector(selector)?.getAttribute('content') || '').trim();

function basicChecks() {
    const checks = [];
    const add = (label, status, detail) => checks.push({ label, status, detail });

    const title = document.title.trim();
    add('Title', !title ? 'error' : (title.length < 30 || title.length > 60 ? 'warn' : 'ok'),
        title ? `${title.length} chars` : 'missing');

    const description = meta('meta[name="description"]');
    add('Description', !description ? 'error' : (description.length < 70 || description.length > 160 ? 'warn' : 'ok'),
        description ? `${description.length} chars` : 'missing');

    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    if (!canonical) {
        add('Canonical', 'error', 'missing');
    } else {
        const self = normalizeUrl(canonical) === normalizeUrl(window.location.href);
        add('Canonical', self ? 'ok' : 'warn', self ? 'self' : 'elsewhere');
    }

    const robots = meta('meta[name="robots"]').toLowerCase();
    const noindex = robots.includes('noindex');
    add('Robots', noindex ? 'error' : 'ok', noindex ? 'noindex' : (robots || 'default'));

    const h1Count = document.querySelectorAll('h1').length;
    add('H1', h1Count === 1 ? 'ok' : (h1Count === 0 ? 'error' : 'warn'), `${h1Count}×`);

    const alternates = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]'));
    const selfListed = alternates.some((l) => normalizeUrl(l.getAttribute('href')) === normalizeUrl(window.location.href));
    add('hreflang', alternates.length && selfListed ? 'ok' : 'warn',
        `${alternates.length}${alternates.length && !selfListed ? ', no self' : ''}`);

    return checks.map((c) =>
        `<li class="pp__check"><span class="pp__check-label">${c.label}</span>${pill(c.status, c.detail)}</li>`
    ).join('');
}

function googlePreview() {
    const url = new URL(window.location.href);
    const crumbs = [url.hostname.replace(/^www\./, ''), ...url.pathname.split('/').filter(Boolean)].join(' › ');
    const description = meta('meta[name="description"]');
    return `
        <div class="pp__serp">
            <div class="pp__serp-url">${escapeHtml(truncate(crumbs, 60))}</div>
            <div class="pp__serp-title">${escapeHtml(truncate(document.title, 60))}</div>
            <div class="pp__serp-desc">${description ? escapeHtml(truncate(description, 158)) : '<em>No meta description – Google will pick text from the page.</em>'}</div>
        </div>`;
}

function socialPreview() {
    const ogTitle = meta('meta[property="og:title"]');
    const ogDescription = meta('meta[property="og:description"]');
    const ogImage = meta('meta[property="og:image"]');
    const missing = [!ogTitle && 'og:title', !ogDescription && 'og:description', !ogImage && 'og:image'].filter(Boolean);

    return `
        <div class="pp__social">
            ${ogImage
                ? `<div class="pp__social-img" style="background-image:url('${escapeHtml(ogImage)}')"></div>`
                : '<div class="pp__social-img is-empty">No og:image</div>'}
            <div class="pp__social-text">
                <div class="pp__social-title">${escapeHtml(truncate(ogTitle || document.title, 70))}</div>
                <div class="pp__social-desc">${escapeHtml(truncate(ogDescription || meta('meta[name="description"]'), 110))}</div>
            </div>
        </div>
        ${missing.length ? `<p class="pp__note">Missing: ${missing.join(', ')}</p>` : ''}`;
}

function headingOutline(headings) {
    if (!headings.length) return '<p class="pp__note">No headings on this page.</p>';
    let previous = 0;
    return `<ol class="pp__outline">${headings.map((h, index) => {
        const level = Number(h.tagName[1]);
        const skipped = previous && level > previous + 1;
        const hidden = !h.offsetParent && getComputedStyle(h).position !== 'fixed';
        previous = level;
        const text = h.textContent.replace(/\s+/g, ' ').trim() || '(empty)';
        return `<li style="--level:${level}"><button type="button" data-heading="${index}" class="${skipped ? 'is-skipped' : ''}${hidden ? ' is-hidden' : ''}"`
            + ` title="${skipped ? 'Skips a heading level' : ''}${hidden ? ' Hidden' : ''}">`
            + `<span class="pp__h-tag">H${level}</span>${escapeHtml(truncate(text, 60))}</button></li>`;
    }).join('')}</ol>`;
}

function structuredData() {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    if (!scripts.length) return '<p class="pp__note">No JSON-LD on this page.</p>';

    return scripts.map((script) => {
        let types = [];
        let pretty = script.textContent.trim();
        let valid = true;
        try {
            const data = JSON.parse(pretty);
            const collect = (node) => {
                if (Array.isArray(node)) node.forEach(collect);
                else if (node && typeof node === 'object') {
                    if (node['@type']) types.push([].concat(node['@type']).join('/'));
                    if (node['@graph']) collect(node['@graph']);
                }
            };
            collect(data);
            pretty = JSON.stringify(data, null, 2);
        } catch (e) {
            valid = false;
        }
        const summary = valid ? (types.join(', ') || 'no @type') : 'Invalid JSON';
        return `<details class="pp__ld${valid ? '' : ' is-invalid'}"><summary>${escapeHtml(summary)}</summary>`
            + `<pre>${escapeHtml(truncate(pretty, 4000))}</pre></details>`;
    }).join('');
}

function tools() {
    const url = encodeURIComponent(window.location.href);
    const link = (href, label) => `<a class="pp__btn" href="${href}" target="_blank" rel="noopener">${ICONS.external}<span>${label}</span></a>`;
    return `<div class="pp__actions">
        ${link(`https://pagespeed.web.dev/analysis?url=${url}`, 'PageSpeed')}
        ${link(`https://search.google.com/test/rich-results?url=${url}`, 'Rich Results')}
        ${link(`https://validator.schema.org/#url=${url}`, 'Schema')}
    </div>`;
}

export default {
    id: 'seo',
    label: 'SEO',

    render(container) {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
            .filter((h) => !isIgnored(h));

        container.innerHTML = `
            <section class="pp__section">
                <ul class="pp__checks">${basicChecks()}</ul>
            </section>
            <section class="pp__section">
                <h2 class="pp__heading">Google preview</h2>
                ${googlePreview()}
            </section>
            <section class="pp__section">
                <h2 class="pp__heading">Social preview</h2>
                ${socialPreview()}
            </section>
            <section class="pp__section">
                <h2 class="pp__heading">Headings <span class="pp__count">${headings.length}</span></h2>
                ${headingOutline(headings)}
            </section>
            <section class="pp__section">
                <h2 class="pp__heading">Structured data</h2>
                ${structuredData()}
            </section>
            <section class="pp__section">
                <h2 class="pp__heading">Tools</h2>
                ${tools()}
            </section>`;

        container.addEventListener('click', (event) => {
            const button = event.target.closest('[data-heading]');
            if (button) flash(headings[Number(button.getAttribute('data-heading'))]);
        });
    }
};
