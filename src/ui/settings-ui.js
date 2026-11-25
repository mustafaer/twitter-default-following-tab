/**
 * Twitter Default Following Tab: settings controls shared by the popup and the settings page.
 *
 * Every change is saved at once to chrome.storage.sync; open X tabs pick it up immediately.
 * Expects lib/settings.js to be loaded first.
 *
 * Copyright (C) 2025-2026 Twitter Default Following Tab Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
(() => {
  'use strict';

  const { DEFAULT_SETTINGS, FOLLOWING_TAB_INDEX, TAB_NAMES_KEY, loadSettings, saveSettings, normalizeTabNames } =
    globalThis.TDFT;

  const STATUS_DURATION = 2000;

  /** @param {string} key @param {string[]} [substitutions] */
  function message(key, substitutions) {
    return chrome.i18n.getMessage(key, substitutions) || key;
  }

  /** Fills every [data-i18n] element with the text for the browser's language. */
  function localizePage() {
    for (const element of document.querySelectorAll('[data-i18n]')) {
      element.textContent = message(element.dataset.i18n);
    }
    for (const element of document.querySelectorAll('[data-i18n-aria-label]')) {
      element.setAttribute('aria-label', message(element.dataset.i18nAriaLabel));
    }
    document.documentElement.lang = chrome.i18n.getUILanguage();
    document.documentElement.dir = message('@@bidi_dir');
    const version = document.getElementById('version');
    if (version) {
      version.textContent = message('versionLabel', [chrome.runtime.getManifest().version]);
    }
  }

  function fallbackTabName(index) {
    if (index === 0) {
      return message('tabForYou');
    }
    return index === FOLLOWING_TAB_INDEX ? message('tabFollowing') : message('tabPinned');
  }

  /**
   * @param {string[]} names tab names last seen on X (may be empty)
   * @param {number} selected the saved tab position
   * @returns {{value: string, label: string}[]}
   */
  function buildTabOptions(names, selected) {
    const count = Math.max(names.length, 2);
    const options = [];
    for (let index = 0; index < count; index += 1) {
      const name = names[index] || fallbackTabName(index);
      options.push({ value: String(index), label: message('tabOption', [String(index + 1), name]) });
    }
    if (selected >= count) {
      options.push({ value: String(selected), label: message('tabMissing', [String(selected + 1)]) });
    }
    return options;
  }

  /**
   * Connects #enabledToggle, #defaultTabSelect, #sortOrderSelect and #status to storage.
   * @returns {Promise<{reset: () => Promise<void>}>}
   */
  async function mountSettings() {
    const ui = {
      enabled: document.getElementById('enabledToggle'),
      tab: document.getElementById('defaultTabSelect'),
      sort: document.getElementById('sortOrderSelect'),
      tabsHint: document.getElementById('tabsHint'),
      sortHint: document.getElementById('sortHint'),
      status: document.getElementById('status'),
      dependents: document.querySelectorAll('[data-requires-enabled]'),
    };

    let settings = { ...DEFAULT_SETTINGS };
    let tabNames = [];
    let statusTimer = 0;

    try {
      settings = await loadSettings(chrome.storage.sync);
    } catch (error) {
      console.error('Could not load settings:', error);
    }
    try {
      const stored = await chrome.storage.local.get(TAB_NAMES_KEY);
      tabNames = normalizeTabNames(stored[TAB_NAMES_KEY]);
    } catch (error) {
      console.error('Could not load tab names:', error);
    }
    render();
    requestAnimationFrame(() => document.body.classList.add('is-ready'));

    ui.enabled.addEventListener('change', () => save({ enabled: ui.enabled.checked }));
    ui.tab.addEventListener('change', () => save({ defaultTab: ui.tab.value }));
    ui.sort.addEventListener('change', () => save({ followingTabSort: ui.sort.value }));

    // Keep the popup and the settings page in step with each other.
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && Object.keys(changes).some((key) => key in DEFAULT_SETTINGS)) {
        loadSettings(chrome.storage.sync)
          .then((latest) => {
            settings = latest;
            render();
          })
          .catch((error) => console.error('Could not reload settings:', error));
      } else if (areaName === 'local' && changes[TAB_NAMES_KEY]) {
        tabNames = normalizeTabNames(changes[TAB_NAMES_KEY].newValue);
        render();
      }
    });

    async function save(patch, statusKey = 'statusSaved') {
      const previous = settings;
      settings = { ...settings, ...patch };
      render();
      try {
        settings = await saveSettings(chrome.storage.sync, settings);
        render();
        showStatus(statusKey, 'success');
      } catch (error) {
        console.error('Could not save settings:', error);
        settings = previous;
        render();
        showStatus('statusError', 'error');
      }
    }

    function render() {
      const isFollowing = settings.defaultTab === String(FOLLOWING_TAB_INDEX);
      ui.enabled.checked = settings.enabled;
      for (const element of ui.dependents) {
        element.classList.toggle('is-off', !settings.enabled);
      }

      const options = buildTabOptions(tabNames.length >= 2 ? tabNames : [], Number(settings.defaultTab));
      const signature = JSON.stringify(options);
      if (ui.tab.dataset.signature !== signature) {
        // Rebuilt only when the list really changed, so an open dropdown is left alone.
        ui.tab.replaceChildren(...options.map((option) => new Option(option.label, option.value)));
        ui.tab.dataset.signature = signature;
      }
      ui.tab.value = settings.defaultTab;
      ui.tab.disabled = !settings.enabled;
      ui.tabsHint.hidden = tabNames.length >= 2;

      ui.sort.value = settings.followingTabSort;
      ui.sort.disabled = !settings.enabled || !isFollowing;
      ui.sortHint.hidden = isFollowing;
    }

    function showStatus(key, kind) {
      ui.status.textContent = message(key);
      ui.status.dataset.kind = kind;
      ui.status.classList.add('is-visible');
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => ui.status.classList.remove('is-visible'), STATUS_DURATION);
    }

    return {
      reset: () => save({ ...DEFAULT_SETTINGS }, 'statusReset'),
    };
  }

  globalThis.TDFT = Object.assign(globalThis.TDFT || {}, { localizePage, mountSettings, buildTabOptions });
})();
