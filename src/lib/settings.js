/**
 * Twitter Default Following Tab: settings shared by the content script, popup and options page.
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

  /** X always lists "For you" first and "Following" second on the home page. */
  const FOLLOWING_TAB_INDEX = 1;

  /** Highest tab position the settings accept (X shows at most a handful of pinned tabs). */
  const MAX_TAB_INDEX = 19;

  /** How the Following timeline is sorted: X's "Recent", X's "Popular", or left as X has it. */
  const SORT_MODES = Object.freeze(['recent', 'popular', 'default']);

  /** Stored in chrome.storage.sync. Key names are kept from v2.0 so existing settings carry over. */
  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    defaultTab: String(FOLLOWING_TAB_INDEX),
    followingTabSort: 'recent',
  });

  /** chrome.storage.local key for the names of the home tabs last seen on X (device only). */
  const TAB_NAMES_KEY = 'homeTabNames';

  function isTabIndex(value) {
    const text = typeof value === 'number' ? String(value) : value;
    return typeof text === 'string' && /^\d{1,2}$/.test(text) && Number(text) <= MAX_TAB_INDEX;
  }

  /**
   * Turns whatever is in storage (missing keys, v2.0 values, junk) into a complete, valid settings object.
   * @param {unknown} raw
   * @returns {{enabled: boolean, defaultTab: string, followingTabSort: string}}
   */
  function normalizeSettings(raw) {
    const input = raw && typeof raw === 'object' ? raw : {};
    const settings = { ...DEFAULT_SETTINGS };

    if (typeof input.enabled === 'boolean') {
      settings.enabled = input.enabled;
    }

    if (input.defaultTab === 'disabled') {
      // v2.0 offered "Disabled" in the tab list; the on/off switch replaces it.
      settings.enabled = false;
    } else if (isTabIndex(input.defaultTab)) {
      settings.defaultTab = String(Number(input.defaultTab));
    }

    if (SORT_MODES.includes(input.followingTabSort)) {
      settings.followingTabSort = input.followingTabSort;
    }

    return settings;
  }

  /**
   * @param {chrome.storage.StorageArea} area usually chrome.storage.sync
   */
  async function loadSettings(area) {
    const raw = await area.get(Object.keys(DEFAULT_SETTINGS));
    return normalizeSettings(raw);
  }

  /**
   * Always writes the complete settings object, so stale v2.0 values cannot linger next to new ones.
   * @param {chrome.storage.StorageArea} area usually chrome.storage.sync
   */
  async function saveSettings(area, settings) {
    const normalized = normalizeSettings(settings);
    await area.set(normalized);
    return normalized;
  }

  /**
   * @param {unknown} value
   * @returns {string[]} the cleaned list of tab names, or an empty list
   */
  function normalizeTabNames(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .slice(0, MAX_TAB_INDEX + 1)
      .map((name) => (typeof name === 'string' ? name.replace(/\s+/g, ' ').trim().slice(0, 80) : ''));
  }

  return {
    FOLLOWING_TAB_INDEX,
    MAX_TAB_INDEX,
    SORT_MODES,
    DEFAULT_SETTINGS,
    TAB_NAMES_KEY,
    normalizeSettings,
    loadSettings,
    saveSettings,
    normalizeTabNames,
  };
});
