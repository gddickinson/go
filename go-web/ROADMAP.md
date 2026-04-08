# Go Game (Web) — Roadmap

## Current State
A single-file HTML/JavaScript implementation of Go (`go-game.html`). Includes AI opponent, ko rule enforcement, multiple board sizes (9x9, 13x13, 19x19), and responsive CSS. Zero dependencies — fully self-contained browser application. Minimal project with just the HTML file and a README.

## Short-term Improvements
- [x] Split `go-game.html` into separate files: `index.html`, `style.css`, `game.js`, `ai.js`
- [ ] Add territory counting visualization — shade territories during scoring
- [ ] Add move validation feedback (why a move is illegal: ko, suicide, occupied)
- [ ] Add a pass counter display and game-over detection (two consecutive passes)
- [x] Add a favicon and proper `<meta>` tags for sharing
- [ ] Add keyboard shortcuts (P for pass, N for new game, U for undo)

## Feature Enhancements
- [ ] Improve AI beyond basic strategy — implement Monte Carlo Tree Search (MCTS)
- [ ] Add move history panel with numbered moves
- [ ] Implement undo/redo functionality
- [ ] Add SGF (Smart Game Format) import/export for sharing games
- [ ] Add a game timer (byoyomi/Fischer clock options)
- [ ] Implement handicap stone placement for balanced games
- [ ] Add sound effects for stone placement and capture

## Long-term Vision
- [ ] Add online multiplayer via WebSocket (peer-to-peer or server-based)
- [ ] Integrate with OGS (Online Go Server) API for matchmaking
- [ ] Add a teaching mode with joseki/fuseki pattern recognition
- [ ] Implement a go problem (tsumego) solver mode
- [ ] Progressive Web App (PWA) support for offline play on mobile
- [ ] Add game analysis — highlight good/bad moves with AI evaluation

## Technical Debt
- [x] Everything in one HTML file makes it hard to maintain and test
- [ ] No automated tests — game logic (capturing, ko, scoring) needs unit tests (use Jest or similar)
- [x] AI logic is interleaved with game state management — separate concerns
- [ ] No build system — adding one (Vite, esbuild) would enable TypeScript, minification, and testing
- [x] CSS is inline — should be extracted for maintainability
- [x] No LICENSE file
