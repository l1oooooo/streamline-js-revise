import { loadStyle } from './vendor-loader.js';
import { setupPressAndHold } from './ui.js';

const HIDE_KEY = 'streamlineHelpHidden';
const LAUNCH_KEY = 'streamlineHelpLaunches';

export function isInWebView() {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isStandalone = window.navigator.standalone === true;
    return (/Android/.test(ua) && /wv/.test(ua))
        || (isIOS && !isStandalone && !/Safari\//.test(ua))
        || ua.includes('Decent')
        || Boolean(window.__DECENT_HOST__);
}

function onHomePage() {
    const host = document.getElementById('subpage-host');
    return !host || host.style.display === 'none' || !host.children.length;
}

export function syncHelpButton() {
    const button = document.getElementById('help-overlay-btn');
    if (!button || !isInWebView() || button.style.display === 'none') return;
    if (!onHomePage()) {
        button.classList.remove('help-btn--webview');
        Object.assign(button.style, { top: '', left: '', right: '', bottom: '', width: '', height: '' });
        return;
    }
    const fullscreen = document.querySelector('#main-page #fullscreen-toggle-btn');
    const rect = fullscreen?.getBoundingClientRect();
    if (!rect?.width) return;
    button.classList.add('help-btn--webview');
    Object.assign(button.style, {
        top: `${rect.top}px`, left: `${rect.left}px`, right: 'auto', bottom: 'auto',
        width: `${rect.width}px`, height: `${rect.height}px`
    });
}

// Hidden unless the user has explicitly turned the button on ('0' from the
// settings switch). '1' (long-press or the switch) and a missing value both
// hide it, so a fresh install does not show the button. `launches` is unused
// here; the counter is still written so an older build sharing this KV store
// keeps its own launch-count behaviour.
export function helpHiddenFrom(preference, launches) {
    void launches;
    return preference !== '0';
}

function helpHidden() {
    return helpHiddenFrom(localStorage.getItem(HIDE_KEY), localStorage.getItem(LAUNCH_KEY));
}

let helpAnchoringReady = false;

// WebView: park the help button on the fullscreen slot and keep it there across
// resizes and page changes. Safe to call again; the listeners are added once,
// including when the button is turned on mid-session.
export function ensureHelpAnchoring() {
    if (helpAnchoringReady || !isInWebView()) return;
    helpAnchoringReady = true;
    document.documentElement.classList.add('help-webview');
    const sync = () => requestAnimationFrame(syncHelpButton);
    sync();
    window.addEventListener('resize', sync);
    document.addEventListener('streamline:scaleupdate', sync);
    const observer = new MutationObserver(sync);
    const host = document.getElementById('subpage-host');
    const main = document.getElementById('main-page');
    if (host) observer.observe(host, { childList: true, attributes: true, attributeFilter: ['style'] });
    if (main) observer.observe(main, { attributes: true, attributeFilter: ['style'] });
}

export function initHelpLauncher() {
    if (document.getElementById('help-overlay-btn')) return;
    localStorage.setItem(LAUNCH_KEY, String((parseInt(localStorage.getItem(LAUNCH_KEY), 10) || 0) + 1));
    const button = document.createElement('button');
    button.id = 'help-overlay-btn';
    button.type = 'button';
    button.setAttribute('aria-label', 'Show help for this screen');
    button.setAttribute('aria-pressed', 'false');
    button.title = 'Help (long-press to hide)';
    button.textContent = '?';
    if (helpHidden()) button.style.display = 'none';
    document.body.appendChild(button);
    loadStyle('src/css/help-overlay.css').catch(() => {});

    if (!helpHidden()) ensureHelpAnchoring();

    let helpModule = null;
    const activate = async () => {
        try {
            helpModule ||= await import('./helpOverlay.js');
            helpModule.initializeHelpOverlay(button);
            helpModule.toggleHelpOverlay();
        } catch {}
    };
    const setHidden = hidden => {
        localStorage.setItem(HIDE_KEY, hidden ? '1' : '0');
        button.style.display = hidden ? 'none' : '';
        document.documentElement.classList.toggle('help-webview', !hidden && isInWebView());
        if (!hidden) {
            ensureHelpAnchoring();
            syncHelpButton();
        }
    };
    setupPressAndHold(button, activate, () => setHidden(true));

    window.showHelpButton = () => setHidden(false);
    window.hideHelpButton = () => setHidden(true);
    window.isHelpButtonHidden = helpHidden;
}
