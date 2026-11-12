"""FastAPI web app for the Go game: serves the front end in static/ and the JSON API under /api.

The game itself runs in the browser (static/go_engine.js, a tested port of go_game.py); the API serves facts about
the Python implementation, a Python-recorded AI-vs-AI demo game, and POST /api/replay, which plays any move list
through the real GoGame so the browser can compare. Run with `python run_web.py` (http://127.0.0.1:8160, local only).
`scripts/build_static.py` exports every path in STATIC_ENDPOINTS to JSON for the GitHub Pages site.
"""
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from web.go_record import BOARD_SIZES, KOMI, ai_game, replay

STATIC = Path(__file__).resolve().parent / "static"
DEMO = {"size": 9, "seed": 1, "max_moves": 1000}  # the game ends by two passes long before the cap
MAX_REPLAY_MOVES = 2000

app = FastAPI(title="Go Game")
app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(STATIC / "index.html")


@app.get("/api/info")
def info():
    """Facts about the Python implementation, for the home and rules pages."""
    return {
        "title": "Go Game",
        "board_sizes": BOARD_SIZES,
        "desktop_board_size": 19,
        "komi": KOMI,
        "scoring": "territory + prisoners",
        "ai": "SimpleGoAI: a uniformly random legal move that does not fill its own eye; passes when none is left",
        "ai_color": 2,
        "modules": ["go_game.py", "go_ai.py", "go_gui.py", "go_main.py"],
    }


@app.get("/api/demo")
def demo():
    """A seeded SimpleGoAI-vs-SimpleGoAI game recorded by the Python engine (played to the end)."""
    return ai_game(DEMO["size"], DEMO["seed"], DEMO["max_moves"])


class Replay(BaseModel):
    size: int = Field(19, ge=2, le=25)
    moves: List[Optional[List[int]]] = Field(default_factory=list)


@app.post("/api/replay")
def replay_moves(req: Replay):
    """Play a move list ([x, y] or null for a pass) through go_game.GoGame; returns each move's result and the final state."""
    if len(req.moves) > MAX_REPLAY_MOVES:
        raise HTTPException(400, f"at most {MAX_REPLAY_MOVES} moves")
    if any(m is not None and len(m) != 2 for m in req.moves):
        raise HTTPException(400, "each move must be [x, y] or null")
    return replay(req.size, req.moves)


# GET paths (without the /api prefix) written to the static site as api/<path>.json.
STATIC_ENDPOINTS = ["/info", "/demo"]
