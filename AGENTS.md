# AGENTS.md: festival-overlay

Instructions for AI coding agents (Claude Code, Cursor, Copilot, Codex) and human contributors working on this repo.
Read this fully before writing code.

---

## 1. Goal

Build **`festival-overlay`**: a zero-dependency JavaScript library that adds animated festival decorations to any website with one line of code, delivered mainly through a **CDN**.

It is modeled on [DevCodeHub99/holi-overlay](https://github.com/DevCodeHub99/holi-overlay) (full-screen canvas, `pointer-events: none`, singleton `start/stop/toggle`, UMD for CDN, data-attribute auto-start, framework guides). We generalize it from one festival to **many festivals via a theme plugin system**, and add **date-aware auto mode**.

### Festivals in scope

| id | Festival | Date type | Visual ideas |
|---|---|---|---|
| `dashain` | Dashain (Nepal) | Lunar (BS), data-driven | Flying kites (changa), falling marigold (sayapatri) petals, red tika glow |
| `tihar` | Tihar (Nepal) | Lunar (BS), data-driven | Twinkling light strings, diyas glowing at the bottom, rangoli corner patterns, marigold garlands |
| `womens-day` | International Women's Day | Fixed, 8 March | Purple and gold confetti, rising flowers, soft sparkle |
| `fathers-day` | Father's Day | Rule-based (3rd Sunday of June) | Floating stars, balloons, ties |
| `holi` | Holi | Lunar, data-driven | Port the reference effect (balloons, pichkaari, powder) as a theme |

New festivals must be addable by creating **one theme file and one calendar entry**, with no engine changes.

### Non-goals

- No images, fonts or external assets in the core bundle. Draw everything with canvas paths and shapes.
- No runtime dependencies. No framework required.
- No tracking, analytics or network calls except the optional calendar fetch (section 7).

---

## 2. Tech constraints

- Language: **JavaScript (ES2020) with JSDoc types**, plus a handwritten/generated `.d.ts`. (TypeScript source is acceptable only if the build stays zero-dependency; prefer JSDoc.)
- Build: **a single `build.js` Node script**, same spirit as the reference (zero or minimal dev dependencies; `esbuild` is the only allowed dev dependency).
- Node 18+ for tooling. The browser target is evergreen browsers (last 2 versions).
- `package.json`: `"type": "module"`, conditional `exports`, `sideEffects` set correctly so tree-shaking works, `files: ["dist", "README.md", "LICENSE"]`.
- License: MIT.

---

## 3. Repository layout

```
festival-overlay/
├─ AGENTS.md
├─ README.md
├─ LICENSE
├─ package.json
├─ build.js                     # produces everything in dist/
├─ demo.html                    # theme switcher, intensity slider, copy-paste snippet
├─ calendar/
│  └─ festivals.json            # CDN-served date table (see section 7)
├─ src/
│  ├─ index.js                  # public API (singleton + create)
│  ├─ auto.js                   # script-tag auto-init, reads data-* attrs
│  ├─ core/
│  │  ├─ engine.js              # canvas overlay, RAF loop, resize, visibility
│  │  ├─ particles.js           # pooled particle system helpers
│  │  ├─ random.js              # rand, pick, clamp, lerp
│  │  └─ options.js             # defaults, merge, validation, data-attr parsing
│  ├─ schedule/
│  │  ├─ resolve.js             # which festival is active on a date
│  │  ├─ rules.js               # nthWeekday, fixed date, range helpers
│  │  └─ calendar.js            # load bundled + remote calendar, cache
│  ├─ themes/
│  │  ├─ index.js               # registry: register(theme), get(id), list()
│  │  ├─ dashain.js
│  │  ├─ tihar.js
│  │  ├─ womens-day.js
│  │  ├─ fathers-day.js
│  │  └─ holi.js
│  ├─ ui/
│  │  └─ banner.js              # optional greeting ribbon inside Shadow DOM
│  └─ react.jsx                 # <FestivalOverlay /> wrapper, thin
├─ dist/                        # generated, committed for CDN stability
└─ .github/workflows/
   ├─ ci.yml                    # lint and build on PR
   └─ release.yml               # publish to npm on tag
```

---

## 4. Public API (keep stable and mirror the reference)

```js
import FestivalOverlay from 'festival-overlay';

FestivalOverlay.start({ festival: 'auto' });   // singleton, returns controller
FestivalOverlay.stop();
FestivalOverlay.toggle(options?);
FestivalOverlay.isRunning();                   // boolean

const c = FestivalOverlay.create(options);     // independent instance
c.start(); c.stop(); c.toggle(); c.isRunning();
c.setFestival('tihar');                        // hot-swap theme without remounting

FestivalOverlay.register(themeObject);         // custom themes
FestivalOverlay.themes;                        // list of registered ids
FestivalOverlay.resolve(date?);                // -> theme id | null (what would "auto" pick?)
FestivalOverlay.version;
```

### Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `festival` | `string` | `'auto'` | A theme id or `'auto'` (pick by date; do nothing if no festival is active) |
| `intensity` | `'low'\|'medium'\|'high'` | `'medium'` | Scales particle caps |
| `zIndex` | `number` | `99999` | |
| `opacity` | `number` | `0.95` | |
| `duration` | `number` | `0` | Auto-stop after N ms; 0 means run until stopped |
| `container` | `string` | `'body'` | CSS selector |
| `banner` | `boolean \| string` | `false` | Show a greeting ribbon; a string overrides the text |
| `colors` | `Array<{r,g,b}>` | theme default | Override palette |
| `date` | `Date \| string` | now | Override "today" for testing `auto` |
| `calendarUrl` | `string` | jsDelivr URL | Remote calendar; `false` disables the fetch |
| `respectReducedMotion` | `boolean` | `true` | Skip animation when the OS requests reduced motion |
| `onStart`, `onStop` | `function` | none | Lifecycle hooks |

If `festival: 'auto'` finds nothing active, `start()` returns a controller whose `isRunning()` is `false`, and it **must not throw**.

---

## 5. Theme contract

Every theme is a plain object registered with the engine. The engine owns the canvas, the loop and the pooling. Themes only describe visuals.

```js
/** @type {import('../types').Theme} */
export default {
  id: 'tihar',
  name: 'Tihar',
  greeting: 'Happy Tihar 🪔',
  palette: [{r:255,g:179,b:0},{r:255,g:111,b:0},{r:233,g:30,b:99}],
  caps: { low: 30, medium: 70, high: 140 },   // max live particles

  // called once on start and on resize
  init(ctx, state) {},

  // return a new particle or null; the engine pools and recycles objects
  spawn(state, rand) { return { x:0, y:0, vx:0, vy:0, life:1, size:8, kind:'diya' }; },

  // advance one particle by dt (seconds); return false to kill it
  update(p, dt, state) { return true; },

  // draw one particle with canvas path calls only
  draw(ctx, p, state) {},

  // optional per-frame layer drawn behind or above the particles
  drawBackground(ctx, state) {},   // e.g. ambient glow, light strings
  drawForeground(ctx, state) {},
};
```

Rules for themes:

1. **No allocations in `update` or `draw`.** Reuse objects and avoid `.map` and `.filter` in the hot path (use in-place compaction as the reference does).
2. Time-based motion (`dt`), not frame-based, so 60 Hz and 120 Hz look the same.
3. Colors come from `state.palette` so `colors` overrides work.
4. A theme never touches the DOM directly. DOM output goes through `ui/banner.js`.
5. Keep each theme file under about 250 lines. Extract shared shapes (petal, star, diya, kite) into `core/particles.js`.

---

## 6. Scheduling (`festival: 'auto'`)

Resolution order for a given date:

1. User `date` override (for tests).
2. **Remote calendar** (if enabled and reachable, cached in `sessionStorage` for 24h; wrap all storage in try/catch).
3. **Bundled calendar** (`calendar/festivals.json` inlined at build time) as the fallback.
4. Rule-based festivals (fixed date, nth weekday).

Calendar entry shapes (`calendar/festivals.json`):

```json
{
  "version": 1,
  "festivals": {
    "womens-day":  { "type": "fixed",   "month": 3, "day": 8, "windowDays": 1 },
    "fathers-day": { "type": "nthWeekday", "month": 6, "weekday": 0, "nth": 3, "windowDays": 1 },
    "dashain": { "type": "ranges", "ranges": { "2026": ["YYYY-MM-DD", "YYYY-MM-DD"] }, "verified": false },
    "tihar":   { "type": "ranges", "ranges": { "2026": ["YYYY-MM-DD", "YYYY-MM-DD"] }, "verified": false },
    "holi":    { "type": "ranges", "ranges": {}, "verified": false }
  }
}
```

**Important rules**

- **Never compute Dashain, Tihar or Holi dates algorithmically.** They follow the lunar Bikram Sambat calendar. Keep them as data and fill them from an official Nepali calendar (Nepal government holiday list or Hamro Patro). Do not invent dates. Leave `"verified": false` until a human confirms each range.
- Father's Day varies by country; the default rule is the 3rd Sunday of June, and the entry must be overridable by the user.
- All date math uses the visitor's **local date**, and an entry can optionally set a `timezone`. Make the choice explicit in the code comments.
- Provide a `windowDays` lead-in or tail option so a theme can run e.g. 3 days before the event.
- Unit-test `resolve()` with fixed `date` inputs, including year boundaries and a missing year entry.

Timing note for the maintainer: Dashain and Tihar fall in autumn. Ship `dashain` and `tihar` first.

---

## 7. CDN delivery and embedding (core requirement)

CDN is the primary distribution channel. Treat these URLs as a public contract.

### Build outputs (`dist/`)

| File | Format | Purpose |
|---|---|---|
| `festival-overlay.umd.js` | UMD, all themes | Default CDN `<script>` bundle, exposes `window.FestivalOverlay` |
| `festival-overlay.umd.min.js` | UMD, minified | Production CDN |
| `festival-overlay.auto.min.js` | IIFE, includes `auto.js` | One-tag auto-init |
| `festival-overlay.esm.js` / `.esm.min.js` | ESM | Bundlers and `<script type="module">` |
| `festival-overlay.cjs` | CJS | Node `require` |
| `themes/<id>.esm.js` | ESM, one per theme | Load a single theme lazily to keep the base small |
| `festival-overlay.d.ts` | Types | |
| `festivals.json` | Calendar copy | Remote calendar target |

Size budget: core plus engine **under 10 KB gzipped**, each theme **under 6 KB gzipped**, full bundle under 35 KB gzipped. CI fails if the budget is exceeded.

### Embed snippets (all must be documented in the README and work in `demo.html`)

**1. One tag, fully automatic**
```html
<script src="https://cdn.jsdelivr.net/npm/festival-overlay@1/dist/festival-overlay.auto.min.js"
        data-festival="auto"
        data-intensity="medium"
        data-duration="30000"
        data-banner="true"></script>
```

**2. Explicit control**
```html
<script src="https://cdn.jsdelivr.net/npm/festival-overlay@1/dist/festival-overlay.umd.min.js"></script>
<script>FestivalOverlay.start({ festival: 'tihar', intensity: 'low' });</script>
```

**3. ESM, one theme only (smallest payload)**
```html
<script type="module">
  import FestivalOverlay from 'https://cdn.jsdelivr.net/npm/festival-overlay@1/dist/festival-overlay.esm.min.js';
  import tihar from 'https://cdn.jsdelivr.net/npm/festival-overlay@1/dist/themes/tihar.esm.js';
  FestivalOverlay.register(tihar);
  FestivalOverlay.start({ festival: 'tihar' });
</script>
```

**4. Pin the version with SRI (recommended for production)**
```html
<script src="https://cdn.jsdelivr.net/npm/festival-overlay@1.0.0/dist/festival-overlay.umd.min.js"
        integrity="sha384-..." crossorigin="anonymous"></script>
```
`build.js` must print the SRI hash of every file it emits.

**5. Platform recipes:** WordPress (`functions.php` and a footer snippet), Shopify (`theme.liquid`), Wix and Squarespace (code injection), Google Tag Manager (Custom HTML tag), plus React, Next.js (App and Pages router), Vue 3, Svelte and Angular. Copy the structure from the reference README, but use the new API.

### `data-*` attributes read by `auto.js`

`data-festival`, `data-intensity`, `data-duration`, `data-opacity`, `data-z-index`, `data-container`, `data-banner`, `data-calendar-url`, `data-date` (testing), and `data-autostart` (kept for parity with the reference; `auto.min.js` starts by default).

### Remote calendar (so dates update **without** users upgrading the package)

- Default URL: `https://cdn.jsdelivr.net/gh/<owner>/festival-overlay@main/calendar/festivals.json`
- Fetch with a short timeout (about 2 s), cache for 24h, validate the schema, and **fall back silently** to the bundled copy on any failure. A CDN outage must never break the host site.
- Keep it opt-out through `calendarUrl: false` or `data-calendar-url="off"`, for privacy-sensitive sites.
- Note in the README that jsDelivr caches `@main` for a while and that users can purge it. For dated releases, recommend `@1` (a semver range) for the library.

### Versioning

Semver. Calendar-only changes are patch releases. Never break option names or the `data-*` attribute names within a major version.

---

## 8. Engine requirements

- One fixed canvas: `position:fixed; inset:0; width:100%; height:100%; pointer-events:none; z-index:<option>`; set `aria-hidden="true"`.
- Handle `devicePixelRatio` (cap at 2) and **debounce resize at 100 ms**.
- Use `requestAnimationFrame` with a clamped `dt` (max 50 ms) so tab switches don't cause jumps.
- **Pause on `document.hidden`**, resume on visible.
- Honor `prefers-reduced-motion: reduce` (default behavior: do not start the loop; optionally render one static frame).
- Scale particle caps by `intensity` and by viewport area (reduce on screens narrower than 768 px).
- `stop()` must: cancel RAF, remove the canvas, remove **all** listeners (resize, visibilitychange, media query), clear timers, and be **idempotent**.
- SSR safe: importing the module must not touch `window` or `document`. Guard every access, and make `start()` a no-op on the server.
- Multiple controllers can coexist, each with its own canvas.

---

## 9. Quality bar and testing

- **Unit tests** (Node's built-in `node:test`): `rules.js`, `resolve.js`, `options.js` (including data-attr parsing), and the calendar schema validator.
- **Smoke test**: build, then load `dist/festival-overlay.umd.js` in `jsdom` or a headless browser; assert `start/stop` leave zero DOM nodes and zero listeners.
- **Manual**: `demo.html` has a theme dropdown, an intensity control, a "pretend today is..." date picker, a FPS counter, and a copy-embed-snippet button.
- Performance target: 60 fps on a mid-range phone at `medium` intensity. No per-frame allocations (check with the browser profiler).
- Accessibility: decorative only, never trap focus, never cover content permanently. Default `duration` for `auto.js` is 30 000 ms unless the user sets it to 0.
- Lint: ESLint and Prettier are optional. If added, they must not become runtime dependencies.

---

## 10. Build order (work in this order, one PR per step)

1. **Scaffold**: `package.json`, `build.js` emitting UMD/ESM/CJS/IIFE, an empty `demo.html`, and CI.
2. **Engine**: overlay, RAF loop, visibility pause, reduced motion, resize, and idempotent `stop()`.
3. **Options and `index.js`**: singleton and `create()` API, `data-*` parsing, `auto.js`.
4. **Theme: `tihar`** (light strings, diyas, marigold petals). It is the reference theme that proves the contract.
5. **Theme: `dashain`** (kites, petals, tika glow).
6. **Scheduler**: rules, bundled calendar, `resolve()`, and tests.
7. **Remote calendar** fetch, cache and fallback.
8. **Themes: `womens-day`, `fathers-day`**, then port `holi`.
9. **Banner (Shadow DOM)** and the React wrapper.
10. **Demo page, README (copy the reference's structure), size-budget check, SRI output**, then publish.

Do not start a step until the previous one builds and its tests pass.

---

## 11. Coding conventions

- Small pure functions. No classes where a closure works. No global state outside the singleton holder.
- Name files in kebab-case. Export named functions, with one default export in `index.js`.
- Comments explain *why*, not *what*. Every public function has JSDoc.
- Never use `eval`, `innerHTML` with dynamic strings, or inline event-handler attributes. Banner text must be set with `textContent`.
- Never put secrets or API keys in the repo.
- Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).

---

## 12. Definition of done (per feature)

- [ ] Works through the CDN `<script>` embed in `demo.html`, not only via npm.
- [ ] `start()` then `stop()` leaves the page exactly as it was.
- [ ] Respects reduced motion and pauses when the tab is hidden.
- [ ] No console errors on a page that already uses high z-index UI.
- [ ] Types and README updated.
- [ ] Size budget respected.

---

## 13. Things agents must ask a human about, not guess

- Exact Dashain, Tihar and Holi date ranges for each year.
- The final npm package name and the GitHub owner (affects every CDN URL).
- Whether Father's Day should follow the Nepali observance (Gokarna Aunsi, which is lunar) instead of the 3rd Sunday of June.
- Any change to the public API or `data-*` names.
