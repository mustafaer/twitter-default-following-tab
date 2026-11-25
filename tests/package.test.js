'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { validate } = require('../scripts/validate.js');
const { SRC } = require('./helpers/chrome-stub.js');

test('src/ passes every packaging check', () => {
  assert.deepEqual(validate(SRC), []);
});

test('the manifest asks for storage only and runs on X alone', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8'));
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.background, undefined, 'no background script');
  assert.deepEqual(manifest.content_scripts[0].matches, ['https://x.com/*', 'https://twitter.com/*']);
  assert.equal(manifest.content_scripts[0].run_at, 'document_start');
});

test('the validator catches the mistakes it is meant to catch', () => {
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'tdft-validate-'));
  try {
    fs.cpSync(SRC, copy, { recursive: true });
    const manifestPath = path.join(copy, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.permissions.push('tabs');
    manifest.content_scripts[0].js.push('missing.js');
    manifest.icons['48'] = 'icons/icon16.png';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    fs.writeFileSync(
      path.join(copy, 'popup.html'),
      fs.readFileSync(path.join(copy, 'popup.html'), 'utf8').replace(
        '</head>',
        '<link rel="stylesheet" href="https://fonts.example.com/font.css"></head>',
      ),
    );
    const tr = JSON.parse(fs.readFileSync(path.join(copy, '_locales/tr/messages.json'), 'utf8'));
    delete tr.sortLabel;
    fs.writeFileSync(path.join(copy, '_locales/tr/messages.json'), JSON.stringify(tr));

    const problems = validate(copy).join('\n');
    assert.match(problems, /unexpected permissions tabs/);
    assert.match(problems, /missing file missing\.js/);
    assert.match(problems, /icons\/icon16\.png should be a 48x48 PNG/);
    assert.match(problems, /must not load anything from the network/);
    assert.match(problems, /_locales\/tr is missing sortLabel/);
  } finally {
    fs.rmSync(copy, { recursive: true, force: true });
  }
});
