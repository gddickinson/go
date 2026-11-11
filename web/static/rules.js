// Rules page: the rules exactly as go_game.py implements them, each illustrated by a small position that the browser
// engine plays from a move list (the same sequences scripts/make_engine_fixtures.py records from the Python).
import { route, app, api, esc } from './core.js';
import { GoGame, apply } from './go_engine.js';
import { boardSvg } from './board_view.js';

const P = null;
const EXAMPLES = [
  { h: 'Capture', size: 5, moves: [[1, 0], [1, 1], [0, 1], [4, 4], [2, 1], [4, 3], [1, 2]],
    t: 'A group with no liberties (adjacent empty points) is removed and counted as prisoners. Black\'s last stone takes the white stone\'s last liberty.' },
  { h: 'Ko', size: 5, moves: [[1, 0], [2, 0], [0, 1], [3, 1], [1, 2], [2, 2], [2, 1], [1, 1]],
    t: 'White has just captured one stone with a lone stone that now has one liberty. Black may not retake at the marked point on the very next move; after a move elsewhere (or a pass) the ban is lifted.' },
  { h: 'No suicide', size: 4, moves: [[0, 0], [2, 0], [3, 3], [1, 1], [3, 2], [0, 1]],
    t: 'Black at the top edge between the two stones would leave the black group with no liberties without capturing anything, so the move is refused (for one stone or many).' },
  { h: 'Territory', size: 5, moves: [[2, 0], [3, 0], [2, 1], [3, 1], [2, 2], [3, 2], [2, 3], [3, 3], [2, 4], [3, 4], P, P],
    t: 'After two passes the game ends. Empty regions touching only one colour are that colour\'s territory; regions touching both (or neither) are neutral. Black 10, White 5 + 6.5 komi = 11.5.' },
];

route('rules', async () => {
  const info = await api('/info');
  const boards = EXAMPLES.map(ex => {
    const g = new GoGame(ex.size);
    let last = null;
    for (const m of ex.moves) { apply(g, m); if (m) last = m; }
    const terr = g.gameOver ? g.territoryMap().owner : null;
    return `<div class="card ex"><b>${esc(ex.h)}</b>${boardSvg(ex.size, g.board, { last: g.gameOver ? null : last, ko: g.koPoint, owner: terr, labels: false, title: ex.h + ' example' })}
      <span>${esc(ex.t)}</span></div>`;
  }).join('');
  app().innerHTML = `
  <p class="kicker">Rules</p>
  <h1>The rules as the code plays them</h1>
  <p class="lead">These are the rules implemented by <code>GoGame</code> in <code>go_game.py</code> (and, identically, by the
  browser engine). The README describes them as based on standard Japanese rules.</p>
  <ol class="rules">
    <li>Black plays first; players alternate placing a stone on an empty intersection, or pass.</li>
    <li>After a stone is placed, opposing groups left without liberties are captured; the mover keeps them as prisoners.</li>
    <li><b>Suicide is illegal:</b> a move that leaves its own group with no liberties and captures nothing is refused.</li>
    <li><b>Simple ko:</b> if a lone stone captures exactly one stone and is left with a single liberty, the opponent may not
      recapture on that point on the next move. A pass clears the ban.</li>
    <li>Two consecutive passes end the game; afterwards no moves are accepted.</li>
    <li><b>Scoring</b> (${esc(info.scoring)}): each empty region bordered only by one colour counts for that colour, plus that
      player's prisoners; White adds ${info.komi} komi. Dead stones are not removed before counting, so play out or capture
      them first.</li>
    <li>Board sizes here: ${info.board_sizes.map(n => `${n}×${n}`).join(', ')} (the desktop app uses ${info.desktop_board_size}×${info.desktop_board_size};
      <code>GoGame(board_size)</code> accepts any size).</li>
  </ol>
  <div class="grid exs">${boards}</div>
  <h2>The AI</h2>
  <p>${esc(info.ai)}: it lists every legal point row by row and picks one with Python's <code>random.choice</code>; it passes
  only when no legal move remains. The browser uses a port of Python's Mersenne Twister, so with the same seed it picks the
  same moves as <code>SimpleGoAI(game, 2, rng=random.Random(seed))</code>.</p>`;
});
