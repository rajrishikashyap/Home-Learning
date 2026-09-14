# Home Learning

Online English tuition for Classes 4–8 (CBSE and SEBA/ASSEB), Guwahati. A real
business site, not a demo. The site is a **book**: 19 designed pages you turn,
built with jQuery + turn.js 4.1.0. No build step, no framework.

`README.md` is the real documentation — design system, page-turn engine, the
mascot rig, why things are the way they are. **Read it before changing anything
in `index.html`, `assets/`, or `vendor/`.** This file is only the short list of
things that are easy to break without knowing.

## Working agreement

- Develop on `claude/website-frontend-review-183yf3`. Never push elsewhere
  without asking.
- Don't open a pull request unless asked.
- Measure before claiming a fix. Every performance number in `README.md` came
  from `tools/checks/`, run before and after. Don't quote a number you didn't
  take.

## Invariants that look like free choices but are not

**The page turn**

- Every `.page` carries `class="hard"`. turn.js's `sheet` effect rebuilds two
  gradients and a blurred box-shadow per frame; `hard` writes a transform. That
  is the whole difference between 25.5ms and 16.7ms median frames.
- A hard page's faces are sized from jQuery's `.width()` — the **content** width.
  So never put horizontal padding or a border on `.page`; it becomes a bare strip
  down the outer edge with the page behind showing through. Padding goes on the
  rows inside (`.page-inner`, `.running-head`, `.folio`), and `.page.left` draws
  its gutter rule as an `inset` box-shadow.
- `.book` is painted in `--paper` because a rigid leaf casts turn.js's shading
  into the slot it is swinging towards before it covers it.
- `vendor/turn.js` carries two local performance patches, marked `PATCHED`, and
  is **CRLF**. Don't replace it with a clean copy, and don't let an editor
  normalise its line endings — the diff becomes unreviewable.
- `html.flipping` stands down everything that competes for the main thread
  mid-turn. Anything new that animates continuously belongs in that list.

**The mascot (Sprout)**

- Joint origins are real drawing coordinates via `transform-box: view-box`, not
  bbox percentages. A bbox moves when the art moves; a joint must not.
- Body gradients are `userSpaceOnUse` so the whole figure shares one ramp. The
  **hands** are the exception and use `g-hand`: a `userSpaceOnUse` gradient
  resolves in the referencing element's local space, and the hands sit inside a
  `translate()` to the wrist, so the figure-wide ramp renders them a shade off.
- Each arm is two bones plus a **disc at the elbow**. Without the disc, a bent
  elbow leaves a wedge-shaped notch that reads as a doll's ball joint.
- The arms deliberately have no outline stroke. Two bones plus the disc cannot
  share one, so a per-piece stroke reappears across the join when the elbow bends.
- Mouth and brow path data in `FACES` (`assets/js/book.js`) are in the head's
  coordinates. Moving the head means moving them too.
- `tools/limb.py` generates the tapered arm outlines from a joint chain and
  reproduces the shipped paths exactly. Use it rather than hand-editing path data.

**Elsewhere**

- `Home-Learning-standalone.html` does not update itself. Rebuild it with
  `python3 tools/build-standalone.py` after any change to the site.
- Colours are tokens in `assets/css/site.css`. Every text token is verified at
  ≥4.5:1 on the surfaces it is used on; keep it that way.
- Respect `prefers-reduced-motion`, but the rule is "no large sweeping travel",
  not "no motion" — expressions and the greeting stay, gentler. A previous pass
  over-applied it and broke the page turn.

## Checking your work

Serve the directory and run the checks. They need `playwright-core`:

```bash
python3 -m http.server 8000 &
cd tools/checks && npm install && npm run all
```

`book` (pages, views, scroll-to-turn at three widths), `nav` (all ten spreads and
their pairings), `guide` (poses, expressions, the wave), `reduced-motion`,
`turn-cadence` (frame gaps), plus `drag` and `reflow`. Set `BASE` if you serve on
another port.

## Still open — these need the owner, not code

- `WHATSAPP_NUMBER` in `assets/js/book.js` is a placeholder, so the primary CTA
  cannot send.
- `[ADD NUMBER]` / `[ADD EMAIL]` on the last page of `index.html`.
- The tutor photo on page 11 is a placeholder.
- **turn.js licence.** The 4th release is the commercially licensed one and this
  is a paid service; no licence has been bought. Unresolved, not overlooked.
- The parent portal is deliberately a mockup, labelled "Preview — not live".
