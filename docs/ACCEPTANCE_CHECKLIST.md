# Acceptance checklist run — 2026-10-14

Status labels distinguish automated/source verification from live browser verification. The browser tool refused the ambient `http://localhost:8000/` URL under its URL policy; no alternate browser or protocol path was used.

## Gameplay

| Criterion | Result | Evidence |
|---|---|---|
| 42 positions, legal moves, gravity, full-column rejection | PASS | Core tests and `js/core.js` rules |
| Horizontal, vertical, both diagonal wins | PASS | Targeted `winningLine` tests |
| Full-board draw detection | PASS | Deterministic 42-move draw fixture |
| Input blocked while AI thinks, during AI turn, after terminal state, and for full columns | PASS | `canAcceptMove` tests plus disabled-column rendering in `js/main.js` |
| Rematch and terminal stop | SOURCE PASS; UI NOT RECHECKED | `reset` handler and terminal guard; live browser access unavailable in this run |
| Undo restores a human/AI pair and reverses a recorded outcome | SOURCE PASS; UI NOT RECHECKED | `undo` and `recordedOutcome` handling in `js/main.js` |

## AI

| Criterion | Result | Evidence |
|---|---|---|
| Minimax and Alpha-Beta use the same evaluator and return matching finite-depth scores/moves | PASS | Comparison unit test; saved benchmark positions |
| Legal choice, immediate win, immediate block | PASS | Targeted search tests |
| Board remains unchanged by search | PASS | Snapshot assertion in test suite |
| Metrics are measured by recursive search | PASS | `search` counters and measured duration in `js/core.js` |
| Difficulty changes configured depth and persists | SOURCE PASS; UI NOT RECHECKED | Depth selector and local-storage wiring in `js/main.js` |
| Search cancellation on new match | SOURCE PASS; UI NOT RECHECKED | Active gameplay Worker is terminated and stale session results ignored |

## Visual experience and AI Lab

| Criterion | Result | Evidence |
|---|---|---|
| Board animation, player indicators, win-line highlighting, sound toggle, reduced motion | SOURCE PASS; visual/UI NOT RECHECKED | CSS and UI state in `css/styles.css` and `js/main.js` |
| Responsive breakpoints | SOURCE PASS; device layouts NOT RECHECKED | CSS breakpoints at 900, 700, and 430 px |
| Main menu and new-game difficulty configuration | SOURCE PASS; UI NOT RECHECKED | Accessible welcome dialog, difficulty choices, start action, and brand-link return are wired in `index.html` and `js/main.js` |
| Essential runtime assets are local | PASS | No runtime CDN/font/image references; CSS and SVG are local |
| Local module and asset references resolve | PASS | `npm run validate` checked all four entry/module files and their referenced assets |
| Search explorer and accurate cutoff trace | PASS | Root scores and bounded event trace come from `search`; trace stores real bounds and skipped sibling counts |
| Controlled comparison and metric definitions | PASS | Both algorithms receive the same snapshot, depth, evaluator, and move order |
| Position analysis validation | PASS | Parser tests cover row shape, gravity, and token-count legality; position analysis uses current-player Minimax |
| No fabricated values | PASS | Metrics and results are returned from search and the benchmark runner |

## Academic deliverables

| Criterion | Result | Evidence |
|---|---|---|
| Report, presentation, viva, algorithm, architecture, experiment protocol, test report | PASS | Files under `docs/` |
| Saved benchmark observations and verified citations | PASS | `docs/benchmark-results.json`; DOI/ISBN references in `docs/ALGORITHM_EXPLANATION.md` |
| Experiment chart reflects actual saved data | PASS | `figures/benchmark-nodes.svg` is calculated from the 12 saved benchmark rows and linked from the report |
| Actual app screenshots | NOT INCLUDED | Browser URL access was blocked by policy in this pass; no screenshot was fabricated |

## Commands run

`npm test` — 13 passed, 0 failed. `npm run validate` — passed. `node --check` passed for `js/main.js`, `js/core.js`, `js/search-worker.js`, and `tools/benchmark.js`. The benchmark runner completed its 12 controlled runs and refreshed `docs/benchmark-results.json`.

## Remaining verification

The current browser build could not be rechecked because the browser policy denied access to localhost. Interactive rematch, terminal lockout, settings persistence, animation, sound, responsive appearance, position-analysis controls, and Worker cancellation therefore have source/unit evidence but no fresh visual confirmation. No full-match or physical mobile-device test is claimed.
