# Session log

## 2026-11-11 -- web interface, static GitHub Pages site, rule bug fixes (branch `web-interface`)

**Bugs fixed in the Python (each in its own commit, with regression tests in `tests/`):**
- Ko was never enforced: `detect_ko()` only set a ko point when exactly one board point changed (i.e. nothing was
  captured), so immediate ko recaptures were always allowed. Now simple ko (lone stone, captured exactly one stone,
  one liberty left); a pass clears the ban.
- Suicide was inconsistent: one-stone suicide was refused, multi-stone suicide was played (own stones removed, no
  prisoners credited). All suicide is now illegal and `is_valid_move()` reports it.
- The AI could choose a suicide point that `place_stone()` refused; the GUI ignored the failure and left White to
  move with the human clicking for White. Fixed by the legality check; `SimpleGoAI` also takes an optional seeded `rng`.
- Passing after the game was over changed the pass count and player; now ignored.
- `pyproject.toml` named a non-existent build backend (`pip install .` failed); now `setuptools.build_meta`.
- README: fixed clone URL and broken placeholder screenshot, Python 3.9+ (code uses `tuple[...]`), rules list.

**Web interface:** `web/` (FastAPI + ES modules, kit theme), pages Home / Play / Watch / Rules / About. The game runs
in the browser on a JS port of `GoGame`/`SimpleGoAI`/`random.Random`; `web/static/go_engine.test.mjs` replays
16 recorded sequences (1245 moves), 5 seeded AI games (1320 moves, 5x5 to 19x19) and 5 PRNG seeds from the Python
and requires identical results (5179 checks). Local app adds "Check with Python" (POST /api/replay).

**Open:** the random AI never passes while it has a legal move, so games against it end only when it runs out of
moves (same in the desktop app). No undo, resign or SGF (the Python has none). `go-web/` (older standalone JS version)
left untouched.
