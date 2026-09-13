# Home Learning

Online English tuition for Classes 4–8 (CBSE and SEBA/ASSEB) — Guwahati.

The site is a **book**: 20 designed pages you turn, rather than a page you scroll.

## Running locally

No build step. Serve the directory over HTTP:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Opening `index.html` over `file://` will not work — the mascot loads as an ES
module and needs a real origin.

## Layout

```
index.html                  markup for all 20 pages
assets/css/fonts.css        @font-face for the three self-hosted families
assets/css/site.css         design system + book/flip CSS
assets/js/book.js           flip engine, navigation, portal, lead form
assets/js/sprout-3d.js      "Sprout" mascot (three.js, ES module)
assets/fonts/               Fraunces, Newsreader, Caveat (woff2)
assets/img/                 logo + philosophy plate
vendor/                     third-party libraries
```

This was originally a single self-extracting 9.5 MB HTML bundle. It has been
unpacked into real files; the fonts and three.js are now self-hosted rather
than fetched from Google Fonts and jsDelivr.

## ⚠️ turn.js licensing

`vendor/turn.js` is the **turn.js 3rd release**. Its license
(`vendor/turn.js.LICENSE.txt`) states:

> Any redistribution, use, or modification is done solely for personal
> benefit and not for any commercial purpose or for monetary gain.

**Home Learning is a commercial service.** Using turn.js 3 here is outside
those terms. The commercially-licensed version is the turn.js 4th release,
sold at <https://www.turnjs.com/>.

The build in `vendor/turn.js` is the npm `turn.js@1.0.5` source — a CommonJS
fork whose `package.json` claims MIT, but which **ships the original
non-commercial license file inside the package**. That `package.json` does not
grant rights the original author did not give. Treat this as unresolved until
a 4th-release license is purchased, or the library is replaced.

A commercially-safe alternative is [`page-flip`](https://www.npmjs.com/package/page-flip)
(StPageFlip) — MIT, zero dependencies.

## Known issues

| | |
|---|---|
| `assets/img/philosophy-krishna.png` is **5.5 MB** | 82% of total page weight; needs to be a ~120 KB WebP |
| Fonts ship Cyrillic + Vietnamese subsets | ~500 KB of unused glyphs for an English-tuition site in India |
| `WHATSAPP_NUMBER` is a placeholder | `assets/js/book.js` — the primary CTA does not work yet |
| `[ADD NUMBER]` / `[ADD EMAIL]` in the footer | last page of `index.html` |
| Tutor photo is a placeholder | page 11 |
| Parent portal is a **mockup** | login accepts anything; all data is fictional |
| Dashboard says 92% attendance | the marks shown add up to 87.5% |
| Both images carry C2PA "AI-generated" credentials | signed metadata, visible to anyone inspecting the file |
| Chrome colours fail WCAG AA | running heads 2.44:1, folios 2.93:1 |
| No focus trap in modal/portal | tab escapes behind the overlay |
| Off-screen pages are not `inert` | screen readers narrate pages that aren't visible |

## Fixed

- **Mobile mirror bug.** In single-page mode (≤900px) the leaf's back face kept
  its `rotateY(180deg)` from the two-page spread, so all 10 even-numbered pages
  rendered as mirror writing. One rule in `site.css`
  (`.book.single .leaf .face.back{transform:none}`) resets it. Verified across
  all 20 pages at 390px.
