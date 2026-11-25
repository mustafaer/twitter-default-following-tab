#!/usr/bin/env node
/**
 * Checks the extension in src/ before it is packaged:
 * manifest fields and file references, icon sizes, translations, local-only resources
 * and the permission list (the privacy policy promises "storage" only).
 *
 * Usage: node scripts/validate.js        (exit code 1 when something is wrong)
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ALLOWED_PERMISSIONS = ['storage'];
const MAX_DESCRIPTION_LENGTH = 132;
const MAX_NAME_LENGTH = 75;

function readJson(file, problems) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    problems.push(`${file}: ${error.message}`);
    return null;
  }
}

/** Width and height from a PNG's IHDR chunk. */
function pngSize(file) {
  const header = fs.readFileSync(file).subarray(0, 24);
  const signature = '89504e470d0a1a0a';
  if (header.subarray(0, 8).toString('hex') !== signature) {
    return null;
  }
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

/**
 * @param {string} root the extension folder (src/)
 * @returns {string[]} problems found; empty when everything is fine
 */
function validate(root) {
  const problems = [];
  const exists = (relative) => fs.existsSync(path.join(root, relative));
  const manifest = readJson(path.join(root, 'manifest.json'), problems);
  if (!manifest) {
    return problems;
  }

  if (manifest.manifest_version !== 3) {
    problems.push('manifest_version must be 3');
  }
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version || '')) {
    problems.push(`version "${manifest.version}" must look like 1.2.3`);
  }

  const extraPermissions = [
    ...(manifest.permissions || []).filter((permission) => !ALLOWED_PERMISSIONS.includes(permission)),
    ...(manifest.host_permissions || []),
    ...(manifest.optional_permissions || []),
    ...(manifest.optional_host_permissions || []),
  ];
  if (extraPermissions.length) {
    problems.push(
      `unexpected permissions ${extraPermissions.join(', ')}: update PRIVACY_POLICY.md and ALLOWED_PERMISSIONS together`,
    );
  }

  // Every file the manifest points at must exist; icons must have the size their key says.
  const referenced = new Set();
  const iconSets = [manifest.icons || {}, (manifest.action && manifest.action.default_icon) || {}];
  for (const icons of iconSets) {
    for (const [size, file] of Object.entries(icons)) {
      referenced.add(file);
      if (exists(file)) {
        const actual = pngSize(path.join(root, file));
        if (!actual || actual.width !== Number(size) || actual.height !== Number(size)) {
          problems.push(`${file} should be a ${size}x${size} PNG`);
        }
      }
    }
  }
  if (manifest.action && manifest.action.default_popup) {
    referenced.add(manifest.action.default_popup);
  }
  if (manifest.options_ui && manifest.options_ui.page) {
    referenced.add(manifest.options_ui.page);
  }
  for (const script of manifest.content_scripts || []) {
    for (const file of [...(script.js || []), ...(script.css || [])]) {
      referenced.add(file);
    }
  }
  for (const file of referenced) {
    if (!exists(file)) {
      problems.push(`manifest.json refers to missing file ${file}`);
    }
  }

  // Translations: same keys everywhere, manifest and pages only use keys that exist.
  const localesDir = path.join(root, '_locales');
  const locales = fs.existsSync(localesDir) ? fs.readdirSync(localesDir) : [];
  const messages = {};
  for (const locale of locales) {
    messages[locale] = readJson(path.join(localesDir, locale, 'messages.json'), problems) || {};
  }
  const defaultLocale = manifest.default_locale;
  const defaultKeys = Object.keys(messages[defaultLocale] || {});
  if (!defaultLocale || !messages[defaultLocale]) {
    problems.push('default_locale must name a folder in _locales');
  }
  for (const locale of locales) {
    const keys = Object.keys(messages[locale]);
    const missing = defaultKeys.filter((key) => !keys.includes(key));
    const extra = keys.filter((key) => !defaultKeys.includes(key));
    if (missing.length) {
      problems.push(`_locales/${locale} is missing ${missing.join(', ')}`);
    }
    if (extra.length) {
      problems.push(`_locales/${locale} has keys the default locale lacks: ${extra.join(', ')}`);
    }
    const text = (key) => (messages[locale][key] && messages[locale][key].message) || '';
    if (text('extDescription').length > MAX_DESCRIPTION_LENGTH) {
      problems.push(`_locales/${locale} extDescription is longer than ${MAX_DESCRIPTION_LENGTH} characters`);
    }
    if (text('extName').length > MAX_NAME_LENGTH) {
      problems.push(`_locales/${locale} extName is longer than ${MAX_NAME_LENGTH} characters`);
    }
  }

  const usedKeys = new Set();
  for (const match of JSON.stringify(manifest).matchAll(/__MSG_(\w+)__/g)) {
    usedKeys.add(match[1]);
  }

  const pages = [manifest.action && manifest.action.default_popup, manifest.options_ui && manifest.options_ui.page];
  for (const page of pages.filter(Boolean)) {
    if (!exists(page)) {
      continue;
    }
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    for (const match of html.matchAll(/data-i18n(?:-aria-label)?="([^"]+)"/g)) {
      usedKeys.add(match[1]);
    }
    for (const match of html.matchAll(/<(?:script|link|img)\b[^>]*?\b(?:src|href)="([^"]+)"/g)) {
      const url = match[1];
      if (/^(https?:)?\/\//.test(url)) {
        problems.push(`${page} loads ${url}: pages must not load anything from the network`);
      } else if (!exists(url)) {
        problems.push(`${page} refers to missing file ${url}`);
      }
    }
  }
  for (const file of fs.readdirSync(path.join(root, 'ui')).filter((name) => name.endsWith('.js'))) {
    const source = fs.readFileSync(path.join(root, 'ui', file), 'utf8');
    for (const match of source.matchAll(/message\('(\w+)'/g)) {
      usedKeys.add(match[1]);
    }
  }
  for (const key of usedKeys) {
    if (defaultKeys.length && !defaultKeys.includes(key)) {
      problems.push(`message "${key}" is used but not defined in _locales/${defaultLocale}`);
    }
  }

  return problems;
}

module.exports = { validate };

if (require.main === module) {
  const root = path.join(__dirname, '..', 'src');
  const problems = validate(root);
  if (problems.length) {
    console.error(`Found ${problems.length} problem(s) in src/:\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  console.log('src/ looks good.');
}
