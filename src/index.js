// Pagepilot entry. Tiny on purpose: it ships to every visitor of the host
// site. It applies the editor's early preferences, decides whether the panel
// should appear, and only then loads the panel itself (a separate module /
// chunk), so regular visitors download nothing more.

import {
    setConfig, getConfig, hideClass, isHidden, PANEL_ACTIVE_CLASS,
    editorFlagUntil, setEditorFlag, applyHandoff
} from './config.js';

let started = false;

function injectEarlyStyles(config) {
    const rules = config.hideables
        .filter((h) => h.selector)
        .map((h) => `html.${hideClass(h.id)} ${h.selector}{display:none!important}`);
    if (config.replaceSelector) {
        rules.push(`html.${PANEL_ACTIVE_CLASS} ${config.replaceSelector}{display:none!important}`);
    }
    if (!rules.length) return;
    const style = document.createElement('style');
    style.setAttribute('data-pagepilot', 'early');
    style.textContent = rules.join('\n');
    document.head.appendChild(style);
}

function applyHides(on) {
    getConfig().hideables.forEach((h) => {
        document.documentElement.classList.toggle(hideClass(h.id), on && isHidden(h.id));
    });
}

function loadPanel() {
    if (started) return;
    started = true;
    import(/* webpackChunkName: "pagepilot" */ './panel.js')
        .then((module) => module.default.create())
        .catch((error) => console.error('Pagepilot: failed to load the panel', error));
}

// Not an editor after all: drop the early hides, so a stale cookie never
// hides anything from a regular visitor.
function giveUp() {
    if (!started) applyHides(false);
}

function waitForSelector(selector, timeout) {
    if (document.querySelector(selector)) {
        loadPanel();
        return;
    }
    const observer = new MutationObserver(() => {
        if (document.querySelector(selector)) {
            observer.disconnect();
            loadPanel();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
        observer.disconnect();
        giveUp();
    }, timeout);
}

function consumeHandoff(config) {
    const hash = window.location.hash;
    const marker = config.handoffHash;
    if (hash !== marker && !hash.startsWith(`${marker}=`)) return;
    setEditorFlag(true);
    const payload = hash.slice(marker.length + 1);
    if (payload) applyHandoff(payload);
    history.replaceState(history.state, '', window.location.pathname + window.location.search);
}

export function init(userConfig = {}) {
    const config = setConfig(userConfig);
    injectEarlyStyles(config);
    consumeHandoff(config);
    // Apply the editor's hide preferences as early as possible to avoid a flash.
    applyHides(true);

    if (editorFlagUntil()) {
        loadPanel();
        return;
    }

    const { activation } = config;
    if (activation === 'always') {
        loadPanel();
    } else if (typeof activation === 'function') {
        Promise.resolve()
            .then(() => activation())
            .then((ok) => (ok ? loadPanel() : giveUp()))
            .catch(giveUp);
    } else if (activation && activation.selector) {
        waitForSelector(activation.selector, activation.timeout);
    } else {
        giveUp();
    }
}

export default { init };
