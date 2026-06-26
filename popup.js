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
  defaultTab: '1',            // Tab index 1 (Following tab by default)
  enabled: true,              // Extension enabled by default
  followingTabSort: 'recent'  // 'recent' (chronological), 'popular' (algorithmic), or 'default' (müdahale etme)
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
let statusTimeout = null;
function showStatus(message) {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.className = 'status success show';

  if (statusTimeout) {
    clearTimeout(statusTimeout);
  }

  statusTimeout = setTimeout(() => {
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
          const clone = tab.cloneNode(true);
          clone.querySelectorAll('svg').forEach(svg => svg.remove());
          return clone.textContent?.trim() || '';
        }).filter(name => name);

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

  // Add disabled option (legacy support)
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
  const enabledToggle = document.getElementById('enabledToggle');
  const sortOrderSelect = document.getElementById('sortOrderSelect');
  const sortOrderGroup = document.getElementById('sortOrderGroup');
  const selectElement = document.getElementById('defaultTabSelect');

  // Load current settings
  const settings = await loadSettings();

  // Initialize UI controls
  enabledToggle.checked = settings.enabled;
  sortOrderSelect.value = settings.followingTabSort;
  selectElement.disabled = !settings.enabled;
  sortOrderSelect.disabled = !settings.enabled;
  
  if (!settings.enabled) {
    sortOrderGroup.classList.add('disabled');
  }

  // Get tab info from active page
  const tabInfo = await getTabInfoFromPage();

  // Populate dropdown dynamically
  await populateDropdown(tabInfo, settings.defaultTab);

  // Setup enabled toggle change handler
  enabledToggle.addEventListener('change', async () => {
    const isEnabled = enabledToggle.checked;
    selectElement.disabled = !isEnabled;
    sortOrderSelect.disabled = !isEnabled;
    
    if (isEnabled) {
      sortOrderGroup.classList.remove('disabled');
    } else {
      sortOrderGroup.classList.add('disabled');
    }
    
    const success = await saveSettings({ enabled: isEnabled });
    if (success) {
      showStatus(isEnabled ? '✓ Extension Enabled' : '✓ Extension Disabled');
    }
  });

  // Setup sort order select change handler
  sortOrderSelect.addEventListener('change', async () => {
    const success = await saveSettings({ followingTabSort: sortOrderSelect.value });
    if (success) {
      showStatus('✓ Sort Preference Saved');
    }
  });

  // Setup dropdown change handler
  selectElement.addEventListener('change', async () => {
    const success = await saveSettings({ defaultTab: selectElement.value });
    if (success) {
      showStatus('✓ Tab Preference Saved');
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

  // Real-time synchronization: sync UI if settings change from options page
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      if (changes.enabled) {
        enabledToggle.checked = changes.enabled.newValue;
        selectElement.disabled = !changes.enabled.newValue;
        sortOrderSelect.disabled = !changes.enabled.newValue;
        if (changes.enabled.newValue) {
          sortOrderGroup.classList.remove('disabled');
        } else {
          sortOrderGroup.classList.add('disabled');
        }
      }
      if (changes.followingTabSort) {
        sortOrderSelect.value = changes.followingTabSort.newValue;
      }
      if (changes.defaultTab) {
        selectElement.value = changes.defaultTab.newValue;
      }
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
