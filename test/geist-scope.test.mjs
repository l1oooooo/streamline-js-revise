// Geist is for Home/Brewing and the expanded chart only. Everything else stays
// on Inter. Run: node --test test/geist-scope.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'fonts') continue;
            walk(full, out);
        } else if (/\.(js|css|html)$/.test(entry.name)) out.push(full);
    }
    return out;
}

function selectorsUsingGeist(css) {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const found = [];
    for (const match of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (match[2].includes('Geist')) found.push(match[1].trim());
    }
    return found;
}

test('every Geist rule in the skin stylesheet is Home/Brewing or the expanded chart', () => {
    const selectors = selectorsUsingGeist(fs.readFileSync(path.join(root, 'src/css/home-skin.css'), 'utf8'));
    assert.ok(selectors.length >= 2, 'expected the skin and the expanded chart');
    for (const selector of selectors) {
        assert.match(selector, /#main-page|#expanded-chart-overlay/, selector);
    }
});

test('the chart applies Geist on the main chart and the expanded chart only', () => {
    const src = fs.readFileSync(path.join(root, 'src/modules/chart.js'), 'utf8');
    const expandedAt = src.indexOf('function renderExpandedCharts');
    assert.ok(expandedAt > 0);
    const calls = (text) => text.split('\n').filter(line => line.includes('withSkinChartFont(') && !line.includes('function withSkinChartFont'));
    const before = calls(src.slice(0, expandedAt));
    const after = calls(src.slice(expandedAt));
    assert.deepEqual(before.map(line => line.trim()), [
        'const paintLayout = isMainChartActive() ? withSkinChartFont(layout) : layout;',
    ]);
    assert.equal(after.length, 1);
    assert.match(after[0], /withSkinChartFont\(layout\)/);
});

test('no other app source sets a Geist font', () => {
    const allowed = new Set([
        'src/css/home-skin.css',
        'src/css/fonts-geist.css',
        'src/modules/chart.js',
    ]);
    for (const file of walk(path.join(root, 'src'))) {
        const rel = path.relative(root, file);
        if (allowed.has(rel)) continue;
        const text = fs.readFileSync(file, 'utf8');
        assert.equal(text.includes('Geist'), false, rel);
    }
    const faces = fs.readFileSync(path.join(root, 'src/css/fonts-geist.css'), 'utf8');
    assert.match(faces, /@font-face/);
    assert.doesNotMatch(faces, /^\s*(body|html|#|\.)/m);
});
