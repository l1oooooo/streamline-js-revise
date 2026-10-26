import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ease, decimals, countMotion, countFrame, countTextIsEmpty, COUNT_TEXT_TARGETS } from '../src/modules/count-text.js';

const easeOut = { x1: 0.32, y1: 0.72, x2: 0, y2: 1 };
const easeInOut = { x1: 0.77, y1: 0, x2: 0.175, y2: 1 };

test('easing stays inside 0..1 and ease-out is ahead at the midpoint', () => {
    assert.ok(Math.abs(ease(0, easeOut)) < 1e-6);
    assert.ok(Math.abs(ease(1, easeOut) - 1) < 1e-3);
    assert.ok(Math.abs(ease(1, easeInOut) - 1) < 1e-3);
    assert.ok(ease(0.5, easeOut) > 0.5);
    for (const t of [0.2, 0.4, 0.6, 0.8]) {
        const value = ease(t, easeInOut);
        assert.ok(value >= 0 && value <= 1, `ease(${t}) = ${value}`);
    }
});

test('decimals count the digits after the dot', () => {
    assert.equal(decimals('30'), 0);
    assert.equal(decimals('1.50'), 2);
    assert.equal(decimals('9'), 0);
});

test('duration follows the design: 160ms for live or a short integer step, else 460ms', () => {
    assert.equal(countMotion('30', '31').duration, 160);
    assert.deepEqual(countMotion('30', '31').curve, easeOut);
    assert.equal(countMotion('15', '45').duration, 460);
    assert.deepEqual(countMotion('15', '45').curve, easeInOut);
    assert.equal(countMotion('1.0', '1.1').duration, 460);
    assert.equal(countMotion('1.0', '9.4', { live: true }).duration, 160);
    assert.equal(countMotion('30s', '31s').duration, 160);
    assert.equal(countMotion('18g', '19.5g').duration, 460);
});

test('non-numbers, reduced motion, and a unit change do not animate', () => {
    assert.equal(countMotion('—', '9.0', { live: true }), null);
    assert.equal(countMotion('Off', '30'), null);
    assert.equal(countMotion('∞', '30s'), null);
    assert.equal(countMotion('30s', '60°c'), null);
    assert.equal(countMotion('1.0', '2.0', { reduced: true }), null);
    assert.equal(countMotion('1.0', '1.0'), null);
});

test('the last frame is the exact end text and the unit stays put', () => {
    const motion = countMotion('18g', '36g');
    assert.equal(countFrame(motion, 0, '36g'), '18g');
    assert.equal(countFrame(motion, 1, '36g'), '36g');
    assert.match(countFrame(motion, 0.5, '36g'), /^\d+g$/);
    const live = countMotion('9.0', '9.4', { live: true });
    assert.equal(countFrame(live, 1, '9.4'), '9.4');
    assert.equal(decimals(countFrame(live, 0.25, '9.4').split('g')[0]), 1);
});

test('brew readouts are the live targets and the clock is not counted', () => {
    for (const id of ['brew-readout-pressure', 'brew-readout-flow', 'brew-readout-temp', 'brew-readout-weight', 'brew-readout-time']) {
        assert.equal(COUNT_TEXT_TARGETS.find(target => target.id === id)?.live, true, id);
    }
    assert.equal(COUNT_TEXT_TARGETS.some(target => target.id === 'data-clock'), false);
    assert.equal(COUNT_TEXT_TARGETS.find(target => target.id === 'dose-in-value').live, false);
    assert.equal(countTextIsEmpty('—'), true);
    assert.equal(countTextIsEmpty('Off'), true);
    assert.equal(countTextIsEmpty('18g'), false);
});
