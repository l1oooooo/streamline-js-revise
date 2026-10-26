import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    STEAM_HEATER_FALLBACK_C,
    STEAM_HEATER_ON_MIN_C,
    HEATER_REPORT_HOLD_MS,
    HEATER_BUSY_STATES,
    steamHeaterOn,
    heaterNeedsFallback,
    applyHeaterReport,
    beginHeaterToggle,
    finishHeaterToggle,
    heaterCardPresentation,
} from '../src/modules/steam-heater-view.js';

const unknown = { status: 'unknown' };

test('135 °C and above is on, including the eco park temperature', () => {
    assert.equal(steamHeaterOn(134), false);
    assert.equal(steamHeaterOn(0), false);
    assert.equal(steamHeaterOn(STEAM_HEATER_ON_MIN_C), true);
    assert.equal(steamHeaterOn(136), true);
    assert.equal(steamHeaterOn(Number.NaN), false);
    assert.equal(STEAM_HEATER_FALLBACK_C, 150);
});

test('a temperature report moves unknown to on or off, and a pending write ignores it', () => {
    const on = applyHeaterReport(unknown, 150, 0);
    assert.deepEqual(on, { status: 'on', shownOn: true });
    const off = applyHeaterReport(on, 0, 1);
    assert.equal(off.status, 'off');
    const pending = beginHeaterToggle(on);
    assert.equal(applyHeaterReport(pending, 0, 2), pending);
    assert.equal(applyHeaterReport(unknown, undefined, 0), unknown);
});

test('the switch can be moved from on or off, not while unknown or pending', () => {
    const on = { status: 'on', shownOn: true };
    const pending = beginHeaterToggle(on);
    assert.equal(pending.shownOn, false);
    assert.equal(pending.revertTo, 'on');
    assert.equal(beginHeaterToggle(pending), null);
    assert.equal(beginHeaterToggle(unknown), null);
    const backOn = beginHeaterToggle({ status: 'off', shownOn: false });
    assert.equal(backOn.shownOn, true);
});

test('a failed write restores the previous side; a success holds against a stale frame', () => {
    const pending = beginHeaterToggle({ status: 'on', shownOn: true });
    const reverted = finishHeaterToggle(pending, false, null, 1000);
    assert.deepEqual(reverted, { status: 'on', shownOn: true });

    const enabled = finishHeaterToggle(beginHeaterToggle({ status: 'off', shownOn: false }), true, 150, 1000);
    assert.equal(enabled.status, 'on');
    assert.equal(enabled.holdUntil, 1000 + HEATER_REPORT_HOLD_MS);
    assert.equal(applyHeaterReport(enabled, 0, 1000 + 500), enabled);
    const agreed = applyHeaterReport(enabled, 150, 1000 + 500);
    assert.equal(agreed.status, 'on');
    assert.equal(agreed.holdUntil, undefined);
});

test('card presentation: off blocks the steppers, busy only disables the switch', () => {
    const off = heaterCardPresentation({ status: 'off', shownOn: false }, false);
    assert.equal(off.showOff, true);
    assert.equal(off.blockControls, true);
    assert.equal(off.switchOn, false);
    assert.equal(off.switchDisabled, false);

    const busyOn = heaterCardPresentation({ status: 'on', shownOn: true }, true);
    assert.equal(busyOn.switchDisabled, true);
    assert.equal(busyOn.blockControls, false);
    assert.equal(busyOn.switchOn, true);

    const pendingOff = heaterCardPresentation({ status: 'pending', shownOn: false, revertTo: 'on' }, false);
    assert.equal(pendingOff.showOff, true);
    assert.equal(pendingOff.switchBusy, true);
    assert.equal(pendingOff.switchDisabled, true);
    assert.equal(pendingOff.blockControls, true);

    const unknownCard = heaterCardPresentation({ status: 'unknown' }, false);
    assert.equal(unknownCard.switchDisabled, true);
    assert.equal(unknownCard.showOff, false);
    assert.equal(unknownCard.blockControls, false);

    assert.deepEqual(HEATER_BUSY_STATES, ['espresso', 'steam', 'flush', 'hotWater']);
});

test('enabling that leaves the heater off needs the 150 °C fallback', () => {
    assert.equal(heaterNeedsFallback(0), true);
    assert.equal(heaterNeedsFallback(undefined), true);
    assert.equal(heaterNeedsFallback(150), false);
    assert.equal(heaterNeedsFallback(136), false);
});
