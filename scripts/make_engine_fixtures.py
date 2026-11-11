"""Write tests/fixtures/go_engine_fixtures.json: move sequences replayed through the repo's Python GoGame and
SimpleGoAI, which web/static/go_engine.test.mjs requires the JS port to reproduce exactly.

Cases: hand-made rule positions (capture, ko, suicide, passing, territory), random move attempts (legal and
illegal, every board recorded), seeded AI-vs-AI games (the JS AI must choose the same moves) and raw
Mersenne Twister outputs of random.Random(seed).
Run: python scripts/make_engine_fixtures.py   (tests/test_web.py checks the file is current)
"""
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from web.go_record import ai_game, replay  # noqa: E402

OUT = ROOT / "tests" / "fixtures" / "go_engine_fixtures.json"
P = None  # a pass

SCENARIOS = [
    ("single capture", 9, [(0, 0), (1, 1), (1, 0), (8, 8), (0, 1), (8, 7), (2, 1), (8, 6), (1, 2)]),
    ("ko: immediate recapture refused", 5, [(1, 0), (2, 0), (0, 1), (3, 1), (1, 2), (2, 2), (2, 1), (1, 1), (2, 1)]),
    ("ko: retake after moves elsewhere", 5,
     [(1, 0), (2, 0), (0, 1), (3, 1), (1, 2), (2, 2), (2, 1), (1, 1), (4, 4), (4, 3), (2, 1)]),
    ("ko: pass clears the ban", 5, [(1, 0), (2, 0), (0, 1), (3, 1), (1, 2), (2, 2), (2, 1), (1, 1), P, (2, 1)]),
    ("one-stone capture by a group is not ko", 5, [(1, 0), (0, 0), (1, 1), (4, 4), (0, 1), (0, 0)]),
    ("multi-stone suicide refused", 4, [(0, 0), (2, 0), (3, 3), (1, 1), (3, 2), (0, 1), (1, 0)]),
    ("single-stone suicide refused", 3, [(1, 0), (2, 2), (0, 1), (0, 0)]),
    ("occupied and off-board refused", 5, [(2, 2), (2, 2), (-1, 0), (5, 0), (0, 5), (0, -1)]),
    ("two-group capture", 5, [(0, 1), (0, 0), (1, 1), (2, 0), (3, 0), (4, 4), (2, 1), (4, 3), (1, 0)]),
    ("two passes end the game", 9, [(2, 2), (6, 6), P, P, (4, 4), P]),
    ("territory: walls", 5, [(2, 0), (3, 0), (2, 1), (3, 1), (2, 2), (3, 2), (2, 3), (3, 3), (2, 4), (3, 4), P, P]),
    ("territory: neutral region", 5, [(0, 2), (4, 2), (1, 2), (3, 2), P, P]),
]


def random_attempts(size, seed, n, pass_p=0.03):
    """Random (x, y) attempts, a few off-board, occasional passes: drawn by Python, replayed by both engines."""
    rng = random.Random(seed)
    moves = []
    for _ in range(n):
        if rng.random() < pass_p:
            moves.append(None)
        else:
            moves.append([rng.randint(-1, size), rng.randint(-1, size)])
    return moves


AI_GAMES = [(5, 0, 400), (7, 11, 300), (9, 1, 300), (13, 2, 200), (19, 3, 120)]
PRNG_SEEDS = [0, 1, 42, 2**32 + 5, 123456789012345]
BELOW = [1, 2, 3, 7, 80, 81, 360, 361]


def build() -> dict:
    cases = []
    for label, size, moves in SCENARIOS:
        mv = [list(m) if m else None for m in moves]
        cases.append({"label": label, "size": size, "moves": mv, **replay(size, mv, boards=True)})
    for size, seed, n in [(5, 1, 250), (7, 2, 300), (9, 3, 400), (13, 4, 200)]:
        mv = random_attempts(size, seed, n)
        cases.append({"label": f"random attempts {size}x{size} seed {seed}", "size": size, "moves": mv,
                      **replay(size, mv, boards=True)})
    games = [ai_game(size, seed, n) for size, seed, n in AI_GAMES]
    prng = []
    for s in PRNG_SEEDS:
        r = random.Random(s)
        u32 = [r.getrandbits(32) for _ in range(8)]
        below = [[n, [r._randbelow(n) for _ in range(6)]] for n in BELOW]
        prng.append({"seed": str(s), "u32": u32, "below": below})
    return {"cases": cases, "ai_games": games, "prng": prng}


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    data = build()
    OUT.write_text(json.dumps(data, separators=(",", ":")))
    print(f"{OUT.relative_to(ROOT)}: {len(data['cases'])} replay cases, {len(data['ai_games'])} AI games, "
          f"{len(data['prng'])} PRNG seeds, {OUT.stat().st_size / 1e3:.0f} kB")


if __name__ == "__main__":
    main()
