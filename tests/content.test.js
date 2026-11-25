'use strict';

const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { createChromeStub, runScripts } = require('./helpers/chrome-stub.js');
const { createFakeX, until } = require('./helpers/fake-x.js');

const CONTENT_SCRIPTS = ['lib/settings.js', 'lib/x-page.js', 'lib/controller.js', 'content.js'];

const pages = [];
afterEach(() => {
  while (pages.length) {
    const x = pages.pop();
    // Like an extension update: chrome.runtime.id disappears and the next check stops the script.
    x.window.chrome.runtime.id = undefined;
    x.window.dispatchEvent(new x.window.PopStateEvent('popstate'));
    x.close();
  }
});

/** Loads the content scripts exactly as the manifest lists them, into a fake X page. */
function loadExtension(fakeOptions, chromeOptions) {
  const x = createFakeX(fakeOptions);
  pages.push(x);
  const chrome = createChromeStub(chromeOptions);
  x.window.chrome = chrome;
  runScripts(x.window, CONTENT_SCRIPTS);
  return { x, chrome };
}

test('the manifest load order wires settings, X and storage together', async () => {
  const { x, chrome } = loadExtension(
    { selected: 1, lateTabs: ['My list'] },
    { sync: { enabled: true, defaultTab: '0', followingTabSort: 'recent' } },
  );

  await until(() => x.state.selected === 0, 2000, 'the saved default tab to open');
  await until(() => !x.isTimelineHidden(), 2000, 'the timeline to be shown');

  await until(() => chrome.storage.local.data.homeTabNames, 4000, 'tab names to be stored');
  assert.deepEqual(chrome.storage.local.data.homeTabNames, ['For you', 'Following', 'My list']);
});

test('a settings change in the popup applies to the open X tab right away', async () => {
  const { x, chrome } = loadExtension(
    { selected: 0, sort: 'popular' },
    { sync: { enabled: false, defaultTab: '1', followingTabSort: 'recent' } },
  );
  await until(() => x.tab(1), 2000, 'the home tabs');
  assert.deepEqual(x.state.clicks, [], 'nothing happens while switched off');

  await chrome.storage.sync.set({ enabled: true, defaultTab: '1', followingTabSort: 'recent' });
  await until(() => x.state.selected === 1 && x.state.sort === 'recent', 3000, 'the new settings to apply');
  await until(() => !x.isTimelineHidden() && !x.state.menuOpen, 2000, 'the switch to finish');
});

test('changes to unrelated storage keys are ignored', async () => {
  const { x, chrome } = loadExtension({ selected: 1, sort: 'recent' }, { sync: { followingTabSort: 'default' } });
  await until(() => x.tab(1), 2000, 'the home tabs');
  await chrome.storage.sync.set({ somethingElse: true });
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.deepEqual(x.state.clicks, []);
});
