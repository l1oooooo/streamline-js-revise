// Home steam-card view of the steam heater. The heater is workflow
// steamSettings.targetTemperature: below 135 °C is off (the same floor
// Settings > Calibration > Steam and Decaid use). Duration 0 is a different
// setting — no timer — and never comes through here.
//
// DOM-free so node:test can import it. ui.js paints the result.

/** Lowest target that means the heater is on. */
export const STEAM_HEATER_ON_MIN_C = 135;

/** Settings uses 150 °C when the heater is switched on with nothing remembered. */
export const STEAM_HEATER_FALLBACK_C = 150;

/** Ignore a disagreeing temperature report for this long after our own write. */
export const HEATER_REPORT_HOLD_MS = 3000;

/** Machine states where the switch is disabled. The card's other controls stay as they are. */
export const HEATER_BUSY_STATES = ['espresso', 'steam', 'flush', 'hotWater'];

export function steamHeaterOn(tempC) {
    return typeof tempC === 'number' && Number.isFinite(tempC) && tempC >= STEAM_HEATER_ON_MIN_C;
}

/** True when enabling did not leave the heater on, so the 150 °C fallback is needed. */
export function heaterNeedsFallback(tempC) {
    return !steamHeaterOn(tempC);
}

/**
 * Fold one temperature report into the card.
 * Pending writes ignore reports. For HEATER_REPORT_HOLD_MS after a write,
 * a report on the opposite side of on/off is ignored (a frame that left the
 * machine before the write).
 * @param {{status:string, shownOn?:boolean, holdUntil?:number, holdTemp?:number}} view
 * @param {number|undefined} tempC
 * @param {number} now
 */
export function applyHeaterReport(view, tempC, now) {
    if (!view || view.status === 'pending') return view;
    if (typeof tempC !== 'number' || !Number.isFinite(tempC)) return view;
    if (view.holdUntil && now < view.holdUntil && steamHeaterOn(tempC) !== steamHeaterOn(view.holdTemp)) {
        return view;
    }
    const on = steamHeaterOn(tempC);
    const status = on ? 'on' : 'off';
    if (view.status === status && view.shownOn === on && !view.holdUntil) return view;
    return { status, shownOn: on };
}

/** @returns {object|null} pending view, or null when the switch cannot be moved */
export function beginHeaterToggle(view) {
    if (!view || view.status === 'pending' || view.status === 'unknown') return null;
    const wantOn = view.status !== 'on';
    return { status: 'pending', shownOn: wantOn, revertTo: view.status === 'on' ? 'on' : 'off' };
}

export function finishHeaterToggle(view, ok, tempC, now) {
    if (!ok) {
        const on = view?.revertTo === 'on';
        return { status: on ? 'on' : 'off', shownOn: on };
    }
    const on = steamHeaterOn(tempC);
    return {
        status: on ? 'on' : 'off',
        shownOn: on,
        holdUntil: now + HEATER_REPORT_HOLD_MS,
        holdTemp: tempC,
    };
}

/**
 * @param {object} view
 * @param {boolean} machineBusy
 */
export function heaterCardPresentation(view, machineBusy) {
    const status = view?.status ?? 'unknown';
    const showOff = status === 'off' || (status === 'pending' && view.shownOn === false);
    const switchOn = status === 'on' || (status === 'pending' && view.shownOn === true);
    return {
        showOff,
        switchOn,
        switchDisabled: status === 'unknown' || status === 'pending' || !!machineBusy,
        switchBusy: status === 'pending',
        blockControls: showOff,
    };
}
