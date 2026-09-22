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

| ID | Change | File | Status |
| --- | --- | --- | --- |
| A | Remove nested `height: calc(100vh - …)` + `overflow: auto`; document scroll + existing `scrollYOffset: 60` | `src/pages/reference.tsx` | pending |
| B | Debounce decoration pass; disconnect observer while mutating DOM | `src/pages/reference.tsx` | pending |
| nativeScrollbars | `nativeScrollbars: true` to drop Perfect Scrollbar layers | `src/pages/reference.tsx` | pending |
| C | Disable `filter: blur` on `.glow` below 996px | `src/pages/index.module.css` | pending |

## Tests

### Desktop (required before merge)

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| D1 | `/reference` scrolls on the window (not an inner shell); navbar stays | pending | |
| D2 | Left menu click jumps to operation; active item updates on scroll | pending | |
| D3 | Operation title not under navbar (`scrollYOffset: 60`) | pending | |
| D4 | Schema expand / One of / 200–400 tabs: required / status / auth classes | pending | |
| D5 | Light ↔ dark: diagram SVGs swap without loop flicker | pending | |
| D6 | `/` width >996px keeps blur; ≤996px no `filter: blur` on `.glow` | pending | |
| D7 | Narrow ~375px: no sticky-breaking overflow hack needed | pending | |
| D8 | Deep-link / `?schema=base` still OK | pending | |

### iPhone Safari + Chrome (required to close the bug)

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| M1 | `/reference` pinch-zoom 8–10× — no reload / crash message | pending | Needs real device |
| M2 | After zoom: scroll, menu, operation click still work | pending | |
| M3 | Long schema scroll (e.g. Internal Payment) without tab hang | pending | |
| M4 | `/` pinch-zoom on hero — no crash; blur-less glow OK | pending | |

### Regressions / follow-up

_(Fill after testing.)_

## Effect

_(Fill after testing: crash before/after, UX side effects.)_

## Rollback

Restore code to baseline (pre-fix):

```bash
# While still on fix/ios-zoom-crash and not merged:
git checkout main

# After merge, revert commits newest-first, or restore files from baseline:
git checkout 83fba2b9269b4736d36230aecfbc147e30238b6c -- \
  website/src/pages/reference.tsx \
  website/src/pages/index.module.css

# Optional: remove this journal or keep it as history
# git checkout 83fba2b9269b4736d36230aecfbc147e30238b6c -- website/IOS_ZOOM_CRASH.md  # N/A (file did not exist)
```

Prefer `git revert <sha>` for each fix commit on `main` so history stays clear. Revert `nativeScrollbars` first if only the menu UX regressed.
