import { ROWS, COLS, HUMAN, AI, createBoard, drop, canAcceptMove, winningLine, isFull, parsePosition, search } from './core.js';

const $ = selector => document.querySelector(selector);
const boardEl = $('#board');
const controls = $('#column-controls');
const status = $('#status');
let board = createBoard();
let turn = HUMAN;
let thinking = false;
let comparing = false;
let finished = false;
let recordedOutcome = null;
let depth = Number(localStorage.getItem('fourward-depth')) || 6;
let focusCol = 3;
let searchSequence = 0;
let gameSession = 0;
let gameWorker = null;
let cancelGameSearch = null;
let sound = localStorage.getItem('fourward-sound') === 'true';
let theme = localStorage.getItem('fourward-theme') === 'dark' ? 'dark' : 'warm';
let lastDrop = null;
let history = [];
let stats = JSON.parse(localStorage.getItem('fourward-stats') || '{"wins":0,"losses":0,"draws":0}');

function runSearch(position, options, gameplay = false) {
  if (!('Worker' in window)) return Promise.resolve(search(position, options));
  return new Promise((resolve, reject) => {
    const worker = new Worker('./js/search-worker.js', { type: 'module' });
    const id = ++searchSequence;
    const clearGameWorker = () => {
      if (gameWorker === worker) { gameWorker = null; cancelGameSearch = null; }
    };
    if (gameplay) {
      gameWorker = worker;
      cancelGameSearch = () => {
        worker.terminate();
        clearGameWorker();
        reject(new Error('Search cancelled'));
      };
    }
    worker.onmessage = ({ data }) => {
      worker.terminate();
      clearGameWorker();
      data.error ? reject(new Error(data.error)) : resolve(data.result);
    };
    worker.onerror = event => {
      worker.terminate();
      clearGameWorker();
      reject(new Error(event.message || 'Search worker failed'));
    };
    worker.postMessage({ id, board: position.map(row => row.slice()), options });
  });
}

function render() {
  boardEl.replaceChildren();
  const win = winningLine(board);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const cell = document.createElement('div');
    cell.className = 'cell' + (board[r][c] === HUMAN ? ' token-human' : board[r][c] === AI ? ' token-ai' : '');
    if (lastDrop?.row === r && lastDrop?.column === c) cell.classList.add('drop-in');
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}: ${board[r][c] === HUMAN ? 'you' : board[r][c] === AI ? 'AI' : 'empty'}`);
    if (win?.line.some(([rr, cc]) => rr === r && cc === c)) cell.classList.add('winner');
    boardEl.append(cell);
  }
  lastDrop = null;
  controls.replaceChildren();
  for (let c = 0; c < COLS; c++) {
    const button = document.createElement('button');
    button.textContent = String(c + 1);
    button.setAttribute('aria-label', `Drop token in column ${c + 1}`);
    button.disabled = thinking || finished || board[0][c] !== 0;
    button.classList.toggle('selected', c === focusCol);
    button.onclick = () => play(c);
    controls.append(button);
  }
  $('#move-count').textContent = String(history.length).padStart(2, '0');
  $('#human-turn').classList.toggle('active', turn === HUMAN && !finished);
  $('#ai-turn').classList.toggle('active', thinking || (turn === AI && !finished));
  $('#undo-button').disabled = history.length < 2 || thinking;
  $('#thinking-pulse').style.visibility = thinking ? 'visible' : 'hidden';
  updateStats();
}

function updateStats() {
  for (const [key, value] of Object.entries(stats)) $(`#stat-${key}`).textContent = value;
}

function play(column) {
  if (!canAcceptMove(board, column, { currentPlayer: turn, thinking, finished })) return;
  const row = drop(board, column, HUMAN);
  if (row < 0) return;
  lastDrop = { row, column };
  history.push(column);
  playTone(HUMAN);
  afterMove(HUMAN);
  if (!finished) {
    turn = AI;
    thinking = true;
    status.textContent = 'FOURWARD is searching the board…';
    render();
    setTimeout(() => aiTurn(gameSession), 40);
  }
}

function afterMove(player) {
  const win = winningLine(board);
  if (win) {
    finished = true;
    status.textContent = `${player === HUMAN ? 'You win!' : 'AI wins this round.'} Four connected.`;
    stats[player === HUMAN ? 'wins' : 'losses']++;
    recordedOutcome = player === HUMAN ? 'wins' : 'losses';
    saveStats();
    $('#insight-copy').textContent = player === HUMAN ? 'A clean line. Your strategy paid off.' : 'The search found a winning continuation.';
  } else if (isFull(board)) {
    finished = true;
    status.textContent = 'A full board. This match is a draw.';
    stats.draws++;
    recordedOutcome = 'draws';
    saveStats();
  }
  render();
}

async function aiTurn(session) {
  try {
    const result = await runSearch(board, { depth }, true);
    if (session !== gameSession) return;
    $('#metric-nodes').textContent = result.stats.nodes.toLocaleString();
    $('#metric-prunes').textContent = result.stats.cutoffs.toLocaleString();
    $('#metric-depth').textContent = result.stats.maxDepth;
    $('#metric-time').textContent = `${result.stats.durationMs.toFixed(1)} ms`;
    $('#insight-copy').textContent = `Best line: column ${result.move + 1} · estimated score ${result.score}.`;
    const root = $('#root-scores');
    root.replaceChildren(...result.rootScores.map(item => {
      const row = document.createElement('div');
      row.className = 'score-row';
      row.innerHTML = `<span>Column ${item.col + 1}</span><b>${item.score}</b>`;
      return row;
    }));
    const trace = $('#cutoff-trace');
    trace.replaceChildren(...result.stats.trace.slice(-12).map(event => {
      const row = document.createElement('div');
      row.className = 'trace-row';
      row.textContent = `Ply ${event.ply} · ${event.maximizing ? 'MAX' : 'MIN'} · after column ${event.column + 1}, α ${event.alpha}, β ${event.beta}; skipped ${event.skipped}`;
      return row;
    }));
    if (!result.stats.trace.length) trace.textContent = 'No Alpha-Beta cutoff occurred in this search.';
    if (result.move !== null && !finished) {
      const row = drop(board, result.move, AI);
      lastDrop = { row, column: result.move };
      history.push(result.move);
      playTone(AI);
      afterMove(AI);
    }
    turn = HUMAN;
    if (!finished) status.textContent = 'Your move. Choose a column.';
  } catch (error) {
    if (session !== gameSession) return;
    status.textContent = 'The AI search failed. Start a new match to try again.';
    console.error(error);
  } finally {
    if (session === gameSession) { thinking = false; render(); }
  }
}

function reset() {
  gameSession++;
  cancelGameSearch?.();
  gameWorker = null;
  cancelGameSearch = null;
  board = createBoard();
  turn = HUMAN;
  thinking = false;
  finished = false;
  history = [];
  lastDrop = null;
  recordedOutcome = null;
  status.textContent = 'Your move. Choose a column.';
  $('#insight-copy').textContent = 'I’ll look for winning lines, then weigh the strongest futures.';
  for (const id of ['metric-nodes', 'metric-prunes', 'metric-depth', 'metric-time']) $(`#${id}`).textContent = '—';
  $('#root-scores').textContent = 'Root candidate scores appear after the AI searches.';
  $('#cutoff-trace').textContent = 'The latest Alpha-Beta search trace appears here.';
  render();
}

function saveStats() { localStorage.setItem('fourward-stats', JSON.stringify(stats)); }

function playTone(player) {
  if (!sound) return;
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = player === HUMAN ? 520 : 390;
    gain.gain.setValueAtTime(.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .12);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + .12);
    oscillator.onended = () => context.close();
  } catch { /* Audio remains optional when unavailable. */ }
}

function undo() {
  if (thinking || history.length < 2) return;
  if (recordedOutcome) {
    stats[recordedOutcome]--;
    recordedOutcome = null;
    saveStats();
  }
  for (let i = 0; i < 2; i++) {
    const column = history.pop();
    for (let row = 0; row < ROWS; row++) if (board[row][column] !== 0) { board[row][column] = 0; break; }
  }
  lastDrop = null;
  finished = false;
  turn = HUMAN;
  status.textContent = 'Your move. Choose a column.';
  render();
}

async function compare() {
  if (thinking || comparing) return;
  comparing = true;
  const button = $('#run-comparison');
  const output = $('#comparison');
  button.disabled = true;
  button.textContent = 'Searching…';
  output.textContent = 'Both algorithms are searching this position in background workers.';
  try {
    const position = board.map(row => row.slice());
    const [plain, pruned] = await Promise.all([
      runSearch(position, { depth, pruning: false }),
      runSearch(position, { depth, pruning: true })
    ]);
    output.innerHTML = `<table><thead><tr><th>Algorithm</th><th>Nodes</th><th>Cutoffs</th><th>Time</th><th>Move</th></tr></thead><tbody><tr><td>Minimax</td><td>${plain.stats.nodes.toLocaleString()}</td><td>0</td><td>${plain.stats.durationMs.toFixed(2)} ms</td><td>${plain.move + 1}</td></tr><tr><td>Alpha-Beta</td><td>${pruned.stats.nodes.toLocaleString()}</td><td>${pruned.stats.cutoffs}</td><td>${pruned.stats.durationMs.toFixed(2)} ms</td><td>${pruned.move + 1}</td></tr></tbody></table>`;
  } catch (error) {
    output.textContent = `Search comparison failed: ${error.message}`;
  } finally {
    comparing = false;
    button.disabled = false;
    button.textContent = 'Compare algorithms';
  }
}

async function analyzePosition() {
  const button = $('#analyze-position');
  const output = $('#position-result');
  button.disabled = true;
  output.textContent = 'Validating position and searching…';
  try {
    const position = parsePosition($('#position-input').value);
    if (position.terminal) throw new Error('This position is already terminal; there is no move to analyze.');
    const playerName = position.turn === HUMAN ? 'You' : 'AI';
    const result = await runSearch(position.board, { depth, player: position.turn, pruning: true });
    output.textContent = `${playerName} to move · best column ${result.move + 1} · score ${result.score} · ${result.stats.nodes.toLocaleString()} nodes · ${result.stats.cutoffs} cutoffs · ${result.stats.durationMs.toFixed(1)} ms`;
  } catch (error) {
    output.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

document.querySelectorAll('.difficulty-options').forEach(group => group.addEventListener('click', event => {
  const button = event.target.closest('button[data-depth]');
  if (!button) return;
  depth = Number(button.dataset.depth);
  document.querySelectorAll('.difficulty-options button').forEach(item => {
    const selected = Number(item.dataset.depth) === depth;
    item.classList.toggle('selected', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
  $('#depth-range').value = depth;
  $('#depth-value').textContent = `${depth} plies`;
  $('#difficulty-label').textContent = `LEVEL 0${Math.ceil(depth / 2)} · ${button.querySelector('small').textContent}`;
  localStorage.setItem('fourward-depth', String(depth));
}));

$('#depth-range').oninput = event => {
  depth = Number(event.target.value);
  localStorage.setItem('fourward-depth', String(depth));
  $('#depth-value').textContent = `${depth} plies`;
  document.querySelectorAll('.difficulty-options button').forEach(button => {
    const active = Number(button.dataset.depth) === depth;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const selected = document.querySelector('.difficulty-options button.selected');
  if (selected) $('#difficulty-label').textContent = `LEVEL 0${Math.ceil(depth / 2)} · ${selected.querySelector('small').textContent}`;
};
$('#new-game').onclick = $('#restart-button').onclick = reset;
$('#menu-start').onclick = () => {
  $('#main-menu').hidden = true;
  if (!controls.children[focusCol].disabled) controls.children[focusCol].focus();
  else status.focus();
};
$('#home-link').onclick = event => { event.preventDefault(); $('#main-menu').hidden = false; $('#menu-start').focus(); };
$('#undo-button').onclick = undo;
$('#run-comparison').onclick = compare;
$('#analyze-position').onclick = analyzePosition;
$('#use-current-position').onclick = () => {
  $('#position-input').value = board.map(row => row.join('')).join('\n');
};
$('#lab-toggle').onclick = () => {
  const lab = $('#lab');
  lab.hidden = !lab.hidden;
  $('#lab-toggle').setAttribute('aria-expanded', String(!lab.hidden));
  $('#lab-toggle').innerHTML = lab.hidden ? 'Open AI lab <span>⌄</span>' : 'Close AI lab <span>⌃</span>';
  if (!lab.hidden) lab.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
$('#sound-toggle').onclick = event => {
  sound = !sound;
  localStorage.setItem('fourward-sound', String(sound));
  event.currentTarget.textContent = sound ? 'Sound on' : 'Sound off';
  event.currentTarget.setAttribute('aria-pressed', String(sound));
};
$('#sound-toggle').textContent = sound ? 'Sound on' : 'Sound off';
$('#sound-toggle').setAttribute('aria-pressed', String(sound));
function applyTheme() {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = theme;
  const toggle = $('#theme-toggle');
  toggle.setAttribute('aria-pressed', String(dark));
  toggle.setAttribute('aria-label', `Switch to ${dark ? 'warm' : 'dark'} theme`);
  toggle.querySelector('.theme-icon').textContent = dark ? '☀' : '◐';
  toggle.querySelector('.theme-label').textContent = dark ? 'Daylight' : 'Evening';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#1d211d' : '#f5efe5';
}
applyTheme();
$('#theme-toggle').onclick = () => {
  theme = theme === 'warm' ? 'dark' : 'warm';
  localStorage.setItem('fourward-theme', theme);
  applyTheme();
};
$('#reset-stats').onclick = () => { stats = { wins: 0, losses: 0, draws: 0 }; recordedOutcome = null; saveStats(); render(); };

const dialog = $('#dialog');
$('#help-button').onclick = () => { dialog.showModal(); $('.close-dialog').focus(); };
$('#menu-help').onclick = () => { $('#help-button').click(); };
$('#explain-button').onclick = () => {
  $('#dialog-title').textContent = 'Reading the search';
  $('#dialog-copy').innerHTML = '<p><b>Nodes</b> are board positions visited. <b>Cutoffs</b> count Alpha-Beta events where remaining alternatives were skipped. <b>Depth</b> counts plies from the search root. <b>Time</b> is measured around the search.</p><p>Minimax chooses the best score assuming the opponent responds optimally. Alpha-Beta returns the same score while avoiding branches that cannot change the decision.</p>';
  dialog.showModal();
};
$('.close-dialog').onclick = () => dialog.close();
dialog.addEventListener('close', () => { if (!$('#main-menu').hidden) $('#menu-start').focus(); });
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
document.addEventListener('keydown', event => {
  if (dialog.open) return;
  const menu = $('#main-menu');
  if (!menu.hidden) {
    if (event.key === 'Tab') {
      const focusable = [...menu.querySelectorAll('button')];
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    return;
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    focusCol = (focusCol + (event.key === 'ArrowRight' ? 1 : 6)) % 7;
    render();
    controls.children[focusCol].focus();
  } else if (event.key === 'Enter' || event.key === ' ') {
    if (document.activeElement.parentElement === controls) { event.preventDefault(); play(focusCol); }
  }
});

$('#depth-range').value = depth;
$('#depth-value').textContent = `${depth} plies`;
document.querySelectorAll('.difficulty-options button').forEach(button => {
  const active = Number(button.dataset.depth) === depth;
  button.classList.toggle('selected', active);
  button.setAttribute('aria-pressed', String(active));
  if (active) $('#difficulty-label').textContent = `LEVEL 0${Math.ceil(depth / 2)} · ${button.querySelector('small').textContent}`;
});
$('#menu-start').focus();
render();
