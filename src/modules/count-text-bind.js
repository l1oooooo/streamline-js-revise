// Paints the count-up on top of the real figure. The real node's text stays
// exactly what the rest of the app reads back; only an aria-hidden copy moves.
import { COUNT_TEXT_TARGETS, countFrame, countMotion, countTextIsEmpty } from './count-text.js';

const items = new Set();
let raf = 0;
let bound = false;

function syncEmpty(item, text) {
    const empty = countTextIsEmpty(text);
    item.el.classList.toggle('is-empty', empty);
    item.face.classList.toggle('is-empty', empty);
}

function copyClasses(item) {
    item.face.className = item.el.className;
    item.face.classList.remove('skin-count-real');
    item.face.classList.add('skin-count-face');
    item.face.setAttribute('aria-hidden', 'true');
}

function ensureLoop() {
    if (raf || items.size === 0) return;
    let running = false;
    const tick = (now) => {
        raf = 0;
        running = false;
        for (const item of items) {
            if (!item.motion) continue;
            const progress = Math.min(1, (now - item.started) / item.motion.duration);
            const text = countFrame(item.motion, progress, item.endText);
            item.face.textContent = text;
            syncEmpty(item, text);
            if (progress >= 1) item.motion = null;
            else running = true;
        }
        if (running) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
}

function refresh(item) {
    if (item.updating) return;
    item.updating = true;
    try {
        copyClasses(item);
        item.face.style.visibility = item.el.style.visibility === 'hidden' ? 'hidden' : '';
        const endText = item.el.textContent ?? '';
        if (!item.seen) {
            item.seen = true;
            item.lastCanonical = endText;
            item.face.textContent = endText;
            syncEmpty(item, endText);
            return;
        }
        if (endText === item.lastCanonical) {
            syncEmpty(item, item.face.textContent);
            return;
        }
        const startText = item.face.textContent;
        item.lastCanonical = endText;
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
        const motion = countMotion(startText, endText, { live: item.live, reduced });
        if (!motion) {
            item.motion = null;
            item.face.textContent = endText;
            syncEmpty(item, endText);
            return;
        }
        item.motion = motion;
        item.endText = endText;
        item.started = performance.now();
        ensureLoop();
    } finally {
        item.updating = false;
    }
}

function snap(item) {
    item.motion = null;
    const text = item.el.textContent ?? '';
    item.lastCanonical = text;
    item.face.textContent = text;
    syncEmpty(item, text);
}

/** Stop in-flight counts. `liveOnly` is the brewing-ended path; otherwise everything stops. */
export function stopCountTexts({ liveOnly = false } = {}) {
    for (const item of items) {
        if (item.motion && (!liveOnly || item.live)) snap(item);
    }
    if (![...items].some(item => item.motion) && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
    }
}

function wrap(el, live) {
    if (el.dataset.countBound) return;
    el.dataset.countBound = '1';
    const face = document.createElement(el.tagName.toLowerCase());
    face.setAttribute('aria-hidden', 'true');
    const host = document.createElement('span');
    host.className = 'skin-count';
    el.parentNode.insertBefore(host, el);
    host.appendChild(el);
    host.appendChild(face);
    el.classList.add('skin-count-real');
    const item = { el, face, live, seen: false, motion: null, lastCanonical: null, updating: false, endText: '' };
    items.add(item);
    copyClasses(item);
    const observer = new MutationObserver(() => refresh(item));
    observer.observe(el, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    refresh(item);
}

/** Idempotent. Safe to call again after initUI re-enters. */
export function bindCountTexts(targets = COUNT_TEXT_TARGETS) {
    for (const target of targets) {
        const el = document.getElementById(target.id);
        if (el) wrap(el, target.live === true);
    }
    if (bound) return;
    bound = true;
    document.addEventListener('streamline:mainpagehidden', () => stopCountTexts());
}
