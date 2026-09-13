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

`Home-Learning-standalone.html` opens straight from disk if you just want to
look at it; the served version is the source of truth.

## Layout

```
index.html                  markup for all 20 pages
check-my-browser.html       standalone environment report (see below)
assets/css/fonts.css        @font-face — Quicksand, Nunito Sans, Caveat
assets/css/site.css         design tokens, motion primitives, components
assets/js/book.js           turn.js setup, scroll gesture, portal, lead form
assets/js/sprout-3d.js      retired 3D mascot (disabled — see The mascot)
assets/fonts/               Quicksand, Nunito Sans, Caveat (variable woff2)
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
| `vendor/three.module.js` is 1.27 MB | no longer loaded; kept so the 3D mascot can be restored |

## Fixed

- **Blank spread reachable by scrolling up.** Page 1 is the blank leading
  endpaper. The prev *button* was correctly disabled on the cover, but the
  wheel and keyboard called `turn(-1)` directly and landed on view `[0,1]` — a
  half-empty spread with nothing in it. `FIRST` is now the floor for every
  navigation path. The page stays in the DOM because it is load-bearing: it is
  what puts the cover on an *even* page, and turn.js pairs even pages leftward.
  Delete it and every designed pair in the book re-pairs one page out — the
  plate would face the wrong text, the portrait the wrong bio.
- **Drop caps became unreadable after the font change.** A capital "I" in
  Quicksand is a bare vertical stroke; on Our Story it sat directly above the
  pull-quote's rule and read as a second border. Initials are set in Caveat now.
- **Blank spread before the cover.** Pages had no background until turn.js added
  `.turn-page`, so the bare book showed for a beat on load. Pages now carry
  `--paper` from the start, and `#flipbook` fades up only once turn.js has
  actually laid them out (`.ready`).
- **Turn arrows stacked on top of each other.** `.turn.prev`/`.turn.next` lost
  their `left`/`right` offsets, so both sat at the book's left edge and the
  next arrow was unreachable on desktop. Restored at `∓24px`.
- **Reduced motion killed the page turn.** `FLIP_MS` was 0 under
  `prefers-reduced-motion`, which turn.js took literally as a 1 ms turn — 15
  fold frames instead of 177, reading as a broken swap rather than a
  considerate one. Now 280 ms (69 frames): the big sweep is gone, the cue
  isn't. If a Windows machine has *Show animations* off, this is what it hits.
- **Brand lock-up wrapped on phones.** At 390 px the name broke over two lines
  and the Caveat tagline ran to three, colliding with the mark. Name stays on
  one line under 620 px; the tagline steps aside.
- **Mobile mirror bug.** The old CSS-3D engine reused the leaf's back face
  without clearing its `rotateY(180deg)`. Moot now that turn.js owns display
  mode, but fixed either way.
- **Philosophy plate.** New artwork, WebP: **5.52 MB → 88 KB**. Apple logo
  painted off the laptop lid (a trademark on a commercial page), plate
  background matched to the art, crop biased to `center 38%`.
- **Fonts.** Retired Fraunces and Newsreader for Quicksand + Nunito Sans; kept
  Caveat. Dropped Cyrillic and Vietnamese subsets. **700 KB → 296 KB.**
- **Dashboard arithmetic.** 7 present / 1 absent / 1 holiday is 87.5%, not 92%.
- **Contrast.** Every text token is verified ≥4.5:1 on every surface it is
  actually used on, soft tints included.
- **Focus traps.** Modal and portal hold Tab, restore focus on close, set
  `role="dialog"`/`aria-modal`.
- **Off-screen pages hidden from assistive tech.**
- **Dead mascot code wired up.** `PLAN`/`setMood()` were written and never
  called; Sprout's expression now follows the spread.
- **Reduced motion in the 3D mascot.** `reduceM` was declared and never used.
- **`.turn-page .more-fade`.** Would have hidden the overflow hint on all 20
  pages once turn.js added `.turn-page` to every page.

## The mascot

Sprout is **inline SVG**, not three.js. Three expressions, plus a wave:

| | |
|---|---|
| `happy` | open grin, bright round eyes — arrivals and good news |
| `smile` | soft closed curve, eyes creased shut — the resting face |
| `curious` | small round mouth, brows up, eyes wide, head tilted — questions and lists |

`PLAN` in `assets/js/book.js` assigns one per spread; `startIdleLife()` drifts
between them every 5.2 s when the reader is sitting still, and waves every 14 s.
Turning a page restarts that clock (`bumpIdleLife()`), so the expression a
spread asked for always gets its full beat on screen.

Three is a deliberate limit. A mascot cycling through eight subtly different
faces reads as noise; three distinct ones read as a character with moods.

### Why not the three.js build

`assets/js/sprout-3d.js` and `vendor/three.module.js` are still in the repo but
are **commented out in `index.html`** — uncomment both lines to restore them.

At the size Sprout actually renders (~110 px) the WebGL mascot's face did not
resolve: the mouth geometry was invisible for `happy` and `smile`, leaving a
grey blob with two dots, so the expressions the code was setting never reached
the reader. The SVG is vector, so it reads at any size, costs 0 KB against
three.js's 1.27 MB, and honours `prefers-reduced-motion` — which the WebGL
version silently did not.

It also removes a second driver: the 3D build ran its own random `MOOD_CYCLE`
timer that overrode whatever expression the current spread had just requested.

## Why it can look different on two computers

The site adapts to machine settings, and one of them changes a lot: **Windows
"Animation effects" off** (Settings → Accessibility → Visual effects) reports
`prefers-reduced-motion: reduce` to the browser.

`check-my-browser.html` is a standalone page that reports what the current
machine supports and what is switched on — open it on any computer that looks
wrong. It sends nothing anywhere.

What reduced motion now does, after a rethink:

| kept | removed |
|---|---|
| Sprout's expressions (a path swap is not motion) | continuous idling — float, breathe, leaf sway |
| the wave, as a gentler/slower swing | the spring's overshoot on hover/press |
| staggered entry, as a pure fade | the 14 px rise that went with it |
| a 280 ms page turn | the full 820 ms fold |

The first pass over-applied it: `.sprout, .sprout *{animation:none!important}`
froze the mascot completely, and `waveOnce()` / `startIdleLife()` / `staggerIn()`
all returned early, so *every* feature on the list above vanished. The guidance
is about vestibular triggers — parallax, zoom, large travel. A face changing
shape, a fade, and a hand waving hello are none of those, and removing them left
the page feeling broken rather than considerate.

**`linear()` easing** is the other machine-dependent piece. It needs Chrome/Edge
113+, Firefox 112+, or Safari 17.4+. A custom property accepts any token stream
at declaration time, so redeclaring `--spring` later is *not* a fallback — the
invalidity only surfaces when `var()` substitutes into
`transition-timing-function`, and that invalidates the whole `transition`
declaration, giving no animation rather than a degraded one. The sampled spring
is therefore gated behind `@supports (transition-timing-function: linear(0, 1))`,
with an overshooting `cubic-bezier` as the base value.

## Design system

A warm, light "cozy" system, replacing the deep forest-green ground the site
started with. Tokens live at the top of `assets/css/site.css`.

- **Type.** Quicksand (rounded geometric) for headings and brand; Nunito Sans
  (humanist geometric) for body and dashboard data; Caveat for the handwritten
  margin notes. All variable, latin + latin-ext only, self-hosted.
- **Colour.** Oat-to-blush ground, warm white paper, three pastel accents —
  peach, honey, sage. Each accent has a *soft* fill and a darker *ink* twin for
  text, because the fill tints can't carry type at AA.
- **Radii.** 12 / 16 / 20 / 24 px plus a pill. No square corners.
- **Depth.** Four levels, each a stack of three low-opacity warm-tinted
  shadows. A tight contact shadow under a wide ambient one is what makes a
  surface look like it is resting on something; one big blur just reads grey.
- **States.** Default, hover, focus-visible, active and disabled are designed
  for every interactive element.

### Motion

`--spring` is a real spring — stiffness 450, damping 18, mass 1 — integrated
and sampled into a CSS `linear()` easing. ζ = 0.42, so it overshoots ~23% and
settles: that overshoot is the squish. Hover scales to 1.03, press to 0.97.

Framer Motion was the brief, but it is React-only and this is a vanilla
document, so the physics is computed rather than imported — same curve, no
runtime.

Entry is orchestrated by `staggerIn()`: when a spread arrives its blocks rise
in 50 ms apart, driven by a `--i` custom property. **Only `opacity` and
`transform` are animated anywhere** — nothing touches height, margin or any
layout property, so no animation can shift the page mid-turn.

All of it collapses under `prefers-reduced-motion`: springs become plain colour
transitions, the stagger is off, and the page turn shortens rather than
vanishing.

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
