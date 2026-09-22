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
| M1 | `/reference` pinch-zoom 8–10× — no reload / crash message | **pending device** | Emulation cannot reproduce WebKit OOM; confirm on real iPhone |
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
| Crash on iOS pinch-zoom | Reported on device | **Not yet re-verified on device** — structural mitigations landed |

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
