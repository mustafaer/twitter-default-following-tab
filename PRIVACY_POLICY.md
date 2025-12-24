# Privacy Policy for Twitter Default Following Tab

**Last Updated:** December 24, 2024  
**Version:** 2.0.0

## Overview

Twitter Default Following Tab is a browser extension that automatically switches to your chosen default tab (Following, Community, or any other tab) when you visit Twitter/X. This privacy policy explains how the extension works and what data it does and does not collect.

## Data Collection

**We collect and store MINIMAL data - only your tab preference setting.**

### What We Store:
- ✅ Your tab preference (one simple setting: "0", "1", "2", "3", "4", or "disabled")
- ✅ Stored locally in Chrome sync storage
- ✅ Approximately 20 bytes of data
- ✅ Example: `{"defaultTab": "1"}`

### What We DON'T Collect:
- ❌ No personal information (name, email, etc.)
- ❌ No browsing history or analytics
- ❌ No tracking of any kind
- ❌ No external server communication
- ❌ No tweets, messages, or profile information
- ❌ No monitoring of what you read, write, or interact with

**Important:** Your tab preference is stored locally in your browser. If you have Chrome sync enabled, it will sync across your devices via Google's encrypted sync service (we have no access to this data).

## How the Extension Works

The extension operates entirely locally in your browser and only performs the following actions:

1. **Detects when you visit Twitter/X homepage** - Monitors the current page URL
2. **Reads your preference** - Retrieves your saved tab preference from Chrome sync storage
3. **Identifies tab navigation** - Locates all available tabs (For You, Following, Community tabs, etc.)
4. **Extracts tab names** - Reads actual tab names from Twitter's page structure (only when you open settings)
5. **Clicks your chosen tab** - Simulates a click on your preferred tab if not already active
6. **Manages visual transitions** - Temporarily hides content during tab switch for seamless experience

All operations happen locally in your browser. **No data is sent to external servers.** Your tab preference is stored only in your browser's local storage and optionally synced via Chrome's built-in sync (if enabled).

## Permissions

The extension requires the following permissions to function:

### Host Permissions
- **`https://twitter.com/*`**
- **`https://x.com/*`**

**Why:** These permissions allow the extension to run on Twitter/X pages and interact with the page DOM to switch tabs.

### Storage Permission
- **`storage`**

**Why:** To save your tab preference locally in your browser. Your setting is stored using Chrome's sync storage API:
- ✅ Stored locally in your browser
- ✅ Optionally synced across your devices (only if Chrome sync is enabled)
- ✅ Never sent to our servers (we don't have any!)
- ✅ Only contains: `{"defaultTab": "1"}` (or "0", "2", "3", "4", "disabled")
- ✅ Can be deleted by uninstalling the extension

### Scripting Permission
- **`scripting`**

**Why:** To detect available tabs and extract their names from Twitter's page:
- Only runs when you open the extension popup/settings
- Reads tab structure from current Twitter page
- Extracts real tab names (e.g., "Following", "Crypto", "Tech News")
- Does not run continuously, only on-demand

### Active Tab Permission
- **`activeTab`**

**Why:** Temporary permission to read current Twitter page when you open settings:
- Only active when you click the extension icon
- Used to detect how many tabs you have
- Helps show which tabs are available
- No background access to your tabs

### Permissions We Do NOT Use
- ❌ Access to all tabs or browsing history
- ❌ Access to cookies
- ❌ Access to clipboard
- ❌ Access to downloads
- ❌ Access to notifications
- ❌ Access to websites other than Twitter/X
- ❌ Background scripts or persistent connections
- ❌ Web requests or network monitoring

## Data Storage

### What We Store (Locally Only)

The extension stores **only one setting** in your browser's local storage:

**Stored Data:**
- Your tab preference: `{"defaultTab": "1"}`
- Possible values: "0", "1", "2", "3", "4", or "disabled"

**Storage Location:**
- Chrome sync storage (local to your browser)
- Optionally synced via Chrome's built-in sync feature (if enabled)

**Total Size:**
- Approximately 20 bytes

### What We Do NOT Store
- ❌ No personal information
- ❌ No browsing history
- ❌ No cookies
- ❌ No tweets or Twitter content
- ❌ No analytics or tracking data
- ❌ No user identification
- ❌ No cached pages
- ❌ No session data

### Storage Security
Your tab preference is:
- ✅ Stored only in your browser
- ✅ Not transmitted to external servers
- ✅ Not accessible to websites
- ✅ Not shared with third parties
- ✅ Deleted when you uninstall the extension
- ✅ Only accessible by this extension

## Open Source

This extension is open source software licensed under the GNU General Public License v3.0. You can review the complete source code at:

**GitHub Repository:** https://github.com/mustafaer/twitter-default-following-tab

The open source nature ensures complete transparency - you can verify that the extension does exactly what it claims and nothing more.

## Third-Party Services

This extension does NOT integrate with, communicate with, or rely on any third-party services, including:
- No analytics services (e.g., Google Analytics)
- No error tracking services
- No advertising networks
- No data collection platforms
- No remote servers or APIs

## Updates

The extension may be updated periodically to:
- Fix bugs or improve performance
- Adapt to changes in Twitter/X's website structure
- Add user-requested features

Any updates will maintain the same privacy-respecting principles. If we ever need to change this privacy policy, the updated version will be posted in the GitHub repository with a new "Last Updated" date.

## Your Rights

### Data You Can Control

Since we only store your tab preference setting:

**You can:**
- ✅ **View your data**: Open extension settings to see your current tab preference
- ✅ **Change your data**: Change your tab preference anytime via the popup/settings
- ✅ **Delete your data**: Uninstall the extension to remove all stored data
- ✅ **Export your data**: Your setting is just one simple value (e.g., "1") - you can note it if needed

**What we store about you:**
- Just your tab preference (one small setting)
- No personal information
- No usage history
- No tracking data

## Children's Privacy

This extension stores only a tab preference setting and does not collect any personal information from anyone, including children under the age of 13 (or the applicable age in your jurisdiction).

## International Users

The extension stores only your tab preference locally and does not transmit data to external servers. It complies with privacy regulations worldwide, including:
- GDPR (General Data Protection Regulation - EU)
- CCPA (California Consumer Privacy Act - USA)
- PIPEDA (Personal Information Protection and Electronic Documents Act - Canada)
- And other international privacy laws

## Contact

If you have questions about this privacy policy or the extension, you can:

1. **Open an issue** on GitHub: https://github.com/mustafaer/twitter-default-following-tab/issues
2. **Contact the author**: Check the GitHub repository for contact information

## Consent

By installing and using this extension, you acknowledge that:
- You have read and understood this privacy policy
- You understand that the extension stores only your tab preference setting
- You agree to the extension's functionality as described

## License

This extension is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This extension is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

---

## Summary

**Privacy-First Design:**
- ✅ Stores only your tab preference (one simple setting: ~20 bytes)
- ✅ No personal data collection
- ✅ No tracking or analytics
- ✅ No external server communication
- ✅ All operations happen locally in your browser
- ✅ Open source - verify the code yourself

**What we store:**
```json
{"defaultTab": "1"}
```
That's it! Just your tab choice. No personal information, no history, no tracking.

**Your tab preference is stored locally in your browser** and optionally synced across your devices via Chrome's encrypted sync feature (controlled by Google, not us).

We believe in transparency: Check our [source code on GitHub](https://github.com/mustafaer/twitter-default-following-tab) to verify everything stated in this policy.

