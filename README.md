# Twitter Default Following Tab

A lightweight browser extension that automatically switches to the "Following" tab when you open Twitter/X, helping you focus on content from people you actually follow.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)

## 🎯 Features

- **Automatic Tab Switching**: Opens the "Following" tab by default instead of "For You"
- **Seamless Transition**: Invisible switching - you never see the "For You" content
- **Smart Content Detection**: Waits for tweets to actually load before displaying
- **Adaptive Performance**: Fast on fast networks, patient on slow connections
- **Language Independent**: Works with any Twitter language setting
- **Zero Permissions**: No data collection, no tracking, completely private
- **SPA Compatible**: Works with Twitter's single-page application architecture

## 🚀 Installation

### From Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store page](#) (link coming soon)
2. Click "Add to Chrome"
3. Enjoy your cleaner Twitter experience!

### Manual Installation (Development)
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/twitter-default-following-tab.git
   cd twitter-default-following-tab
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked" and select the project folder

## 🎬 How It Works

The extension uses intelligent content detection to ensure a smooth experience:

1. **Page Load**: When you visit Twitter/X homepage
2. **Content Hidden**: Temporarily hides content (tabs remain visible)
3. **Tab Switch**: Automatically clicks the "Following" tab
4. **Smart Wait**: Checks every 50ms for tweets to load (max 2.5s)
5. **Content Reveal**: Shows content once Following tweets are loaded

### Performance

| Network Speed | Transition Time | Notes |
|---------------|----------------|-------|
| Fast (Fiber/5G) | ~150-200ms | ⚡ Optimal speed |
| Normal (ADSL/4G) | ~300-500ms | ✅ Smooth |
| Slow (3G) | ~1000-2000ms | ✅ Waits for content |
| Timeout | 2500ms max | ⚠️ Shows anyway |

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

Found a bug? Please [open an issue](https://github.com/yourusername/twitter-default-following-tab/issues) with:
- Browser version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## 💡 Feature Requests

Have an idea? [Open an issue](https://github.com/yourusername/twitter-default-following-tab/issues) with the "enhancement" label!

## 🙏 Acknowledgments

- Thanks to all contributors who help improve this extension
- Inspired by users who prefer chronological feeds over algorithmic ones

## 📊 Technical Details

### Architecture
- **Manifest V3**: Uses latest Chrome extension standard
- **Content Script**: Runs on Twitter/X pages only
- **Zero Permissions**: No special permissions required
- **No Background Script**: Minimal resource usage

### Browser Compatibility
- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Brave (Chromium-based)
- ✅ Opera (Chromium-based)
- ⏳ Firefox (coming soon with Manifest V3 support)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/twitter-default-following-tab/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/twitter-default-following-tab/discussions)

## ⭐ Star This Project

If you find this extension useful, please consider giving it a star on GitHub! It helps others discover the project.

---

Made with ❤️ by the open source community

