# Presentation outline (10 slides)

1. **FOURWARD — Think fourward.** Motivation: make adversarial search visible. Visual: actual game screen. Notes: introduce Connect Four and project. ~45 sec.
2. **Problem and objectives.** Accurate rules, playable UI, explainable AI. Visual: four acceptance pillars. Notes: explain scope. ~50 sec.
3. **Game as a search problem.** State, legal column actions, transitions, terminal utility. Visual: labeled board. Notes: deterministic, zero-sum, alternating turns. ~60 sec.
4. **System architecture.** UI, independent core, storage, tests. Visual: see architecture document. Notes: state ownership and module boundaries. ~60 sec.
5. **Minimax.** Maximize AI value; minimize opponent value; cutoff heuristic. Visual: small game tree. Notes: depth and terminal scoring. ~70 sec.
6. **Alpha-Beta pruning.** Explain alpha, beta and a cutoff fragment. Visual: `figures/alpha-beta-pruning.svg`. Notes: a skipped branch cannot change the ancestor choice. ~75 sec.
7. **Demo and AI Lab.** Play a move; inspect root scores and actual metrics. Visual: live interface. Notes: show depth control. ~75 sec.
8. **Experimental method and results.** The three depth-6 positions visited 357,760 Minimax nodes and 24,130 Alpha-Beta nodes; selected moves and scores matched. Visual: `figures/benchmark-nodes.svg`. Notes: this is one observed run; duration varies by environment. ~60 sec.
9. **Limitations and next steps.** Heuristic horizon, browser/device variability, finite search depth; broader trials and browser accessibility testing. Visual: roadmap. ~50 sec.
10. **Conclusion.** Classical AI search made inspectable in a playable game. Visual: winning board. Notes: recap verified implementation and next validation. ~40 sec.
