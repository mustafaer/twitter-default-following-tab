/**
 * Twitter Default Following Tab: everything the extension knows about X's page structure.
 *
 * Keep every X selector in this file, so a change on X's side is a one-file fix.
 * Last checked against x.com on 25 November 2026:
 *   - home tabs: [data-testid="primaryColumn"] [role="tablist"] > … > div[role="tab"][aria-selected]
 *     ("For you", "Following", then pinned lists and communities, which render ~300 ms later)
 *   - the selected Following tab carries aria-haspopup="menu"; clicking it toggles a sort menu
 *   - sort menu: #layers [role="menu"] with [role="menuitem"] "Popular" then "Recent";
 *     only the checked item contains an <svg> check mark
 *   - timeline: [data-testid="primaryColumn"] section[role="region"] with article[data-testid="tweet"]
 *
 * Copyright (C) 2025-2026 Twitter Default Following Tab Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.TDFT = Object.assign(root.TDFT || {}, api);
  }
})(globalThis, () => {
  'use strict';

  const SELECTORS = Object.freeze({
    tabList: '[data-testid="primaryColumn"] [role="tablist"]',
    tab: '[role="tab"]',
    tweet: '[data-testid="primaryColumn"] article[data-testid="tweet"]',
    menu: '[role="menu"]',
    menuItem: '[role="menuitem"]',
  });

  /** English labels of the sort menu, matched exactly; other languages fall back to position. */
  const SORT_LABELS = Object.freeze({ popular: 'popular', recent: 'recent' });

  /** Position of each option in X's sort menu, used when the labels are not English. */
  const SORT_POSITIONS = Object.freeze({ popular: 0, recent: 1 });

  /** @param {string} pathname */
  function isHomePath(pathname) {
    const path = String(pathname || '/').replace(/\/+$/, '') || '/';
    return path === '/' || path === '/home';
  }

  /** @param {Element} element */
  function getLabel(element) {
    return (element.textContent || '').replace(/\s+/g, ' ').trim();
  }

  /**
   * The home page's tabs, left to right. Other tablists in the primary column (such as the
   * composer toolbar) have no tabs, so the first list with at least two tabs is the right one.
   * @param {Document} doc
   * @returns {Element[]}
   */
  function getHomeTabs(doc) {
    for (const list of doc.querySelectorAll(SELECTORS.tabList)) {
      const tabs = list.querySelectorAll(SELECTORS.tab);
      if (tabs.length >= 2) {
        return Array.from(tabs);
      }
    }
    return [];
  }

  /** @param {Element} tab */
  function isSelected(tab) {
    return tab.getAttribute('aria-selected') === 'true';
  }

  /** Only the selected Following tab opens a sort menu; this needs no language knowledge. */
  function hasSortMenu(tab) {
    return tab.getAttribute('aria-haspopup') === 'menu';
  }

  /** @param {Element} tab */
  function isMenuExpanded(tab) {
    return tab.getAttribute('aria-expanded') === 'true';
  }

  /** @param {Document} doc */
  function snapshotTweets(doc) {
    return new Set(doc.querySelectorAll(SELECTORS.tweet));
  }

  /**
   * True once the timeline shows a post that was not there before (the new feed has arrived).
   * @param {Document} doc
   * @param {Set<Element>} before
   */
  function hasFreshTweets(doc, before) {
    for (const tweet of doc.querySelectorAll(SELECTORS.tweet)) {
      if (!before.has(tweet)) {
        return true;
      }
    }
    return false;
  }

  /** @param {Document} doc */
  function snapshotMenus(doc) {
    return new Set(doc.querySelectorAll(SELECTORS.menu));
  }

  /**
   * @param {Document} doc
   * @param {Set<Element>} before
   * @returns {Element|null} a menu that opened after the snapshot was taken
   */
  function findNewMenu(doc, before) {
    for (const menu of doc.querySelectorAll(SELECTORS.menu)) {
      if (!before.has(menu)) {
        return menu;
      }
    }
    return null;
  }

  /**
   * @param {Element} menu the Following sort menu
   * @param {'recent'|'popular'} mode
   * @returns {Element|null} the menu item for that sort order, or null if the menu is not recognised
   */
  function findSortItem(menu, mode) {
    const items = Array.from(menu.querySelectorAll(SELECTORS.menuItem));
    const label = SORT_LABELS[mode];
    const byLabel = items.find((item) => getLabel(item).toLowerCase() === label);
    if (byLabel) {
      return byLabel;
    }
    // Any other language: X keeps the order Popular, Recent. Refuse to guess on other menus.
    return items.length === 2 ? items[SORT_POSITIONS[mode]] : null;
  }

  /**
   * @param {Element} item
   * @param {Element} menu
   * @returns {boolean} true when X shows this item as the current choice
   */
  function isMenuItemChecked(item, menu) {
    const ariaChecked = item.getAttribute('aria-checked');
    if (ariaChecked !== null) {
      return ariaChecked === 'true';
    }
    const marked = Array.from(menu.querySelectorAll(SELECTORS.menuItem)).filter((entry) =>
      entry.querySelector('svg'),
    );
    return marked.length === 1 && marked[0] === item;
  }

  return {
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
  };
});
