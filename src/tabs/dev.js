// "Dev" tab: viewport/breakpoint, overlays, the site's components on the
// page (optional, see config.components -- with a with/without toggle per
// element) and basic performance numbers. The server HTML for the "without"
// view is fetched once, on first use.

import { ICONS, escapeHtml, describe, flash, outline, pill } from '../util.js';
import { getConfig } from '../config.js';

const BREAKPOINTS = [['xxl', 1400], ['xl', 1200], ['lg', 992], ['md', 768], ['sm', 576], ['xs', 0]];

let rawDocPromise = null;
const swapped = new Map(); // live element -> raw replacement

function breakpoint() {
    const width = window.innerWidth;
    return BREAKPOINTS.find(([, min]) => width >= min)[0];
}

function scanComponents(components) {
    const groups = new Map();
    document.querySelectorAll(components.selector).forEach((element) => {
        const name = components.nameOf(element);
        if (!name) return;
        if (!groups.has(name)) groups.set(name, []);
        groups.get(name).push(element);
    });
    return groups;
}

function loadRawDocument() {
    if (!rawDocPromise) {
        rawDocPromise = fetch(window.location.href, { credentials: 'same-origin' })
            .then((response) => response.text())
            .then((html) => new DOMParser().parseFromString(html, 'text/html'));
    }
    return rawDocPromise;
}

// Find the server-rendered counterpart of a live component: the n-th element
// of the same component in the raw HTML.
async function rawCounterpart(components, name, index) {
    const doc = await loadRawDocument();
    const candidates = Array.from(doc.querySelectorAll(components.rawSelector || '[class]'))
        .filter((el) => components.nameOf(el) === name);
    const raw = candidates[index];
    if (!raw) return null;

    const clone = document.importNode(raw, true);
    // Drop the component classes so neither the component CSS nor a rescan
    // touches the raw view.
    if (components.classPrefix) {
        [clone, ...clone.querySelectorAll('[class]')].forEach((el) => {
            Array.from(el.classList).filter((c) => components.classPrefix.test(c)).forEach((c) => el.classList.remove(c));
        });
    }
    clone.classList.add('pp-raw');
    return clone;
}

function setOutline(selector, on) {
    let style = document.querySelector('style[data-pagepilot="outline"]');
    if (on && !style) {
        style = document.createElement('style');
        style.setAttribute('data-pagepilot', 'outline');
        style.textContent = `${selector}{outline:2px dashed color-mix(in srgb, var(--pp-accent) 70%, transparent)!important;outline-offset:2px}`;
        document.head.appendChild(style);
    } else if (!on && style) {
        style.remove();
    }
}

// 12-column overlay measured from the page's own .container (no reliance on
// the site's grid classes). Re-measured on resize while it is visible.
function layoutGrid() {
    const grid = document.querySelector('.pp-grid');
    if (!grid) return;
    const host = Array.from(document.querySelectorAll(getConfig().grid.container))
        .find((el) => !el.closest('.pp, .pp-grid') && el.getBoundingClientRect().width > 0);
    const rect = host ? host.getBoundingClientRect() : { left: 0, width: window.innerWidth };
    const style = host ? getComputedStyle(host) : null;
    const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bs-gutter-x')) || 24;
    Object.assign(grid.style, {
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        paddingLeft: style ? style.paddingLeft : '12px',
        paddingRight: style ? style.paddingRight : '12px',
        columnGap: `${gutter}px`
    });
}

function showGrid() {
    if (document.querySelector('.pp-grid')) return;
    const grid = document.createElement('div');
    grid.className = 'pp-grid';
    const { columns } = getConfig().grid;
    grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    grid.innerHTML = '<span></span>'.repeat(columns);
    document.body.appendChild(grid);
    layoutGrid();
    window.addEventListener('resize', layoutGrid);
}

function hideGrid() {
    document.querySelector('.pp-grid')?.remove();
    window.removeEventListener('resize', layoutGrid);
}

function performanceInfo() {
    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const bytes = resources.reduce((sum, r) => sum + (r.transferSize || 0), nav?.transferSize || 0);
    const ms = (value) => (value ? `${Math.round(value)} ms` : '–');
    const rows = [
        ['TTFB', ms(nav && nav.responseStart - nav.requestStart)],
        ['DOM ready', ms(nav?.domContentLoadedEventEnd)],
        ['Load', ms(nav?.loadEventEnd)],
        ['Requests', String(resources.length + 1)],
        ['Transferred', bytes ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : '–'],
        ['DOM nodes', String(document.getElementsByTagName('*').length)]
    ];
    return rows.map(([label, value]) =>
        `<li class="pp__check"><span class="pp__check-label">${label}</span><span class="pp__value">${value}</span></li>`
    ).join('');
}

export default {
    id: 'dev',
    label: 'Dev',

    render(container) {
        const config = getConfig();
        const components = config.components;
        const label = components ? components.label : '';
        const groups = components ? scanComponents(components) : new Map();
        const elements = [];
        const componentRows = Array.from(groups.entries()).map(([name, list]) => {
            const errors = components.errorClass ? list.filter((el) => el.classList.contains(components.errorClass)).length : 0;
            const items = list.map((element, index) => {
                const id = elements.push({ element, name, index }) - 1;
                return `<li class="pp__mod-item" data-el="${id}">`
                    + `<button type="button" class="pp__mod-target" data-role="locate">${ICONS.target}<span>${escapeHtml(describe(element))}</span></button>`
                    + `<button type="button" class="pp__chip" data-role="raw">without ${escapeHtml(label)}</button></li>`;
            }).join('');
            return `<li class="pp__mod"><div class="pp__mod-head"><span>${escapeHtml(name)}</span>`
                + `${errors ? pill('error', `${errors} error`) : ''}<span class="pp__count">${list.length}×</span></div>`
                + `<ul>${items}</ul></li>`;
        }).join('');

        container.innerHTML = `
            <section class="pp__section">
                <h2 class="pp__heading">Viewport</h2>
                <div class="pp__viewport" data-role="viewport"></div>
            </section>
            <section class="pp__section pp__stack">
                ${components ? `<label class="pp__row">
                    <span class="pp__row-text"><span class="pp__row-title">Outline ${escapeHtml(label)} elements</span></span>
                    <input type="checkbox" class="pp__switch-input" data-role="outline">
                    <span class="pp__switch" aria-hidden="true"></span>
                </label>` : ''}
                <label class="pp__row">
                    <span class="pp__row-text"><span class="pp__row-title">Grid overlay</span><span class="pp__row-hint">${escapeHtml(config.grid.container)}, ${config.grid.columns} columns</span></span>
                    <input type="checkbox" class="pp__switch-input" data-role="grid">
                    <span class="pp__switch" aria-hidden="true"></span>
                </label>
            </section>
            ${components ? `<section class="pp__section">
                <h2 class="pp__heading">${escapeHtml(label)} on this page <span class="pp__count">${elements.length}</span></h2>
                ${componentRows ? `<ul class="pp__mods">${componentRows}</ul>` : `<p class="pp__note">No ${escapeHtml(label)} elements on this page.</p>`}
                <p class="pp__note" data-role="raw-note" hidden></p>
            </section>` : ''}
            <section class="pp__section">
                <h2 class="pp__heading">Performance</h2>
                <ul class="pp__checks">${performanceInfo()}</ul>
            </section>`;

        // Viewport readout -- updated on resize while this tab is rendered.
        const viewport = container.querySelector('[data-role="viewport"]');
        const updateViewport = () => {
            if (!viewport.isConnected) {
                window.removeEventListener('resize', updateViewport);
                return;
            }
            viewport.innerHTML = `<span class="pp__bp">${breakpoint()}</span>`
                + `<span>${window.innerWidth} × ${window.innerHeight}</span><span class="pp__count">DPR ${window.devicePixelRatio || 1}</span>`;
        };
        updateViewport();
        window.addEventListener('resize', updateViewport);

        container.querySelector('[data-role="outline"]')?.addEventListener('change', (event) => {
            setOutline(components.selector, event.target.checked);
        });

        container.querySelector('[data-role="grid"]').addEventListener('change', (event) => {
            if (event.target.checked) showGrid();
            else hideGrid();
        });

        // Component list: hover outlines, click locates, chip toggles the raw view.
        const list = container.querySelector('.pp__mods');
        if (!list) return;
        const note = container.querySelector('[data-role="raw-note"]');
        const entryOf = (target) => elements[Number(target.closest('[data-el]')?.getAttribute('data-el'))];
        const visibleNode = (entry) => swapped.get(entry.element) || entry.element;

        list.addEventListener('mouseover', (event) => {
            const entry = event.target.closest('[data-el]') && entryOf(event.target);
            outline(entry ? visibleNode(entry) : null);
        });
        list.addEventListener('mouseleave', () => outline(null));

        list.addEventListener('click', async (event) => {
            const entry = event.target.closest('[data-el]') && entryOf(event.target);
            if (!entry) return;

            if (event.target.closest('[data-role="locate"]')) {
                flash(visibleNode(entry));
                return;
            }

            const chip = event.target.closest('[data-role="raw"]');
            if (!chip) return;

            if (swapped.has(entry.element)) {
                swapped.get(entry.element).replaceWith(entry.element);
                swapped.delete(entry.element);
                chip.textContent = `without ${label}`;
                chip.classList.remove('is-active');
                flash(entry.element);
                return;
            }

            chip.textContent = 'loading…';
            try {
                const raw = await rawCounterpart(components, entry.name, entry.index);
                if (!raw) throw new Error('not found');
                entry.element.replaceWith(raw);
                swapped.set(entry.element, raw);
                chip.textContent = `with ${label}`;
                chip.classList.add('is-active');
                note.hidden = true;
                flash(raw);
            } catch (e) {
                chip.textContent = `without ${label}`;
                note.textContent = 'Could not find this element in the server HTML.';
                note.hidden = false;
            }
        });
    }
};
