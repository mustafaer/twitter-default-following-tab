/**
 * Twitter Default Following Tab: decides when to open the chosen home tab and set the Following sort.
 *
 * One "run" happens each time the home page is reached. Every wait inside a run listens to the
 * same AbortSignal, so navigating away or changing settings cancels it cleanly.
 *
 * Copyright (C) 2025-2026 Twitter Default Following Tab Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./x-page.js'));
  } else {
    root.TDFT = Object.assign(root.TDFT || {}, factory(root.TDFT));
  }
})(globalThis, (xPage) => {
  'use strict';

  const {
    SELECTORS,
    isHomePath,
    getLabel,
    getHomeTabs,
    isSelected,
    hasSortMenu,
    isMenuExpanded,
    snapshotTweets,
    hasFreshTweets,
    snapshotMenus,
    findNewMenu,
    findSortItem,
    isMenuItemChecked,
  } = xPage;

  /** All times in milliseconds. */
  const DEFAULT_TIMING = Object.freeze({
    tabsTimeout: 10000, // slow connections: how long to wait for the home tabs to appear
    lateTabTimeout: 2500, // pinned lists and communities render after For you / Following
    selectTimeout: 2000, // how long X may take to mark the clicked tab as selected
    contentTimeout: 3000, // how long to wait for the new timeline's first post
    menuTimeout: 1500, // how long to wait for the sort menu to open
    maxHidden: 4000, // safety net: the timeline is never hidden for longer than this
    revealFade: 150, // fade-in when the timeline is shown again
    pollInterval: 1000, // slow fallback check for in-page navigation
    tabNamesDelay: 2000, // let pinned tabs render before reporting tab names
  });

  const CLASS_HIDDEN = 'tdft-hide-timeline';
  const CLASS_FADE = 'tdft-fade-in';
  const CLASS_SORTING = 'tdft-sorting';

  function abortError() {
    const error = new Error('The run was cancelled');
    error.name = 'AbortError';
    return error;
  }

  /**
   * @param {object} env
   * @param {Window} env.window the page's window (a jsdom window in tests)
   * @param {() => {enabled: boolean, defaultTab: string, followingTabSort: string}} env.getSettings
   * @param {(names: string[]) => void} [env.onTabNames] receives the home tab names, left to right
   * @param {() => boolean} [env.isAlive] returns false once the extension was updated or removed
   * @param {(event: Event) => boolean} [env.isUserEvent] tells real user input from scripted clicks
   * @param {(...args: unknown[]) => void} [env.log]
   * @param {Partial<typeof DEFAULT_TIMING>} [env.timing]
   */
  function createController(env) {
    const win = env.window;
    const doc = win.document;
    const html = doc.documentElement;
    const timing = { ...DEFAULT_TIMING, ...env.timing };
    const getSettings = env.getSettings;
    const onTabNames = env.onTabNames || (() => {});
    const isAlive = env.isAlive || (() => true);
    const isUserEvent = env.isUserEvent || ((event) => event.isTrusted);
    const log = env.log || (() => {});

    let started = false;
    let ready = Promise.resolve();
    let activeRun = null; // AbortController of the run in progress
    let activeRunDone = null; // promise that settles when that run has finished
    let currentPath = win.location.pathname;
    let manualTabChoice = false; // the user picked a different tab by hand during this page visit
    let sortHandled = false; // the sort was applied, or left to the user, during this page visit
    let lastTabNames = null;
    let hideTimer = 0;
    let fadeTimer = 0;
    let pollTimer = 0;
    let tabNamesTimer = 0;
    let routeObserver = null;

    // --- Timeline visibility -------------------------------------------------------------------

    function hideTimeline() {
      html.classList.add(CLASS_HIDDEN);
      win.clearTimeout(hideTimer);
      hideTimer = win.setTimeout(() => {
        log('Showing the timeline after the safety timeout');
        revealTimeline();
      }, timing.maxHidden);
    }

    function revealTimeline() {
      win.clearTimeout(hideTimer);
      if (!html.classList.contains(CLASS_HIDDEN)) {
        return;
      }
      html.classList.add(CLASS_FADE);
      html.classList.remove(CLASS_HIDDEN);
      win.clearTimeout(fadeTimer);
      fadeTimer = win.setTimeout(() => html.classList.remove(CLASS_FADE), timing.revealFade + 50);
    }

    // --- Waiting on X's page -------------------------------------------------------------------

    /**
     * Resolves with check()'s first truthy result, or null after `timeout`; rejects when aborted.
     * MutationObserver callbacks run before the browser paints, so whatever happens right after
     * this resolves (hiding the timeline, say) is in place before the user sees the change.
     */
    function waitFor(check, timeout, signal) {
      return new Promise((resolve, reject) => {
        if (signal.aborted) {
          reject(abortError());
          return;
        }
        const immediate = check();
        if (immediate) {
          resolve(immediate);
          return;
        }
        let settled = false;
        const observer = new win.MutationObserver(() => {
          const value = check();
          if (value) {
            finish(resolve, value);
          }
        });
        const timer = win.setTimeout(() => finish(resolve, null), timeout);
        const onAbort = () => finish(reject, abortError());

        function finish(settle, value) {
          if (settled) {
            return;
          }
          settled = true;
          observer.disconnect();
          win.clearTimeout(timer);
          signal.removeEventListener('abort', onAbort);
          settle(value);
        }

        observer.observe(html, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['aria-selected', 'aria-expanded', 'aria-haspopup'],
        });
        signal.addEventListener('abort', onAbort, { once: true });
      });
    }

    // --- Runs ------------------------------------------------------------------------------------

    function wantsToAct() {
      return getSettings().enabled && !manualTabChoice;
    }

    function cancelRun() {
      if (activeRun) {
        activeRun.abort();
        activeRun = null;
        activeRunDone = null;
      }
    }

    function startRun({ hideFirst = false } = {}) {
      cancelRun();
      if (!isHomePath(win.location.pathname)) {
        revealTimeline();
        return;
      }
      const run = new AbortController();
      activeRun = run;
      if (hideFirst && wantsToAct()) {
        hideTimeline();
      }
      activeRunDone = runHome(run.signal)
        .catch((error) => {
          if (error.name !== 'AbortError') {
            log('Something went wrong:', error);
          }
        })
        .finally(() => {
          if (activeRun === run) {
            activeRun = null;
            activeRunDone = null;
            revealTimeline();
          }
        });
    }

    async function runHome(signal) {
      await ready;
      if (signal.aborted) {
        throw abortError();
      }
      if (!wantsToAct()) {
        revealTimeline();
      }

      const tabs = await waitFor(
        () => {
          const found = getHomeTabs(doc);
          return found.length ? found : null;
        },
        timing.tabsTimeout,
        signal,
      );
      if (!tabs) {
        log('The home tabs did not appear');
        return;
      }
      scheduleTabNamesReport();

      const settings = getSettings();
      if (!settings.enabled || manualTabChoice) {
        log(settings.enabled ? 'Keeping the tab you picked' : 'Auto-switch is off');
        return;
      }

      const index = Number(settings.defaultTab);
      let target =
        tabs[index] || (await waitFor(() => getHomeTabs(doc)[index] || null, timing.lateTabTimeout, signal));
      if (!target) {
        log(`There is no tab at position ${index + 1}`);
        return;
      }

      if (!isSelected(target)) {
        hideTimeline();
        const tweetsBefore = snapshotTweets(doc);
        log(`Opening tab ${index + 1} (${getLabel(target)})`);
        target.click();
        target = await waitFor(
          () => {
            const tab = getHomeTabs(doc)[index];
            return tab && isSelected(tab) ? tab : null;
          },
          timing.selectTimeout,
          signal,
        );
        if (!target) {
          log('X did not switch tabs');
          return;
        }
        await waitFor(() => hasFreshTweets(doc, tweetsBefore), timing.contentTimeout, signal);
      }

      if (settings.followingTabSort !== 'default' && !sortHandled && hasSortMenu(target)) {
        await applySort(target, settings.followingTabSort, signal);
      }
    }

    /** Opens the Following sort menu (kept invisible), picks the wanted order and closes it. */
    async function applySort(tab, mode, signal) {
      sortHandled = true; // once per page visit, even if X's menu is not recognised
      html.classList.add(CLASS_SORTING);
      try {
        const menusBefore = snapshotMenus(doc);
        tab.click();
        const menu = await waitFor(() => findNewMenu(doc, menusBefore), timing.menuTimeout, signal);
        if (!menu) {
          log('The sort menu did not open');
          return;
        }
        const item = findSortItem(menu, mode);
        if (!item) {
          log('The sort menu was not recognised');
          return;
        }
        if (isMenuItemChecked(item, menu)) {
          log(`Following is already sorted by ${mode}`);
          return;
        }
        hideTimeline();
        const tweetsBefore = snapshotTweets(doc);
        log(`Sorting Following by ${mode}`);
        item.click();
        await waitFor(() => hasFreshTweets(doc, tweetsBefore), timing.contentTimeout, signal);
      } finally {
        if (tab.isConnected && isMenuExpanded(tab)) {
          tab.click(); // clicking the tab again closes the menu
        }
        html.classList.remove(CLASS_SORTING);
      }
    }

    // --- Tab names for the settings pages ----------------------------------------------------

    function scheduleTabNamesReport() {
      win.clearTimeout(tabNamesTimer);
      tabNamesTimer = win.setTimeout(reportTabNames, timing.tabNamesDelay);
    }

    function reportTabNames() {
      if (!isHomePath(win.location.pathname)) {
        return;
      }
      const names = getHomeTabs(doc).map(getLabel);
      const key = JSON.stringify(names);
      if (names.length < 2 || key === lastTabNames) {
        return;
      }
      lastTabNames = key;
      onTabNames(names);
    }

    // --- Events ----------------------------------------------------------------------------------

    /** A tab picked by hand wins over the setting until the page is loaded again. */
    function onUserActivation(event) {
      if (!isUserEvent(event) || !isHomePath(win.location.pathname)) {
        return;
      }
      if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      const element = event.target && typeof event.target.closest === 'function' ? event.target : null;
      const tab = element && element.closest(SELECTORS.tab);
      const index = tab ? getHomeTabs(doc).indexOf(tab) : -1;
      if (index === -1) {
        return;
      }
      manualTabChoice = index !== Number(getSettings().defaultTab);
      sortHandled = true; // opening the sort menu yourself means you choose the sort
      log(manualTabChoice ? `You picked tab ${index + 1}; leaving it until the next page load` : 'You picked the default tab');
      if (activeRun) {
        cancelRun();
        revealTimeline();
      }
    }

    function checkLocation() {
      if (!isAlive()) {
        log('The extension was updated or removed; stopping');
        stop();
        return;
      }
      const path = win.location.pathname;
      if (path === currentPath) {
        return;
      }
      const wasHome = isHomePath(currentPath);
      currentPath = path;
      if (!isHomePath(path)) {
        cancelRun();
        revealTimeline();
      } else if (!wasHome) {
        log('Back on the home page');
        startRun();
      }
    }

    // --- Public API ------------------------------------------------------------------------------

    /**
     * @param {{ready?: Promise<unknown>}} [options] `ready` settles once the settings are loaded
     */
    function start(options = {}) {
      if (started) {
        return;
      }
      started = true;
      ready = Promise.resolve(options.ready).catch(() => {});
      doc.addEventListener('click', onUserActivation, true);
      doc.addEventListener('keydown', onUserActivation, true);
      // X re-renders as soon as its URL changes, so a DOM mutation is the earliest sign of
      // in-page navigation, and its callback still runs before the browser paints. The
      // callback only compares two strings, so it stays cheap on a busy page.
      routeObserver = new win.MutationObserver(() => {
        if (win.location.pathname !== currentPath) {
          checkLocation();
        }
      });
      routeObserver.observe(html, { childList: true, subtree: true });
      win.addEventListener('popstate', checkLocation);
      if (win.navigation && typeof win.navigation.addEventListener === 'function') {
        win.navigation.addEventListener('currententrychange', checkLocation);
      }
      pollTimer = win.setInterval(checkLocation, timing.pollInterval);
      // A fresh page load: hide the timeline before X draws it, so "For you" never flashes.
      startRun({ hideFirst: true });
    }

    function stop() {
      if (!started) {
        return;
      }
      started = false;
      cancelRun();
      if (routeObserver) {
        routeObserver.disconnect();
        routeObserver = null;
      }
      doc.removeEventListener('click', onUserActivation, true);
      doc.removeEventListener('keydown', onUserActivation, true);
      win.removeEventListener('popstate', checkLocation);
      if (win.navigation && typeof win.navigation.removeEventListener === 'function') {
        win.navigation.removeEventListener('currententrychange', checkLocation);
      }
      for (const timer of [hideTimer, fadeTimer, tabNamesTimer]) {
        win.clearTimeout(timer);
      }
      win.clearInterval(pollTimer);
      html.classList.remove(CLASS_HIDDEN, CLASS_FADE, CLASS_SORTING);
    }

    /** New settings apply right away, and clear any manual choice made earlier on this page. */
    function settingsChanged() {
      manualTabChoice = false;
      sortHandled = false;
      if (started) {
        startRun();
      }
    }

    /** Resolves when no run is in progress (used by tests). */
    async function idle() {
      while (activeRunDone) {
        await activeRunDone;
      }
    }

    function inspect() {
      return { started, running: Boolean(activeRun), manualTabChoice, sortHandled };
    }

    return { start, stop, settingsChanged, checkLocation, idle, inspect };
  }

  return { createController, DEFAULT_TIMING, CLASS_HIDDEN, CLASS_FADE, CLASS_SORTING };
});
