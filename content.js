/**
 * Twitter Default Following Tab - Content Script
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

/**
 * Automatically switches to the Following tab when opening Twitter/X homepage.
 * Works with Twitter's SPA (Single Page Application) architecture.
 *
 * Features:
 * - Seamless transition (hides "For You" content during switch)
 * - Smart content detection (waits for Following tweets to load)
 * - Adaptive performance (faster on fast networks, patient on slow networks)
 * - Language-independent (position-based tab selection)
 * - Dynamic sorting order selection (Recent vs Popular)
 */

// Debug mode - set to true for development
const DEBUG = false;

// Default settings
const DEFAULT_SETTINGS = {
  defaultTab: '1',            // Tab index 1 (Following tab by default)
  enabled: true,              // Extension enabled by default
  followingTabSort: 'recent'  // 'recent' (chronological), 'popular' (algorithmic), or 'default' (müdahale etme)
};

// Configuration constants
const TRANSITION_STYLE_ID = 'twitter-following-transition-style';
const CONTENT_CHECK_INTERVAL = 50; // ms between content checks
const MAX_CONTENT_WAIT_ATTEMPTS = 50; // max 2.5 seconds wait
const DEBOUNCE_DELAY = 100; // ms for page checks
const USER_INTERACTION_TIMEOUT = 3000; // ms - how long to respect user's manual tab choice

// State tracking
let userManuallyChangedTab = false; // Track if user manually clicked a tab
let userInteractionTimer = null; // Timer to reset user interaction flag
let lastUrl = window.location.href; // Track URL changes
let currentSettings = DEFAULT_SETTINGS; // Current settings from storage
let cachedTabCount = 0; // Cached tab count for performance

// State for active switching operations
let tabListObserver = null;
let tabListSearchTimeoutId = null;
let contentCheckIntervalId = null;
let isApplyingSort = false; // Guard to prevent loop when sorting is selected

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    currentSettings = result;
    log('Settings loaded:', currentSettings);
    return result;
  } catch (error) {
    console.error('Error loading settings:', error);
    currentSettings = DEFAULT_SETTINGS;
    return DEFAULT_SETTINGS;
  }
}

/**
 * Get current tab count from Twitter page
 * @returns {number} Number of tabs available
 */
function getTabCount() {
  const tabList = document.querySelector('[role="tablist"]');
  if (!tabList) {
    return 0;
  }

  const tabs = tabList.querySelectorAll('[role="tab"]');
  const count = tabs.length;

  if (count !== cachedTabCount) {
    cachedTabCount = count;
    log('Tab count detected:', count);

    // Send tab count to popup/options if they're listening
    chrome.runtime.sendMessage({
      type: 'TAB_COUNT_UPDATE',
      count: count
    }).catch(() => {
      // Ignore errors if popup/options not open
    });
  }

  return count;
}

/**
 * Adds CSS to hide content during tab transition
 * Prevents "For You" content from being visible during switch
 */
function addTransitionStyle() {
  if (document.getElementById(TRANSITION_STYLE_ID)) {
    return; // Already added
  }

  const style = document.createElement('style');
  style.id = TRANSITION_STYLE_ID;
  style.textContent = `
    /* Hide content while transitioning to Following tab */
    body.twitter-following-transition [role="tablist"] ~ * {
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);
  log('Transition style added');
}

/**
 * Starts the transition by hiding content
 */
function startTransition() {
  document.body.classList.add('twitter-following-transition');
  log('Transition started - content hidden');
}

/**
 * Ends the transition by showing content
 */
function endTransition() {
  // Wait a tiny moment to ensure rendering before showing
  setTimeout(() => {
    document.body.classList.remove('twitter-following-transition');
    log('Transition ended - content visible');
  }, 100);
}

/**
 * Checks if Following tab content is loaded
 * @returns {boolean} True if tweets are visible
 */
function isFollowingContentLoaded() {
  if (!isFollowingTabActive()) {
    return false;
  }

  // Twitter uses article[data-testid="tweet"] for tweet elements
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');
  const isLoaded = tweets.length > 0;

  log('Following content loaded check:', isLoaded, 'tweets:', tweets.length);
  return isLoaded;
}

/**
 * Clean up all active switching operations (intervals, timeout, observers)
 */
function cleanupActiveOperations() {
  if (tabListObserver) {
    tabListObserver.disconnect();
    tabListObserver = null;
  }
  if (tabListSearchTimeoutId) {
    clearTimeout(tabListSearchTimeoutId);
    tabListSearchTimeoutId = null;
  }
  if (contentCheckIntervalId) {
    clearInterval(contentCheckIntervalId);
    contentCheckIntervalId = null;
  }
}

/**
 * Ensures that the timeline is sorted by the user's preference (Recent vs Popular)
 */
function ensureSortOrder(onDone) {
  if (currentSettings.followingTabSort === 'default' || isApplyingSort) {
    onDone();
    return;
  }

  // Only check sort menu if default tab is active
  if (!isFollowingTabActive()) {
    onDone();
    return;
  }

  const targetTab = findTargetTab();
  if (!targetTab) {
    onDone();
    return;
  }

  log('Opening tab sort menu...');
  isApplyingSort = true;
  
  // Start transition to hide menu opening
  startTransition();
  targetTab.click(); // Click tab to open dropdown menu

  let attempts = 0;
  const menuCheckInterval = setInterval(() => {
    attempts++;
    const menu = document.querySelector('[role="menu"]');
    if (menu) {
      clearInterval(menuCheckInterval);
      const items = menu.querySelectorAll('[role="menuitem"]');
      if (items.length >= 2) {
        // Attempt to find the "Recent" and "Popular" items robustly by text content
        let recentItem = null;
        let popularItem = null;

        items.forEach(item => {
          const text = item.textContent?.toLowerCase() || '';
          if (text.includes('recent') || text.includes('son') || text.includes('chronological') || text.includes('new')) {
            recentItem = item;
          } else if (text.includes('popular') || text.includes('popüler') || text.includes('top')) {
            popularItem = item;
          }
        });

        // Fallbacks if text matching fails
        if (!popularItem) popularItem = items[0];
        if (!recentItem) recentItem = items[1];

        const targetSortItem = currentSettings.followingTabSort === 'recent' ? recentItem : popularItem;
        const isAlreadySelected = targetSortItem.querySelector('svg') !== null;

        if (!isAlreadySelected) {
          log('Selecting target sort order:', currentSettings.followingTabSort);
          targetSortItem.click();
          // Wait for feed to reload
          waitForFollowingContent(onDone, true);
        } else {
          log('Target sort order already selected, closing menu...');
          targetTab.click(); // Click again to close menu
          isApplyingSort = false;
          onDone();
        }
      } else {
        targetTab.click(); // Close menu
        isApplyingSort = false;
        onDone();
      }
    } else if (attempts >= 20) { // Timeout after 1 second
      clearInterval(menuCheckInterval);
      log('Timeout waiting for sort menu');
      isApplyingSort = false;
      onDone();
    }
  }, 50);
}

/**
 * Waits for Following tab content to load
 */
function waitForFollowingContent(onDone, skipSort = false) {
  let attempts = 0;

  contentCheckIntervalId = setInterval(() => {
    attempts++;

    if (isFollowingContentLoaded()) {
      log('Following content loaded after', attempts, 'attempts');
      cleanupActiveOperations();
      
      if (!skipSort) {
        ensureSortOrder(() => {
          isApplyingSort = false;
          onDone();
        });
      } else {
        isApplyingSort = false;
        onDone();
      }
    } else if (attempts >= MAX_CONTENT_WAIT_ATTEMPTS) {
      log('Timeout waiting for Following content after', attempts, 'attempts');
      cleanupActiveOperations();
      isApplyingSort = false;
      onDone();
    }
  }, CONTENT_CHECK_INTERVAL);
}

/**
 * Logging utility for debug mode
 */
function log(...args) {
  if (DEBUG) {
    console.log('[Twitter Following Tab]', ...args);
  }
}

/**
 * Marks that user manually changed tabs
 * Prevents auto-switching for a period of time to respect user choice
 */
function markUserInteraction() {
  userManuallyChangedTab = true;
  log('User manually changed tab - respecting their choice');

  // Clear existing timer
  if (userInteractionTimer) {
    clearTimeout(userInteractionTimer);
  }

  // Reset flag after timeout (if user navigates, it will be reset immediately)
  userInteractionTimer = setTimeout(() => {
    userManuallyChangedTab = false;
    log('User interaction timeout - auto-switching enabled again');
  }, USER_INTERACTION_TIMEOUT);
}

/**
 * Resets user interaction flag on navigation
 * Called when user navigates to homepage via URL change
 */
function resetUserInteraction() {
  userManuallyChangedTab = false;
  if (userInteractionTimer) {
    clearTimeout(userInteractionTimer);
    userInteractionTimer = null;
  }
  log('Navigation detected - reset user interaction flag');
}

/**
 * Sets up tab click listeners to detect user manual interaction
 */
function setupTabClickListeners() {
  // Use event delegation on document to catch all tab clicks
  document.addEventListener('click', (event) => {
    // Check if click was on a tab element
    const target = event.target.closest('[role="tab"]');
    if (target && isHomePage()) {
      // User manually clicked a tab
      markUserInteraction();
    }
  }, true); // Use capture phase to catch before other handlers

  log('Tab click listeners setup complete');
}

/**
 * Checks if current page is Twitter/X homepage
 * @returns {boolean} True if on homepage
 */
function isHomePage() {
  const path = window.location.pathname;
  return path === '/' || path === '/home';
}

/**
 * Checks if the target tab (based on settings) is currently active
 * @returns {boolean} True if target tab is active
 */
function isFollowingTabActive() {
  // If disabled, return true to prevent switching
  if (!currentSettings.enabled || currentSettings.defaultTab === 'disabled') {
    return true;
  }

  const tabList = document.querySelector('[role="tablist"]');
  if (!tabList) {
    return false;
  }

  const tabs = tabList.querySelectorAll('[role="tab"]');
  const targetIndex = parseInt(currentSettings.defaultTab);

  // Need at least 2 tabs (For You, Following)
  if (tabs.length < 2) {
    return false;
  }

  // Check if we have enough tabs
  if (targetIndex < 0 || targetIndex >= tabs.length) {
    return false;
  }

  // Check if target tab is active
  const targetTab = tabs[targetIndex];
  return targetTab.getAttribute('aria-selected') === 'true';
}

/**
 * Finds the target tab element based on user settings
 * Uses position-based selection (language-independent)
 */
function findTargetTab() {
  // Check if extension is disabled
  if (!currentSettings.enabled || currentSettings.defaultTab === 'disabled') {
    log('Extension is disabled');
    return null;
  }

  const tabList = document.querySelector('[role="tablist"]');
  if (!tabList) {
    log('Tab list not found');
    return null;
  }

  const tabs = tabList.querySelectorAll('[role="tab"]');
  const targetIndex = parseInt(currentSettings.defaultTab);

  // Update cached tab count
  getTabCount();

  if (tabs.length < 2) {
    log('Not enough tabs found:', tabs.length);
    return null;
  }

  // Check if target index is valid
  if (targetIndex < 0 || targetIndex >= tabs.length) {
    log('Target tab index out of range:', targetIndex, 'available tabs:', tabs.length);
    return null;
  }

  const targetTab = tabs[targetIndex];
  log('Found target tab at index', targetIndex, ':', targetTab);

  return targetTab;
}

/**
 * Helper to wait for the tab list to be rendered in the DOM
 */
function waitForTabList() {
  // Set up temporary MutationObserver specifically looking for the tab list
  tabListObserver = new MutationObserver((mutations, obs) => {
    const tabList = document.querySelector('[role="tablist"]');
    if (tabList && tabList.querySelectorAll('[role="tab"]').length >= 2) {
      log('Tab list found via MutationObserver');
      obs.disconnect();
      tabListObserver = null;
      if (tabListSearchTimeoutId) {
        clearTimeout(tabListSearchTimeoutId);
        tabListSearchTimeoutId = null;
      }
      executeTabSwitch();
    }
  });

  tabListObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Safety timeout: 3 seconds to find tab list
  tabListSearchTimeoutId = setTimeout(() => {
    log('Timeout waiting for tab list');
    cleanupActiveOperations();
    endTransition();
  }, 3000);
}

/**
 * Clicks the target tab (based on settings) and manages transition
 */
function executeTabSwitch() {
  // Don't auto-switch if extension is disabled
  if (!currentSettings.enabled || currentSettings.defaultTab === 'disabled') {
    log('Extension is disabled - skipping auto-switch');
    endTransition();
    return;
  }

  // Don't auto-switch if user manually selected a different tab
  if (userManuallyChangedTab) {
    log('User manually changed tab - skipping auto-switch');
    endTransition();
    return;
  }

  if (isFollowingTabActive()) {
    log('Target tab already active');
    if (isFollowingContentLoaded()) {
      ensureSortOrder(endTransition);
    } else {
      waitForFollowingContent(endTransition);
    }
    return;
  }

  const targetTab = findTargetTab();
  if (targetTab) {
    log('Found target tab, clicking...');
    startTransition();
    targetTab.click();
    waitForFollowingContent(endTransition);
  } else {
    log('Target tab not found, ending transition');
    endTransition();
  }
}

/**
 * Handles page changes and switches to Following tab if needed
 */
function handlePageChange() {
  cleanupActiveOperations();

  if (!isHomePage()) {
    endTransition();
    return;
  }

  log('On homepage, checking tabs...');
  resetUserInteraction();

  if (!currentSettings.enabled || currentSettings.defaultTab === 'disabled') {
    endTransition();
    return;
  }

  // Hide content immediately (before "For You" tab is visible)
  if (!isFollowingTabActive()) {
    startTransition();
  }

  // Check if tabs are already loaded in the DOM
  const tabList = document.querySelector('[role="tablist"]');
  if (tabList && tabList.querySelectorAll('[role="tab"]').length >= 2) {
    log('Tab list already present, executing switch immediately');
    executeTabSwitch();
  } else {
    log('Tab list not present, waiting...');
    waitForTabList();
  }
}

/**
 * Debounced wrapper for page changes to prevent rapid repeated calls
 */
const debouncedHandlePageChange = (() => {
  let timeout;
  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(handlePageChange, DEBOUNCE_DELAY);
  };
})();

/**
 * Initializes the extension
 */
async function initialize() {
  log('Initializing extension...');

  // Load settings from storage first
  await loadSettings();

  // Add transition CSS
  addTransitionStyle();

  // Setup tab click listeners to detect user manual interactions
  setupTabClickListeners();

  // Initial page check
  handlePageChange();

  // Listen for settings changes (syncing real-time across tabs/panels)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      let changed = false;
      if (changes.defaultTab) {
        log('Settings changed (defaultTab):', changes.defaultTab.newValue);
        currentSettings.defaultTab = changes.defaultTab.newValue;
        changed = true;
      }
      if (changes.enabled) {
        log('Settings changed (enabled):', changes.enabled.newValue);
        currentSettings.enabled = changes.enabled.newValue;
        changed = true;
      }
      if (changes.followingTabSort) {
        log('Settings changed (followingTabSort):', changes.followingTabSort.newValue);
        currentSettings.followingTabSort = changes.followingTabSort.newValue;
        changed = true;
      }

      if (changed && isHomePage()) {
        resetUserInteraction();
        handlePageChange();
      }
    }
  });

  // Setup lightweight URL polling checker (SPA navigation support)
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      log('URL change detected:', lastUrl);
      debouncedHandlePageChange();
    }
  }, 200);

  // Listen for popstate (back/forward buttons) for instant updates
  window.addEventListener('popstate', () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      log('popstate detected');
      debouncedHandlePageChange();
    }
  });

  log('Initialization complete');
}

// Start the extension when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
