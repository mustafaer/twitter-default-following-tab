/**
 * Twitter Default Following Tab: toolbar popup.
 *
 * Copyright (C) 2025-2026 Twitter Default Following Tab Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
(() => {
  'use strict';

  const { localizePage, mountSettings } = globalThis.TDFT;

  localizePage();

  document.getElementById('openOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  mountSettings().catch((error) => console.error('Could not show the settings:', error));
})();
