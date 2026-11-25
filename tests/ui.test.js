'use strict';

const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const { createChromeStub, runScripts, SRC } = require('./helpers/chrome-stub.js');
const { until } = require('./helpers/fake-x.js');

const windows = [];
afterEach(() => {
  while (windows.length) {
    windows.pop().close();
  }
});

/** Opens popup.html or options.html with the given storage contents. */
async function openPage(page, chromeOptions = {}) {
  const html = fs.readFileSync(path.join(SRC, page), 'utf8');
  const dom = new JSDOM(html, { url: `https://extension.test/${page}`, runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  windows.push(window);
  const chrome = createChromeStub(chromeOptions);
  window.chrome = chrome;
  window.close = () => {
    window.closedByScript = true;
  };
  runScripts(window, ['lib/settings.js', 'ui/settings-ui.js', page.replace('.html', '.js')]);
  const $ = (selector) => window.document.querySelector(selector);
  await until(() => $('#defaultTabSelect').options.length > 0, 1000, 'the settings to render');
  return { window, chrome, $ };
}

function change(window, element, value) {
  if (element.type === 'checkbox') {
    element.checked = value;
  } else {
    element.value = value;
  }
  element.dispatchEvent(new window.Event('change', { bubbles: true }));
}

const optionLabels = (select) => Array.from(select.options, (option) => option.textContent);

test('popup shows the saved settings with the tab names seen on X', async () => {
  const { $ } = await openPage('popup.html', {
    sync: { enabled: true, defaultTab: '2', followingTabSort: 'popular' },
    local: { homeTabNames: ['For you', 'Following', 'Build in Public'] },
  });

  assert.deepEqual(optionLabels($('#defaultTabSelect')), ['1. For you', '2. Following', '3. Build in Public']);
  assert.equal($('#defaultTabSelect').value, '2');
  assert.equal($('#enabledToggle').checked, true);
  assert.equal($('#sortOrderSelect').value, 'popular');
  assert.equal($('#sortOrderSelect').disabled, true, 'sorting only applies to Following');
  assert.equal($('#sortHint').hidden, false);
  assert.equal($('#tabsHint').hidden, true);
  assert.match($('#version').textContent, /^Version \d+\.\d+\.\d+$/);
});

test('popup explains how to list pinned tabs before X was visited', async () => {
  const { $ } = await openPage('popup.html');
  assert.deepEqual(optionLabels($('#defaultTabSelect')), ['1. For you', '2. Following']);
  assert.equal($('#defaultTabSelect').value, '1');
  assert.equal($('#tabsHint').hidden, false);
  assert.equal($('#sortOrderSelect').disabled, false);
  assert.equal($('#sortHint').hidden, true);
});

test('a saved tab that X no longer shows stays selected and is labelled', async () => {
  const { $ } = await openPage('popup.html', {
    sync: { defaultTab: '4' },
    local: { homeTabNames: ['For you', 'Following'] },
  });
  assert.deepEqual(optionLabels($('#defaultTabSelect')), [
    '1. For you',
    '2. Following',
    '5. Not on your home page right now',
  ]);
  assert.equal($('#defaultTabSelect').value, '4');
});

test('every change is saved at once and confirmed', async () => {
  const { window, chrome, $ } = await openPage('popup.html');

  change(window, $('#sortOrderSelect'), 'popular');
  await until(() => chrome.storage.sync.data.followingTabSort === 'popular', 1000, 'the sort to be saved');
  assert.deepEqual(chrome.storage.sync.data, { enabled: true, defaultTab: '1', followingTabSort: 'popular' });
  await until(() => $('#status').textContent === 'Saved', 1000, 'the confirmation');
  assert.equal($('#status').dataset.kind, 'success');

  change(window, $('#enabledToggle'), false);
  await until(() => chrome.storage.sync.data.enabled === false, 1000, 'the switch to be saved');
  assert.equal($('#defaultTabSelect').disabled, true);
  assert.equal($('#sortOrderSelect').disabled, true);
  assert.ok($('[data-requires-enabled]').classList.contains('is-off'));
});

test('switching on after the v2.0 "Disabled" choice clears the old value', async () => {
  const { window, chrome, $ } = await openPage('popup.html', { sync: { enabled: true, defaultTab: 'disabled' } });
  assert.equal($('#enabledToggle').checked, false, 'v2.0 "Disabled" shows as switched off');
  assert.equal($('#defaultTabSelect').value, '1');

  change(window, $('#enabledToggle'), true);
  await until(() => chrome.storage.sync.data.enabled === true, 1000, 'the switch to be saved');
  assert.deepEqual(chrome.storage.sync.data, { enabled: true, defaultTab: '1', followingTabSort: 'recent' });
});

test('a failed save says so and puts the control back', async () => {
  const { window, $ } = await openPage('popup.html', { failWrites: true });
  window.console.error = () => {}; // the page logs the failure; keep the test output clean
  change(window, $('#sortOrderSelect'), 'popular');
  await until(() => $('#status').dataset.kind === 'error', 1000, 'the error message');
  assert.equal($('#status').textContent, "Couldn't save. Please try again.");
  assert.equal($('#sortOrderSelect').value, 'recent');
});

test('popup follows changes made elsewhere, such as new tab names', async () => {
  const { chrome, $ } = await openPage('popup.html');
  await chrome.storage.local.set({ homeTabNames: ['For you', 'Following', 'My list'] });
  await chrome.storage.sync.set({ enabled: true, defaultTab: '2', followingTabSort: 'recent' });
  await until(() => $('#defaultTabSelect').value === '2', 1000, 'the new settings');
  assert.deepEqual(optionLabels($('#defaultTabSelect')), ['1. For you', '2. Following', '3. My list']);
});

test('the settings button opens the settings page', async () => {
  const { window, chrome, $ } = await openPage('popup.html');
  $('#openOptions').click();
  assert.equal(chrome.runtime.optionsOpened, true);
  assert.equal(window.closedByScript, true);
});

test('the pages follow the browser language', async () => {
  const { window, $ } = await openPage('popup.html', { locale: 'tr' });
  assert.equal(window.document.documentElement.lang, 'tr');
  assert.equal($('label[for="defaultTabSelect"]').textContent, 'Açılacak sekme');
  assert.deepEqual(optionLabels($('#defaultTabSelect')), ['1. Sana özel', '2. Takip edilenler']);
  assert.match($('#version').textContent, /^Sürüm /);
});

test('settings page restores the defaults', async () => {
  const { window, chrome, $ } = await openPage('options.html', {
    sync: { enabled: false, defaultTab: '0', followingTabSort: 'default' },
  });
  assert.equal(window.document.title, 'Settings · Twitter Default Following Tab');
  $('#resetButton').click();
  await until(() => chrome.storage.sync.data.enabled === true, 1000, 'the defaults to be saved');
  assert.deepEqual(chrome.storage.sync.data, { enabled: true, defaultTab: '1', followingTabSort: 'recent' });
  await until(() => $('#status').textContent === 'Defaults restored', 1000, 'the confirmation');
  assert.equal($('#enabledToggle').checked, true);
  assert.equal($('#defaultTabSelect').value, '1');
});

test('no element is left with an untranslated message key', async () => {
  for (const page of ['popup.html', 'options.html']) {
    const { window } = await openPage(page);
    for (const element of window.document.querySelectorAll('[data-i18n]')) {
      assert.notEqual(element.textContent, element.dataset.i18n, `${page}: ${element.dataset.i18n}`);
      assert.ok(element.textContent.trim(), `${page}: ${element.dataset.i18n} is empty`);
    }
  }
});
