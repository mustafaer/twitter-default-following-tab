'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_SETTINGS,
  normalizeSettings,
  loadSettings,
  saveSettings,
  normalizeTabNames,
} = require('../src/lib/settings.js');
const { createChromeStub } = require('./helpers/chrome-stub.js');

test('defaults open Following, sorted by Recent', () => {
  assert.deepEqual(DEFAULT_SETTINGS, { enabled: true, defaultTab: '1', followingTabSort: 'recent' });
  assert.deepEqual(normalizeSettings(undefined), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings({}), DEFAULT_SETTINGS);
});

test('keeps valid settings from v2.0 as they are', () => {
  const saved = { enabled: false, defaultTab: '3', followingTabSort: 'popular' };
  assert.deepEqual(normalizeSettings(saved), saved);
  assert.deepEqual(normalizeSettings({ followingTabSort: 'default' }).followingTabSort, 'default');
});

test('turns the v2.0 "Disabled" tab choice into the off switch', () => {
  assert.deepEqual(normalizeSettings({ enabled: true, defaultTab: 'disabled' }), {
    enabled: false,
    defaultTab: '1',
    followingTabSort: 'recent',
  });
});

test('replaces invalid values with defaults', () => {
  assert.deepEqual(
    normalizeSettings({ enabled: 'yes', defaultTab: '-1', followingTabSort: 'chronological' }),
    DEFAULT_SETTINGS,
  );
  assert.equal(normalizeSettings({ defaultTab: 'abc' }).defaultTab, '1');
  assert.equal(normalizeSettings({ defaultTab: '99' }).defaultTab, '1', 'beyond the highest position');
  assert.equal(normalizeSettings({ defaultTab: 2 }).defaultTab, '2', 'numbers are accepted');
  assert.equal(normalizeSettings({ defaultTab: '02' }).defaultTab, '2', 'leading zeros are dropped');
});

test('loadSettings reads only the extension keys and normalises them', async () => {
  const chrome = createChromeStub({ sync: { defaultTab: 'disabled', unrelated: 1 } });
  assert.deepEqual(await loadSettings(chrome.storage.sync), { ...DEFAULT_SETTINGS, enabled: false });
});

test('saveSettings always writes the complete, normalised object', async () => {
  const chrome = createChromeStub({ sync: { defaultTab: 'disabled' } });
  const saved = await saveSettings(chrome.storage.sync, { enabled: true, followingTabSort: 'nope' });
  assert.deepEqual(saved, DEFAULT_SETTINGS);
  assert.deepEqual(chrome.storage.sync.data, DEFAULT_SETTINGS, 'the legacy value is gone');
});

test('normalizeTabNames tidies what the content script stored', () => {
  assert.deepEqual(normalizeTabNames(['  For you ', 'Following', 42, 'A\n  list']), [
    'For you',
    'Following',
    '',
    'A list',
  ]);
  assert.deepEqual(normalizeTabNames('For you'), []);
  assert.equal(normalizeTabNames(['x'.repeat(500)])[0].length, 80);
  assert.equal(normalizeTabNames(Array.from({ length: 50 }, (_, i) => `Tab ${i}`)).length, 20);
});
