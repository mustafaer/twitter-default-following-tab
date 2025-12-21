# Contributing to Twitter Default Following Tab

First off, thank you for considering contributing to Twitter Default Following Tab! It's people like you that make this extension better for everyone.

## 🤝 Code of Conduct

This project and everyone participating in it is governed by basic principles of respect and collaboration. By participating, you are expected to uphold these principles.

## 🐛 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - Browser: [e.g. Chrome 120]
 - OS: [e.g. macOS 14.0]
 - Extension Version: [e.g. 1.0.0]
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Create an issue and provide:

- **Clear title** describing the enhancement
- **Detailed description** of the proposed functionality
- **Use cases** explaining why this would be useful
- **Possible implementation** if you have ideas

### Pull Requests

#### Development Process

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Make your changes**
5. **Test thoroughly**
6. **Commit** with clear messages
7. **Push** to your fork
8. **Create a Pull Request**

#### Code Guidelines

**JavaScript Style:**
```javascript
// Use clear, descriptive function names
function checkIfFollowingTabIsActive() { ... }

// Add JSDoc comments for functions
/**
 * Checks if the Following tab is currently active
 * @returns {boolean} True if Following tab is active
 */
function isFollowingTabActive() { ... }

// Use constants for magic numbers
const CONTENT_CHECK_INTERVAL = 50; // ms

// Keep functions focused and small
// One function = one responsibility
```

**Code Organization:**
- Constants at the top
- Utility functions (log, debounce) together
- DOM-related functions grouped
- Initialization at the bottom

**Comments:**
- Explain WHY, not WHAT (code should be self-explanatory)
- Use JSDoc for function documentation
- Add inline comments for complex logic only

**Performance:**
- Minimize DOM queries (cache selectors when possible)
- Use debouncing for frequent events
- Avoid unnecessary loops
- Test on slow networks

#### Testing Checklist

Before submitting a PR, test:

- ✅ Normal page load
- ✅ Fast network (no throttling)
- ✅ Slow network (Chrome DevTools → Slow 3G)
- ✅ Navigation (home → profile → home)
- ✅ Back/forward buttons
- ✅ Page refresh (F5)
- ✅ Multiple tabs open
- ✅ Debug mode works (console logs)

#### Commit Messages

Use clear, descriptive commit messages:

```
Good:
✅ "Add smart content detection for Following tab"
✅ "Fix transition timing on slow networks"
✅ "Improve performance by caching tab queries"

Bad:
❌ "fix bug"
❌ "update code"
❌ "changes"
```

Format:
```
Short summary (50 chars or less)

More detailed explanation if needed. Wrap at 72 characters.
Explain the problem this commit solves and how.

- Bullet points are okay too
- Use present tense ("Add feature" not "Added feature")
```

## 📁 Project Structure

```
twitter-default-following-tab/
├── content.js          # Main extension logic
├── manifest.json       # Extension configuration
├── build.sh           # Build script
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── LICENSE            # GNU GPL v3
└── README.md          # Documentation
```

## 🔧 Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/mustafaer/twitter-default-following-tab.git
   cd twitter-default-following-tab
   ```

2. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project folder

3. Enable debug mode:
   - Open `content.js`
   - Change `const DEBUG = false;` to `const DEBUG = true;`
   - Reload extension

4. Make changes and test

5. Build for distribution:
   ```bash
   chmod +x build.sh
   ./build.sh
   ```

## 🧪 Testing

### Manual Testing

1. **Basic functionality:**
   - Open twitter.com
   - Verify Following tab is active
   - Check no "For You" content is visible

2. **Network conditions:**
   - Chrome DevTools → Network tab
   - Test with: Fast 3G, Slow 3G, Offline
   - Verify content loads before showing

3. **Navigation:**
   - Navigate away and back
   - Use back/forward buttons
   - Refresh page
   - All should maintain Following tab

### Debug Console

With DEBUG mode enabled, check console for:
```
[Twitter Following Tab] Initializing extension...
[Twitter Following Tab] Transition started - content hidden
[Twitter Following Tab] Found Following tab, clicking...
[Twitter Following Tab] Following content loaded check: true tweets: 15
[Twitter Following Tab] Following content loaded after 3 attempts
[Twitter Following Tab] Transition ended - content visible
```

## 📝 Documentation

When adding features, update:

- **README.md** - User-facing documentation
- **Code comments** - Developer documentation
- **JSDoc** - Function documentation

## 🎯 Priority Areas

Current focus areas for contributions:

1. **Performance optimization** - Faster, more efficient code
2. **Edge case handling** - Unusual scenarios
3. **Browser compatibility** - Firefox, Safari support
4. **Accessibility** - Screen readers, keyboard navigation
5. **Tests** - Automated testing framework

## ❓ Questions?

- Open a [Discussion](https://github.com/mustafaer/twitter-default-following-tab/discussions)
- Check existing [Issues](https://github.com/mustafaer/twitter-default-following-tab/issues)

## 📜 License

By contributing, you agree that your contributions will be licensed under the GNU General Public License v3.0.

---

Thank you for contributing! 🎉

