// Play page: a full game on the JS port of go_game.py. Default as in the desktop GUI: you are Black, SimpleGoAI is
// White (seeded, so a game can be reproduced in Python with SimpleGoAI(rng=random.Random(seed))). Two-player mode
// skips the AI. Click/tap a point, or use the arrow keys and Enter on the focused board; P passes.
import { route, app, api, esc, isStatic, needsServer, onLeave, $ } from './core.js';
import { GoGame, apply } from './go_engine.js';
import { SimpleGoAI } from './go_ai.js';
import { PyRandom } from './py_random.js';
import { boardSvg, pointAt, pointName } from './board_view.js';

const SIZES = [9, 13, 19];
const NAME = { 1: 'Black', 2: 'White' };

route('play', (args, query) => {
  const S = {
    size: SIZES.includes(+query.size) ? +query.size : 9, mode: query.mode === 'two' ? 'two' : 'ai',
    seed: Number.isInteger(+query.seed) && query.seed !== undefined ? Math.abs(+query.seed) : 1,
    game: null, ai: null, moves: [], last: null, cursor: null, msg: '', showTerr: false, timer: 0,
  };

  app().innerHTML = `
  <p class="kicker">Play</p>
  <h1>Go against SimpleGoAI</h1>
  <div class="play">
    <div class="view"><div class="board-wrap" id="bw" tabindex="0" aria-label="Go board: arrow keys move the cursor, Enter places a stone, P passes"></div>
      <p class="hint">Click an intersection to place a stone. Keyboard: focus the board, arrows to move, Enter to play, P to pass.</p></div>
    <div class="panel controls">
      <label>Board size</label>
      <div class="seg" id="sizes" role="group" aria-label="Board size">${SIZES.map(n => `<button data-n="${n}">${n}×${n}</button>`).join('')}</div>
      <label>Opponent</label>
      <div class="seg" id="modes" role="group" aria-label="Opponent"><button data-m="ai">AI plays White</button><button data-m="two">Two players</button></div>
      <label for="seed">AI seed (random.Random seed)</label>
      <input id="seed" type="number" min="0" step="1" value="${S.seed}">
      <div class="bar"><button id="pass">Pass</button><button id="new" class="alt">New game</button></div>
      <div id="status" class="status" role="status" aria-live="polite"></div>
      <div class="readout" id="readout"></div>
      <label class="chk"><input type="checkbox" id="terr"> Show territory as get_score() counts it</label>
      <div class="check">${isStatic() ? needsServer('Checking this game against the Python engine')
        : '<button id="pycheck" class="alt">Check with Python</button><div id="pyres" class="small"></div>'}</div>
      <h3>Moves</h3><div id="moves" class="moves mono small"></div>
    </div>
  </div>`;

  const bw = $('#bw');
  const busy = () => S.mode === 'ai' && S.game.currentPlayer === 2 && !S.game.gameOver;

  function newGame() {
    clearTimeout(S.timer);
    S.game = new GoGame(S.size);
    S.ai = new SimpleGoAI(S.game, 2, new PyRandom(S.seed));
    S.moves = []; S.last = null; S.msg = ''; S.cursor = null;
    draw();
  }

  function record(move, who) {
    S.moves.push(move);
    S.last = move;
    S.msg = move ? '' : `${NAME[who]} passed.`;
  }

  function play(move) {
    if (S.game.gameOver || busy()) return;
    const who = S.game.currentPlayer;
    if (move && !S.game.isValidMove(move[0], move[1])) {
      const [x, y] = move, g = S.game;
      S.msg = g.at(x, y) ? 'That point is occupied.'
        : g.koPoint && g.koPoint[0] === x && g.koPoint[1] === y ? 'Ko: you cannot retake immediately; play elsewhere first.'
        : 'Suicide is not allowed: the stone would have no liberties.';
      return draw();
    }
    apply(S.game, move);
    record(move, who);
    draw();
    if (busy()) S.timer = setTimeout(aiTurn, 280);
  }

  function aiTurn() {
    if (!busy()) return;
    const m = S.ai.makeMove();
    apply(S.game, m);
    record(m, 2);
    draw();
  }

  function draw() {
    const g = S.game, n = S.size;
    const terr = (S.showTerr || g.gameOver) ? g.territoryMap().owner : null;
    bw.innerHTML = boardSvg(n, g.board, { last: S.last, ko: g.koPoint, owner: terr, cursor: S.cursor });
    const [b, w] = g.getScore();
    let status;
    if (g.gameOver) status = `<b>Game over.</b> Black ${b}, White ${w}: <b class="ok">${b > w ? 'Black' : 'White'} wins by ${Math.abs(w - b)}</b>.`;
    else status = `<span class="dot ${g.currentPlayer === 1 ? 'b' : 'w'}"></span> ${NAME[g.currentPlayer]} to play${busy() ? ' (AI thinking)' : ''}.`;
    $('#status').innerHTML = status + (S.msg ? `<br><span class="warnc">${esc(S.msg)}</span>` : '');
    const t = g.countTerritory();
    $('#readout').innerHTML = `
      <div><span>Prisoners B</span><b>${g.capturedStones[1]}</b></div><div><span>Prisoners W</span><b>${g.capturedStones[2]}</b></div>
      <div><span>Territory B</span><b>${t[1]}</b></div><div><span>Territory W</span><b>${t[2]}</b></div>
      <div><span>Score B</span><b>${b}</b></div><div><span>Score W (+6.5)</span><b>${w}</b></div>
      <div><span>Moves</span><b>${S.moves.length}</b></div><div><span>Passes</span><b>${g.passes}</b></div>`;
    $('#moves').innerHTML = S.moves.length
      ? S.moves.map((m, i) => `<span>${i + 1}.${i % 2 ? 'W' : 'B'} ${m ? pointName(m[0], m[1], n) : 'pass'}</span>`).join(' ')
      : '<span class="mute">none yet</span>';
    document.querySelectorAll('#sizes button').forEach(b2 => b2.classList.toggle('on', +b2.dataset.n === S.size));
    document.querySelectorAll('#modes button').forEach(b2 => b2.classList.toggle('on', b2.dataset.m === S.mode));
    $('#pass').disabled = g.gameOver || busy();
  }

  bw.addEventListener('click', e => { const svg = bw.querySelector('svg'); const p = svg && pointAt(svg, e, S.size); if (p) { S.cursor = null; play(p); } });
  bw.addEventListener('keydown', e => {
    const k = e.key, n = S.size;
    if (k === 'p' || k === 'P') { e.preventDefault(); return play(null); }
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
    if (d) {
      e.preventDefault();
      const c = S.cursor || [n >> 1, n >> 1];
      S.cursor = [Math.min(n - 1, Math.max(0, c[0] + d[0])), Math.min(n - 1, Math.max(0, c[1] + d[1]))];
      return draw();
    }
    if ((k === 'Enter' || k === ' ') && S.cursor) { e.preventDefault(); play(S.cursor); }
  });
  $('#pass').onclick = () => play(null);
  $('#new').onclick = newGame;
  $('#sizes').onclick = e => { const n = +e.target.dataset.n; if (n) { S.size = n; newGame(); } };
  $('#modes').onclick = e => { const m = e.target.dataset.m; if (m) { S.mode = m; newGame(); } };
  $('#seed').onchange = () => { const v = Math.abs(Math.trunc(+$('#seed').value)) || 0; S.seed = v; $('#seed').value = v; newGame(); };
  $('#terr').onchange = () => { S.showTerr = $('#terr').checked; draw(); };
  const pc = $('#pycheck');
  if (pc) pc.onclick = async () => {
    const out = $('#pyres');
    out.textContent = 'Replaying through go_game.GoGame...';
    try {
      const r = await api('/replay', { body: { size: S.size, moves: S.moves } });
      const g = S.game, f = r.final, [b, w] = g.getScore();
      const okAll = f.board === g.encode() && r.results.every(Boolean) && f.score['1'] === b && f.score['2'] === w
        && f.current_player === g.currentPlayer && JSON.stringify(f.ko_point) === JSON.stringify(g.koPoint);
      out.innerHTML = okAll
        ? `<span class="ok">Python agrees:</span> same board, ko point, player to move and score (${f.score['1']} to ${f.score['2']}) after ${S.moves.length} moves.`
        : `<span class="err">Mismatch with Python</span> (Python score ${f.score['1']} to ${f.score['2']}).`;
    } catch (e) { out.innerHTML = `<span class="err">${esc(e.message)}</span>`; }
  };
  onLeave(() => clearTimeout(S.timer));
  newGame();
});
