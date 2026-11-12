// Watch page: a seeded SimpleGoAI-vs-SimpleGoAI game recorded by the Python engine (GET /api/demo), stepped through
// on the board. The browser engine replays the same moves and the page states whether it ends on Python's position.
import { route, app, api, onLeave, $ } from './core.js';
import { GoGame, apply } from './go_engine.js';
import { boardSvg, pointName } from './board_view.js';

route('watch', async () => {
  const d = await api('/demo');
  const n = d.size;
  // Replay once, keeping every position.
  const g = new GoGame(n), frames = [{ board: g.board.slice(), ko: null, cap: { ...g.capturedStones } }];
  for (const m of d.moves) { apply(g, m); frames.push({ board: g.board.slice(), ko: g.koPoint, cap: { ...g.capturedStones } }); }
  const [b, w] = g.getScore();
  const agree = g.encode() === d.final.board && b === d.final.score['1'] && w === d.final.score['2'];

  app().innerHTML = `
  <p class="kicker">Watch</p>
  <h1>SimpleGoAI against itself</h1>
  <p class="lead">A complete ${n}×${n} game (${d.moves.length} moves, ending with two passes) between two random-move AIs, recorded by the Python code
  (<code>SimpleGoAI(game, colour, rng=random.Random(${d.seed}))</code> for both players, sharing one generator).
  ${agree ? '<span class="ok">The browser engine replays it to exactly the same final position and score.</span>'
    : '<span class="err">The browser engine does not reach the Python position.</span>'}</p>
  <div class="play">
    <div class="view"><div class="board-wrap" id="bw"></div></div>
    <div class="panel controls">
      <label for="mv">Move <b id="mvn"></b></label>
      <input id="mv" type="range" min="0" max="${d.moves.length}" value="0">
      <div class="bar"><button id="back" class="alt" aria-label="Previous move">◀</button><button id="run">Play</button><button id="fwd" class="alt" aria-label="Next move">▶</button></div>
      <div class="readout" id="readout"></div>
      <p class="hint">Each AI plays a random legal move that does not fill one of its own eyes and passes when no such move
      is left; two passes in a row end the game.</p>
      <h3>Python's count at the end</h3>
      <p class="small">Black ${d.final.score['1']} · White ${d.final.score['2']} (prisoners ${d.final.captured['1']} / ${d.final.captured['2']},
      territory ${d.final.territory['1']} / ${d.final.territory['2']}, komi 6.5)</p>
    </div>
  </div>`;

  let i = 0, timer = 0;
  const show = k => {
    i = Math.max(0, Math.min(d.moves.length, k));
    const f = frames[i], m = i ? d.moves[i - 1] : null;
    $('#bw').innerHTML = boardSvg(n, f.board, { last: m, ko: f.ko, title: `Position after move ${i}` });
    $('#mv').value = i;
    $('#mvn').textContent = `${i} / ${d.moves.length}` + (i ? ` · ${i % 2 ? 'Black' : 'White'} ${m ? pointName(m[0], m[1], n) : 'pass'}` : '');
    $('#readout').innerHTML = `<div><span>Prisoners B</span><b>${f.cap[1]}</b></div><div><span>Prisoners W</span><b>${f.cap[2]}</b></div>`;
  };
  const stop = () => { clearInterval(timer); timer = 0; $('#run').textContent = 'Play'; };
  $('#mv').oninput = () => { stop(); show(+$('#mv').value); };
  $('#back').onclick = () => { stop(); show(i - 1); };
  $('#fwd').onclick = () => { stop(); show(i + 1); };
  $('#run').onclick = () => {
    if (timer) return stop();
    if (i >= d.moves.length) i = 0;
    $('#run').textContent = 'Pause';
    timer = setInterval(() => { show(i + 1); if (i >= d.moves.length) stop(); }, 220);
  };
  onLeave(() => clearInterval(timer));
  show(0);
});
