# Go Game (Python) -- Interface Map

## Module Overview

| File | Purpose |
|------|---------|
| `go_main.py` | Entry point -- launches the PyQt5 application |
| `go_game.py` | Core game logic -- `GoGame` class with board state, rules, capture, ko, suicide, scoring |
| `go_ai.py` | AI opponent -- `SimpleGoAI` class (random legal move, optional seeded `rng`) |
| `go_gui.py` | PyQt5 GUI -- `GoBoard` (board widget) and `GoWindow` (main window) |
| `test_go_game.py` | Unit tests for `GoGame` -- capture, territory, validation, passing |
| `tests/test_rules_regressions.py` | Regression tests for the ko / suicide / AI-legality / pass / AI-eye / dead-stone fixes |
| `tests/test_packaging.py` | pyproject.toml build backend and module list are valid |
| `tests/test_web.py` | Web API, static build, fixture-is-current and node engine tests |
| `web/` | Web interface (see below) |
| `run_web.py` | Starts the web app on http://127.0.0.1:8160 |
| `scripts/build_static.py` | Exports the static GitHub Pages site to `site/` |
| `scripts/make_engine_fixtures.py` | Records Python move sequences to `tests/fixtures/go_engine_fixtures.json` |
| `scripts/screenshots.py` | Playwright smoke test + README screenshots (`docs/img/`) |
| `.github/workflows/pages.yml` | Builds and publishes the static site on push to main |

## Key Classes and Functions

### go_game.py
- `GoGame` -- main game engine; coordinates are (x, y), board indexed `board[y, x]`, 1 black / 2 white
  - `place_stone(x, y)` -- place a stone if legal, process captures, set ko point
  - `is_valid_move(x, y)` -- legality: on board, empty, not the ko point, not suicide
  - `is_suicide(x, y, player)` / `get_liberties(x, y)` -- suicide test, liberties of a group
  - `is_eye(x, y, player)` -- simple eye test (used by the AI so it never fills its own eyes)
  - `toggle_dead(x, y)` / `scoring_board()` -- after the game: mark a group dead; board with dead stones removed
  - `pass_turn()` -- pass (clears ko); two passes end game; ignored after game over
  - `get_score()` -- returns (black_score, white_score): territory scoring (territory + prisoners, dead stones
    counted for the opponent), 6.5 komi
  - `count_territory()` -- flood-fill territory counting
  - `get_connected_stones(x, y)` -- BFS to find a group
  - `detect_ko(x, y)` -- simple ko point after the move at (x, y)

### go_ai.py
- `SimpleGoAI(game, color, rng=None)` -- random legal move that doesn't fill its own eye, via `rng.choice`
  (default: global `random`)
  - `make_move()` -- returns (x, y), or None to pass when only own-eye moves (or none) are left

### go_gui.py
- `GoBoard(QWidget)` -- draws the board and handles clicks (moves; after the game, dead-group marking)
- `GoWindow(QMainWindow)` -- main window with board, status, pass button

### go_main.py
- `main()` -- creates QApplication and shows GoWindow

### web/
- `web/app.py` -- FastAPI app: `/api/info`, `/api/demo` (Python AI-vs-AI game), `POST /api/replay`; `STATIC_ENDPOINTS`
- `web/go_record.py` -- Qt-free helpers: `replay(size, moves, dead=())`, `ai_game(size, seed, max_moves)`, `state(game)`
- `web/static/go_engine.js` -- JS port of `GoGame`; `go_ai.js` -- port of `SimpleGoAI`; `py_random.js` -- Python's
  `random.Random` (MT19937, `choice`); `go_engine.test.mjs` -- node test against the Python fixtures
- `web/static/board_view.js` -- SVG board renderer; pages `home.js`, `play.js`, `watch.js`, `rules.js`, `about.js`;
  `main.js` (entry), `core.js` / `style.css` (shared web kit), `style_app.css`, `static_api.js` (static-site data)

## Module Dependencies
```
go_main.py --> go_gui.py --> go_game.py
                         --> go_ai.py --> go_game.py
web/app.py --> web/go_record.py --> go_game.py, go_ai.py
web/static/play.js --> go_engine.js, go_ai.js --> py_random.js
```
