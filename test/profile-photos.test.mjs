// Favourite photos are CSS backgrounds: profileManager rewrites button text,
// which would delete an <img> child. Run: node --test test/profile-photos.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(root, 'src/css/home-skin.css'), 'utf8');

test('each favourite slot maps to its own photo, WebP with a JPEG fallback', () => {
    for (let slot = 0; slot < 5; slot += 1) {
        const n = slot + 1;
        const block = css.split(`#main-page #fav-profile-btn-${slot}::after {`)[1]?.split('}')[0];
        assert.ok(block, `slot ${slot} has no ::after rule`);
        assert.match(block, new RegExp(`preview-${n}\\.jpg`));
        assert.match(block, new RegExp(`preview-${n}\\.webp`));
        assert.match(block, /image-set\(/);
        assert.doesNotMatch(block, new RegExp(`preview-${n === 1 ? 2 : 1}\\.`));
        for (const ext of ['webp', 'jpg']) {
            const file = path.join(root, 'src/ui/skin/profile', `preview-${n}.${ext}`);
            assert.ok(fs.statSync(file).size > 1000, `${file} missing or empty`);
        }
    }
});

test('an empty favourite does not paint a photo', () => {
    assert.match(css, /#main-page #fav-profile-btn-0:empty::after[\s\S]*background-image:\s*none/);
});

test('the open card fades and scales in over 240ms and closes over 160ms', () => {
    assert.match(css, /button\.skin-profile::after \{[\s\S]*opacity 160ms/);
    assert.match(css, /button\.skin-profile::after \{[\s\S]*transform: scale\(0\.98\)/);
    assert.match(css, /button\.skin-profile\.bg-\\\[var\\\(--mimoja-blue-v2\\\)\\\]::after \{[\s\S]*opacity 240ms/);
    assert.match(css, /button\.skin-profile\.bg-\\\[var\\\(--mimoja-blue-v2\\\)\\\]::after \{[\s\S]*min-height: 160px/);
});
