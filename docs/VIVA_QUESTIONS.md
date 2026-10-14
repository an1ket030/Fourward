# Viva questions and concise answers

1. **What is AI here?** Search over possible future game states to select a move.
2. **Why adversarial search?** The opponent actively chooses moves that reduce our outcome.
3. **What is Minimax?** Recursive max/min optimization assuming best play within the horizon.
4. **What is Alpha-Beta?** A Minimax optimization that prunes irrelevant branches.
5. **What do α and β mean?** Best known lower bound for maximizer and upper bound for minimizer.
6. **Why is pruning correct?** A branch bounded beyond an ancestor's available alternative cannot change its choice.
7. **What is a heuristic?** An estimate of non-terminal position value at a depth cutoff.
8. **Why does depth matter?** Deeper search considers more future replies but costs exponentially more work.
9. **What is branching factor?** The number of legal child actions at a position.
10. **Minimax complexity?** O(b^d) time, with branching factor b and depth d.
11. **Best-case Alpha-Beta?** Approximately O(b^(d/2)) with ideal move ordering; worst case remains O(b^d).
12. **Why order moves?** Strong ordering tends to create earlier bounds and more pruning.
13. **Can the AI guarantee a win?** Not with finite-depth heuristic search; it selects the best evaluated line found.
14. **Can deeper search still be suboptimal?** Yes; horizon effects and heuristic error can misrank outcomes beyond the searched depth.
15. **How are terminal states scored?** Large positive/negative values with ply adjustment; draws score zero.
16. **How are threats handled?** Four-cell windows contribute scores, while actual wins are checked as terminal states.
17. **What is a transposition table?** A cache keyed by state that can reuse prior search results; not implemented here.
18. **How verify Alpha-Beta?** Compare scores and moves with plain Minimax at controlled finite depths.
19. **How count nodes?** One count on entry to each recursive search position.
20. **Why does time vary?** Runtime and scheduling differ by device, browser, and load.
21. **Why deterministic?** Rules have no chance events; state plus action determines next state.
22. **AI vs machine learning?** AI is broad; ML learns patterns from data. This project uses classical search.
23. **Does it train a neural network?** No. Minimax and Alpha-Beta are classical AI search techniques, not ML training algorithms.
24. **What are limitations?** Finite horizon, heuristic estimates, exponential growth, and synchronous browser search.
25. **Possible extensions?** Web Worker, transposition cache, deeper iterative search, broader benchmark set, and browser accessibility testing.
