#!/usr/bin/env node
/**
 * Renders the Chrome Web Store images into store/images/:
 *
 *   en/ and tr/   four 1280x800 screenshots each, built around the real popup and settings page
 *                 (src/ with a stubbed chrome API and sample tab names, so no real account shows)
 *   promo/        the 440x280 small promo tile and the 1400x560 marquee tile, without text,
 *                 as the store advises for promotional images
 *
 * Needs Google Chrome or Chromium. Set CHROME=/path/to/chrome if it is not found.
 * Usage: npm run store-images
 */
'use strict';

const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { execFile, execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'store', 'images');

const COPY = {
  en: {
    tabs: ['For you', 'Following', 'Tech News', 'Design', 'Friends'],
    shots: [
      ['Opens on Following.<br>Every time.', 'Skip the algorithmic feed: X opens on the tab you choose.'],
      ['Your tab,<br>your sort order', 'Following, For you or a pinned list, sorted Recent or Popular.'],
      ['Light or dark,<br>English or Turkish', 'Follows your system theme and your browser language.'],
      ['Private<br>by design', 'Your settings stay in your browser. Nothing is sent anywhere.'],
    ],
    privacy: [
      ['1', 'permission: storage'],
      ['0', 'network requests'],
      ['0', 'trackers or analytics'],
      ['GPL', 'open source'],
    ],
  },
  tr: {
    tabs: ['Sana özel', 'Takip edilenler', 'Teknoloji', 'Tasarım', 'Arkadaşlar'],
    shots: [
      ['Her seferinde<br>Takip edilenler.', 'Algoritmik akışı atlayın: X seçtiğiniz sekmede açılır.'],
      ['Sekmeniz,<br>sıralamanız', 'Takip edilenler, Sana özel ya da sabitlenmiş bir liste; En yeni ya da Popüler.'],
      ['Açık ya da koyu,<br>Türkçe ya da İngilizce', 'Sistem temanıza ve tarayıcınızın diline uyar.'],
      ['Gizlilik<br>öncelikli', 'Ayarlarınız tarayıcınızda kalır. Hiçbir yere veri gönderilmez.'],
    ],
    privacy: [
      ['1', 'izin: storage'],
      ['0', 'ağ isteği'],
      ['0', 'izleyici ya da analiz'],
      ['GPL', 'açık kaynak'],
    ],
  },
};

const BACKDROP = `
  radial-gradient(900px 600px at 88% 8%, rgba(46, 168, 246, 0.35), transparent 60%),
  radial-gradient(700px 520px at 0% 100%, rgba(10, 108, 176, 0.45), transparent 62%),
  linear-gradient(135deg, #0b1724, #0f2b46)`;

function findChrome() {
  const candidates = [
    process.env.CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (candidate.includes('/')) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
      continue;
    }
    try {
      return execFileSync('which', [candidate], { encoding: 'utf8' }).trim();
    } catch {
      // not on PATH; try the next one
    }
  }
  throw new Error('Chrome or Chromium was not found. Set CHROME=/path/to/chrome and try again.');
}

/** The dark theme's custom properties, so one image can show light and dark side by side. */
function darkThemeVariables() {
  const css = fs.readFileSync(path.join(SRC, 'ui', 'ui.css'), 'utf8');
  const match = css.match(/@media \(prefers-color-scheme: dark\) \{\s*:root \{([^}]*)\}/);
  if (!match) {
    throw new Error('Could not find the dark theme in src/ui/ui.css');
  }
  return match[1];
}

/**
 * A copy of popup.html or options.html that runs with a stubbed chrome API.
 * @returns {string} the file name, relative to the served folder
 */
function writePreview(dir, page, { locale, dark = false, settings = {}, tabNames, status = null }) {
  const messages = JSON.parse(fs.readFileSync(path.join(SRC, '_locales', locale, 'messages.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8'));
  const sync = { enabled: true, defaultTab: '1', followingTabSort: 'recent', ...settings };
  const stub = `<script>
    const MESSAGES = ${JSON.stringify(messages)};
    const area = (data) => ({
      async get(keys) { const out = {}; for (const key of [].concat(keys)) { if (key in data) { out[key] = data[key]; } } return out; },
      async set(values) { Object.assign(data, values); },
    });
    window.chrome = {
      storage: {
        sync: area(${JSON.stringify(sync)}),
        local: area(${JSON.stringify({ homeTabNames: tabNames })}),
        onChanged: { addListener() {} },
      },
      i18n: {
        getUILanguage: () => ${JSON.stringify(locale)},
        getMessage: (key, subs = []) => key === '@@bidi_dir' ? 'ltr'
          : MESSAGES[key] ? MESSAGES[key].message.replace(/\\$(\\d)/g, (_, i) => [].concat(subs)[i - 1]) : '',
      },
      runtime: { id: 'store-images', getManifest: () => (${JSON.stringify({ version: manifest.version })}), openOptionsPage() {} },
    };
  </script>`;
  let html = fs.readFileSync(path.join(SRC, page), 'utf8');
  html = html.replace('<script src="lib/settings.js"></script>', `${stub}\n  <script src="lib/settings.js"></script>`);
  if (dark) {
    html = html.replace('</head>', `<style>:root { color-scheme: dark; ${darkThemeVariables()} }</style>\n</head>`);
  }
  if (status) {
    const script = page.replace('.html', '.js');
    html = html.replace(
      `<script src="${script}"></script>`,
      `<script src="${script}"></script>
  <script>setTimeout(() => { const s = document.getElementById('status'); s.textContent = chrome.i18n.getMessage(${JSON.stringify(status)}); s.dataset.kind = 'success'; s.classList.add('is-visible'); }, 200);</script>`,
    );
  }
  const name = `${page.replace('.html', '')}-${locale}-${dark ? 'dark' : 'light'}${status ? '-saved' : ''}.html`;
  fs.writeFileSync(path.join(dir, name), html);
  return name;
}

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { overflow: hidden; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #ffffff;
         background: ${BACKDROP}; -webkit-font-smoothing: antialiased; }
  iframe { border: 0; display: block; }
  .shot { width: 1280px; height: 800px; display: grid; grid-template-columns: 430px 1fr;
          align-items: center; gap: 48px; padding: 0 64px; }
  .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 34px;
           font-size: 18px; font-weight: 600; color: #cfe3f5; }
  .brand img { width: 40px; height: 40px; }
  h1 { font-size: 50px; line-height: 1.08; letter-spacing: -0.02em; font-weight: 800; }
  .caption p { margin-top: 22px; font-size: 24px; line-height: 1.38; color: #b9c9d8; }
  .visual { position: relative; height: 100%; display: flex; align-items: center; justify-content: center; }
  .frame { border-radius: 14px; overflow: hidden; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5); }
  .fit { opacity: 0; } .fit.ready { opacity: 1; }
`;

/** Sizes each iframe to its content once the settings have rendered. */
const FIT_SCRIPT = `<script>
  setTimeout(() => {
    for (const frame of document.querySelectorAll('iframe.fit')) {
      frame.style.height = frame.contentDocument.documentElement.scrollHeight + 'px';
      frame.classList.add('ready');
    }
  }, 600);
</script>`;

function page(body, extraCss = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}${extraCss}</style></head>
<body>${body}${FIT_SCRIPT}</body></html>`;
}

function caption(copy, index) {
  const [title, text] = copy.shots[index];
  return `<div class="caption">
    <div class="brand"><img src="icon.svg" alt="">Twitter Default Following Tab</div>
    <h1>${title}</h1><p>${text}</p>
  </div>`;
}

function skeletonPost(width) {
  return `<div class="post"><i class="avatar"></i><div><b style="width:${width}%"></b><b></b><b style="width:72%"></b></div></div>`;
}

/** 1: the popup over a neutral, wireframe home page (no X branding or real posts). */
function shotHome(copy, popup) {
  const css = `
    .shot.home-shot { grid-template-columns: 390px 1fr; gap: 40px; }
    .browser { position: relative; width: 712px; height: 560px; background: #f7f9f9; border-radius: 16px;
               box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5); overflow: hidden; }
    .bar { height: 48px; display: flex; align-items: center; gap: 14px; padding: 0 16px; background: #e3e8ec; }
    .dots { display: flex; gap: 7px; } .dots i { width: 12px; height: 12px; border-radius: 50%; background: #c3ccd3; }
    .address { flex: 1; height: 28px; border-radius: 14px; background: #ffffff; color: #536471;
               font-size: 14px; display: flex; align-items: center; padding: 0 14px; }
    .ext { width: 30px; height: 30px; border-radius: 8px; background: rgba(29, 155, 240, 0.18);
           display: grid; place-items: center; } .ext img { width: 20px; height: 20px; }
    .home { display: grid; grid-template-columns: 72px 320px 1fr; height: calc(100% - 48px); }
    .nav { padding: 24px 0 0 22px; display: grid; gap: 18px; align-content: start; }
    .nav i { width: 28px; height: 28px; border-radius: 8px; background: #dfe5ea; }
    .column { border-left: 1px solid #e1e8ed; border-right: 1px solid #e1e8ed; }
    .tabs { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #e1e8ed; }
    .tabs span { height: 52px; display: grid; place-items: center; font-size: 15px; color: #536471; font-weight: 500; }
    .tabs .on { color: #0f1419; font-weight: 700; position: relative; }
    .tabs .on::after { content: ""; position: absolute; bottom: 0; width: 64px; height: 4px; border-radius: 2px; background: #1d9bf0; }
    .post { display: grid; grid-template-columns: 40px 1fr; gap: 12px; padding: 16px; border-bottom: 1px solid #eef2f4; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #d4dde4; }
    .post b { display: block; height: 10px; border-radius: 5px; background: #dfe5ea; margin: 6px 0 10px; }
    .popup { position: absolute; top: 56px; right: 10px; width: 320px; border-radius: 14px; overflow: hidden;
             box-shadow: 0 18px 50px rgba(15, 20, 25, 0.35); }`;
  return page(`<div class="shot home-shot">${caption(copy, 0)}
    <div class="visual"><div class="browser">
      <div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="address">x.com/home</span>
        <span class="ext"><img src="ext/icons/icon32.png" alt=""></span></div>
      <div class="home">
        <div class="nav"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="column">
          <div class="tabs"><span>${copy.tabs[0]}</span><span class="on">${copy.tabs[1]}</span></div>
          ${skeletonPost(40)}${skeletonPost(55)}${skeletonPost(35)}${skeletonPost(50)}
        </div>
      </div>
      <div class="popup"><iframe class="fit" src="ext/${popup}" width="320" height="400"></iframe></div>
    </div></div></div>`, css);
}

/** 2: the settings page. */
function shotSettings(copy, options) {
  return page(`<div class="shot">${caption(copy, 1)}
    <div class="visual"><div class="frame" style="width:680px;height:518px">
      <iframe src="ext/${options}" width="680" height="518"></iframe></div></div></div>`);
}

/** 3: light and dark popups, one in each language. */
function shotThemes(copy, lightPopup, darkPopup) {
  const css = `.pair { display: flex; gap: 40px; align-items: flex-start; }
    .pair .frame:last-child { margin-top: 70px; }`;
  return page(`<div class="shot">${caption(copy, 2)}
    <div class="visual"><div class="pair">
      <div class="frame"><iframe class="fit" src="ext/${lightPopup}" width="320" height="400"></iframe></div>
      <div class="frame"><iframe class="fit" src="ext/${darkPopup}" width="320" height="400"></iframe></div>
    </div></div></div>`, css);
}

/** 4: privacy, as four large figures. */
function shotPrivacy(copy) {
  const css = `
    .figures { display: grid; grid-template-columns: repeat(2, 300px); gap: 24px; }
    .figure { height: 190px; padding: 28px; border-radius: 18px; background: rgba(255, 255, 255, 0.07);
              border: 1px solid rgba(255, 255, 255, 0.14); display: flex; flex-direction: column; justify-content: flex-end; }
    .figure strong { font-size: 76px; line-height: 1; font-weight: 800; color: #4cb5f9; letter-spacing: -0.03em; }
    .figure span { margin-top: 12px; font-size: 22px; color: #d5e2ee; }`;
  const figures = copy.privacy
    .map(([value, label]) => `<div class="figure"><strong>${value}</strong><span>${label}</span></div>`)
    .join('');
  return page(`<div class="shot">${caption(copy, 3)}<div class="visual"><div class="figures">${figures}</div></div></div>`, css);
}

/** A text-free tab bar: the second tab is chosen. */
function tabMotif(scale) {
  return `<div class="motif" style="--s:${scale}">
    <div class="tabbar"><span><i></i></span><span class="on"><i></i></span></div>
    <div class="feed">${'<div class="row"><b></b><i></i></div>'.repeat(3)}</div>
  </div>`;
}

const PROMO_CSS = `
  body { display: flex; align-items: center; justify-content: center; }
  .promo { display: flex; align-items: center; }
  .logo { filter: drop-shadow(0 18px 36px rgba(0, 0, 0, 0.45)); }
  .motif { width: calc(250px * var(--s)); border-radius: calc(16px * var(--s)); overflow: hidden;
           background: #ffffff; box-shadow: 0 calc(20px * var(--s)) calc(50px * var(--s)) rgba(0, 0, 0, 0.4); }
  .tabbar { display: grid; grid-template-columns: 1fr 1fr; border-bottom: calc(2px * var(--s)) solid #e6ecf0; }
  .tabbar span { height: calc(56px * var(--s)); display: grid; place-items: center; position: relative; }
  .tabbar i { width: calc(56px * var(--s)); height: calc(10px * var(--s)); border-radius: 99px; background: #cfd9de; }
  .tabbar .on i { background: #0f1419; }
  .tabbar .on::after { content: ""; position: absolute; bottom: calc(-2px * var(--s)); width: calc(70px * var(--s));
                       height: calc(6px * var(--s)); border-radius: 99px; background: #1d9bf0; }
  .feed { padding: calc(10px * var(--s)) calc(16px * var(--s)); display: grid; gap: calc(12px * var(--s)); }
  .row { display: grid; grid-template-columns: calc(30px * var(--s)) 1fr; gap: calc(10px * var(--s)); align-items: center; }
  .row b { width: calc(30px * var(--s)); height: calc(30px * var(--s)); border-radius: 50%; background: #d7e1e8; }
  .row i { height: calc(10px * var(--s)); border-radius: 99px; background: #e3e9ed; }`;

function promoSmall() {
  return page(`<div class="promo" style="gap:30px"><img class="logo" src="icon.svg" width="150" height="150" alt="">
    ${tabMotif(0.82)}</div>`, `${PROMO_CSS} html, body { width: 440px; height: 280px; }`);
}

function promoMarquee() {
  return page(`<div class="promo" style="gap:90px"><img class="logo" src="icon.svg" width="300" height="300" alt="">
    ${tabMotif(1.75)}</div>`, `${PROMO_CSS} html, body { width: 1400px; height: 560px; }`);
}

function serve(dir) {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const server = http.createServer((request, response) => {
    const file = path.join(dir, decodeURIComponent(new URL(request.url, 'http://x').pathname));
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(response);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function screenshot(chrome, profile, url, file, width, height) {
  const args = [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profile}`, '--blink-settings=preferredColorScheme=1', '--force-device-scale-factor=1',
    '--virtual-time-budget=3000', `--window-size=${width},${height}`, `--screenshot=${file}`, url,
  ];
  return new Promise((resolve, reject) => {
    execFile(chrome, args, { timeout: 60000 }, (error) => (error ? reject(error) : resolve()));
  });
}

async function main() {
  const chrome = findChrome();
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'tdft-store-images-'));
  const ext = path.join(work, 'ext');
  fs.cpSync(SRC, ext, { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'assets', 'icon.svg'), path.join(work, 'icon.svg'));

  const jobs = [];
  for (const [locale, copy] of Object.entries(COPY)) {
    const other = locale === 'en' ? 'tr' : 'en';
    const preview = (pageName, options) => writePreview(ext, pageName, { locale, tabNames: copy.tabs, ...options });
    const popupLight = preview('popup.html', {});
    const popupSaved = preview('popup.html', { status: 'statusSaved' });
    const optionsLight = preview('options.html', { settings: { followingTabSort: 'recent' } });
    const popupDarkOther = writePreview(ext, 'popup.html', { locale: other, dark: true, tabNames: COPY[other].tabs, settings: { defaultTab: '2' } });
    const pages = [
      shotHome(copy, popupLight),
      shotSettings(copy, optionsLight),
      shotThemes(copy, popupSaved, popupDarkOther),
      shotPrivacy(copy),
    ];
    fs.mkdirSync(path.join(OUT, locale), { recursive: true });
    pages.forEach((html, index) => {
      const name = `${locale}-${index + 1}.html`;
      fs.writeFileSync(path.join(work, name), html);
      jobs.push({ name, file: path.join(OUT, locale, `screenshot-${index + 1}.png`), width: 1280, height: 800 });
    });
  }
  fs.mkdirSync(path.join(OUT, 'promo'), { recursive: true });
  fs.writeFileSync(path.join(work, 'promo-small.html'), promoSmall());
  fs.writeFileSync(path.join(work, 'promo-marquee.html'), promoMarquee());
  jobs.push({ name: 'promo-small.html', file: path.join(OUT, 'promo', 'small-440x280.png'), width: 440, height: 280 });
  jobs.push({ name: 'promo-marquee.html', file: path.join(OUT, 'promo', 'marquee-1400x560.png'), width: 1400, height: 560 });

  const server = await serve(work);
  const { port } = server.address();
  try {
    for (const job of jobs) {
      await screenshot(chrome, path.join(work, 'profile'), `http://127.0.0.1:${port}/${job.name}`, job.file, job.width, job.height);
      console.log(`  ${path.relative(ROOT, job.file)}`);
    }
  } finally {
    server.close();
    fs.rmSync(work, { recursive: true, force: true });
  }
  console.log(`Rendered ${jobs.length} images into ${path.relative(ROOT, OUT)}/`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
