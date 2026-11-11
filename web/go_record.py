"""Qt-free helpers around the repo's real game code (go_game.GoGame, go_ai.SimpleGoAI).

Used by the web API and by scripts/make_engine_fixtures.py, so the browser engine is checked against exactly this.
Moves are (x, y) pairs, or None for a pass. Boards are encoded row by row as a string of '0' (empty), '1' (black),
'2' (white).
"""
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from go_ai import SimpleGoAI  # noqa: E402
from go_game import GoGame  # noqa: E402

BOARD_SIZES = [9, 13, 19]
KOMI = 6.5


def encode(board) -> str:
    return "".join(str(int(v)) for v in board.ravel())


def state(game: GoGame) -> dict:
    """Everything the browser needs to compare with its own engine."""
    territory = game.count_territory()
    black, white = game.get_score()
    return {
        "size": game.board_size,
        "board": encode(game.board),
        "current_player": int(game.current_player),
        "ko_point": list(game.ko_point) if game.ko_point else None,
        "passes": int(game.passes),
        "game_over": bool(game.game_over),
        "captured": {"1": int(game.captured_stones[1]), "2": int(game.captured_stones[2])},
        "territory": {str(k): int(v) for k, v in territory.items()},
        "score": {"1": float(black), "2": float(white)},
    }


def apply(game: GoGame, move) -> bool:
    """Play one move (or pass, if move is None). Returns place_stone's result; a pass returns True."""
    if move is None:
        game.pass_turn()
        return True
    return bool(game.place_stone(int(move[0]), int(move[1])))


def replay(size: int, moves, boards: bool = False) -> dict:
    """Replay a move list through GoGame. Returns per-move results (and boards if asked) plus the final state."""
    game = GoGame(size)
    results, steps = [], []
    for m in moves:
        results.append(apply(game, m))
        if boards:
            steps.append({"board": encode(game.board), "ko_point": list(game.ko_point) if game.ko_point else None,
                          "current_player": int(game.current_player)})
    out = {"results": results, "final": state(game)}
    if boards:
        out["steps"] = steps
    return out


def ai_game(size: int, seed: int, max_moves: int = 1000) -> dict:
    """Seeded AI-vs-AI game: one random.Random(seed) shared by both SimpleGoAI players (Black moves first).

    A player with no legal move passes (as in the desktop GUI); the game stops at two passes or after max_moves."""
    game = GoGame(size)
    rng = random.Random(seed)
    ais = {1: SimpleGoAI(game, 1, rng=rng), 2: SimpleGoAI(game, 2, rng=rng)}
    moves = []
    while not game.game_over and len(moves) < max_moves:
        move = ais[game.current_player].make_move()
        apply(game, move)
        moves.append(list(move) if move else None)
    return {"size": size, "seed": seed, "max_moves": max_moves, "moves": moves, "final": state(game)}
