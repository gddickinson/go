# Go Game (Python) — Roadmap

## Current State
A four-file Python implementation of Go: `go_game.py` (game logic, rules), `go_ai.py` (SimpleGoAI — random valid moves only), `go_gui.py` (PyQt5 GUI), `go_main.py` (entry point). Implements stone capture, ko rule, territory scoring, and 6.5 komi. The AI is trivially simple — just picks a random legal move. No tests, no package structure, no requirements file.

## Short-term Improvements
- [x] Add `requirements.txt` (PyQt5, numpy)
- [x] Add unit tests for `go_game.py` — capture logic, ko detection, territory scoring, suicide prevention
- [x] Add input validation in `go_game.py` for board coordinates (bounds checking)
- [ ] Add game-over detection feedback in the GUI (display final score, territory visualization)
- [ ] Add move history display (numbered moves or a move list panel)
- [x] Add error handling for PyQt5 initialization in `go_main.py`

## Feature Enhancements
- [ ] Replace `SimpleGoAI` with Monte Carlo Tree Search (MCTS) for a real challenge
- [ ] Add configurable board sizes (9x9, 13x13, 19x19) — currently appears to be fixed
- [ ] Implement undo/redo for moves
- [ ] Add SGF (Smart Game Format) save/load for game records
- [ ] Add territory estimation during play (show influence map)
- [ ] Implement handicap stones and adjustable komi
- [ ] Add a game clock with byoyomi support

## Long-term Vision
- [ ] Integrate a neural network AI (e.g., KataGo or a lightweight model)
- [ ] Add network play (local network or online via WebSocket)
- [ ] Build a teaching mode with common pattern recognition (eyes, ladders, nets)
- [ ] Add a tsumego (Go problem) mode with curated puzzles
- [ ] Migrate from PyQt5 to PyQt6 for ongoing support
- [ ] Package as a standalone app with PyInstaller

## Technical Debt
- [ ] `go_ai.py` is 19 lines with no strategy — it's a placeholder, not a real AI
- [ ] `go_game.py` likely handles both game state and rule enforcement — consider separating board state from rules engine
- [ ] No docstrings or type hints in any module
- [x] No `.gitignore` or project metadata (`setup.py`, `pyproject.toml`)
- [x] `__pycache__/` is not gitignored
- [ ] No separation between the "Go engine" and the "Go application" — the engine should be reusable
