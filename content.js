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
 */

// Debug mode - set to true for development
const DEBUG = false;

// Configuration constants
const TRANSITION_STYLE_ID = 'twitter-following-transition-style';
const CONTENT_CHECK_INTERVAL = 50; // ms between content checks
const MAX_CONTENT_WAIT_ATTEMPTS = 50; // max 2.5 seconds wait
const DEBOUNCE_DELAY = 200; // ms
const INITIAL_TAB_CHECK_DELAY = 100; // ms
const PAGE_LOAD_CHECK_DELAY = 150; // ms
const TRANSITION_END_DELAY = 100; // ms

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
  setTimeout(() => {
    document.body.classList.remove('twitter-following-transition');
    log('Transition ended - content visible');
  }, TRANSITION_END_DELAY);
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
 * Waits for Following tab content to load
 * @param {Function} callback - Called with (success: boolean) when done
 * @param {number} maxAttempts - Maximum number of check attempts
 */
function waitForFollowingContent(callback, maxAttempts = MAX_CONTENT_WAIT_ATTEMPTS) {
  let attempts = 0;

  const checkInterval = setInterval(() => {
    attempts++;

    if (isFollowingContentLoaded()) {
      clearInterval(checkInterval);
      log('Following content loaded after', attempts, 'attempts');
      callback(true);
    } else if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      log('Timeout waiting for Following content after', attempts, 'attempts');
      callback(false); // Timeout - show content anyway
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
 * Checks if current page is Twitter/X homepage
 * @returns {boolean} True if on homepage
 */
function isHomePage() {
  const path = window.location.pathname;
  return path === '/' || path === '/home';
}

/**
 * Checks if the Following tab is currently active
 * @returns {boolean} True if Following tab is active
 */
function isFollowingTabActive() {
  const tabList = document.querySelector('[role="tablist"]');
  if (!tabList) {
    return false;
  }

  const tabs = tabList.querySelectorAll('[role="tab"]');

  // Need at least 2 tabs (For You, Following)
  if (tabs.length < 2) {
    return false;
  }

  // Check if second tab (Following) is active
  const secondTab = tabs[1];
  return secondTab.getAttribute('aria-selected') === 'true';
}

/**
 * Finds the Following tab element
 * Uses position-based selection (language-independent)
 *
 * Twitter tab order is always:
 * 1. For You (index 0)
 * 2. Following (index 1)
 * 3. Other custom tabs (if any)
 *
 * @returns {Element|null} The Following tab element or null
 */
function findFollowingTab() {
  const tabList = document.querySelector('[role="tablist"]');
  if (!tabList) {
    log('Tab list not found');
    return null;
  }

  const tabs = tabList.querySelectorAll('[role="tab"]');

  if (tabs.length < 2) {
    log('Not enough tabs found:', tabs.length);
    return null;
  }

  // Return second tab (Following)
  const followingTab = tabs[1];
  log('Found second tab (Following) at index 1:', followingTab);

  return followingTab;
}

/**
 * Clicks the Following tab and manages transition
 * @returns {boolean} True if successful
 */
function clickFollowingTab() {
  // Skip if Following tab is already active
  if (isFollowingTabActive()) {
    log('Following tab already active, skipping...');

    // Check if content is loaded
    if (isFollowingContentLoaded()) {
      endTransition(); // Content ready, show immediately
    } else {
      // Wait for content to load
      waitForFollowingContent(() => {
        endTransition();
      });
    }
    return true;
  }

  const followingTab = findFollowingTab();

  if (followingTab) {
    log('Found Following tab, clicking...', followingTab);

    // Hide content during transition
    startTransition();

    // Click the tab
    followingTab.click();

    // Wait for content to load before showing
    waitForFollowingContent((success) => {
      if (success) {
        log('Following content loaded successfully');
      } else {
        log('Timeout - showing content anyway');
      }
      endTransition();
    });

    return true;
  } else {
    log('Following tab not found');
    endTransition(); // If tab not found, remove transition
    return false;
  }
}

/**
 * Debounce utility to prevent rapid repeated calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Handles page changes and switches to Following tab if needed
 */
const handlePageChange = debounce(() => {
  if (isHomePage()) {
    log('On home page, checking tabs...');

    // Hide content immediately (before "For You" tab is visible)
    if (!isFollowingTabActive()) {
      startTransition();
    }

    // Wait for DOM to be ready before switching tabs
    setTimeout(() => {
      clickFollowingTab();
    }, INITIAL_TAB_CHECK_DELAY);
  }
}, DEBOUNCE_DELAY);

/**
 * MutationObserver instance to watch for DOM changes
 */
let observer = null;

/**
 * Sets up MutationObserver to watch for DOM changes
 * Monitors Twitter's dynamic content loading
 */
function setupObserver() {
  // Disconnect existing observer if any
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    // Only process relevant changes (added nodes)
    const hasRelevantChanges = mutations.some(mutation =>
      mutation.type === 'childList' && mutation.addedNodes.length > 0
    );

    if (hasRelevantChanges && isHomePage()) {
      log('DOM changed on home page');
      handlePageChange();
    }
  });

  // Observe the entire body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  log('MutationObserver setup complete');
}

/**
 * Initializes the extension
 * Sets up observers and intercepts history changes
 */
function initialize() {
  log('Initializing extension...');

  // Add transition CSS
  addTransitionStyle();

  // Initial check if on homepage
  if (isHomePage()) {
    // Hide content immediately
    if (!isFollowingTabActive()) {
      startTransition();
    }

    // Check and switch tabs after DOM is ready
    setTimeout(() => {
      clickFollowingTab();
    }, PAGE_LOAD_CHECK_DELAY);
  }

  // Setup DOM observer
  setupObserver();

  // Intercept History API for SPA navigation
  // Twitter uses pushState/replaceState for navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    log('pushState detected');
    handlePageChange();
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    log('replaceState detected');
    handlePageChange();
  };

  // Listen for popstate (back/forward buttons)
  window.addEventListener('popstate', () => {
    log('popstate detected');
    handlePageChange();
  });

  log('Initialization complete');
}

// Start the extension when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

