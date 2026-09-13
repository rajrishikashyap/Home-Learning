# Home Learning

Online English tuition for Classes 4–8 (CBSE and SEBA/ASSEB) — Guwahati.

The site is a **book**: 20 designed pages you turn, rather than a page you scroll.
The page-turn is [turn.js 3](https://www.turnjs.com/); scrolling the wheel reads
the current page first and turns the leaf only once its text has bottomed out.

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
assets/js/book.js           turn.js setup, scroll gesture, portal, lead form
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

- **Mobile mirror bug.** In single-page mode (≤900px) the old CSS-3D engine
  reused the leaf's back face without clearing the `rotateY(180deg)` it carries
  in a two-page spread, so all 10 even-numbered pages rendered as mirror
  writing. Fixed in the previous commit with a one-line reset; the bug is now
  moot, as turn.js replaced that engine and handles single-page display itself.
  Verified at 390px either way.

## Page-turn engine

turn.js owns `#flipbook` and its 21 `.page` children, wraps each in a
`.turn-page-wrapper`, and keeps ~6 pages in the DOM at a time. `assets/js/book.js`
supplies the glue:

- **Sizing** — turn.js needs pixel dimensions, so `bookSize()` mirrors the CSS
  clamps and feeds `turn('size', w, h)` on resize.
- **Scroll gesture** — not part of turn.js, and not in the demo this was modelled
  on. A wheel event scrolls whichever visible page still has text in that
  direction; only when both have bottomed out does the accumulated delta call
  `turn('next'|'previous')`.
- **Corner size** — turn.js starts a drag-fold only within `cornerSize` of a
  corner, so page centres stay free for the scrolling `.page-inner` panes. The
  default 100px is shrunk to 28px on touch, where it would otherwise swallow
  most of a swipe. turn.js rebuilds a page's flip when it re-enters range, which
  resets this, so it is reapplied on every `turned`.
- **Responsive** — `turn('display', 'single'|'double')` at the 900px breakpoint.

### Cost

turn.js animates with `setInterval(fn, 30)` and recomputes the fold geometry in
JavaScript on every tick. One page turn measures **177 `transform()` calls and
398 `css()` writes**. The CSS-3D engine it replaced did zero per-frame JS work —
one class toggle, then the compositor interpolated a single `rotateY`.

On desktop this is not visible; in headless testing turn.js actually measured
*smoother* than the old engine, because software rasterising a 1180px
`preserve-3d` surface is expensive. On low-end Android the ~400 main-thread
style writes per turn are where it would show. This has not been measured on a
real phone.
