# Changelog

All notable changes to this extension are listed here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [2.1.0] - 2026-11-25

A reliability, privacy and polish release. Settings from 2.0.x carry over automatically.

### Fixed

- **No more "For you" flash.** The old hiding rule (`[role="tablist"] ~ *`) matched nothing on today's x.com, so the wrong feed could show while switching. The timeline itself is now hidden, from before X draws the page until the right feed has loaded. This also works when you return to Home without reloading.
- **Sort order only touches the Following tab.** Before, the extension clicked whichever tab was the default to look for a sort menu. With "For you" or a pinned tab as the default, that meant an extra click and up to a second of delay on every visit.
- **Sort detection is reliable and language-independent.** It used to match fragments such as "son", "new" and "top" (which also match "person", "news" and "stop"). It now matches X's exact labels and falls back to the menu position (Popular, then Recent) in other languages, after checking the menu really is the sort menu.
- **The sort menu no longer flashes open.** It is opened and closed invisibly, once per page visit and whenever you change the setting.
- **Pinned tabs work after a fresh load.** Pinned lists and communities render about 300 ms after "For you" and "Following"; the extension now waits for the tab at your chosen position instead of giving up.
- **The popup no longer shows the wrong tab names.** It used to read the first tab bar on whatever page was open, such as a profile's "Posts / Replies". Any site whose address contained "x.com" also counted, for example `dropbox.com`. Tab names now come from the X home page only.
- **Manual choices are respected for the whole visit.** If you pick another tab yourself, it stays until you reload. The extension's own clicks no longer count as yours.
- **Cancelled switches clean up after themselves.** Leaving the home page or changing settings mid-switch could leave a timer clicking on the next page, or stop sorting until reload. Every wait is now cancelled together.
- **An extension update no longer leaves a broken script running** in tabs that were already open.
- **Icons:** the 16 px and 48 px files were swapped, and all three had a grey checkerboard baked into the image instead of a transparent background. They are redrawn from a new SVG source (`assets/icon.svg`) and a 32 px size is added.
- **Privacy policy link** on the settings page pointed at a `main` branch that does not exist (404).

### Changed

- **Fewer permissions:** only `storage` is requested now. `scripting`, `activeTab` and the separate host permissions are gone. The content script declared for x.com and twitter.com is all the extension needs.
- **No network requests at all:** the popup and settings page no longer load the Inter font from Google Fonts; they use your system font.
- **Settings save instantly everywhere.** The settings page has no Save button any more and stays in step with the popup. "Restore defaults" remains.
- **The redundant "Disabled" entry in the tab list is gone.** The on/off switch does this job, and a saved "Disabled" from 2.0 becomes "switched off".
- **New look:** light and dark themes that follow your system, the extension's own icon instead of the X logo, visible keyboard focus, screen reader labels and reduced-motion support.
- **Tabs are listed by position with their real names**, for example "2. Following".
- **Language support:** the interface, store name and description are translatable, with English and Turkish included.
- Navigation is detected from DOM changes and the Navigation API instead of polling the URL every 200 ms.

### Added

- Automated tests (54) covering tab switching, sorting, manual choices, navigation, safety timeouts, settings migration, the popup and settings page, and the packaging checks. They run against a page modelled on x.com's current markup.
- `npm run lint`, `npm test` and `npm run build`, plus a GitHub Actions workflow that runs them and attaches the store zip.
- `scripts/validate.js`, which checks the manifest, icon sizes, translations, that no page loads remote resources and that no new permission slips in without a privacy policy update.
- Debug logging that needs no code change: run `localStorage.setItem('tdft:debug', '1')` on x.com and reload.

### Developer notes

- The extension now lives in `src/` (load that folder unpacked). Build output goes to `dist/`.
- All knowledge of X's page structure is in `src/lib/x-page.js`, so a change on X's side is a one-file fix.

## [2.0.1] - 2026-06-26

### Added

- Following sort order setting: Recent, Popular, or leave as it is.

### Changed

- Redesigned popup and settings page.

## [2.0.0] - 2025-12-24

### Added

- Choose any home tab as the default (For you, Following, or a pinned list or community).
- Popup and settings page showing the real tab names.
- Settings stored in Chrome sync storage and applied live.

### Changed

- New `storage`, `scripting` and `activeTab` permissions.

## [1.1.0] - 2025-12-21

### Added

- Waits for the Following timeline to load before showing it.
- Respects a tab you pick yourself.
- Support for X's in-page navigation.

## [1.0.0] - 2025-12-21

### Added

- First release: switches to the Following tab automatically, in any language.

[2.1.0]: https://github.com/mustafaer/twitter-default-following-tab/compare/v2.0.0...v2.1.0
[2.0.1]: https://github.com/mustafaer/twitter-default-following-tab/commit/2e08277
[2.0.0]: https://github.com/mustafaer/twitter-default-following-tab/compare/v1.1.0...v2.0.0
[1.1.0]: https://github.com/mustafaer/twitter-default-following-tab/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/mustafaer/twitter-default-following-tab/releases/tag/v1.0.0
