# Twitter Default Following Tab - Automatically Switch to Following Feed on Twitter/X

**Enhance Your Twitter Experience | Chrome Extension for Twitter Following Tab | Skip For You Algorithm**

A lightweight, privacy-focused browser extension that automatically switches to the "Following" tab when you open Twitter/X, helping you focus on chronological content from people you actually follow instead of the algorithmic "For You" feed.

**Keywords:** Twitter extension, X.com extension, Following tab, Chrome extension, Browser extension, Twitter automation, Social media productivity, Chronological timeline, Twitter following feed, Skip for you tab, Twitter tools, Manifest V3

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chromewebstore.google.com/detail/twitter-default-following/afnfdobnmoffaiiboblgdcoeefobihbd)
[![GitHub stars](https://img.shields.io/github/stars/mustafaer/twitter-default-following-tab.svg?style=social)](https://github.com/mustafaer/twitter-default-following-tab/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/mustafaer/twitter-default-following-tab.svg)](https://github.com/mustafaer/twitter-default-following-tab/issues)

## 🎯 Features

### Why Use This Twitter Extension?

**Tired of Twitter's "For You" algorithmic feed?** This extension automatically switches you to the chronological "Following" feed every time you open Twitter or X.com.

- **🔄 Automatic Tab Switching** - Opens the "Following" tab by default instead of "For You" algorithmic feed
- **✨ Seamless Transition** - Invisible switching - you never see the "For You" content flash
- **🧠 Smart Content Detection** - Intelligently waits for tweets to actually load before displaying
- **👤 Respects User Choice** - If you manually click "For You" tab, the extension won't interfere
- **⚡ Adaptive Performance** - Fast on fiber/5G networks (~150ms), patient on slow 3G connections
- **🌍 Language Independent** - Works with any Twitter language setting (English, Spanish, Japanese, etc.)
- **🔒 Zero Permissions Required** - No data collection, no tracking, completely private and secure ([Privacy Policy](PRIVACY_POLICY.md))
- **📱 SPA Compatible** - Works seamlessly with Twitter's single-page application architecture
- **🆓 Free & Open Source** - GNU GPL v3 licensed, community-driven development

### Perfect For:
- Users who prefer chronological feeds over algorithmic recommendations
- People who want to see content from followed accounts first
- Anyone seeking more control over their Twitter/X experience
- Users frustrated with the forced "For You" tab
- Privacy-conscious users who want minimal-permission extensions

## 🚀 Installation - How to Install Twitter Following Tab Extension

### From Chrome Web Store (Recommended - Coming Soon)
The easiest way to install this Twitter extension for Chrome, Edge, Brave, and Opera.

1. Visit the [Chrome Web Store page](https://chromewebstore.google.com/detail/twitter-default-following/afnfdobnmoffaiiboblgdcoeefobihbd)
2. Click "Add to Chrome" or "Add to Edge/Brave/Opera"
3. Enjoy your cleaner Twitter/X experience with automatic Following tab!

### Manual Installation for Developers (Chrome, Edge, Brave, Opera)

**For Chrome / Chromium-based browsers:**

1. **Clone or Download** this Twitter extension:
   ```bash
   git clone https://github.com/mustafaer/twitter-default-following-tab.git
   cd twitter-default-following-tab
   ```

2. **Open Chrome Extensions Page:**
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`
   - Brave: Navigate to `brave://extensions/`
   - Opera: Navigate to `opera://extensions/`

3. **Enable Developer Mode:**
   - Toggle "Developer mode" switch in the top right corner

4. **Load Extension:**
   - Click "Load unpacked" button
   - Select the project folder you downloaded
   - The Twitter Following Tab extension is now installed! ✅

5. **Test on Twitter:**
   - Visit [twitter.com](https://twitter.com) or [x.com](https://x.com)
   - The Following tab should automatically be selected

## 🎬 How It Works - Technical Details

This Twitter automation extension uses intelligent content detection to ensure a smooth, seamless experience when switching from the "For You" algorithmic feed to the chronological "Following" timeline.

### Technical Process:

1. **Page Load Detection** - When you visit Twitter/X homepage
2. **Content Hiding** - Temporarily hides "For You" content using CSS (tabs remain visible)
3. **Automatic Tab Switch** - Programmatically clicks the "Following" tab
4. **Smart Content Detection** - Checks every 50ms for tweets to load (maximum 2.5 seconds)
5. **Seamless Display** - Shows content once Following tweets are fully loaded
6. **User Interaction Respect** - Detects manual tab clicks and respects user choice (no auto-switch after manual selection)

### Performance Metrics by Network Speed:

| Network Type | Connection Speed | Transition Time | User Experience |
|--------------|------------------|----------------|-----------------|
| **Fiber/5G** | 100+ Mbps | ~150-200ms | ⚡ Instant, optimal speed |
| **4G/ADSL** | 10-50 Mbps | ~300-500ms | ✅ Smooth transition |
| **3G/Slow** | 1-5 Mbps | ~1000-2000ms | ✅ Waits for full content |
| **Very Slow** | <1 Mbps | 2500ms max (timeout) | ⚠️ Shows content anyway (safe fallback) |

### Why This Approach?

**Problem:** Simple tab-switching extensions show blank pages on slow connections because tweets haven't loaded yet.

**Solution:** Our extension intelligently detects when Following feed tweets are actually loaded in the DOM before revealing content, ensuring you always see populated content, not loading spinners.

**Technical Implementation:**
- DOM MutationObserver for dynamic content changes
- Position-based tab detection (language-agnostic)
- User interaction detection (respects manual tab selections)
- Debounced event handling for performance
- History API interception for SPA navigation
- Smart timeout protection (never hangs forever)

## 🔧 Development

### Prerequisites
- Node.js (for development scripts)
- Chrome/Chromium browser

### Building
```bash
# Make build script executable
chmod +x build.sh

# Build the extension
./build.sh
```

This creates:
- `build/` folder for testing
- `twitter-default-following-tab.zip` for distribution

### Debug Mode
Enable debug logging in `content.js`:
```javascript
const DEBUG = true; // Change from false to true
```

Then check browser console (F12) for detailed logs.

## 📝 Configuration

All timing configurations are defined at the top of `content.js`:

```javascript
const CONTENT_CHECK_INTERVAL = 50;      // ms between content checks
const MAX_CONTENT_WAIT_ATTEMPTS = 50;   // max 2.5 seconds wait
const DEBOUNCE_DELAY = 200;             // ms
const INITIAL_TAB_CHECK_DELAY = 100;    // ms
const PAGE_LOAD_CHECK_DELAY = 150;      // ms
const TRANSITION_END_DELAY = 100;       // ms
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
1. Keep code simple and readable
2. Add comments for complex logic
3. Test on both fast and slow network conditions
4. Maintain language-independent approach
5. Follow existing code style

## 💖 Support This Project

If you find this extension helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-%E2%9D%A4-pink?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/mustafaer)

Your support helps maintain and improve this extension:
- 🐛 Bug fixes and improvements
- ✨ New features development
- 📚 Documentation updates
- 🚀 Performance optimizations
- 💬 Community support

**Other ways to support:**
- ⭐ Star this repository on GitHub
- 🐛 Report bugs and suggest features
- 🔄 Share with others who might find it useful
- 📝 Write about it or create tutorials
- 💻 Contribute code improvements

Every contribution, big or small, is appreciated! 🙏

## 🔒 Privacy Policy

This extension is privacy-first by design. We collect **zero data** about you or your usage.

**Key Privacy Features:**
- ✅ No data collection whatsoever
- ✅ No analytics or tracking
- ✅ No external server communication
- ✅ Works entirely locally in your browser
- ✅ Open source - verify the code yourself

Read our complete [Privacy Policy](PRIVACY_POLICY.md) for full details.

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

This means you can:
- ✅ Use this software for any purpose
- ✅ Study and modify the source code
- ✅ Share copies of the software
- ✅ Share your modifications

With the conditions:
- 📋 Disclose source code
- 📋 State changes you made
- 📋 Use the same license (GPL v3)
- 📋 Include copyright notice

## 🐛 Bug Reports

Found a bug? Please [open an issue](https://github.com/mustafaer/twitter-default-following-tab/issues) with:
- Browser version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## 💡 Feature Requests

Have an idea? [Open an issue](https://github.com/mustafaer/twitter-default-following-tab/issues) with the "enhancement" label!

## 🙏 Acknowledgments

- Thanks to all contributors who help improve this extension
- Inspired by users who prefer chronological feeds over algorithmic ones

## 📊 Technical Details

### Architecture (v2.0.0)
- **Manifest V3**: Latest Chrome extension standard (future-proof)
- **Content Script**: Runs on Twitter/X pages for tab switching
- **Popup UI**: Dark mode interface with dynamic dropdown
- **Options Page**: Full settings page with descriptions
- **Chrome Storage API**: Saves your preference locally (synced via Chrome)
- **Dynamic Tab Detection**: Intelligently discovers available tabs
- **Structure-Based Extraction**: Uses HTML structure, not CSS classes (future-proof)

### Permissions Used
- `storage` - Save your tab preference
- `scripting` - Detect tabs and extract names
- `activeTab` - Read current page for settings
- Host permissions for Twitter/X domains

### Browser Compatibility
- ✅ Chrome 88+ (tested and verified)
- ✅ Edge 88+ (Chromium-based)
- ✅ Brave (Chromium-based, privacy browser)
- ✅ Opera (Chromium-based)
- ⏳ Firefox (coming soon with Manifest V3 support)
- ❌ Safari (not supported - different extension API)

### Extension Technologies
- **JavaScript ES6+** - Modern, efficient code
- **DOM Manipulation** - Direct interaction with Twitter's interface
- **MutationObserver API** - Monitors dynamic content changes
- **History API** - Handles SPA navigation
- **CSS Injection** - Seamless content transitions

## ❓ Frequently Asked Questions (FAQ)

### General Questions

**Q: Can I choose which tab opens by default?**
A: Yes! Version 2.0 lets you choose any tab - Following, Community tabs, or even "For You" if you want.

**Q: How do I change my default tab?**
A: Click the extension icon in your browser toolbar, select your preferred tab from the dropdown, and it saves automatically.

**Q: How do I make Twitter open to Following tab by default?**
A: Install this extension and select "Tab 1 (Following)" in the settings dropdown. That's it!

**Q: Can I use this for Community tabs?**
A: Absolutely! If you have community tabs (Tab 2, 3, 4...), they'll appear in the dropdown with their actual names.

**Q: Does this work on both twitter.com and x.com?**
A: Yes! The extension works on both domains seamlessly.

**Q: What's new in version 2.0?**
A: Dark mode UI, dropdown selector, dynamic tab detection, real tab names, and the ability to choose any tab as default!

### Privacy & Security

**Q: Does this extension collect my data?**
A: We only store your tab preference (1 small setting) locally in your browser. No personal data, no tracking. Read our [Privacy Policy](PRIVACY_POLICY.md).

**Q: What permissions does this Twitter extension need?**
A: v2.0 requires:
- `storage` - To save your tab preference
- `scripting` - To detect available tabs
- `activeTab` - To read current page for settings
- Host permissions for Twitter/X domains

**Q: Where is my setting stored?**
A: In your browser's local Chrome storage. If you have Chrome sync enabled, it syncs across your devices (encrypted by Google).

**Q: Is my data sent to any server?**
A: No! Everything works locally. Your tab preference never leaves your browser (except via Chrome's optional sync feature).

**Q: Is it safe to use?**
A: Yes! It's open source (GNU GPL v3), you can inspect all code. No malicious behavior, no ads, no tracking.

**Q: Can Twitter detect or ban me for using this?**
A: No. This extension simply clicks the Following tab - something you could do manually. It's not against Twitter's ToS.

### Technical Questions

**Q: Does it work on mobile?**
A: No. Browser extensions only work on desktop browsers (Chrome, Edge, Brave, Opera). Mobile browsers don't support extensions.

**Q: Does it slow down Twitter?**
A: No! It's very lightweight. In fact, on fast networks it completes in ~150-200ms - faster than manual clicking.

**Q: What if Twitter changes their layout?**
A: The extension uses position-based selection (resilient to changes), but major Twitter updates may temporarily break it. We'll update promptly if needed.

**Q: Does it work with TweetDeck?**
A: No, this extension is specifically for the main Twitter/X website (twitter.com and x.com).

### Installation & Troubleshooting

**Q: How do I install a Chrome extension manually?**
A: See our [Installation Guide](#-installation---how-to-install-twitter-following-tab-extension) above for step-by-step instructions.

**Q: The extension isn't working, what should I do?**
A: 1) Make sure it's enabled in chrome://extensions/, 2) Refresh Twitter, 3) Check browser console (F12) for errors, 4) Report an issue on GitHub.

**Q: Can I use this with other Twitter extensions?**
A: Yes! It's designed to be compatible with other extensions.

### Open Source & Development

**Q: Is the code open source?**
A: Yes! Licensed under GNU GPL v3. View, modify, and contribute at our [GitHub repository](https://github.com/mustafaer/twitter-default-following-tab).

**Q: Can I contribute to development?**
A: Absolutely! Check out our [Contributing Guide](CONTRIBUTING.md) for how to get started.

**Q: How do I report bugs or request features?**
A: Open an issue on our [GitHub Issues page](https://github.com/mustafaer/twitter-default-following-tab/issues).

### Comparisons

**Q: How is this different from other Twitter extensions?**
A: Most extensions use fixed delays which cause blank pages on slow networks. We use smart content detection for guaranteed loaded content.

**Q: Why not just bookmark twitter.com/home?**
A: Twitter redirects all home page variations to the same URL with "For You" as default. This extension solves that.

**Q: Is there a Firefox version?**
A: Coming soon! We're waiting for Firefox's full Manifest V3 support.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/mustafaer/twitter-default-following-tab/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mustafaer/twitter-default-following-tab/discussions)

## ⭐ Star This Project

If you find this extension useful, please consider giving it a star on GitHub! It helps others discover the project.

[![GitHub stars](https://img.shields.io/github/stars/mustafaer/twitter-default-following-tab.svg?style=social&label=Star)](https://github.com/mustafaer/twitter-default-following-tab/stargazers)

---

## 🔍 Related Searches & Keywords

**Popular Searches This Extension Solves:**
- How to make Twitter default to Following tab
- Twitter open Following tab automatically
- Skip Twitter For You tab
- Twitter chronological timeline extension
- Twitter Following feed default
- Chrome extension for Twitter automation
- Disable Twitter For You tab
- Twitter extension Following first
- X.com Following tab extension
- Twitter productivity tools
- Social media chronological feed
- Twitter extension no permissions
- Privacy-focused Twitter extension
- Open source Twitter tools

**SEO Keywords:** Twitter extension, X extension, Following tab, Chrome extension, browser extension, Twitter automation, social media tools, productivity extension, chronological timeline, Twitter following feed, skip for you, Twitter tools, Manifest V3, privacy-focused, zero permissions, open source, GPL-3, Twitter productivity, X.com tools, social network extension, Twitter customization, feed customization

---

Made with ❤️ by the open source community | Licensed under GNU GPL v3 | Privacy-focused • No tracking • No data collection

**#TwitterExtension #ChromeExtension #Productivity #OpenSource #Privacy #FollowingTab #XCom**

