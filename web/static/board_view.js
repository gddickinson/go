// SVG board renderer shared by the play, watch and rules pages. Pure function of the state: returns an SVG string.
// Coordinates follow go_game.py: (x, y) with x across and y down from the top-left; board is a flat array y*n+x.
import { esc } from './core.js';

const STAR = { 9: [2, 4, 6], 13: [3, 6, 9], 19: [3, 9, 15] };
const COLS = 'ABCDEFGHJKLMNOPQRST';   // Go column letters skip I
export const pointName = (x, y, n) => n <= 19 ? `${COLS[x]}${n - y}` : `(${x},${y})`;

// opts: { last:[x,y], ko:[x,y], owner:Int8Array (territory: 0/1/2, -1 stone), cursor:[x,y], labels:bool, title }
export function boardSvg(n, board, opts = {}) {
  const cell = 40, pad = opts.labels === false ? 26 : 50, size = pad * 2 + cell * (n - 1);
  const P = i => pad + i * cell;
  const r = cell * 0.47;
  let s = `<svg class="goban" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(opts.title || `${n} by ${n} Go board`)}">`;
  s += `<rect class="wood" x="0" y="0" width="${size}" height="${size}" rx="10"/>`;
  for (let i = 0; i < n; i++) {
    s += `<line class="ln" x1="${P(0)}" y1="${P(i)}" x2="${P(n - 1)}" y2="${P(i)}"/><line class="ln" x1="${P(i)}" y1="${P(0)}" x2="${P(i)}" y2="${P(n - 1)}"/>`;
  }
  for (const a of STAR[n] || []) for (const b of STAR[n]) s += `<circle class="star" cx="${P(a)}" cy="${P(b)}" r="4"/>`;
  if (opts.labels !== false && n <= 19) {
    for (let i = 0; i < n; i++) {
      s += `<text class="lab" x="${P(i)}" y="${pad / 2 - 2}">${COLS[i]}</text><text class="lab" x="${pad / 2 - 6}" y="${P(i) + 5}">${n - i}</text>`;
    }
  }
  if (opts.owner) {
    for (let k = 0; k < n * n; k++) {
      const o = opts.owner[k];
      if (o === 1 || o === 2) { const x = k % n, y = (k - x) / n; s += `<rect class="terr t${o}" x="${P(x) - 7}" y="${P(y) - 7}" width="14" height="14"/>`; }
    }
  }
  for (let k = 0; k < n * n; k++) {
    const v = board[k];
    if (!v) continue;
    const x = k % n, y = (k - x) / n;
    s += `<circle class="st ${v === 1 ? 'b' : 'w'}" cx="${P(x)}" cy="${P(y)}" r="${r}"/>`;
  }
  if (opts.last) {
    const [x, y] = opts.last, v = board[y * n + x];
    s += `<circle class="last ${v === 1 ? 'on-b' : 'on-w'}" cx="${P(x)}" cy="${P(y)}" r="${r * 0.42}"/>`;
  }
  if (opts.ko) s += `<rect class="ko" x="${P(opts.ko[0]) - 9}" y="${P(opts.ko[1]) - 9}" width="18" height="18"><title>ko: no immediate retake here</title></rect>`;
  if (opts.cursor) s += `<circle class="cur" cx="${P(opts.cursor[0])}" cy="${P(opts.cursor[1])}" r="${r + 3}"/>`;
  return s + '</svg>';
}

// Map a pointer event on the board SVG to the nearest intersection [x, y], or null if outside.
export function pointAt(svg, ev, n, labels = true) {
  const cell = 40, pad = labels === false ? 26 : 50, size = pad * 2 + cell * (n - 1);
  const box = svg.getBoundingClientRect();
  const fx = (ev.clientX - box.left) / box.width * size, fy = (ev.clientY - box.top) / box.height * size;
  const x = Math.round((fx - pad) / cell), y = Math.round((fy - pad) / cell);
  return x >= 0 && x < n && y >= 0 && y < n ? [x, y] : null;
}
