// SimpleGoAI from go_ai.py: a uniformly random legal move that does not fill one of its own eyes, chosen with
// Python's random.choice over those points scanned row by row (y outer, x inner). With a PyRandom seeded like
// random.Random(seed) it picks exactly the moves the Python AI picks. Returns [x, y], or null (pass) when there is none.
import { PyRandom } from './py_random.js';

export class SimpleGoAI {
  constructor(game, color, rng = new PyRandom(Date.now())) { this.game = game; this.color = color; this.rng = rng; }

  legalMoves() {
    const out = [], n = this.game.boardSize;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (this.game.isValidMove(x, y) && !this.game.isEye(x, y, this.color)) out.push([x, y]);
    return out;
  }

  makeMove() {
    const moves = this.legalMoves();
    return moves.length ? this.rng.choice(moves) : null;
  }
}
