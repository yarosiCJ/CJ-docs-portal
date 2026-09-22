# iOS zoom crash — investigation and fix log

## Baseline

| Field | Value |
| --- | --- |
| Date | 2026-09-22 |
| Branch | `fix/ios-zoom-crash` |
| Baseline commit (pre-fix) | `83fba2b9269b4736d36230aecfbc147e30238b6c` |
| Pages (hypothesis) | Primary: `/reference` (Redoc). Secondary: `/` (landing glow blur). |

`main` at start matched `origin/main` and was clean.

## Problem

- **Symptom:** Safari / Chrome on iPhone show **«A problem repeatedly occurred»** (WebKit renderer crash / OOM), not a JS exception. iOS Chrome also uses WebKit.
- **Repro (reported):** Pinch-zoom / scale the page repeatedly on iPhone Safari and Chrome.
- **Likely surface:** `/reference` — full OpenAPI via Redoc `2.5.2` (~360KB spec), nested `100vh` + `overflow: auto` shell, Perfect Scrollbar, undebounced `MutationObserver` decorating the whole tree. Landing `.glow { filter: blur(26px) }` is a secondary compositor risk.

## Hypotheses and changes

| ID | Change | File | Commit | Status |
| --- | --- | --- | --- | --- |
| A | Remove nested `height: calc(100vh - …)` + `overflow: auto`; document scroll + existing `scrollYOffset: 60` | `src/pages/reference.tsx` | `b69ce60` | done |
| B | Debounce decoration pass (120ms + rAF); disconnect observer while mutating DOM | `src/pages/reference.tsx` | `d9b8268` | done |
| nativeScrollbars | `nativeScrollbars: true` to drop Perfect Scrollbar layers | `src/pages/reference.tsx` | `0c6966f` | done |
| C | Disable `filter: blur` on `.glow` below 996px | `src/pages/index.module.css` | `2f702d8` | done |

Journal baseline commit: `4e59db4`.

## Tests

Environment for automated checks: local `npm start` at `http://localhost:3010/CJ-docs-portal/` (2026-09-22). Desktop Chromium via Cursor browser tools. Real iPhone pinch-zoom not available in this environment.

### Desktop (required before merge)

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| D1 | `/reference` scrolls on the window (not an inner shell); navbar stays | **pass** | `.redocPage` `overflow: visible`, height ~content; `document` scrolls |
| D2 | Left menu click jumps to operation; active item updates on scroll | **pass** | Click → `#tag/wallet_get_balance/operation/getWallet`, `scrollY` ~1990 |
| D3 | Operation title not under navbar (`scrollYOffset: 60`) | **pass** | Heading top ~99px with navbar 60px; `underNavbar: false` |
| D4 | Schema expand / One of / 200–400 tabs: required / status / auth classes | **pass** | 238 `.redoc-required-label`, 89 `.redoc-status-success` after debounce |
| D5 | Light ↔ dark: diagram SVGs swap without loop flicker | **pass** | 6 diagrams to `*-dark.svg` in dark; back to light OK |
| D6 | `/` width >996px keeps blur; ≤996px no `filter: blur` on `.glow` | **pass** | 1440px → `blur(26px)`; 390px → `filter: none` |
| D7 | Narrow ~375px: no sticky-breaking overflow hack needed | **pass** | Mobile smoke: shell `overflowY: visible`, scroll works |
| D8 | Deep-link / `?schema=base` still OK | **pass** | `redoc-schema-base` class; decorations still apply |

Sticky sidebar after scroll: `.menu-content` `position: sticky; top: 60px`, `menuTop: 60` at `scrollY: 2500`.

### iPhone Safari + Chrome (required to close the bug)

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| M1 | `/reference` pinch-zoom 8–10× — no reload / crash message | **fail (device)** | Still crashes after r1 on Pages |
| M2 | After zoom: scroll, menu, operation click still work | **pending device** | |
| M3 | Long schema scroll (e.g. Internal Payment) without tab hang | **pending device** | Mobile viewport smoke scroll OK in emulator only |
| M4 | `/` pinch-zoom on hero — no crash; blur-less glow OK | **pending device** | Blur-off at ≤996px verified in CSS; crash not device-tested |

### Regressions / follow-up

- None found on desktop.
- **Must confirm M1–M4 on a physical iPhone** before treating the crash as closed.
- If menu UX feels jumpy after `nativeScrollbars`, revert only `0c6966f` first.

## Effect

| Topic | Before (baseline) | After (this branch) |
| --- | --- | --- |
| Scroll model | Nested `100vh` + `overflow: auto` around Redoc | Document/window scroll; shell not a scroll container |
| Perfect Scrollbar | Default (on) | `nativeScrollbars: true` |
| Decoration observer | Sync full scan on every mutation | Debounced 120ms + rAF; disconnect during mutate |
| Landing glow | `blur(26px)` all widths | No blur ≤996px; desktop unchanged |
| Crash on iOS pinch-zoom | Reported on device | **Still reproduced on device after Pages deploy of r1** (user 2026-09-22) |

## Rollback

Restore code to baseline (pre-fix):

```bash
# While still on fix/ios-zoom-crash and not merged:
git checkout main

# After merge — revert newest-first if needed:
git revert 2f702d8   # landing blur
git revert 0c6966f   # nativeScrollbars only
git revert d9b8268   # observer debounce
git revert b69ce60   # nested scroll
# keep or revert journal: 4e59db4 / later docs commit

# Or restore files from baseline SHA:
git checkout 83fba2b9269b4736d36230aecfbc147e30238b6c -- \
  website/src/pages/reference.tsx \
  website/src/pages/index.module.css
```

Prefer `git revert <sha>` for each fix commit on `main` so history stays clear. Revert `nativeScrollbars` (`0c6966f`) first if only the menu UX regressed.

---

## Round 2 — deeper mitigations (branch `fix/ios-zoom-crash-r2`)

### Round 2 baseline

| Field | Value |
| --- | --- |
| Date | 2026-09-22 |
| Branch | `fix/ios-zoom-crash-r2` (from `fix/ios-zoom-crash` @ `0b3e5cc`) |
| Parent round | Round 1 deployed to Pages; **crash still reproduced on real iPhone** (user report) |
| Constraint | Code changes **only** on `fix/ios-zoom-crash-r2` (not `main`, not amending r1) |

### Round 2 plan (hypotheses after r1 failure)

Round 1 removed nested scroll / Perfect Scrollbar / blur / observer thrash. Crash unchanged ⇒ likely **DOM + compositor weight of full Redoc page** under pinch-zoom:

| ID | Hypothesis | Mitigation |
| --- | --- | --- |
| R2-A | Sticky left menu + sticky right samples create expensive layers on zoom | On iOS: force `position: static` on `.menu-content` and Redoc right panel via `.redoc-ios-lite` |
| R2-B | SVG diagrams (~20–40KB each, several in view) re-rasterize on zoom | Initially CSS-hid diagrams; **reverted** — diagrams stay visible; no theme img.src swap |
| R2-C | Decoration `MutationObserver` still walks huge tree | On iOS: **skip observer entirely** (one-shot optional no-op) |
| R2-D | Deep expanded JSON/schema samples inflate DOM | Shallow expand; initially hid request samples — **reverted** after UX feedback |
| R2-E | Need device-side signal that lite mode is active | Set `data-cj-ios-lite="1"` + one-time `console.info` with DOM counts for Safari Web Inspector |

### Round 2 changes (to implement)

- [`website/src/pages/reference.tsx`](website/src/pages/reference.tsx) — detect iPhone/iPad WebKit; lite Redoc options; skip decorations observer; mark root class + dataset; diagnostic log.
- [`website/src/css/custom.css`](website/src/css/custom.css) — `.redocPage.redoc-ios-lite` sticky-off (diagram hide removed after UX feedback).
- This journal — tests + effect after implementation.

### Round 2 commits

| Commit | Summary |
| --- | --- |
| `c0bdb12` | docs: Round 2 plan / test matrix |
| `16ac1a7` | fix: iOS Redoc lite mode |
| `cbe400e` | docs: Round 2 test results |
| `6843f55` | restore request samples + SVG diagrams on iOS lite |

### Round 2 tests

Environment: local `npm start` :3010 (2026-09-22). Desktop Chromium + CDP UA override for iPhone.

#### Desktop (must not regress non-iOS)

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| R2-D1 | Desktop UA: no `redoc-ios-lite`, decorations still run | **pass** | `iosLiteClass: false`, 238 required labels |
| R2-D2 | Sticky menu still sticky on desktop | **pass** | `menuPos: sticky`, `menuTop: 60` |
| R2-D3 | Diagrams still theme-swap on desktop | **pass** | 6 diagram imgs present |
| R2-D4 | Menu jump / scrollYOffset still OK | **pass** | hash `#tag/wallet_get_balance/operation/getWallet` |

#### Emulated iPhone UA (automation)

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| R2-E1 | `data-cj-ios-lite=1` and class `redoc-ios-lite` present | **pass** | html + `.redocPage` |
| R2-E2 | `console` / log line with node counts once | **pass** | scheduled `[CJ] redoc ios-lite` after 2.5s |
| R2-E3 | Menu `position` not sticky; diagrams visible again | **updated** | sticky off kept; diagram CSS hide removed |
| R2-E4 | Shallow expand / no decoration labels on iOS | **pass** | `requiredLabels: 0` (observer skipped); request samples restored |

#### Real iPhone (user)

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| R2-M1 | Pinch-zoom `/reference` 8–10× — no crash | **pending device** | Redeploy `fix/ios-zoom-crash-r2` after restore commit |
| R2-M2 | Safari Web Inspector: see `[CJ] redoc ios-lite` log | **pending device** | |
| R2-M3 | SVG diagrams + request samples visible; scroll usable | **pending device** | UX regression from hide flags fixed in code |

### Round 2 effect

| Topic | After Round 2 (iOS only) |
| --- | --- |
| Decorations observer | Disabled on Apple touch WebKit |
| Sticky layers | Forced `position: static` on sticky nodes inside `.redocPage` |
| Diagrams | ~~Hidden via CSS~~ **visible again**; no theme `img.src` swap (observer off) |
| Redoc options | Shallow JSON/schema expand; `pathInMiddlePanel`; ~~hide request payload~~ **request samples restored** |
| Desktop | Unchanged behaviour verified |
| Crash | **Awaiting real-device retest** after Pages deploy of this branch |

### Round 2 rollback

```bash
git checkout fix/ios-zoom-crash   # back to r1 (still on Pages if r2 not deployed)
# or after r2 merge/deploy:
git revert 16ac1a7   # code
git revert c0bdb12   # docs (optional)
```

### Round 2b — broken SVG on iOS (2026-09-22)

**Root cause:** skipping the decoration observer left markdown paths as `docs/diagrams/out/*.svg`. On `/reference/` the browser resolves them to `/CJ-docs-portal/reference/docs/diagrams/...` → **404** (blue "?"). Desktop still rewrote URLs via the full observer.

**Fix (`fix/ios-zoom-crash-r2`):** lightweight diagram-only rewrite + `loading=lazy` on iOS; keep sticky neutralization and shallow expand; do **not** hide SVGs or request samples. Log includes `diagramBroken` count.

