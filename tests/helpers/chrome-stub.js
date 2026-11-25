'use strict';

/**
 * Just enough of the chrome.* extension API for the tests: storage (sync and local, with
 * onChanged), i18n backed by the real _locales files, and runtime basics.
 */
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.join(__dirname, '..', '..', 'src');

function loadMessages(locale) {
  return JSON.parse(fs.readFileSync(path.join(SRC, '_locales', locale, 'messages.json'), 'utf8'));
}

function createChromeStub({ sync = {}, local = {}, locale = 'en', failWrites = false } = {}) {
  const listeners = [];
  const messages = loadMessages(locale);
  const fallback = loadMessages('en');
  const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8'));

  function createArea(name, initial) {
    const data = structuredClone(initial);
    return {
      data,
      async get(keys) {
        if (keys === null || keys === undefined) {
          return structuredClone(data);
        }
        const wanted = typeof keys === 'string' ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys);
        const result = Array.isArray(keys) || typeof keys === 'string' ? {} : structuredClone(keys);
        for (const key of wanted) {
          if (key in data) {
            result[key] = structuredClone(data[key]);
          }
        }
        return result;
      },
      async set(items) {
        if (failWrites) {
          throw new Error('Simulated storage failure');
        }
        const changes = {};
        for (const [key, value] of Object.entries(items)) {
          if (JSON.stringify(data[key]) !== JSON.stringify(value)) {
            changes[key] = { oldValue: data[key], newValue: structuredClone(value) };
          }
          data[key] = structuredClone(value);
        }
        if (Object.keys(changes).length) {
          await Promise.resolve();
          listeners.forEach((listener) => listener(changes, name));
        }
      },
    };
  }

  const chrome = {
    storage: {
      sync: createArea('sync', sync),
      local: createArea('local', local),
      onChanged: { addListener: (listener) => listeners.push(listener) },
    },
    i18n: {
      getUILanguage: () => locale,
      getMessage(key, substitutions = []) {
        if (key === '@@bidi_dir') {
          return 'ltr';
        }
        const entry = messages[key] || fallback[key];
        if (!entry) {
          return '';
        }
        const values = Array.isArray(substitutions) ? substitutions : [substitutions];
        return entry.message.replace(/\$(\d)/g, (_, index) => values[Number(index) - 1] ?? '');
      },
    },
    runtime: {
      id: 'test-extension-id',
      getManifest: () => manifest,
      openOptionsPage() {
        chrome.runtime.optionsOpened = true;
      },
      optionsOpened: false,
    },
  };

  return chrome;
}

/** Runs extension source files in a jsdom window, in order, as the browser would. */
function runScripts(window, files) {
  for (const file of files) {
    window.eval(fs.readFileSync(path.join(SRC, file), 'utf8'));
  }
}

module.exports = { createChromeStub, runScripts, SRC };
