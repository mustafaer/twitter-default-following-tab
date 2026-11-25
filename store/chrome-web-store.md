# Chrome Web Store listing: version 2.1.0

Text to paste into the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) for this release. Each block in a code fence is meant to be pasted as it is.

The store shows the description as plain text, so the blocks use plain line breaks and "•" bullets rather than Markdown.

## Before you submit

1. **Publish the corrected privacy policy first.** The store links to `https://medevstudios.com/twitter-default-following/privacy-policy`. The live page still says the extension "stores absolutely no data" and uses no `chrome.storage`, which was untrue for 2.0.x too. The corrected page is in `~/projects/medev-studios` (`twitter-default-following/privacy-policy.html`) and matches [PRIVACY_POLICY.md](../PRIVACY_POLICY.md). It uses contact@medevstudios.com as the contact address. Deploy it before submitting. The settings page links to the GitHub copy, so change both copies together.
2. Test the build: load `src/` unpacked, with the store version turned off.
3. Run `npm run build` and upload `dist/twitter-default-following-tab-v2.1.0.zip` under **Package**.

The **title** and **summary** come from the package (`src/_locales/*/messages.json`), so there is nothing to paste for them. The old summary ("…zero permissions…") is replaced automatically.

- English summary: "Opens the Following tab on X (Twitter) automatically, sorted by Recent or Popular. No tracking, no data collection."
- Turkish summary: "X'te (Twitter) Takip edilenler sekmesini otomatik açar; En yeni veya Popüler sıralamayla. İzleme ve veri toplama yok."

Users who already have the extension will not be asked to approve anything. 2.1.0 only removes permissions, and the sites it runs on are unchanged.

## Store listing tab

**Category:** keep the current one (Tools, under Productivity).

**Language:** English is the default. The package now includes Turkish, so you can add a Turkish description through the language selector at the top of the Store listing tab.

### Description (English)

```text
Open X (Twitter) on the Following tab every time, and skip the algorithmic "For you" feed.

Twitter Default Following Tab switches the X home page to the tab you choose (Following by default) as soon as it opens. It can also sort the Following timeline by Recent (newest first) or Popular. The switch happens out of sight: the timeline stays hidden for the moment it takes, so the "For you" feed never flashes up.

WHAT IT DOES
• Opens Following, For you, or one of your pinned lists or communities: whichever you choose.
• Sorts the Following timeline by Recent or Popular, or leaves X's choice alone.
• Keeps a tab you pick yourself until you reload the page.
• Works with X in any language, because tabs are matched by their position.
• Applies changed settings to open X tabs straight away.
• Follows your system's light or dark mode. Available in English and Turkish.

PRIVATE BY DESIGN
• One permission only: storage, to remember your settings.
• No network requests at all: no analytics, tracking, ads or remote code.
• Your settings stay in your browser, and sync between your own devices if Chrome sync is on. The names of your home tabs are kept on this device only, to label the choices in the settings.
• Runs only on x.com and twitter.com. Chrome calls this "Read and change your data on x.com and twitter.com". The extension only looks at the home page's tabs and clicks the one you chose.

HOW TO USE IT
1. Click the extension's icon in the toolbar.
2. Under "Open on", choose your default tab. Pinned lists and communities appear there after you have opened x.com/home once.
3. Under "Following sort", choose Recent, Popular or "Leave as it is".
Changes are saved instantly.

NEW IN 2.1
• The "For you" feed no longer flashes while the tab switches.
• The sort setting only touches the Following tab, and works in every language.
• Pinned tabs open reliably right after the page loads.
• Fewer permissions (storage only), and no web fonts or other network requests.
• Redesigned settings with light and dark themes, and a Turkish translation.

Open source (GNU GPL v3): https://github.com/mustafaer/twitter-default-following-tab
Questions or problems: https://github.com/mustafaer/twitter-default-following-tab/issues

Not affiliated with or endorsed by X Corp. "X" and "Twitter" are trademarks of their respective owners.
```

### Description (Turkish)

```text
X'i (Twitter) her seferinde Takip edilenler sekmesinde açın, algoritmik "Sana özel" akışını atlayın.

Twitter Default Following Tab, X ana sayfası açılır açılmaz seçtiğiniz sekmeye (varsayılan olarak Takip edilenler) geçer. Takip edilenler zaman akışını En yeni (önce yeni gönderiler) ya da Popüler olarak da sıralayabilir. Geçiş görünmeden yapılır: zaman akışı bu kısa an boyunca gizli kalır, böylece "Sana özel" akışı hiç görünmez.

NELER YAPAR
• Takip edilenler, Sana özel ya da sabitlediğiniz liste veya topluluklardan hangisini seçerseniz onu açar.
• Takip edilenler zaman akışını En yeni ya da Popüler olarak sıralar veya X'in seçimine dokunmaz.
• Kendiniz seçtiğiniz sekmeyi, sayfayı yenileyene kadar korur.
• Sekmeler sırasına göre eşleştiği için X hangi dilde olursa olsun çalışır.
• Değiştirdiğiniz ayarlar açık X sekmelerine hemen uygulanır.
• Sisteminizin açık veya koyu temasına uyar. Türkçe ve İngilizce kullanılabilir.

GİZLİLİK ÖNCELİKLİ
• Tek bir izin: ayarlarınızı hatırlamak için storage (depolama).
• Hiçbir ağ isteği yapmaz: analiz, izleme, reklam ya da uzaktan kod yok.
• Ayarlarınız tarayıcınızda kalır; Chrome eşitlemesi açıksa kendi cihazlarınız arasında eşitlenir. Ana sayfa sekmelerinizin adları, ayarlardaki seçenekleri adlandırmak için yalnızca bu cihazda tutulur.
• Yalnızca x.com ve twitter.com'da çalışır. Chrome bunu bu iki sitedeki verilere erişim izni olarak gösterir. Eklenti yalnızca ana sayfadaki sekmelere bakar ve seçtiğiniz sekmeye tıklar.

NASIL KULLANILIR
1. Araç çubuğundaki eklenti simgesine tıklayın.
2. "Açılacak sekme" bölümünden varsayılan sekmenizi seçin. Sabitlediğiniz listeler ve topluluklar, x.com/home sayfasını bir kez açtıktan sonra burada görünür.
3. "Takip edilenler sıralaması" bölümünden En yeni, Popüler ya da "Olduğu gibi bırak" seçeneğini seçin.
Değişiklikler anında kaydedilir.

2.1 SÜRÜMÜNDEKİ YENİLİKLER
• Sekme değişirken "Sana özel" akışı artık bir an bile görünmüyor.
• Sıralama ayarı yalnızca Takip edilenler sekmesini etkiliyor ve her dilde çalışıyor.
• Sabitlenmiş sekmeler, sayfa yüklendikten hemen sonra da güvenilir şekilde açılıyor.
• Daha az izin (yalnızca storage); web yazı tipi ya da başka bir ağ isteği yok.
• Açık ve koyu temalı yeni ayarlar ekranı ve Türkçe çeviri.

Açık kaynak (GNU GPL v3): https://github.com/mustafaer/twitter-default-following-tab
Soru ve sorunlar için: https://github.com/mustafaer/twitter-default-following-tab/issues

X Corp. ile bağlantılı değildir ve X Corp. tarafından onaylanmamıştır. "X" ve "Twitter", sahiplerinin ticari markalarıdır.
```

### Images

All the images are in [`images/`](images/). They are rendered from the real popup and settings page, using sample tab names so no real account shows. To make them again after a UI change, run `npm run store-images` (needs Google Chrome or Chromium).

**Screenshots** (1280×800, square corners, no padding). Delete the 2.0 screenshots and upload these in order:

| File | Shows |
| --- | --- |
| `images/en/screenshot-1.png` | The popup over the X home page, with Following selected |
| `images/en/screenshot-2.png` | The settings page: default tab and Following sort |
| `images/en/screenshot-3.png` | The popup in light and dark mode, in English and Turkish |
| `images/en/screenshot-4.png` | Privacy: one permission, no network requests, no trackers, open source |

For the Turkish listing, upload `images/tr/screenshot-1.png` to `screenshot-4.png` the same way.

**Promo tiles.** Following Google's advice, these have no text, so one set serves every language:

- Small promo tile (440×280): `images/promo/small-440x280.png`. This is optional, but listings without one are shown after listings that have one.
- Marquee promo tile (1400×560): `images/promo/marquee-1400x560.png`. Optional; without it the extension can't be featured in the marquee.

**Store icon.** This comes from the package (`src/icons/icon128.png`). Google recommends 96×96 artwork with 16px of transparent padding on each side. Ours fills 116px, so it looks a little larger than its neighbours in the store. That is a recommendation, not a rule. Changing it would mean a new package (2.1.1), because 2.1.0 is already tagged.

## Privacy practices tab

### Single purpose

```text
Opens the X (Twitter) home page on the tab the user chooses (the Following tab by default) and, if the user wants, sets the Following timeline's sort order to Recent or Popular.
```

### Permission justification

The `scripting` and `activeTab` fields go away once 2.1.0 is uploaded. Two remain.

**storage**

```text
Saves the user's three settings (on/off, which home tab to open, and the Following sort order) in chrome.storage.sync. Also saves the names of the user's X home tabs in chrome.storage.local, so the settings can show real tab names. Nothing is sent anywhere.
```

**Host permission** (the content script on `https://x.com/*` and `https://twitter.com/*`)

```text
The content script runs only on x.com and twitter.com. On the home page it finds the tab at the position the user chose, clicks it, and hides the timeline for a moment while the new feed loads. If the user asked for a sort order, it also selects that order in the Following tab's menu. It does not read posts, messages or account data, and it runs on no other site.
```

### Remote code

Select **"No, I am not using remote code."**

### Data usage

The dashboard currently says the extension collects no data. Google's user data FAQ says data must be disclosed "even when data is processed or stored locally", and 2.1.0 keeps the names of the home tabs on the device. So tick the category for content read from web pages. In the dashboard that is **Website content**; if the wording differs, pick the category that covers text read from websites.

These are the names shown on the user's X home tabs, such as "Following" or the names of pinned lists and communities. They are stored only on the user's device and never transmitted.

Leave every other category unticked.

If you would rather keep "no data" on the listing, the extension could stop saving tab names. The popup would ask the open X tab for them instead. The cost is that the settings page could no longer show your pinned tabs' names when no X tab is open.

Tick all three certifications:

- you do not sell or transfer user data to third parties, outside of the approved use cases;
- you do not use or transfer user data for purposes unrelated to the item's single purpose;
- you do not use or transfer user data to determine creditworthiness or for lending purposes.

### Privacy policy

Keep `https://medevstudios.com/twitter-default-following/privacy-policy`, once its text matches [PRIVACY_POLICY.md](../PRIVACY_POLICY.md); see "Before you submit".
