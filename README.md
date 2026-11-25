# Twitter Default Following Tab

**Open the Following tab on X (Twitter) automatically, and skip the algorithmic "For you" feed.**

A small, privacy-friendly Chrome extension. Every time you open the X home page, it switches to the **Following** tab, or any tab you choose. It can also set the Following timeline to **Recent** (newest first) or **Popular**. You never see the wrong feed flash by.

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-install-1d9bf0?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/twitter-default-following/afnfdobnmoffaiiboblgdcoeefobihbd)
[![CI](https://github.com/mustafaer/twitter-default-following-tab/actions/workflows/ci.yml/badge.svg)](https://github.com/mustafaer/twitter-default-following-tab/actions/workflows/ci.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/mustafaer/twitter-default-following-tab.svg?style=social)](https://github.com/mustafaer/twitter-default-following-tab/stargazers)

## Features

- **Following by default.** Opens the Following tab instead of "For you" on x.com and twitter.com.
- **Any tab you like.** Choose For you, Following, or one of your pinned lists or communities. The settings show your real tab names.
- **Recent or Popular.** Sets the Following timeline's sort order for you, or leaves it alone.
- **No flash of the wrong feed.** The timeline stays hidden for the moment it takes to switch, then fades in.
- **Respects your clicks.** If you pick another tab yourself, the extension leaves it there until you reload the page.
- **Works in every language.** Tabs are matched by position, not by their text.
- **Private by design.** Only the `storage` permission, no network requests, no tracking ([privacy policy](PRIVACY_POLICY.md)).
- **Light and dark themes**, keyboard and screen reader friendly, in English and Turkish.

## Install

### From the Chrome Web Store

[Add it to Chrome](https://chromewebstore.google.com/detail/twitter-default-following/afnfdobnmoffaiiboblgdcoeefobihbd). It also works in Edge, Brave, Opera and other Chromium browsers.

### From source

1. Download or clone this repository:
   ```bash
   git clone https://github.com/mustafaer/twitter-default-following-tab.git
   ```
2. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`) and turn on **Developer mode**.
3. Click **Load unpacked** and select the repository's **`src`** folder.
4. Open [x.com](https://x.com/home).

## Using it

Click the extension's toolbar icon:

| Setting | What it does |
| --- | --- |
| **Auto-switch** | Turns the extension on or off. |
| **Open on** | The home tab to open, by position: "2. Following" is the default. Pinned lists and communities appear here after you have visited x.com/home once. |
| **Following sort** | **Recent** (newest first), **Popular** (X's ranking), or **Leave as it is**. Only used when the default tab is Following. |

**Settings** opens a full page with the same options and a **Restore defaults** button. Changes are saved instantly and apply to open X tabs straight away.

## How it works

1. On a fresh load of the X home page, the extension hides the timeline before X draws it. The tabs stay visible.
2. As soon as X renders the home tabs, it checks your chosen tab. If that tab is already open, the timeline is shown at once.
3. Otherwise it clicks your tab and waits until X shows posts from the new feed (up to 3 seconds), then fades the timeline in.
4. If you chose Recent or Popular, it opens the Following sort menu out of sight, picks your order and closes it. This happens once per page visit, so a sort you change by hand is not overridden.
5. A safety net shows the timeline after 4 seconds whatever happens, so a change on X's side can never leave you with an empty page.

## Privacy

The extension stores only your three settings, in Chrome's storage, plus the names of your home tabs on this device so the settings can show them. It makes no network requests, has no analytics and never reads your posts, messages or account. Read the full [privacy policy](PRIVACY_POLICY.md).

## FAQ

**Is the Following tab chronological?**
Choose **Recent** under *Following sort* and it is: newest posts first.

**Can I make "For you" or a list my default instead?**
Yes. Pick it under *Open on*. Pinned lists and communities show up there by name after you have opened x.com/home once.

**I clicked "For you" and it stayed there. Is that a bug?**
No. A tab you pick yourself is kept until you reload the page. Reload, or change a setting, and your default applies again.

**Does it work with X in my language?**
Yes. Tabs are matched by position. The sort menu is matched by X's English labels, or by its fixed order (Popular, then Recent) in other languages.

**Why does Chrome say it can "read and change your data on x.com and twitter.com"?**
That is Chrome's standard wording for any extension that runs on a site. This one only looks at the home page's tabs and clicks the one you chose. It does not read your posts or account, and it runs nowhere else.

**Can X ban me for this?**
The extension only clicks a tab, exactly as you would yourself.

**Something stopped working after X changed its site.**
Please [open an issue](https://github.com/mustafaer/twitter-default-following-tab/issues/new/choose). Until it is fixed, the safety net keeps X fully usable.

**Firefox or Safari?**
Not yet. The extension uses Chrome's extension APIs. Contributions are welcome.

## Development

You need Node.js 22 or newer.

```bash
npm ci          # install the dev tools (ESLint, jsdom)
npm test        # run the test suite
npm run lint    # check code style
npm run build   # validate src/ and create dist/twitter-default-following-tab-v<version>.zip
npm run icons   # re-render src/icons/*.png from assets/icon.svg (needs librsvg)
```

Load `src/` unpacked in Chrome to try changes. After editing, click the reload button on `chrome://extensions` and reload the X tab.

**Debug logging:** in an X tab's DevTools console, run `localStorage.setItem('tdft:debug', '1')`, then reload the page. Logs start with `[Default Following Tab]`. Remove the key to turn logging off.

### Project layout

```
src/                     the extension (this folder is what ships)
├── manifest.json
├── content.js           content script entry: connects the controller to chrome.storage
├── content.css          hides the timeline and sort menu while switching
├── lib/
│   ├── settings.js      defaults, validation and migration of stored settings
│   ├── x-page.js        every selector for X's page lives here
│   └── controller.js    when to switch tabs and sort; navigation; safety timeouts
├── ui/                  shared popup/settings code and styles
├── popup.html/js        toolbar popup
├── options.html/js      settings page
├── _locales/            translations (en, tr)
└── icons/
assets/icon.svg          icon source
scripts/                 build, validation and icon scripts
tests/                   node:test suites, with a fake X home page built on jsdom
```

When X changes its markup, update `src/lib/x-page.js`, along with the fake page in `tests/helpers/fake-x.js` so the tests keep matching reality.

### Adding a language

Copy `src/_locales/en/messages.json` to `src/_locales/<code>/messages.json`, translate the `message` values (keep `extName` as it is) and run `npm test`. The tests check that every language has every key.

## Contributing

Bug reports, translations and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Support

If the extension saves you a little time each day, you can [sponsor its development](https://github.com/sponsors/mustafaer) or star the repository.

## License

[GNU General Public License v3.0 or later](LICENSE).

---

Twitter Default Following Tab is an independent project. It is not affiliated with or endorsed by X Corp. "X" and "Twitter" are trademarks of their respective owners.

<sub>Keywords: Twitter Following tab by default, X Following feed, skip For you, chronological Twitter timeline, Following Recent sort, Chrome extension for X.com.</sub>
