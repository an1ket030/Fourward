# FOURWARD — Connect Four AI Lab

A local, browser-based Connect Four game with a deterministic Minimax opponent, Alpha-Beta pruning, live search metrics, and a controlled algorithm comparison.

## Run the game

Use Python's built-in static server from this directory:

```powershell
py -m http.server 8000
```

Open <http://localhost:8000/>. ES modules require HTTP; opening `index.html` as a `file://` URL is unsupported. No build or runtime dependency is required. The interface uses CSS and SVG assets with installed system font stacks, includes warm and evening themes, and works offline.

## Play

Choose a challenge on the main menu and start a match. Choose a numbered column button, or use left/right arrows and Enter. Open the main menu again from the FOURWARD brand link. Open **AI Lab** to compare plain Minimax and Alpha-Beta for the current position, inspect real cutoff events, or paste a six-row position for validated analysis. Search results and metrics come from actual executions. Statistics, sound preference, and depth are stored in local storage.

## Development checks and benchmark

Requires Node.js 18+ only for development commands:

```powershell
npm test
npm run validate
npm run benchmark
```

The benchmark emits JSON to stdout for three deterministic positions at depths 4 and 6. Save a clean run with `node tools/benchmark.js > docs/benchmark-results.json`. Results are machine-specific observations, not universal performance claims. See [docs/EXPERIMENT_PROTOCOL.md](docs/EXPERIMENT_PROTOCOL.md).

## Architecture

- `js/core.js`: board rules, heuristic, Minimax, Alpha-Beta, instrumentation.
- `js/main.js`: authoritative match state, DOM rendering, settings, AI Lab.
- `js/search-worker.js`: module Worker entry point for gameplay and comparison searches.
- `css/styles.css`: responsive interface, board, animation, reduced-motion handling.
- `tests/`: dependency-free assertions for core behavior.
- `tools/`: reproducible benchmark runner.
- `tools/asset-validation.js`: checks local entry/module and asset references.
- `docs/`: algorithm, system, protocol, presentation, report, and viva material.

## Known limitations

Search runs in module Web Workers where supported, keeping input and rendering responsive; browsers without Worker support use a synchronous fallback. Search depth is bounded to 8 and Minimax comparisons at higher depths can still take time. The AI Lab shows real root scores and up to 12 recent cutoff events, but has no dynamic full-tree renderer. There is no persistent experiment database, chart export, or browser automation suite. Undo removes the latest human/AI pair. Benchmark output is one observed local run, not a universal performance claim.
