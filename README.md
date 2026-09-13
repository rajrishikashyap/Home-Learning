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

These need your input — I can't supply them:

| | |
|---|---|
| `WHATSAPP_NUMBER` is a placeholder | `assets/js/book.js` — the primary CTA still can't send |
| `[ADD NUMBER]` / `[ADD EMAIL]` in the footer | last page of `index.html` |
| Tutor photo is a placeholder | page 11 |

Open by choice, not by oversight:

| | |
|---|---|
| Parent portal is a mockup | login accepts anything, data is fictional; now labelled "Preview — not live" |
| turn.js licence | see above — unresolved for a commercial site |
| `vendor/three.module.js` is 1.27 MB | the 3D mascot; the SVG mascot it hides is 0 KB and arguably cuter |

## Fixed

- **Mobile mirror bug.** In single-page mode (≤900px) the old CSS-3D engine
  reused the leaf's back face without clearing its `rotateY(180deg)`, so all 10
  even-numbered pages rendered as mirror writing. Moot now that turn.js owns
  display mode, but fixed either way.
- **Philosophy plate.** Replaced with new artwork and encoded as WebP:
  **5.52 MB → 88 KB**, a 64× reduction, and no longer 82% of page weight. The
  Apple logo on the laptop lid was painted out — a trademark on a commercial
  page — and the plate background now matches the art instead of clashing dark
  brown. Crop biased to `center 38%` so the face and laptop stay in frame.
- **Fonts.** Cyrillic and Vietnamese subsets dropped (190 KB of glyphs that
  could never render on an English site). The remaining faces are variable
  fonts that Google emits as one `@font-face` per weight all pointing at the
  same file — collapsed to one block per file with a weight *range*, 22 blocks
  down to 8.
- **Dashboard arithmetic.** The attendance marks are 7 present / 1 absent /
  1 holiday = 87.5%; the stat tile claimed 92%. Now 88%.
- **Contrast.** Every piece of chrome that failed WCAG AA now passes: running
  heads 2.44 → 4.51, folios 2.93 → 4.55, cover subtitle 2.44 → 4.51, the
  absent-day marker 2.70 → 4.55, present 3.31 → 4.53, both dashboard badges,
  and the closing-page copyright. Gold split into `--gold` (decorative fills,
  unchanged) and `--gold-ink` (text, darkened to 4.56).
- **Focus traps.** The modal and the portal both hold Tab inside themselves,
  restore focus to whatever opened them, and set `role="dialog"`/`aria-modal`.
  Previously Tab walked straight out into the pages behind the overlay.
- **Off-screen pages hidden from assistive tech.** turn.js keeps ~6 pages in
  the DOM but only two on screen; the rest are now `aria-hidden` with their
  focusables taken out of the tab order.
- **Dead mascot code wired up.** `PLAN` and `setMood()` were fully written and
  never called — Sprout's expression ran off a random timer with no relation to
  the page. It now changes on turn.js's `turned` event, so it is curious on
  "What we teach" and proud on "Your tutor", as the list always intended. The
  `side`/`vy` fields were removed: Sprout keeps one margin position now, so
  they described behaviour that no longer exists.
- **Reduced motion in the 3D mascot.** `reduceM` was declared and never used,
  so the WebGL mascot animated regardless of the OS setting while the SVG one
  respected it. It now renders a single static pose and skips the loop.
- **`.turn-page .more-fade`.** A leftover that was inert under the old engine
  but would have hidden the overflow hint on all 20 pages once turn.js added
  `.turn-page` to every page. Scoped to `#turn-fwrappers`.

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

## Standalone build

`Home-Learning-standalone.html` is a single 1.67 MB file with fonts, artwork,
jQuery and turn.js inlined as data URIs. It opens straight from disk with no
server — for previewing and for sending to someone.

It omits the three.js mascot: ES modules are blocked over `file://`, so the SVG
mascot runs instead. Every call site already guards on `window.Sprout3D`, so
that is a supported path rather than a fallback hack.

Rebuild it after changing the site — it does not update itself. `index.html`
is the source of truth.
