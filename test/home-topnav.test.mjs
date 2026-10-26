// Shot data is the detail table inside Shot History, not a second topnav entry.
// Run: node --test test/home-topnav.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/modules/ui.js'), 'utf8');

const SHOT_DATA_IDS = [
    'shot-data-temp-header',
    'shot-data-pi-time', 'shot-data-pi-weight', 'shot-data-pi-volume',
    'shot-data-pi-temp', 'shot-data-pi-flow', 'shot-data-pi-pressure',
    'shot-data-ex-time', 'shot-data-ex-weight', 'shot-data-ex-volume',
    'shot-data-ex-temp', 'shot-data-ex-flow', 'shot-data-ex-pressure',
    'shot-data-total-time', 'shot-data-total-weight', 'shot-data-total-volume',
];

function elementSlice(source, id) {
    const open = source.search(new RegExp(`<div\\b[^>]*\\bid="${id}"[^>]*>`));
    assert.ok(open >= 0, `missing #${id}`);
    let depth = 0;
    const tag = /<\/?div\b[^>]*>/g;
    tag.lastIndex = open;
    let match;
    while ((match = tag.exec(source))) {
        depth += match[0].startsWith('</') ? -1 : 1;
        if (depth === 0) return source.slice(open, tag.lastIndex);
    }
    throw new Error(`#${id} never closes`);
}

test('Shot history is the only topnav entry and it contains the shot data table', () => {
    assert.doesNotMatch(html, /id="shot-data-open-btn"/);
    assert.doesNotMatch(ui, /shot-data-open-btn/);
    assert.match(html, /id="fullscreen-toggle-btn"/);
    const history = elementSlice(html, 'shot-history-panel');
    const data = elementSlice(history, 'shot-data-panel');
    assert.equal(data.match(/skin-overlay-close/g), null);
    assert.equal(history.match(/skin-overlay-close/g).length, 1);
    for (const id of SHOT_DATA_IDS) {
        assert.match(data, new RegExp(`id="${id}"`), id);
    }
    assert.match(data, /id="shot-header-pressure"/);
});
