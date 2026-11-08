# Agent guide

**What it is.** A static, dependency-free demo repo for the `i-have-adhd` output skill. It holds nine hand-written
prompt/answer pairs — each with a chatty "before" and a skill-shaped "after" — and renders them side by side in
`index.html`. It is not a benchmark, not a set of recorded transcripts, and not affiliated with the upstream skill.

## Commands

```sh
npm run build     # data/examples.json → data/examples.js (required after any data edit)
npm run verify    # build + rule checks; exits 1 on failure
npm run serve     # python3 -m http.server ${PORT:-4173} (only if file:// is awkward)
open index.html   # works directly: no bundler, no fetch, no network
```

There is nothing to install. Node 18+ is only needed for the two scripts.

Layout check (macOS, no dependencies): `docs/preview.png` was produced with headless Chrome, and the same command
reports DOM errors:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --virtual-time-budget=3000 --dump-dom "file://$PWD/index.html" | grep -c 'class="card"'
```

## Architecture

Three layers, deliberately separate:

1. `data/examples.json` — sole source of truth. Arrays of block strings per prompt/before/after, plus `why` and
   `rules`. Never edit `data/examples.js`; `scripts/build.mjs` regenerates it because `fetch` is blocked on
   `file://`, so the page loads a classic script that sets `window.EXAMPLES`.
2. `assets/render.js` — the markdown-subset renderer (`p`, `ol`, `ul`, fenced code, inline code/bold/links) and the
   word/step counters. Loaded by the page *and* by `scripts/verify.mjs` via `new Function`, so checks run against the
   real renderer rather than a copy.
3. `assets/app.js` — DOM wiring: cards, three view modes (`both`/`before`/`after`, persisted in `localStorage`),
   kind filter, keys `1`/`2`/`3`. No framework.

## Decisions and constraints

- **Block arrays, not markdown strings.** Newlines inside JSON strings are unreadable and easy to break. Each array
  element is one block; a list must be a single block with one item per line. `verify.mjs` fails on unclosed fences
  or leftover markers.
- **`data/examples.js` is generated.** The verifier compares it to the JSON and fails when stale. Do not hand-edit.
- **The gate is the product.** `verify.mjs` enforces the skill's own rules on the "after" column: no filler opener,
  no closer, ≤5 numbered steps, last block is a next step, and shorter than "before". Relaxing these invalidates the
  demo's claim.
- **Answers are illustrations.** `README.md` says so twice, on purpose. Do not add a "results" table implying these
  are model measurements.
- **No dependencies, ever.** The page must open from a bare checkout on a machine with no toolchain.

## Known issues

- Word counts are whitespace tokenisation after stripping markup. Good enough for comparison, not a metric.
- `assets/app.js` uses `color-mix()` through CSS for the sticky bar; on very old browsers the bar is transparent but
  functional.
- The only automated checks are data + string rendering. Layout was verified by hand with headless Chrome at 1400px
  and 390px viewports; there is no CI browser test.
- `docs/preview.png` is a manual screenshot (`--window-size=1400,1760`); regenerate it if the layout changes.

## Continuity

Local only. Canonical path: `~/Projects/i-have-adhd-demo`. Not published; if it is pushed, update this file with the
remote and the Pages URL in the same push.
