/**
 * Twitter Default Following Tab: content script entry point.
 *
 * Runs at document_start on x.com and twitter.com, after lib/settings.js, lib/x-page.js and
 * lib/controller.js (see manifest.json). It wires the controller to chrome.storage.
 *
 * Debug logging: run `localStorage.setItem('tdft:debug', '1')` in the X tab's console and reload.
 *
 * Copyright (C) 2025-2026 Twitter Default Following Tab Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
(() => {
  'use strict';

  const { createController, loadSettings, DEFAULT_SETTINGS, TAB_NAMES_KEY } = globalThis.TDFT;

  const debug = (() => {
    try {
      return window.localStorage.getItem('tdft:debug') === '1';
    } catch {
      return false;
    }
  })();
  const log = debug ? (...args) => console.debug('[Default Following Tab]', ...args) : () => {};

  /** chrome.* calls throw once the extension is updated or removed while this page stays open. */
  const isAlive = () => Boolean(globalThis.chrome && chrome.runtime && chrome.runtime.id);

  let settings = { ...DEFAULT_SETTINGS };

  async function refreshSettings() {
    try {
      settings = await loadSettings(chrome.storage.sync);
      log('Settings:', settings);
    } catch (error) {
      log('Could not read settings, using defaults:', error);
    }
  }

  const controller = createController({
    window,
    getSettings: () => settings,
    isAlive,
    log,
    onTabNames(names) {
      if (isAlive()) {
        chrome.storage.local.set({ [TAB_NAMES_KEY]: names }).catch((error) => log('Could not save tab names:', error));
      }
    },
  });

  controller.start({ ready: refreshSettings() });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync' || !Object.keys(changes).some((key) => key in DEFAULT_SETTINGS)) {
      return;
    }
    refreshSettings().then(() => controller.settingsChanged());
  });
})();
