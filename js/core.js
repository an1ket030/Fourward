export const ROWS = 6;
export const COLS = 7;
export const CONNECT = 4;
export const EMPTY = 0;
export const HUMAN = 1;
export const AI = 2;
export const ORDER = [3, 2, 4, 1, 5, 0, 6];

export const createBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));

export function legalMoves(board) {
  return ORDER.filter(column => board[0][column] === EMPTY);
}

export function drop(board, column, player) {
  if (!Number.isInteger(column) || column < 0 || column >= COLS || board[0][column] !== EMPTY) return -1;
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][column] === EMPTY) { board[row][column] = player; return row; }
  }
  return -1;
}

export function canAcceptMove(board, column, { currentPlayer, thinking = false, finished = false } = {}) {
  return currentPlayer === HUMAN && !thinking && !finished && Number.isInteger(column) &&
    column >= 0 && column < COLS && board[0][column] === EMPTY;
}

export function undo(board, row, column) { board[row][column] = EMPTY; }

export function winningLine(board) {
  for (let row = 0; row < ROWS; row++) for (let column = 0; column < COLS; column++) {
    const player = board[row][column];
    if (!player) continue;
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const line = [];
      for (let offset = 0; offset < CONNECT; offset++) {
        const r = row + dr * offset, c = column + dc * offset;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
        line.push([r, c]);
      }
      if (line.length === CONNECT) return { player, line };
    }
  }
  return null;
}

export const isFull = board => board[0].every(cell => cell !== EMPTY);

export function parsePosition(input) {
  const rows = input.trim().split(/\r?\n/);
  if (rows.length !== ROWS || rows.some(row => !/^[012]{7}$/.test(row))) {
    throw new Error('Enter exactly six rows of seven digits (0 empty, 1 you, 2 AI).');
  }
  const board = rows.map(row => [...row].map(Number));
  for (let column = 0; column < COLS; column++) {
    let foundEmpty = false;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][column] === EMPTY) foundEmpty = true;
      else if (foundEmpty) throw new Error(`Column ${column + 1} has a floating token.`);
    }
  }
  const human = board.flat().filter(cell => cell === HUMAN).length;
  const ai = board.flat().filter(cell => cell === AI).length;
  if (human < ai || human > ai + 1) throw new Error('Token counts do not match alternating turns with you starting.');
  const winHuman = winningLineFor(board, HUMAN);
  const winAi = winningLineFor(board, AI);
  if (winHuman && winAi) throw new Error('Both players cannot have winning lines in a legal position.');
  if ((winHuman && human !== ai + 1) || (winAi && human !== ai)) throw new Error('The winning line does not match the last player to move.');
  return { board, turn: human === ai ? HUMAN : AI, terminal: winHuman || winAi || isFull(board) };
}

function winningLineFor(board, player) {
  for (let row = 0; row < ROWS; row++) for (let column = 0; column < COLS; column++) {
    if (board[row][column] !== player) continue;
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      let count = 0;
      for (let offset = 0; offset < CONNECT; offset++) {
        const r = row + dr * offset, c = column + dc * offset;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
        count++;
      }
      if (count === CONNECT) return true;
    }
  }
  return false;
}

export function evaluate(board) {
  const win = winningLine(board);
  if (win) return win.player === AI ? 100000 : -100000;
  let score = 0;
  for (let row = 0; row < ROWS; row++) if (board[row][3] === AI) score += 6;
  for (let row = 0; row < ROWS; row++) for (let column = 0; column < COLS; column++) {
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      let ai = 0, human = 0, invalid = false;
      for (let offset = 0; offset < CONNECT; offset++) {
        const r = row + dr * offset, c = column + dc * offset;
        if (r >= ROWS || c < 0 || c >= COLS) { invalid = true; break; }
        if (board[r][c] === AI) ai++;
        else if (board[r][c] === HUMAN) human++;
      }
      if (invalid) continue;
      if (human === 0) score += [0, 1, 8, 45, 0][ai];
      if (ai === 0) score -= [0, 1, 10, 60, 0][human];
    }
  }
  return score;
}

export function search(board, { depth = 6, pruning = true, moveOrder = true, player = AI } = {}) {
  const start = performance.now();
  const stats = { nodes: 0, leaves: 0, terminals: 0, cutoffs: 0, moves: 0, maxDepth: 0, trace: [] };
  const order = moveOrder ? ORDER : [0, 1, 2, 3, 4, 5, 6];
  const available = () => order.filter(column => board[0][column] === EMPTY);

  function visit(remaining, maximizing, alpha, beta, ply) {
    stats.nodes++;
    stats.maxDepth = Math.max(stats.maxDepth, ply);
    const win = winningLine(board);
    if (win) {
      stats.leaves++;
      stats.terminals++;
      return win.player === AI ? 100000 - ply : -100000 + ply;
    }
    if (remaining === 0 || isFull(board)) {
      stats.leaves++;
      if (isFull(board)) stats.terminals++;
      return isFull(board) ? 0 : evaluate(board);
    }
    let best = maximizing ? -Infinity : Infinity;
    const columns = available();
    for (let index = 0; index < columns.length; index++) {
      const column = columns[index];
      const row = drop(board, column, maximizing ? AI : HUMAN);
      stats.moves++;
      let score;
      try { score = visit(remaining - 1, !maximizing, alpha, beta, ply + 1); }
      finally { undo(board, row, column); }
      if (maximizing) { best = Math.max(best, score); alpha = Math.max(alpha, best); }
      else { best = Math.min(best, score); beta = Math.min(beta, best); }
      if (pruning && alpha >= beta && index < columns.length - 1) {
        stats.cutoffs++;
        if (stats.trace.length < 120) stats.trace.push({ ply, column, maximizing, alpha, beta, skipped: columns.length - index - 1 });
        break;
      }
    }
    return best;
  }

  const rootScores = [];
  let bestColumn = null, bestScore = player === AI ? -Infinity : Infinity;
  for (const column of available()) {
    const row = drop(board, column, AI);
    let score;
    try {
      // Full windows keep every reported root score exact at the configured horizon.
      score = visit(Math.max(0, depth - 1), player === HUMAN, -Infinity, Infinity, 1);
    } finally { undo(board, row, column); }
    rootScores.push({ col: column, score });
    stats.moves++;
    if ((player === AI && score > bestScore) || (player === HUMAN && score < bestScore)) { bestScore = score; bestColumn = column; }
  }
  stats.durationMs = performance.now() - start;
  return { move: bestColumn, score: bestScore, rootScores, stats };
}
