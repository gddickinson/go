# Go Game (Python) -- Interface Map

## Module Overview

| File | Purpose |
|------|---------|
| `go_main.py` | Entry point -- launches the PyQt5 application |
| `go_game.py` | Core game logic -- `GoGame` class with board state, rules, capture, ko, scoring |
| `go_ai.py` | AI opponent -- `SimpleGoAI` class (random valid move selection) |
| `go_gui.py` | PyQt5 GUI -- `GoBoard` (board widget) and `GoWindow` (main window) |
| `test_go_game.py` | Unit tests for `GoGame` -- capture, ko, territory, validation |

## Key Classes and Functions

### go_game.py
- `GoGame` -- main game engine
  - `place_stone(x, y)` -- place a stone and process captures
  - `is_valid_move(x, y)` -- check move legality
  - `pass_turn()` -- pass; two passes end game
  - `get_score()` -- returns (black_score, white_score) with 6.5 komi
  - `count_territory()` -- flood-fill territory counting
  - `get_connected_stones(x, y)` -- BFS to find a group
  - `detect_ko()` -- detect simple ko

### go_ai.py
- `SimpleGoAI` -- trivial AI that picks a random legal move
  - `make_move()` -- returns (x, y) or None to pass

### go_gui.py
- `GoBoard(QWidget)` -- draws the board and handles clicks
- `GoWindow(QMainWindow)` -- main window with board, status, pass button

### go_main.py
- `main()` -- creates QApplication and shows GoWindow

## Module Dependencies
```
go_main.py --> go_gui.py --> go_game.py
                         --> go_ai.py --> go_game.py
```
