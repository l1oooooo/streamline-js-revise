// Home status line: design type, Streamline colours, compact skip-step glyph.
// Run: node --test test/home-skin-status.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(root, 'src/css/home-skin.css'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/modules/ui.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function rule(selector) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
    assert.ok(match, `missing rule ${selector}`);
    return match[1];
}

test('the status line uses the design type and keeps Streamline colours', () => {
    const status = rule('#main-page #machine-status');
    assert.match(status, /font-family:\s*inherit/);
    assert.match(status, /font-size:\s*14px/);
    assert.match(status, /line-height:\s*20px/);
    assert.match(status, /font-weight:\s*500/);
    assert.match(rule('#main-page #machine-status.is-link'), /font-weight:\s*400/);
    assert.match(rule('#main-page #machine-status.status-msg-green'), /color:\s*var\(--status-green-color\)/);
    assert.match(rule('#main-page #machine-status.status-msg-red'), /color:\s*var\(--status-red-color\)/);
    assert.match(rule('#main-page #machine-status.status-msg-clickable'), /color:\s*var\(--status-clickable-color\)/);
});

test('Connecting starts as a connection word and disconnected keeps that weight', () => {
    assert.match(html, /id="machine-status"[^>]*class="[^"]*\bis-link\b/);
    assert.match(ui, /classList\.toggle\('is-link', resolveStatusStateKey\(status, substate\) === 'disconnected'\)/);
});

test('the skip-step glyph is a 20px icon in a 32px hit area', () => {
    const hit = rule('#main-page #machine-status .header-icon-btn');
    assert.match(hit, /width:\s*32px/);
    assert.match(hit, /height:\s*32px/);
    assert.match(hit, /border:\s*0/);
    const glyph = rule('#main-page #machine-status .skip-step-glyph');
    assert.match(glyph, /width:\s*20px/);
    assert.match(glyph, /height:\s*20px/);
});

test('the alert chip colours are unchanged', () => {
    const light = rule('#main-page .skin-heat.is-alert');
    assert.match(light, /background:\s*#fef2f2/);
    assert.match(light, /color:\s*#b91c1c/);
    const dark = rule('[data-theme="dark"] #main-page .skin-heat.is-alert');
    assert.match(dark, /background:\s*#450a0a/);
    assert.match(dark, /color:\s*#fecaca/);
});
