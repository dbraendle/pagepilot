# Pagepilot

A small, draggable on-page toolbar for the people who edit a website. It shows
up only for editors and gives them the things they keep looking for:

- **Language versions** – every `hreflang` alternate as a tile, current page
  marked, missing versions dashed, x-default labelled.
- **Instant language switch** – opt-in, one hour: prefetches all language
  versions of each page via Speculation Rules (Chrome/Edge), with a "refresh
  preloads" button for after editing.
- **Environment switch** – the same page on Live / Stage / Local.
- **Hide elements for yourself** – e.g. a chat widget, per editor, via cookie.
- **SEO** – title/description lengths, canonical, robots, Google and social
  previews, heading outline (skipped levels marked), JSON-LD viewer.
- **Checks** (on click) – gentle internal link check (404s, redirects, broken
  anchors) and image check (missing alt, oversized, heavy files).
- **Dev** – breakpoint readout, grid overlay measured from your container,
  optional component inspector with a per-element "without JS enhancement"
  view, timings.

Three sizes: a small circle → a compact language bar → the full panel with
tabs. Position and view are remembered; `Alt+B` toggles it.

Regular visitors load only the tiny entry module. The panel itself is a
separate module that is fetched once activation succeeds.

## Install

No build step, no dependencies. Install straight from GitHub, pinned to a tag:

```sh
npm install github:dbraendle/pagepilot#v0.2.0
```

or load it as a plain ES module:

```html
<script type="module">
  import { init } from '/path/to/pagepilot/src/index.js';
  init({ activation: { selector: '#cms-editor-marker' } });
</script>
```

With a bundler (webpack, Vite, …) the panel becomes its own lazy chunk.

## Configuration

Everything site-specific lives in the config you pass to `init()` – the
package itself knows nothing about your CMS, domains or brand. Every option
is optional.

### Pick what you need

```js
init({
  tabs: ['page', 'seo', 'checks', 'dev'], // which tabs, in which order
  languages: true,      // language tiles, compact language bar, instant switch
  prefetch: true,       // instant language switch (needs languages)
  environments: [],     // empty: no environment switch
  hideables: [],        // empty: no "hide for me" toggles
  noCacheParam: null,   // null: no "Uncached" button
  components: null      // null: no component inspector in the Dev tab
});
```

For a single-language site use `languages: false`: the circle then opens the
full panel directly and the SEO check skips hreflang. Hideables, environments
and actions live in the Page tab, so keep `'page'` in `tabs` if you use them.

Works with any CMS or none: activate the panel with a selector your CMS
renders only for logged-in editors, a function (e.g. checking an admin
cookie), or `'always'` on staging.

### All options

```js
import { init } from 'pagepilot';

init({
  title: 'Editor',
  logo: '<svg viewBox="0 0 24 24">…</svg>',   // coloured with the accent
  accent: '#e60000',
  accentSoft: '#ff4d4d',

  // Keep stable – changing it resets every editor's settings.
  storagePrefix: 'mysite_editor',

  // When does the panel appear? An element your CMS renders only for
  // logged-in editors, 'always', or a function returning true/false.
  activation: { selector: '#cms-editor-marker', timeout: 4000 },
  replaceSelector: '#cms-editor-marker',      // hidden while the panel is active
  ignoreSelectors: ['#chat-widget'],          // skipped by checks and outlines

  // Language tiles, in this order. Without markets, tiles come straight from
  // the page's hreflang links.
  markets: [
    { key: 'de-de', label: 'Deutsch', name: 'Germany · Deutsch' },
    { key: 'uk-en', label: 'English (UK)', name: 'United Kingdom · English' }
  ],
  // url -> market key (default: first path segment).
  marketFromUrl: (url) => url.pathname.split('/')[1],

  environments: [[
    { label: 'Live', host: 'www.example.com' },
    { label: 'Stage', host: 'stage.example.com' },
    { label: 'Local', host: 'example.test' }
  ]],

  hideables: [
    { id: 'chat', label: 'Hide chat widget', selector: '#chat-widget', icon: 'chat' }
  ],

  noCacheParam: 'no_cache',          // adds an "Uncached" reload button
  contentIdPattern: /^c\d+$/,        // labels content elements (TYPO3: c123)

  // Optional component inspector in the Dev tab.
  components: {
    label: 'Widgets',
    selector: '[data-widget-ready]',  // enhanced elements on the live page
    rawSelector: '[data-widget]',     // candidates in the server HTML
    nameOf: (el) => el.dataset.widget,
    classPrefix: /^widget-/,          // stripped for the "without" view
    errorClass: 'widget-error'
  },

  tabs: ['page', 'seo', 'checks', 'dev'],
  languages: true,
  grid: { container: '.container', columns: 12 },
  shortcut: 'KeyB',                  // Alt + this key
  prefetch: true,
  linkCheck: { maxUrls: 100, concurrency: 2, pauseMs: 250 },
  handoffHash: '#pagepilot'
});
```

### Several domains

Settings live per domain. When an editor follows a link from the panel to
another domain (a language on a separate domain, another environment), the
link carries editor mode and the current settings in the hash. The target
domain adopts them, removes the hash, and shows the panel for 30 days even
without the activation marker (there is a "Turn off" button). The panel only
shows public page data.

### Instant language switch

Uses the Speculation Rules API, so it works in Chrome and Edge with "Preload
pages" enabled. It prefetches HTML only (no prerender), so no page scripts or
tracking run. Speculation Rules prefetch is used instead of
`<link rel="prefetch">` because CMS pages are often sent with
`Cache-Control: no-store`.

## Demo

```sh
python3 -m http.server 8000
# open http://localhost:8000/demo/          (multilingual, all tabs)
# open http://localhost:8000/demo/single.html (single language, SEO + Checks)
```

## License

MIT
