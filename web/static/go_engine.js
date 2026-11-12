// The Go rules of go_game.py (class GoGame) ported line for line to JavaScript, so the static site is the real game.
// Coordinates are (x, y); the board is a flat Int8Array indexed y * size + x with 0 empty, 1 black, 2 white.
// Rules as the Python implements them: captures by liberties, simple ko (a lone stone that captured exactly one stone
// and has one liberty bans the immediate retake; a pass clears it), no suicide, two passes end the game, and
// Japanese-style scoring: empty regions bordered by one colour + prisoners, plus 6.5 komi for White.
// go_engine.test.mjs replays move sequences recorded from the Python and requires identical results.

export const KOMI = 6.5;
export const BLACK = 1, WHITE = 2;

export class GoGame {
  constructor(boardSize = 19) {
    this.boardSize = boardSize;
    this.board = new Int8Array(boardSize * boardSize);
    this.currentPlayer = BLACK;
    this.previousBoard = null;
    this.koPoint = null;          // [x, y] or null
    this.gameOver = false;
    this.passes = 0;
    this.capturedStones = { 1: 0, 2: 0 };
  }

  at(x, y) { return this.board[y * this.boardSize + x]; }
  set(x, y, v) { this.board[y * this.boardSize + x] = v; }

  placeStone(x, y) {
    if (this.gameOver || !this.isValidMove(x, y)) return false;
    this.previousBoard = this.board.slice();
    this.set(x, y, this.currentPlayer);
    const captured = this.removeCapturedStones(3 - this.currentPlayer);
    this.capturedStones[this.currentPlayer] += captured;
    this.koPoint = this.detectKo(x, y);
    this.passes = 0;
    this.switchPlayer();
    return true;
  }

  passTurn() {
    if (this.gameOver) return;
    this.passes += 1;
    this.koPoint = null;
    if (this.passes === 2) this.gameOver = true;
    else this.switchPlayer();
  }

  isValidMove(x, y) {
    if (!Number.isInteger(x) || !Number.isInteger(y)) return false;
    if (x < 0 || x >= this.boardSize || y < 0 || y >= this.boardSize) return false;
    if (this.at(x, y) !== 0) return false;
    if (this.koPoint && this.koPoint[0] === x && this.koPoint[1] === y) return false;
    if (this.isSuicide(x, y, this.currentPlayer)) return false;
    return true;
  }

  isSuicide(x, y, player) {
    for (const [nx, ny] of this.getNeighbors(x, y)) {
      const color = this.at(nx, ny);
      if (color === 0) return false;
      const liberties = this.getLiberties(nx, ny).size;
      if (color === player && liberties > 1) return false;
      if (color !== player && liberties === 1) return false;
    }
    return true;
  }

  // Simple eye test used by the AI (go_game.py is_eye): empty, all orthogonal neighbours are player's stones, and the
  // opponent holds at most one diagonal (none on the edge or in a corner).
  isEye(x, y, player) {
    if (this.at(x, y) !== 0) return false;
    if (this.getNeighbors(x, y).some(([nx, ny]) => this.at(nx, ny) !== player)) return false;
    let on = 0, enemy = 0;
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const a = x + dx, b = y + dy;
      if (a < 0 || a >= this.boardSize || b < 0 || b >= this.boardSize) continue;
      on++;
      if (this.at(a, b) === 3 - player) enemy++;
    }
    return on < 4 ? enemy === 0 : enemy < 2;
  }

  getLiberties(x, y) {
    const liberties = new Set();
    for (const k of this.getConnectedStones(x, y)) {
      const sx = k % this.boardSize, sy = (k - sx) / this.boardSize;
      for (const [nx, ny] of this.getNeighbors(sx, sy)) if (this.at(nx, ny) === 0) liberties.add(ny * this.boardSize + nx);
    }
    return liberties;
  }

  removeCapturedStones(player) {
    let captured = 0;
    const n = this.boardSize;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (this.at(x, y) !== player) continue;
        const group = this.getConnectedStones(x, y);
        let alive = false;
        for (const k of group) { const sx = k % n; if (this.hasLiberties(sx, (k - sx) / n)) { alive = true; break; } }
        if (!alive) for (const k of group) { this.board[k] = 0; captured += 1; }
      }
    }
    return captured;
  }

  // Set of point indices (y * size + x) in the group containing (x, y), same colour as that point.
  getConnectedStones(x, y) {
    const color = this.at(x, y), n = this.boardSize;
    const visited = new Set();
    const stack = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop();
      const k = cy * n + cx;
      if (visited.has(k)) continue;
      visited.add(k);
      for (const [nx, ny] of this.getNeighbors(cx, cy)) if (this.at(nx, ny) === color) stack.push([nx, ny]);
    }
    return visited;
  }

  hasLiberties(x, y) { return this.getNeighbors(x, y).some(([nx, ny]) => this.at(nx, ny) === 0); }

  getNeighbors(x, y) {
    const out = [];
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize) out.push([nx, ny]);
    }
    return out;
  }

  detectKo(x, y) {
    if (!this.previousBoard) return null;
    const captured = [];
    for (let k = 0; k < this.board.length; k++) if (this.previousBoard[k] !== 0 && this.board[k] === 0) captured.push(k);
    if (captured.length !== 1) return null;
    if (this.getConnectedStones(x, y).size !== 1 || this.getLiberties(x, y).size !== 1) return null;
    const cx = captured[0] % this.boardSize;
    return [cx, (captured[0] - cx) / this.boardSize];
  }

  switchPlayer() { this.currentPlayer = 3 - this.currentPlayer; }

  getScore() {
    const t = this.countTerritory();
    return [this.capturedStones[1] + t[1], this.capturedStones[2] + t[2] + KOMI];
  }

  countTerritory() { return this.territoryMap().counts; }

  // Owner (0 neutral, 1, 2) of every empty point, as get_score() counts it; stones are -1. Also returns the counts.
  territoryMap() {
    const n = this.boardSize, owner = new Int8Array(n * n).fill(-1), counts = { 0: 0, 1: 0, 2: 0 };
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (owner[y * n + x] !== -1 || this.at(x, y) !== 0) continue;
        const region = this.getConnectedEmpty(x, y);
        const who = this.determineTerritoryOwner(region);
        for (const k of region) owner[k] = who;
        counts[who] += region.size;
      }
    }
    return { owner, counts };
  }

  getConnectedEmpty(x, y) {
    const n = this.boardSize, visited = new Set(), stack = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop();
      const k = cy * n + cx;
      if (visited.has(k)) continue;
      visited.add(k);
      for (const [nx, ny] of this.getNeighbors(cx, cy)) if (this.at(nx, ny) === 0) stack.push([nx, ny]);
    }
    return visited;
  }

  determineTerritoryOwner(region) {
    let black = false, white = false;
    const n = this.boardSize;
    for (const k of region) {
      const x = k % n;
      for (const [nx, ny] of this.getNeighbors(x, (k - x) / n)) {
        const c = this.at(nx, ny);
        if (c === 1) black = true; else if (c === 2) white = true;
      }
    }
    if (black && !white) return 1;
    if (white && !black) return 2;
    return 0;
  }

  encode() { return Array.from(this.board).join(''); }
}

// Play one move ([x, y], or null for a pass) as web/go_record.py apply() does: a pass returns true.
export function apply(game, move) {
  if (move === null || move === undefined) { game.passTurn(); return true; }
  return game.placeStone(move[0], move[1]);
}
