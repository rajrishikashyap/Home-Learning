# Home Learning

Online English tuition for Classes 4–8 (CBSE and SEBA/ASSEB) — Guwahati.

The site is a **book**: 19 designed pages you turn, rather than a page you scroll.
The page-turn is [turn.js 4.1.0](https://www.turnjs.com/); scrolling the wheel
reads the current page first and turns the leaf only once its text has bottomed
out.

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
index.html                  markup for all 19 pages
check-my-browser.html       standalone environment report (see below)
assets/css/fonts.css        @font-face — Quicksand, Nunito Sans, Caveat
assets/css/site.css         design tokens, motion primitives, components
assets/js/book.js           turn.js setup, scroll gesture, portal, lead form
assets/js/sprout-3d.js      retired 3D mascot (disabled — see The mascot)
assets/fonts/               Quicksand, Nunito Sans, Caveat (variable woff2)
assets/img/                 logo + philosophy plate
vendor/                     third-party libraries
tools/build-standalone.py   inlines everything into the single-file build
```

This was originally a single self-extracting 9.5 MB HTML bundle. It has been
unpacked into real files; the fonts and three.js are now self-hosted rather
than fetched from Google Fonts and jsDelivr.

## ⚠️ turn.js licensing

`vendor/turn.js` is the **turn.js 4th release** (4.1.0). The 4th release is the
commercially-licensed one; the freely-redistributable BSD release is the 3rd,
whose terms restrict use to

> ...personal benefit and not for any commercial purpose or for monetary gain.

**Home Learning is a paid tuition service**, so neither release covers it
without a licence bought from <https://www.turnjs.com/>. The file in `vendor/`
is a copy supplied for this project; `vendor/turn.js.LICENSE.txt` is a pointer
to the canonical terms, not a grant.

Treat this as unresolved until a licence is purchased, or the library is
replaced. A commercially-safe alternative is
[`page-flip`](https://www.npmjs.com/package/page-flip) (StPageFlip) — MIT, zero
dependencies.

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
- **Blank spread before the cover.** Pages had no background until turn.js had
  wrapped them, so the bare book showed for a beat on load. Pages now carry
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
- **A `.more-fade` rule keyed to turn.js's own class.** Would have hidden the
  overflow hint on every page once turn.js wrapped them. It is keyed to
  `html.flipping` now, which is ours and means what it says.

## Sprout, the guide

Sprout's job is to move the reader through the book: greet them, name the spread
in front of them, look down when there is more text below the fold, and nudge
toward the next page when they have gone quiet. **Clicking Sprout turns the
page** — on the last spread it opens the assessment form instead.

### The rig

Inline SVG, drawn in parts so every pose is one rotation about a named origin:

| part | pivots at |
|---|---|
| `#s-head` | the neck (`50% 96%`) |
| `#s-armL` / `#s-armR` | its own shoulder |
| `#s-leaves` | the base of the stem |

The arms are drawn **last**, after the head. Drawn before it, a raised arm
disappears behind the head — which is what the first pass did, and why "wave"
and "cheer" were indistinguishable from "smile".

Seven poses: `smile` `happy` `curious` `wave` `point` `cheer` `read`, driven by
`data-pose` on `.sprout`. Four faces (`FACES` in `book.js`) set mouth, eyes and
brows independently, so "pointing while curious" is expressible.

### What it says

`GUIDE` in `assets/js/book.js` holds one pose and one line per spread. The line
appears in a bubble **below** Sprout. Above is the obvious place and was tried:
the margin is only ~130 px wide, so a bubble wide enough to read overhangs into
the book and lands straight on the next-page arrow. Covering the navigation is a
bad trade for a caption.

The bubble and the click target are siblings of the mascot, not children —
anything inside inherits its scale transform, which at the small end shrinks the
text to nothing. All three are positioned from the same numbers in
`moveSprout()`.

### Nudging

After ~9 s without a turn, Sprout reacts to what is actually on screen:

- page still has text below the fold → `read` pose, *"There's a little more below."*
- page fully read → `point` pose with a pulsing arm, *"Turn the page when you're ready."*
- last spread → `cheer`, *"Ready when you are."*

Verified: the greeting fires on the cover, nothing waves mid-book, the finale
cheers — identically with and without `prefers-reduced-motion`.

Below ~900 px there is no margin to stand in, so Sprout, the bubble and the
click target all withdraw together.

## Why it can look different on two computers

`check-my-browser.html` reports what a machine supports and what is switched on.
Run it on any computer the site looks wrong on — it sends nothing anywhere.

**Reduced motion** (Windows → Settings → Accessibility → Visual effects →
"Animation effects" off) reports `prefers-reduced-motion: reduce`. What it now
does, after a rethink:

| kept | removed |
|---|---|
| Sprout's expressions (a path swap is not motion) | continuous idling — float, breathe, leaf sway |
| the wave, as a gentler/slower swing | the spring's overshoot on hover/press |
| staggered entry, as a pure fade | the 14 px rise that went with it |
| a 280 ms page turn | the full 820 ms fold |

The first pass over-applied it: `.sprout, .sprout *{animation:none!important}`
froze the mascot, and `waveOnce()` / `startIdleLife()` / `staggerIn()` all
returned early, so *every* feature above vanished. The guidance is about
vestibular triggers — parallax, zoom, large travel. A face changing shape, a
fade, and a hand waving hello are none of those.

**`linear()` easing** needs Chrome/Edge 113+, Firefox 112+, Safari 17.4+. A
custom property accepts any token stream at declaration time, so redeclaring
`--spring` later is *not* a fallback — the invalidity only surfaces when `var()`
substitutes into `transition-timing-function`, and that invalidates the whole
`transition` declaration, giving no animation rather than a degraded one. The
sampled spring is gated behind
`@supports (transition-timing-function: linear(0, 1))`, with an overshooting
`cubic-bezier` as the base value.

**Page colours.** Two blend-mode layers are gone: a fixed `soft-light` grain
overlay and a `multiply` paper texture on every page. Both were tuned for the
original dark-green ground; measured against the light palette they moved the
paper by **1/255 and 0/255** respectively — nothing. Blend modes composite
against whatever backdrop the stacking context resolves to, and turn.js wraps
every page in transformed containers that each create one, so they were a
cross-browser liability buying no visual benefit. The paper texture is plain
alpha now and resolves identically everywhere.

That said: a reported yellow-paper difference between two browsers could **not**
be reproduced by forcing different stacking contexts (0/255 variation either
way), so the blend removal is a robustness change, not a confirmed fix for it.
The likelier cause is a page-recolouring browser extension — Dark Reader and
similar tint backgrounds while skipping `<img>`, which is exactly the signature
of "paper yellow, illustration fine". `check-my-browser.html` detects those.

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

turn.js 4.1.0 owns `#flipbook` and its 19 `.page` children, wraps each in a
`.page-wrapper`, and keeps ~6 pages in the DOM at a time.

**There is no blank endpaper.** The book opens on its cover, which stands alone
on the right the way a real one does; the half beside it is the inside board,
styled as binding with a debossed mark. The endpaper used to exist only to push
the cover onto an *even* page so turn.js would pair it leftward. Folding the old
"a note before you begin" page into the cover removed the need for it without
re-pairing anything — the plate still faces its philosophy text, the portrait
its bio, questions still face contact.

```
view 0  = page 1          cover (alone, right)
view i  = pages 2i, 2i+1  the nine designed spreads
```

`assets/js/book.js` supplies sizing, the scroll gesture, the spread mapping and
the corner-size clamp.

### The cover is a `hard` page

The 4th release understands a `hard` page — a rigid board that swings as one
piece instead of folding — so the cover now carries `class="hard"` and opens
like a front board rather than bending like paper. That is also what closed out
an older workaround: forcing the cover to span both halves had been tried and
reverted, because turn.js nests each page two levels below its wrapper and sizes
it inline from half the book width.

One thing the `hard` effect needs from the CSS. It sizes its two faces from
jQuery's `.width()` — the **content** width, padding excluded — and then clips
them. Any horizontal padding on the page element itself therefore becomes a bare
strip down the outer edge with the next page showing through it; at 1440px that
was a 92px strip (two 46px `clamp()` paddings). So `.book .page.hard` carries no
padding of its own and the same gutter is set on the panes inside it.

`autoCenter` is deliberately left off. It would shift the whole book a quarter
width left so the lone cover sat centred, but here the half beside the cover is
drawn as the front board, so the book should stay put.

### Smoothness

The 3rd release drove the fold with `setInterval(f, 30)` and advanced progress
by a fixed 30 ms step per tick. On a 60 Hz display a 30 ms timer beats against
the 16.7 ms vsync — some frames get two updates, some none — and the fold's real
duration drifts with timer lag because progress is counted in ticks rather than
elapsed time. That needed a local patch. **The 4th release does it upstream**:
`window.requestAnim` is `requestAnimationFrame`, and `animatef` derives progress
from the elapsed timestamp. `vendor/turn.js` is now stock, with no patches.

Everything else that competes for the main thread mid-fold is stood down via
`html.flipping`: the paper texture, the topbar's `backdrop-filter`, and the
mascot's seven infinite SVG transform animations, which are *not*
compositor-accelerated and tick on the same thread turn.js is using.

Frame cadence, 5 trials each, both builds measured back-to-back on the same
headless box (a relative signal, not real-device numbers):

| one turn | turn.js 3 (patched) | turn.js 4.1.0 |
|---|---|---|
| cover → spread 1, median gap | 24.6 ms | **16.8 ms** |
| cover → spread 1, p95 gap | 39.5 ms | **30.5 ms** |
| cover → spread 1, frames > 33 ms | 4 | **1.8** |
| spread 4 → 5, median gap | 23.7 ms | 26.3 ms |
| spread 4 → 5, p95 gap | 45.3 ms | 48.8 ms |

The cover is markedly smoother, which is the `hard` board doing less work than a
fold. Mid-book, the two are level — the differences there are inside the run-to-
run spread of this machine.

**The remaining limit is structural.** turn.js recomputes fold geometry in
JavaScript every frame — 92 `transform()` calls and 384 `css()` writes per turn
at 650 ms. A CSS-transform engine does zero per-frame JS and hands the whole
animation to the compositor. If the turn still isn't smooth enough on a weak
GPU, that is the trade to revisit, not more tuning. On desktop it is not
visible; on low-end Android those main-thread style writes are where it would
show, and that has not been measured on a real phone.

## Standalone build

`Home-Learning-standalone.html` is a single 1.41 MB file with fonts, artwork,
jQuery and turn.js inlined as data URIs. It opens straight from disk with no
server — for previewing and for sending to someone.

It omits the three.js mascot: ES modules are blocked over `file://`, so the SVG
mascot runs instead. Every call site already guards on `window.Sprout3D`, so
that is a supported path rather than a fallback hack.

Rebuild it after changing the site — it does not update itself. `index.html`
is the source of truth:

```bash
python3 tools/build-standalone.py
```
