"""Web interface for the Go game (FastAPI app + static front end, published to GitHub Pages).

Contents:
    app.py        FastAPI app: front end at /, JSON API under /api, STATIC_ENDPOINTS for the static export
    go_record.py  Qt-free helpers around go_game.GoGame / go_ai.SimpleGoAI: replay a move list, record a seeded
                  AI-vs-AI game, serialise a game state (used by the API and scripts/make_engine_fixtures.py)
    static/       ES-module front end; go_engine.js / go_ai.js / py_random.js are the JS port of the Python rules and AI
"""
