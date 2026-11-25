# Contributing

Thank you for helping improve Twitter Default Following Tab. Bug reports, translations and code are all welcome.

## Reporting a bug

Check the [existing issues](https://github.com/mustafaer/twitter-default-following-tab/issues) first, then [open a new one](https://github.com/mustafaer/twitter-default-following-tab/issues/new/choose). The most useful reports include:

- your browser and its version, and the extension version (shown in the popup);
- your settings (default tab and Following sort) and X's display language;
- what you expected and what happened, with steps to reproduce;
- debug logs: in an X tab's DevTools console run `localStorage.setItem('tdft:debug', '1')`, reload, reproduce, then copy the lines that start with `[Default Following Tab]`.

## Setting up

You need Node.js 22 or newer and a Chromium browser.

```bash
git clone https://github.com/mustafaer/twitter-default-following-tab.git
cd twitter-default-following-tab
npm ci
```

Load the `src/` folder with **Load unpacked** on `chrome://extensions` (Developer mode on). After a change, click the extension's reload button there and reload the X tab.

## Before you open a pull request

```bash
npm run lint
npm test
npm run build
```

CI runs the same three commands on every pull request.

Then try the change on x.com itself:

- a fresh load of x.com/home, with For you and with Following open beforehand;
- going to a profile or post and back to Home, with both the links and the back/forward buttons;
- picking a tab yourself, then navigating away and back;
- each sort setting (Recent, Popular, Leave as it is);
- a pinned list or community as the default tab, if you have one;
- a slow connection (DevTools → Network → Slow 4G or 3G);
- the popup and settings page in light and dark mode.

## Code guidelines

- **X's page structure belongs in `src/lib/x-page.js` only.** If X changes its markup, that file and the fake page in `tests/helpers/fake-x.js` are what change.
- **Prefer what X exposes for accessibility** (`role`, `aria-selected`, `aria-haspopup`, `data-testid`) over class names or visible text, so the extension keeps working in every language.
- **Every wait must be cancellable and bounded.** Use the controller's `waitFor` with the run's `AbortSignal` and a timeout from `DEFAULT_TIMING`. Never leave the timeline hidden without the safety timeout.
- **Add a test for every behaviour change.** The fake X page lets you reproduce timing problems in `tests/controller.test.js`.
- **Keep it private.** No network requests, no remote code, no new permissions without updating `PRIVACY_POLICY.md` and `ALLOWED_PERMISSIONS` in `scripts/validate.js`.
- **User-facing text goes in `src/_locales/*/messages.json`**, with the English wording in the HTML as a fallback.
- Write clear names and explain *why* in comments. ESLint enforces the rest.

## Translations

Copy `src/_locales/en/messages.json` to `src/_locales/<language code>/messages.json` and translate each `message`. Keep `extName` unchanged, keep `extDescription` within 132 characters, and leave `$1` and `$2` placeholders in place. `npm test` checks that nothing is missing.

## Commit messages

Use a short summary line in the present tense ("Fix sort menu detection in Japanese"), followed by a blank line and any details.

## Releasing (maintainers)

1. Update `version` in `src/manifest.json` and move the changelog's "Unreleased" section under the new version and date.
2. Update `PRIVACY_POLICY.md` if the stored data or permissions changed.
3. Run `npm run build` and upload `dist/twitter-default-following-tab-v<version>.zip` to the Chrome Web Store Developer Dashboard.
4. Tag the release: `git tag v<version>` and push the tag.

## License

By contributing you agree that your work is licensed under the [GNU General Public License v3.0 or later](LICENSE).
