'use strict';

const { describe, test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { createController, CLASS_SORTING } = require('../src/lib/controller.js');
const { DEFAULT_SETTINGS } = require('../src/lib/settings.js');
const { createFakeX, until, sleep } = require('./helpers/fake-x.js');

/** Short timings so the whole suite runs in a couple of seconds. */
const FAST = {
  tabsTimeout: 300,
  lateTabTimeout: 150,
  selectTimeout: 150,
  contentTimeout: 200,
  menuTimeout: 150,
  maxHidden: 400,
  revealFade: 5,
  pollInterval: 10,
  tabNamesDelay: 40,
};

const cleanups = [];
afterEach(() => {
  while (cleanups.length) {
    cleanups.pop()();
  }
});

function setup(fakeOptions = {}, settingsOverrides = {}, timingOverrides = {}) {
  const x = createFakeX(fakeOptions);
  const settings = { ...DEFAULT_SETTINGS, ...settingsOverrides };
  const tabNames = [];
  const controller = createController({
    window: x.window,
    getSettings: () => settings,
    isUserEvent: (event) => event.fromUser === true,
    onTabNames: (names) => tabNames.push(names),
    timing: { ...FAST, ...timingOverrides },
  });
  cleanups.push(() => {
    controller.stop();
    x.close();
  });
  return { x, controller, settings, tabNames };
}

describe('opening the default tab', () => {
  test('switches from For you to Following and never shows the For you feed', async () => {
    const { x, controller } = setup({ selected: 0, sort: 'recent' });
    controller.start();
    assert.equal(x.isTimelineHidden(), true, 'the timeline is hidden before X renders it');

    await until(() => x.state.selected === 1, 1000, 'Following to be selected');
    await until(() => !controller.inspect().running, 1000, 'the run to finish');

    assert.equal(x.isTimelineHidden(), false);
    assert.deepEqual(x.state.clicks, ['tab:1', 'tab:1', 'tab:1'], 'switch, then open and close the sort menu');
    for (const paint of x.paintLog.filter((entry) => entry.feed.startsWith('For you'))) {
      assert.equal(paint.hidden, true, 'For you posts may only appear while hidden');
    }
    assert.equal(x.state.menuOpen, false);
  });

  test('hides a For you feed that X draws in the same step as the tabs', async () => {
    const { x, controller } = setup({ selected: 0, sort: 'recent', postsWithTabs: true });
    controller.start();
    await until(() => x.state.selected === 1, 1000, 'Following to be selected');
    await controller.idle();

    const forYou = x.paintLog.filter((entry) => entry.feed.startsWith('For you'));
    assert.equal(forYou.length, 1, 'X did draw the For you feed');
    assert.equal(forYou[0].hidden, true, 'but it was hidden before the next paint');
    assert.equal(x.isTimelineHidden(), false);
  });

  test('hides the For you feed when you come back to the home page in the same visit', async () => {
    const { x, controller } = setup(
      { path: '/explore', selected: 0, postsWithTabs: true },
      { followingTabSort: 'default' },
      { pollInterval: 60000 }, // only the DOM observer can notice the navigation in time
    );
    controller.start();
    await sleep(20);
    x.navigate('/home');
    await until(() => x.state.selected === 1, 1000, 'Following to be selected');
    await controller.idle();

    const forYou = x.paintLog.filter((entry) => entry.feed.startsWith('For you'));
    assert.equal(forYou.length, 1);
    assert.equal(forYou[0].hidden, true, 'no flash, even without hiding up front');
  });

  test('leaves an already open Following tab alone when the sort is right', async () => {
    const { x, controller } = setup({ selected: 1, sort: 'recent' });
    controller.start();
    await until(() => x.state.clicks.length >= 2, 1000, 'the sort check');
    await controller.idle();

    assert.deepEqual(x.state.clicks, ['tab:1', 'tab:1'], 'only opens and closes the menu');
    assert.equal(x.state.sort, 'recent');
    assert.equal(x.state.menuOpen, false);
    assert.equal(x.html.classList.contains(CLASS_SORTING), false);
    assert.equal(x.isTimelineHidden(), false);
  });

  test('does not touch the sort menu when the sort is set to "leave as it is"', async () => {
    const { x, controller } = setup({ selected: 1, sort: 'popular' }, { followingTabSort: 'default' });
    controller.start();
    await until(() => x.tab(1), 1000, 'the home tabs');
    await controller.idle();

    assert.deepEqual(x.state.clicks, []);
    assert.equal(x.state.sort, 'popular');
    assert.equal(x.isTimelineHidden(), false);
  });

  test('opens another default tab without opening a sort menu', async () => {
    const { x, controller } = setup({ selected: 1, sort: 'popular' }, { defaultTab: '0' });
    controller.start();
    await until(() => x.state.selected === 0, 1000, 'For you to be selected');
    await controller.idle();

    assert.deepEqual(x.state.clicks, ['tab:0']);
    assert.equal(x.state.sort, 'popular');
  });

  test('waits for a pinned tab that renders after the first two', async () => {
    const { x, controller } = setup({ selected: 0, lateTabs: ['My list'], lateTabsDelay: 40 }, { defaultTab: '2' });
    controller.start();
    await until(() => x.state.selected === 2, 1000, 'the pinned tab to be selected');
    await controller.idle();
    assert.equal(x.isTimelineHidden(), false);
  });

  test('gives up quietly when the chosen position does not exist', async () => {
    const { x, controller } = setup({ selected: 0 }, { defaultTab: '5' });
    controller.start();
    await until(() => x.tab(0), 1000, 'the home tabs');
    await controller.idle();

    assert.deepEqual(x.state.clicks, []);
    assert.equal(x.isTimelineHidden(), false);
  });

  test('does nothing at all while switched off', async () => {
    const { x, controller } = setup({ selected: 0 }, { enabled: false });
    controller.start();
    assert.equal(x.isTimelineHidden(), false, 'never hides the timeline');
    await until(() => x.tab(0), 1000, 'the home tabs');
    await controller.idle();
    assert.deepEqual(x.state.clicks, []);
  });

  test('waits for the settings before deciding', async () => {
    const x = createFakeX({ selected: 0 });
    const settings = { ...DEFAULT_SETTINGS };
    let release;
    const ready = new Promise((resolve) => {
      release = resolve;
    });
    const controller = createController({ window: x.window, getSettings: () => settings, timing: FAST });
    cleanups.push(() => {
      controller.stop();
      x.close();
    });

    controller.start({ ready });
    await sleep(30);
    assert.deepEqual(x.state.clicks, [], 'no clicks before the settings are known');
    settings.enabled = false;
    release();
    await controller.idle();
    assert.deepEqual(x.state.clicks, []);
    assert.equal(x.isTimelineHidden(), false);
  });
});

describe('Following sort', () => {
  test('switches Popular to Recent and closes the hidden menu', async () => {
    const { x, controller } = setup({ selected: 1, sort: 'popular' });
    controller.start();
    await until(() => x.state.sort === 'recent', 1000, 'the sort to change');
    await controller.idle();

    assert.deepEqual(x.state.clicks, ['tab:1', 'sort:recent']);
    assert.equal(x.state.menuOpen, false);
    assert.equal(x.html.classList.contains(CLASS_SORTING), false);
    assert.equal(x.isTimelineHidden(), false);
    assert.ok(
      x.paintLog.filter((entry) => entry.feed === 'Following (popular)').every((entry) => entry.hidden),
      'the Popular feed is never shown',
    );
  });

  test('switches Recent to Popular when asked', async () => {
    const { x, controller } = setup({ selected: 1, sort: 'recent' }, { followingTabSort: 'popular' });
    controller.start();
    await until(() => x.state.sort === 'popular', 1000, 'the sort to change');
    await controller.idle();
    assert.equal(x.state.menuOpen, false);
  });

  test('finds the sort options by position when X is not in English', async () => {
    const { x, controller } = setup({
      selected: 1,
      sort: 'popular',
      sortLabels: { popular: 'Popüler', recent: 'En son' },
    });
    controller.start();
    await until(() => x.state.sort === 'recent', 1000, 'the sort to change');
    await controller.idle();
    assert.deepEqual(x.state.clicks, ['tab:1', 'sort:recent']);
  });

  test('applies the sort once per page visit, then leaves it to the user', async () => {
    const { x, controller } = setup({ selected: 1, sort: 'popular' });
    controller.start();
    await until(() => x.state.sort === 'recent', 1000, 'the sort to change');
    await controller.idle();

    x.navigate('/someone/status/1');
    await sleep(30);
    x.state.sort = 'popular'; // the user changed it somewhere along the way
    x.navigate('/home');
    await until(() => x.tab(1), 1000, 'the home page to render again');
    await sleep(60);
    await controller.idle();

    assert.deepEqual(x.state.clicks, ['tab:1', 'sort:recent'], 'no second sort change');
  });

  test('applies a new sort straight away when the setting changes', async () => {
    const { x, controller, settings } = setup({ selected: 1, sort: 'recent' });
    controller.start();
    await until(() => x.state.clicks.length >= 2, 1000, 'the first sort check');
    await controller.idle();

    settings.followingTabSort = 'popular';
    controller.settingsChanged();
    await until(() => x.state.sort === 'popular', 1000, 'the new sort');
    await controller.idle();
    assert.equal(x.state.menuOpen, false);
  });
});

describe('your own choices', () => {
  test('keeps a tab you pick by hand until the page is loaded again', async () => {
    const { x, controller, settings } = setup({ selected: 0, sort: 'recent' });
    controller.start();
    await until(() => x.state.selected === 1, 1000, 'Following to be selected');
    await controller.idle();

    x.userClick(x.tab(0));
    await until(() => x.state.selected === 0, 1000, 'For you to be selected by the user');
    assert.equal(controller.inspect().manualTabChoice, true);

    x.navigate('/someone/status/1');
    await sleep(30);
    x.navigate('/home');
    await until(() => x.tab(0), 1000, 'the home page to render again');
    await sleep(80);
    await controller.idle();
    assert.equal(x.state.selected, 0, 'your choice is kept');

    settings.defaultTab = '1';
    controller.settingsChanged();
    await until(() => x.state.selected === 1, 1000, 'new settings to win again');
  });

  test('stops switching the moment you click a tab yourself', async () => {
    const { x, controller } = setup({ selected: 0, selectDelay: 60, sort: 'recent' });
    controller.start();
    await until(() => x.state.clicks.includes('tab:1'), 1000, 'the switch to start');
    x.userClick(x.tab(0));

    assert.equal(controller.inspect().running, false);
    assert.equal(x.isTimelineHidden(), false, 'the timeline is shown at once');
    await sleep(120);
    assert.deepEqual(
      x.state.clicks.filter((click) => !click.startsWith('tab:0')),
      ['tab:1'],
      'no sort menu after you took over',
    );
  });

  test('ignores scripted clicks when looking for your own choices', async () => {
    const { x, controller } = setup({ selected: 1, sort: 'recent' }, { followingTabSort: 'default' });
    controller.start();
    await until(() => x.tab(0), 1000, 'the home tabs');
    await controller.idle();
    x.tab(0).click(); // isUserEvent says no: not the user's choice
    assert.equal(controller.inspect().manualTabChoice, false);
  });
});

describe('navigation and safety nets', () => {
  test('shows the timeline after the safety timeout when X never renders the tabs', async () => {
    const { x, controller } = setup({ tabsDelay: null });
    controller.start();
    assert.equal(x.isTimelineHidden(), true);
    await until(() => !x.isTimelineHidden(), FAST.maxHidden + 300, 'the safety timeout');
    await controller.idle();
  });

  test('cancels a switch when you leave the home page', async () => {
    const { x, controller } = setup({ selected: 0, selectDelay: 80, sort: 'popular' });
    controller.start();
    await until(() => x.state.clicks.includes('tab:1'), 1000, 'the switch to start');
    x.navigate('/explore');
    await until(() => !controller.inspect().running, 500, 'the run to stop');

    assert.equal(x.isTimelineHidden(), false);
    await sleep(150);
    assert.deepEqual(x.state.clicks, ['tab:1'], 'nothing else is clicked');
  });

  test('switches again when you come back to the home page in the same visit', async () => {
    const { x, controller } = setup({ path: '/explore', selected: 0, sort: 'recent' }, { followingTabSort: 'default' });
    controller.start();
    await sleep(30);
    assert.deepEqual(x.state.clicks, []);

    x.navigate('/home');
    await until(() => x.state.selected === 1, 1000, 'Following to be selected');
    await controller.idle();
    assert.equal(x.isTimelineHidden(), false);
  });

  test('reports the home tab names once they have settled', async () => {
    const { x, controller, tabNames } = setup({ selected: 1, lateTabs: ['My list'] }, { followingTabSort: 'default' });
    controller.start();
    await until(() => tabNames.length > 0, 1000, 'tab names');
    assert.deepEqual(tabNames, [['For you', 'Following', 'My list']]);
    assert.ok(x.tab(2));
  });

  test('stops cleanly once the extension is gone', async () => {
    const x = createFakeX({ selected: 1 });
    let alive = true;
    const controller = createController({
      window: x.window,
      getSettings: () => ({ ...DEFAULT_SETTINGS, followingTabSort: 'default' }),
      isAlive: () => alive,
      timing: FAST,
    });
    cleanups.push(() => x.close());
    controller.start();
    alive = false;
    await until(() => !controller.inspect().started, 500, 'the controller to stop');
    assert.equal(x.isTimelineHidden(), false);
    assert.equal(x.html.className, '');
  });
});
