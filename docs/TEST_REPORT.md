# Test report

## Current automated results

On 2026-10-14, Node.js v22.14.0 ran `npm test`: **13 passed, 0 failed**. `npm run validate` passed for local entry/module and asset references. Syntax checks passed for `js/main.js`, `js/core.js`, `js/search-worker.js`, `tools/benchmark.js`, and `tools/asset-validation.js`.

Coverage includes board dimensions and legal columns, gravity/full-column rejection, horizontal/vertical/both diagonal wins, full-board draw detection, Minimax/Alpha-Beta agreement, board immutability, immediate AI win/block, draw detection, move-input lockouts, position input shape/gravity/token-count/winner validation, and search from a human-to-move position.

## Browser verification limits

A previous browser smoke check confirmed a human move, AI response, measured metrics, comparison, and undo. During this acceptance pass, the browser tool rejected the open localhost URL under its URL policy. No alternate browser or protocol path was used. The main-menu UI, position-analysis controls, and cancellation interaction were therefore not visually verified in this pass. No full-match, mobile-device, or automated browser test suite is included.

See [ACCEPTANCE_CHECKLIST.md](ACCEPTANCE_CHECKLIST.md) for per-criterion results and remaining checks.
