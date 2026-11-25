'use strict';

/**
 * A small imitation of X's home page in jsdom, modelled on the live markup recorded in
 * src/lib/x-page.js: role="tab" divs with aria-selected, a Following tab that gains
 * aria-haspopup="menu" when selected and toggles a "Sort by" menu in #layers, and a timeline
 * section whose posts are replaced (after a delay) whenever the tab or sort changes.
 */
const { JSDOM } = require('jsdom');

const SVG_NS = 'http://www.w3.org/2000/svg';
const ENGLISH_SORT_LABELS = { popular: 'Popular', recent: 'Recent' };

/**
 * @param {object} [options]
 * @param {string} [options.path] starting path
 * @param {string[]} [options.tabs] tab names rendered first
 * @param {string[]} [options.lateTabs] pinned tabs rendered `lateTabsDelay` ms later
 * @param {number} [options.selected] index of the tab X opens on
 * @param {'popular'|'recent'} [options.sort] X's current Following sort
 * @param {{popular: string, recent: string}} [options.sortLabels] menu labels (language)
 * @param {number|null} [options.tabsDelay] ms before the home page renders (null: never)
 * @param {number} [options.selectDelay] ms before a clicked tab becomes selected
 * @param {number} [options.feedDelay] ms before a timeline's posts arrive
 * @param {boolean} [options.postsWithTabs] draw the first feed in the same step as the tabs
 */
function createFakeX(options = {}) {
  const {
    path = '/home',
    tabs = ['For you', 'Following'],
    lateTabs = [],
    lateTabsDelay = 30,
    selected = 0,
    sort = 'popular',
    sortLabels = ENGLISH_SORT_LABELS,
    tabsDelay = 5,
    selectDelay = 5,
    feedDelay = 15,
    postsWithTabs = false,
  } = options;

  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div id="react-root"></div><div id="layers"></div></body></html>',
    { url: `https://x.com${path}`, pretendToBeVisual: true, runScripts: 'outside-only' },
  );
  const { window } = dom;
  const { document } = window;
  const html = document.documentElement;

  const state = { selected, sort, menuOpen: false, clicks: [] };
  /** Every batch of posts X put on screen, and whether the extension had the timeline hidden. */
  const paintLog = [];
  let tabList = null;
  let timeline = null;
  let tabElements = [];
  let feedVersion = 0;

  function element(tag, attributes = {}) {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes)) {
      node.setAttribute(name, value);
    }
    return node;
  }

  function renderHome() {
    const column = element('div', { 'data-testid': 'primaryColumn' });
    const nav = element('nav', { role: 'navigation' });
    tabList = element('div', { role: 'tablist', 'data-testid': 'ScrollSnap-List' });
    nav.append(tabList);
    const toolbar = element('div', { 'data-testid': 'toolBar' });
    toolbar.append(element('div', { role: 'tablist' })); // an empty tablist, as on x.com
    timeline = element('section', { role: 'region' });
    column.append(nav, toolbar, timeline);
    document.getElementById('react-root').replaceChildren(column);
    tabElements = [];
    tabs.forEach(addTab);
    updateTabs();
    if (postsWithTabs) {
      paintFeed();
    } else {
      loadFeed();
    }
    if (lateTabs.length) {
      window.setTimeout(() => {
        lateTabs.forEach(addTab);
        updateTabs();
      }, lateTabsDelay);
    }
  }

  function addTab(name) {
    const tab = element('div', { role: 'tab', 'aria-selected': 'false', tabindex: '-1' });
    const label = element('span');
    label.textContent = name;
    tab.append(label);
    const wrapper = element('div', { role: 'presentation' });
    wrapper.append(tab);
    tabList.append(wrapper);
    tabElements.push(tab);
    tab.addEventListener('click', () => onTabClick(tabElements.indexOf(tab)));
  }

  function updateTabs() {
    tabElements.forEach((tab, index) => {
      tab.setAttribute('aria-selected', String(index === state.selected));
      if (index === 1 && index === state.selected) {
        tab.setAttribute('aria-haspopup', 'menu');
        tab.setAttribute('aria-expanded', String(state.menuOpen));
      } else {
        tab.removeAttribute('aria-haspopup');
        tab.removeAttribute('aria-expanded');
      }
    });
  }

  function loadFeed() {
    feedVersion += 1;
    const version = feedVersion;
    timeline.replaceChildren();
    window.setTimeout(() => {
      if (version === feedVersion && timeline.isConnected) {
        paintFeed();
      }
    }, feedDelay);
  }

  /** Puts the current feed's posts on screen and notes whether they could be seen. */
  function paintFeed() {
    const feed = `${tabElements[state.selected].textContent}${state.selected === 1 ? ` (${state.sort})` : ''}`;
    timeline.replaceChildren();
    for (let index = 0; index < 3; index += 1) {
      const cell = element('div', { 'data-testid': 'cellInnerDiv' });
      const post = element('article', { 'data-testid': 'tweet' });
      post.textContent = `${feed} post ${index + 1}`;
      cell.append(post);
      timeline.append(cell);
    }
    // Browsers paint only after the current task and its microtasks (where MutationObserver
    // callbacks run), so check visibility in the next task.
    window.setTimeout(() => paintLog.push({ feed, hidden: html.classList.contains('tdft-hide-timeline') }), 0);
  }

  function onTabClick(index) {
    state.clicks.push(`tab:${index}`);
    if (index !== state.selected) {
      closeMenu();
      window.setTimeout(() => {
        state.selected = index;
        updateTabs();
        loadFeed();
      }, selectDelay);
    } else if (index === 1) {
      if (state.menuOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }
  }

  function openMenu() {
    state.menuOpen = true;
    const menu = element('div', { role: 'menu' });
    const dropdown = element('div', { 'data-testid': 'Dropdown' });
    const heading = element('span');
    heading.textContent = 'Sort by';
    dropdown.append(heading);
    for (const mode of ['popular', 'recent']) {
      const item = element('div', { role: 'menuitem', tabindex: '0' });
      const text = element('span');
      text.textContent = sortLabels[mode];
      item.append(text);
      if (state.sort === mode) {
        item.append(document.createElementNS(SVG_NS, 'svg'));
      }
      item.addEventListener('click', () => {
        state.clicks.push(`sort:${mode}`);
        const changed = state.sort !== mode;
        state.sort = mode;
        closeMenu();
        if (changed) {
          loadFeed();
        }
      });
      dropdown.append(item);
    }
    menu.append(dropdown);
    document.getElementById('layers').append(menu);
    updateTabs();
  }

  function closeMenu() {
    state.menuOpen = false;
    document.querySelectorAll('#layers [role="menu"]').forEach((menu) => menu.remove());
    updateTabs();
  }

  function scheduleHome() {
    if (tabsDelay !== null) {
      window.setTimeout(renderHome, tabsDelay);
    }
  }

  /** In-page navigation, like X's router: pushState, then render the new page. */
  function navigate(nextPath) {
    window.history.pushState({}, '', nextPath);
    closeMenu();
    if (nextPath === '/home') {
      scheduleHome();
    } else {
      document.getElementById('react-root').replaceChildren(element('main'));
    }
  }

  /** A click that the controller will treat as the user's own (see isUserEvent in the tests). */
  function userClick(target) {
    const event = new window.MouseEvent('click', { bubbles: true, cancelable: true });
    event.fromUser = true;
    target.dispatchEvent(event);
  }

  if (path === '/home') {
    scheduleHome();
  } else {
    document.getElementById('react-root').append(element('main'));
  }

  return {
    window,
    document,
    html,
    state,
    paintLog,
    navigate,
    userClick,
    tab: (index) => tabElements[index],
    isTimelineHidden: () => html.classList.contains('tdft-hide-timeline'),
    close: () => window.close(),
  };
}

/** Polls until predicate() is truthy; rejects after `timeout` ms. */
async function until(predicate, timeout = 1500, message = 'condition') {
  const deadline = Date.now() + timeout;
  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for ${message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = { createFakeX, until, sleep };
