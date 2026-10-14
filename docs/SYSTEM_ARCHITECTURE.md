# System architecture

`index.html` declares accessible controls and semantic regions. `js/core.js` is UI-independent and owns board constants, transitions, win detection, evaluation, and instrumented search. `js/main.js` owns the live match matrix and lifecycle; rendering reads that state and user events request core transitions. AI search receives the current board but restores all hypothetical edits before returning. `css/styles.css` owns responsive presentation and reduced-motion behavior. Local storage holds match record, sound toggle, and selected depth.

![FOURWARD system architecture](figures/system-architecture.svg)

`js/search-worker.js` accepts a board snapshot and search settings, then returns the real search result and metrics. Gameplay, position analysis, and two-algorithm comparisons use module Workers where supported; a synchronous fallback remains for older browsers. Difficulty is bounded to depths 2–8. Search result objects carry root scores, cutoff traces, and raw metrics to the live panel and comparison view. A new match terminates its active gameplay Worker and advances a session counter so stale results cannot be applied. UI errors are constrained by disabling column controls while the AI is thinking and after terminal states.
