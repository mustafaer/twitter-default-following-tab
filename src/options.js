/**
 * Twitter Default Following Tab: settings page.
 *
 * Copyright (C) 2025-2026 Twitter Default Following Tab Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
(() => {
  'use strict';

  const { localizePage, mountSettings } = globalThis.TDFT;

  localizePage();
  document.title = `${chrome.i18n.getMessage('optionsTitle')} · ${chrome.i18n.getMessage('extName')}`;

  mountSettings()
    .then((settings) => {
      document.getElementById('resetButton').addEventListener('click', () => settings.reset());
    })
    .catch((error) => console.error('Could not show the settings:', error));
})();
