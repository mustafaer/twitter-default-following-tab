# Privacy Policy: Twitter Default Following Tab

**Last updated:** 25 November 2026
**Applies to:** version 2.1.0 and later

Twitter Default Following Tab is a browser extension that opens the tab you choose (Following by default) when you visit the X (Twitter) home page, and can set the Following timeline's sort order. This policy explains exactly what the extension stores and what it does not do.

## Summary

- The extension **does not collect, sell or share any personal data.**
- It **never sends anything over the network**: no servers, analytics, error reporting, ads or third-party services. Its pages use your system fonts and load nothing from the web.
- It stores three settings and the names of your home tabs, **in your own browser**. Nothing else.
- It is open source, so you can check every line: <https://github.com/mustafaer/twitter-default-following-tab>

## What the extension stores

| What | Example | Where | Why |
| --- | --- | --- | --- |
| Auto-switch on or off | `"enabled": true` | `chrome.storage.sync` | Your on/off choice |
| Default tab position | `"defaultTab": "1"` | `chrome.storage.sync` | Which home tab to open (counted from 0) |
| Following sort | `"followingTabSort": "recent"` | `chrome.storage.sync` | `recent`, `popular` or `default` (leave as is) |
| Names of your home tabs | `["For you", "Following", "My list"]` | `chrome.storage.local` | To label the choices in the settings with your real tab names |

- **Settings** live in Chrome's sync storage. If you have turned on Chrome sync, Google syncs them between your own devices, under Google's privacy policy. The extension's author never receives them.
- **Tab names** are the visible titles of the tabs on your X home page, such as the names of pinned lists or communities. They stay in local storage on this device only and are never synced or sent anywhere.

## What the extension does not do

- It does not read, store or send your posts, messages, likes, follows, profile, account details or browsing history.
- It does not track you, log your activity or build any profile.
- It does not use cookies, does not make network requests and does not run any remote code.
- It does not run on any website other than `x.com` and `twitter.com`.

## How it works

On `x.com` and `twitter.com` the extension's content script:

1. checks whether the page is the home page;
2. reads your settings from browser storage;
3. clicks your chosen tab if it is not already open, and sets the Following sort if you asked for one, hiding the timeline for a moment so the switch is not visible;
4. stores the names of your home tabs locally (only if they have changed).

All of this happens inside your browser.

## Permissions

| Permission | Why it is needed |
| --- | --- |
| `storage` | Saves your settings and the tab names described above. |
| Content script on `https://x.com/*` and `https://twitter.com/*` | Lets the extension open your chosen tab on X. Chrome shows this as "Read and change your data on x.com and twitter.com". The extension only reads the home page's tabs and timeline structure and clicks tabs, as described above. |

The extension has no background script and does not use the `tabs`, `scripting`, `activeTab`, `cookies`, `history` or `webRequest` permissions.

## Your control over the data

- **See or change** your settings at any time in the extension's popup or settings page.
- **Restore defaults** with the button on the settings page.
- **Delete everything**: uninstalling the extension removes all of its stored data from your browser. Chrome may keep the synced settings in your Google account until sync catches up; you can clear synced data in your Google account settings.

## Earlier versions

Version 2.0.0 stored only the default tab position, and version 2.0.1 stored the same three settings as 2.1.0, both in `chrome.storage.sync`. Neither kept tab names. When you opened their popup or settings page:

- they used the `scripting` and `activeTab` permissions to read the names of the tabs on an open X page, without storing them;
- version 2.0.1 also loaded the Inter font from Google Fonts, a request to Google's servers that, like any web request, includes your IP address.

Version 2.1.0 removes both. Chrome updates the extension automatically.

## Children

The extension does not collect personal information from anyone, including children.

## Changes to this policy

If the extension ever starts to store or handle data differently, this policy will be updated before that version is released, with a new "Last updated" date. Past versions are available in the repository history.

## Contact

Questions or concerns: open an issue at <https://github.com/mustafaer/twitter-default-following-tab/issues>.

---

Twitter Default Following Tab is not affiliated with or endorsed by X Corp. "X" and "Twitter" are trademarks of their respective owners.
