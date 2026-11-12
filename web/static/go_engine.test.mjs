// Node test: the JS port (go_engine.js, go_ai.js, py_random.js) must reproduce the repo's Python exactly on move
// sequences recorded from it: every move result, board, ko point and player to move, the final captures, territory
// and score, the moves a seeded AI chooses, and the raw random numbers.
// Fixtures: tests/fixtures/go_engine_fixtures.json (python scripts/make_engine_fixtures.py). Run: node go_engine.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GoGame, apply } from './go_engine.js';
import { SimpleGoAI } from './go_ai.js';
import { PyRandom } from './py_random.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const fx = JSON.parse(readFileSync(here + '../../tests/fixtures/go_engine_fixtures.json', 'utf8'));
let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; if (fails < 30) console.error('FAIL', msg); } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const close = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));

function checkFinal(g, f, label) {
  ok(g.encode() === f.board, `${label}: final board`);
  ok(g.currentPlayer === f.current_player, `${label}: player to move`);
  ok(same(g.koPoint, f.ko_point), `${label}: ko point ${g.koPoint} vs ${f.ko_point}`);
  ok(g.passes === f.passes && g.gameOver === f.game_over, `${label}: passes / game over`);
  ok(g.capturedStones[1] === f.captured['1'] && g.capturedStones[2] === f.captured['2'], `${label}: captures`);
  const t = g.countTerritory();
  ok([0, 1, 2].every(k => t[k] === f.territory[String(k)]), `${label}: territory ${JSON.stringify(t)}`);
  const [b, w] = g.getScore();
  ok(close(b, f.score['1']) && close(w, f.score['2']), `${label}: score ${b}-${w} vs ${f.score['1']}-${f.score['2']}`);
}

// 1. recorded move sequences: every step
let steps = 0;
for (const c of fx.cases) {
  const g = new GoGame(c.size);
  c.moves.forEach((m, i) => {
    const r = apply(g, m);
    const s = c.steps[i];
    steps++;
    ok(r === c.results[i], `${c.label} move ${i} ${JSON.stringify(m)}: result ${r} vs ${c.results[i]}`);
    ok(g.encode() === s.board, `${c.label} move ${i}: board`);
    ok(same(g.koPoint, s.ko_point), `${c.label} move ${i}: ko ${g.koPoint} vs ${s.ko_point}`);
    ok(g.currentPlayer === s.current_player, `${c.label} move ${i}: player`);
  });
  checkFinal(g, c.final, c.label);
}

// 2. seeded AI-vs-AI games: the JS AI must choose the same moves from the same seed
let aiMoves = 0;
for (const a of fx.ai_games) {
  const g = new GoGame(a.size), rng = new PyRandom(a.seed);
  const ais = { 1: new SimpleGoAI(g, 1, rng), 2: new SimpleGoAI(g, 2, rng) };
  const moves = [];
  while (!g.gameOver && moves.length < a.max_moves) {
    const m = ais[g.currentPlayer].makeMove();
    apply(g, m);
    moves.push(m);
  }
  aiMoves += moves.length;
  let first = moves.findIndex((m, i) => !same(m, a.moves[i]));
  ok(moves.length === a.moves.length && first === -1, `AI ${a.size}x${a.size} seed ${a.seed}: first differing move ${first}`);
  checkFinal(g, a.final, `AI ${a.size}x${a.size} seed ${a.seed}`);
}

// 3. Mersenne Twister and _randbelow against random.Random(seed)
for (const p of fx.prng) {
  const r = new PyRandom(BigInt(p.seed));
  ok(same(p.u32.map(() => r.getrandbits(32)), p.u32), `PRNG seed ${p.seed}: getrandbits(32)`);
  for (const [n, vals] of p.below) ok(same(vals.map(() => r.randbelow(n)), vals), `PRNG seed ${p.seed}: randbelow(${n})`);
}

// 4. hand checks
const g = new GoGame(9);
ok(g.getScore()[1] === 6.5 && g.countTerritory()[0] === 81, 'empty board: all neutral, komi 6.5');
ok(!g.isValidMove(9, 0) && !g.isValidMove(0, -1) && !g.isValidMove(1.5, 0), 'off-board / non-integer moves refused');

const e = new GoGame(5);
e.set(1, 0, 1); e.set(0, 1, 1);
ok(e.isEye(0, 0, 1) && !e.isEye(0, 0, 2), 'corner eye');
e.set(1, 1, 2);
ok(!e.isEye(0, 0, 1), 'corner with an opponent diagonal is a false eye');
const full = new GoGame(5); full.board.fill(1); full.set(0, 0, 0); full.set(4, 4, 0);
ok(new SimpleGoAI(full, 1, new PyRandom(0)).makeMove() === null, 'AI passes instead of filling its own eyes');

console.log(`${checks - fails}/${checks} checks passed (${fx.cases.length} recorded sequences, ${steps} moves; ` +
  `${fx.ai_games.length} seeded AI games, ${aiMoves} AI moves; ${fx.prng.length} PRNG seeds)`);
process.exit(fails ? 1 : 0);
