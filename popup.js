/**
 * Twitter Default Following Tab - Popup Script
 *
 * Copyright (C) 2025 Twitter Default Following Tab Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// Default settings
const DEFAULT_SETTINGS = {
  defaultTab: '1' // Tab index 1 (Following tab by default)
};

/**
 * Load saved settings from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    return result;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to storage
 */
async function saveSettings(settings) {
  try {
    await chrome.storage.sync.set(settings);
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

/**
 * Show status message
 */
function showStatus(message) {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.className = 'status success show';

  setTimeout(() => {
    statusElement.classList.remove('show');
  }, 2000);
}

/**
 * Get tab info (count and names) from active Twitter tab
 */
async function getTabInfoFromPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if it's a Twitter/X page
    if (!tab || (!tab.url?.includes('twitter.com') && !tab.url?.includes('x.com'))) {
      return { count: 2, names: ['For You', 'Following'] };
    }

    // Execute script to get tab info from page
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const tabList = document.querySelector('[role="tablist"]');
        if (!tabList) return { count: 2, names: ['For You', 'Following'] };

        const tabs = tabList.querySelectorAll('[role="tab"]');
        const names = Array.from(tabs).map(tab => {
          // Structure: div[role="tab"] > div > div[dir="ltr"] > span
          // Get the first div inside the tab
          const firstDiv = tab.querySelector('div');
          if (!firstDiv) return '';

          // Get the div with dir="ltr" attribute (text container)
          const textContainer = firstDiv.querySelector('div[dir="ltr"]');
          if (!textContainer) return '';

          // Get the first span inside (contains the tab name)
          const span = textContainer.querySelector('span');
          if (span) {
            return span.textContent?.trim() || '';
          }

          return '';
        }).filter(name => name); // Remove empty names

        return { count: tabs.length || 2, names: names.length > 0 ? names : ['For You', 'Following'] };
      }
    });

    return results[0]?.result || { count: 2, names: ['For You', 'Following'] };
  } catch (error) {
    console.error('Error getting tab info:', error);
    return { count: 2, names: ['For You', 'Following'] };
  }
}

/**
 * Populate dropdown with dynamic tab count and names
 */
async function populateDropdown(tabInfo, selectedValue) {
  const selectElement = document.getElementById('defaultTabSelect');
  selectElement.innerHTML = ''; // Clear existing options

  const { count, names } = tabInfo;

  // Add options based on tab count
  for (let i = 0; i < Math.max(count, 4); i++) {
    const option = document.createElement('option');
    option.value = i.toString();

    // Use actual tab name if available
    const tabName = names[i] || `Tab ${i}`;
    option.textContent = `Tab ${i} (${tabName})`;

    // Disable if tab doesn't exist
    if (i >= count) {
      option.textContent = `Tab ${i} (Not available)`;
      option.disabled = true;
    }

    selectElement.appendChild(option);
  }

  // Add disabled option
  const disabledOption = document.createElement('option');
  disabledOption.value = 'disabled';
  disabledOption.textContent = 'Disabled';
  selectElement.appendChild(disabledOption);

  // Set selected value
  selectElement.value = selectedValue;
}

/**
 * Initialize the popup
 */
async function initialize() {
  const selectElement = document.getElementById('defaultTabSelect');

  // Load current settings
  const settings = await loadSettings();

  // Get tab info from active page
  const tabInfo = await getTabInfoFromPage();

  // Populate dropdown dynamically
  await populateDropdown(tabInfo, settings.defaultTab);

  // Setup dropdown change handler
  selectElement.addEventListener('change', async () => {
    const settings = {
      defaultTab: selectElement.value
    };

    const success = await saveSettings(settings);
    if (success) {
      showStatus('✓ Saved!');
    }
  });

  // Setup settings button
  document.getElementById('settingsBtn').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // Listen for tab info updates from content script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TAB_COUNT_UPDATE') {
      // Refresh tab info
      getTabInfoFromPage().then(info => populateDropdown(info, selectElement.value));
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

