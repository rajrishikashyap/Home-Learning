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
is a copy supplied for this project, carrying two local performance patches
(marked `PATCHED` in the source — see Smoothness);
`vendor/turn.js.LICENSE.txt` is a pointer to the canonical terms, not a grant.

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
- **A closing HTML comment marker with no opening one**, left over from
  disabling the 3D mascot. It printed on the page as text, under the book.
- **Reduced motion in the 3D mascot.** `reduceM` was declared and never used.
- **A `.more-fade` rule keyed to turn.js's own class.** Would have hidden the
  overflow hint on every page once turn.js wrapped them. It is keyed to
  `html.flipping` now, which is ours and means what it says.

## Sprout, the guide

Sprout is an SVG character, rigged and animated in CSS. Nine poses, six
expressions, one line per spread.

**Why not three.js or GSAP.** A three.js mascot built out of primitives looks
like a toy assembled from spheres; getting real 3D quality means a modelled and
rigged GLTF, which is an art asset, not a code change. It would also put a WebGL
render loop back on the same main thread the page turns need, and ES modules do
not load over `file://`, so it cannot run in the standalone build — which is why
the old 3D mascot in `assets/js/sprout-3d.js` is disabled rather than deleted.
GSAP buys timeline orchestration, but the idle loop is exactly what CSS
keyframes do for free on the compositor, and `html.flipping` can pause keyframes
mid-turn in one line. Neither earns its place here.

### The rig

Every joint origin is a real coordinate in the drawing (`transform-box:
view-box`), not a percentage of a bounding box — a bbox moves when the art
inside it moves, and a joint must not.

Each arm is **two bones**: the shoulder turns the whole arm, the elbow turns the
forearm and the hand together. The elbow is what stops a raised arm reading as a
plank, and it is most of the difference between a character and a stick figure.

Three things had to be right for that to hold up:

- **The elbow needs a disc.** Two bones end in semicircular caps, and once the
  elbow bends those two semicircles no longer close the circle between them —
  they leave a wedge-shaped notch that reads exactly like a doll's ball joint. A
  disc of the joint radius, in the arm's own space so the bend never moves it,
  fills that wedge at any angle.
- **One gradient ramp for the whole figure.** With the default
  `objectBoundingBox`, every part gets its own ramp, so the tones meet at a seam
  wherever two parts touch and the figure reads as pieces bolted together. All
  the body gradients are `userSpaceOnUse`.
- **Except the hands, which need their own.** A `userSpaceOnUse` gradient
  resolves in the local space of whatever references it, and each hand sits
  inside a `translate()` out to the wrist. Against the figure-wide ramp the hands
  were sampling 205 units from its centre, past the last stop, and came out a
  full shade darker than the forearms they attach to — measured at rgb(240,226,200)
  against the forearm's rgb(253,246,234). They have a ramp in hand space now, and
  every part of the figure sits within a few points of every other.

The arms carry no contour of their own. Two bones plus the elbow disc cannot
share one outline — a stroke drawn per piece reappears straight across the join
the moment the elbow bends — so separation comes from a soft cast shadow, and the
head and body wear a light contour rather than a hard one.

The limb outlines are generated rather than hand-drawn: a joint chain of
`(x, y, half-width)` is walked down one side and back up the other with a
Catmull-Rom spline through the offsets, so the silhouette tapers from shoulder to
wrist with no visible corners.

### What it says and does

Poses: rest, smile, happy, curious, wave, point, read, cheer, think.
Expressions: happy, smile, curious, cheer, wink, oh — a mouth path swap plus an
eye subtree swap, with brows fading in only for the faces that need them. Neither
travels, which is why expressions are kept under reduced motion.

**The wave lives in the forearm and wrist, not the shoulder.** That is how an arm
actually waves, and it is the difference between a greeting and a metronome. The
shoulder only breathes a few degrees underneath it, and the whole body leans in,
because an arm moving on a still body reads like a puppet rather than a creature.

The keyframes start and end at the wave pose's own angles, so the arm has to *be*
in that pose or it snaps there on the first frame and back on the last. The idle
wave can fire on any spread, so `waveOnce()` borrows the pose for the duration
and hands it back when the animation ends. Cheer is the exception: it already
holds both arms up and has keyframes anchored to its own angles, so it waves from
where it is instead of dropping to a one-arm greeting.

Under `prefers-reduced-motion` the greeting stays — a hand waving hello is brief
and local, not the kind of large sweeping travel the setting is about — but it
slows down, loses the body lean, and swings through a third of the arc. Cheer's
wave out-specifies the general rule, so the reduced-motion block names it
explicitly or it would keep the full-speed swing.

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

### Every page is a `hard` page

turn.js has two turn effects and only one of them is cheap.

`sheet` bends the leaf like paper. Per animation frame it drives four surfaces
(the page, its mirrored back, and two shadow layers), regenerates **two
full-size `linear-gradient` background-image strings**, and repaints a 20px
blurred `box-shadow`. `hard` swings the leaf rigid: a transform and an alpha.

That is the entire reason the cover turned smoothly from the first day and the
rest of the book stuttered — the cover was the only hard page. Marking every
page hard closed the gap exactly. The trade is that a leaf no longer bends as
it turns; it swings, the way a board book or a photo album does.

Two things the hard effect needs from the CSS:

- It sizes each face from jQuery's `.width()` — the **content** width, padding
  excluded — and then clips to it. Horizontal padding on the page itself
  therefore shows up as a bare strip down the outer edge with the page behind
  visible through it; at 1440px that was a 92px strip, two 46px `clamp()`
  paddings. So `.book .page.hard` carries no padding of its own and the gutter
  is set on the rows inside it. For the same reason `.page.left` draws its
  gutter rule as an `inset` box-shadow rather than a `border`, which would take
  a pixel of content width and leave a seam for the whole turn.
- A rigid leaf casts turn.js's shading onto whatever is in the slot it is
  swinging into, and for the first part of the turn that slot is the book
  itself. `.book` is painted in `--paper` rather than the page-edge colour, so
  that shading reads as a shadow falling on a page instead of a flat grey band.

`autoCenter` is deliberately left off. It would shift the whole book a quarter
width left so the lone cover sat centred, but the half beside the cover is drawn
as the front board, so the book should stay put.

### Smoothness

Two things were wrong, and they were not the same thing.

**Forced synchronous layout.** The turn read element widths and heights many
times per frame — `_c` twice, `_c2` twice, `_fold` three times, `O()` four times
per call and it runs twice — and every read came straight after turn.js had
written a transform. Layout was dirty, so the browser had to lay out
synchronously before it could answer: about a dozen forced reflows per frame,
interleaved with the writes. None of those numbers can change mid-turn, so
`vendor/turn.js` now reads each element once per resize and serves a cache after
that (`dimOf`, invalidated by a generation counter that `resize` bumps). Same
for the per-frame `z-index` read, which now prefers the inline value turn.js
sets itself. Marked `PATCHED` in the source.

**The wrong turn effect**, which was the larger half — see above.

Frame cadence, 5 trials each, measured on the same headless box:

| one mid-book turn | before | after |
|---|---|---|
| median frame gap | 25.5 ms | **16.7 ms** (60fps) |
| p95 frame gap | 46.4 ms | **25.6 ms** |
| worst frame | 59.6 ms | **34.9 ms** |
| frames > 33 ms | 9.2 | **1.2** |
| forced reflows per frame | 11.5 | **1.6** |
| frames delivered | 45 | **62** |

The cover gained from the reflow work too: p95 28.4 → 22.9 ms, long frames
1.8 → 0.4. Mid-book and the cover now measure identically, which is the point.

Everything else that competes for the main thread mid-turn is stood down via
`html.flipping`: the paper texture, the topbar's `backdrop-filter`, and the
mascot's seven infinite SVG transform animations, which are *not*
compositor-accelerated and tick on the same thread turn.js is using.

**If you ever want the bending-paper fold back**, remove `hard` from the page
divs in `index.html`. Everything else — pairing, navigation, the drag, the
guide — is independent of the effect. It will cost roughly the frame budget in
the table above.

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
