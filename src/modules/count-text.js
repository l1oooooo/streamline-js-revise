// Count-up used by the Home/Brewing figures. Port of decaid-custom-skin
// CountText: cubic-bezier solved with six Newton steps, 160ms ease-out for a
// live value or an integer step of 1 or less, otherwise 460ms ease-in-out.
// The final frame is the caller's exact text. DOM-free.

const easeOut = { x1: 0.32, y1: 0.72, x2: 0, y2: 1 };
const easeInOut = { x1: 0.77, y1: 0, x2: 0.175, y2: 1 };

export function ease(amount, curve) {
    const x = (u) => 3 * (1 - u) * (1 - u) * u * curve.x1 + 3 * (1 - u) * u * u * curve.x2 + u * u * u;
    const y = (u) => 3 * (1 - u) * (1 - u) * u * curve.y1 + 3 * (1 - u) * u * u * curve.y2 + u * u * u;
    const slope = (u) => 3 * (1 - u) * (1 - u) * curve.x1 + 6 * (1 - u) * u * (curve.x2 - curve.x1) + 3 * u * u * (1 - curve.x2);
    let u = amount;
    for (let i = 0; i < 6; i += 1) {
        const dx = slope(u);
        if (Math.abs(dx) < 1e-4) break;
        u = Math.min(1, Math.max(0, u - (x(u) - amount) / dx));
    }
    return y(u);
}

export function decimals(text) {
    const dot = String(text).indexOf('.');
    return dot === -1 ? 0 : String(text).length - dot - 1;
}

/** A leading number plus the unit that follows it. "30s" → 30, "s". "—" → null. */
export function splitNumeric(text) {
    const match = /^(-?\d+(?:\.\d+)?)(.*)$/.exec(String(text));
    if (!match) return null;
    const value = Number(match[1]);
    if (!Number.isFinite(value)) return null;
    return { value, digits: match[1], suffix: match[2] };
}

/**
 * How to move from the text on screen to the next text.
 * Null means show the next text immediately: reduced motion, a non-number,
 * or a unit change (the figure changed meaning, it did not count).
 * @param {boolean} [live] brew readouts and other streamed values use 160ms
 */
export function countMotion(startText, endText, { live = false, reduced = false } = {}) {
    if (reduced || startText === endText) return null;
    const start = splitNumeric(startText);
    const end = splitNumeric(endText);
    if (!start || !end || start.suffix !== end.suffix) return null;
    const places = Math.max(decimals(start.digits), decimals(end.digits));
    const span = Math.abs(end.value - start.value);
    const duration = live || (places === 0 && span <= 1) ? 160 : 460;
    return {
        duration,
        curve: duration === 460 ? easeInOut : easeOut,
        places,
        start: start.value,
        end: end.value,
        suffix: end.suffix,
    };
}

/** Frame text. progress >= 1 returns endText unchanged, suffix and all. */
export function countFrame(motion, progress, endText) {
    if (!motion || progress >= 1) return endText;
    const value = motion.start + (motion.end - motion.start) * ease(Math.min(1, Math.max(0, progress)), motion.curve);
    const body = motion.places ? value.toFixed(motion.places) : String(Math.round(value));
    return body + motion.suffix;
}

export function countTextIsEmpty(text) {
    return text === '—' || text === 'Off' || text === '-';
}

/** Figures that count. `live` ones always use the 160ms timing. */
export const COUNT_TEXT_TARGETS = [
    { id: 'grind-value', live: false },
    { id: 'dose-in-value', live: false },
    { id: 'drink-out-value', live: false },
    { id: 'temp-value', live: false },
    { id: 'steam-duration-value', live: false },
    { id: 'steam-flow-value', live: false },
    { id: 'flush-value', live: false },
    { id: 'hot-water-vol-value', live: false },
    { id: 'hot-water-temp-value', live: false },
    { id: 'data-mix-temp', live: false },
    { id: 'data-group-temp', live: false },
    { id: 'data-steam-temp', live: false },
    { id: 'data-tank-vol', live: false },
    { id: 'data-milk-temp', live: false },
    { id: 'data-cupwarmer-temp', live: false },
    { id: 'brew-readout-pressure', live: true },
    { id: 'brew-readout-flow', live: true },
    { id: 'brew-readout-temp', live: true },
    { id: 'brew-readout-weight', live: true },
    { id: 'brew-readout-time', live: true },
];
