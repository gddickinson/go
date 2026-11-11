"""Regression tests for rule bugs fixed in go_game.py / go_ai.py (2026-11-11).

Coordinates are (x, y); the board array is indexed board[y, x]. Black = 1, White = 2.
Run: python -m pytest -q tests/test_rules_regressions.py
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from go_game import GoGame  # noqa: E402


def play(game, moves):
    for m in moves:
        assert game.place_stone(*m), f"setup move {m} was rejected"


def ko_position():
    """5x5: Black (1,0),(0,1),(1,2); White (2,0),(3,1),(2,2); Black at (2,1), then White takes it at (1,1)."""
    game = GoGame(5)
    play(game, [(1, 0), (2, 0), (0, 1), (3, 1), (1, 2), (2, 2), (2, 1), (1, 1)])
    return game


# --- ko -------------------------------------------------------------------------------------------------------------
def test_ko_immediate_recapture_rejected():
    game = ko_position()
    assert game.board[1, 2] == 0 and game.board[1, 1] == 2   # white captured the black stone at (2,1)
    assert game.ko_point == (2, 1)
    assert game.is_valid_move(2, 1) is False
    assert game.place_stone(2, 1) is False
    assert game.board[1, 1] == 2 and game.current_player == 1


def test_ko_recapture_allowed_after_intervening_moves():
    game = ko_position()
    play(game, [(4, 4), (4, 3)])                           # black plays elsewhere, white answers elsewhere
    assert game.ko_point is None
    assert game.place_stone(2, 1) is True                    # now black may retake
    assert game.board[1, 1] == 0


def test_pass_clears_ko():
    game = ko_position()
    game.pass_turn()                                         # black passes instead of taking the ko
    assert game.ko_point is None
    assert game.place_stone(1, 3) is True                    # white is not barred from anything


def test_capture_of_one_stone_by_a_group_is_not_ko():
    """Capturing one stone with a stone that joins a group (or keeps several liberties) sets no ko point."""
    game = GoGame(5)
    # White stone at (0,0) in the corner, Black takes it by playing (0,1) next to its own (1,1) stone.
    play(game, [(1, 0), (0, 0), (1, 1), (4, 4), (0, 1)])
    assert game.board[0, 0] == 0
    assert game.ko_point is None


# --- suicide --------------------------------------------------------------------------------------------------------
def multi_suicide_position():
    """4x4: Black (0,0) with White (2,0),(1,1),(0,1) around; Black (1,0) would be a two-stone suicide."""
    game = GoGame(4)
    play(game, [(0, 0), (2, 0), (3, 3), (1, 1), (3, 2), (0, 1)])
    return game


def test_multi_stone_suicide_rejected():
    game = multi_suicide_position()
    before = game.board.copy()
    assert game.is_valid_move(1, 0) is False
    assert game.place_stone(1, 0) is False
    assert (game.board == before).all() and game.current_player == 1
    assert game.captured_stones == {1: 0, 2: 0}


def test_single_stone_suicide_is_not_a_valid_move():
    game = GoGame(3)
    play(game, [(1, 0), (2, 2), (0, 1)])
    assert game.current_player == 2
    assert game.is_valid_move(0, 0) is False                 # white at (0,0) would have no liberties
    assert game.place_stone(0, 0) is False


def test_capturing_move_is_not_suicide():
    """Filling the last liberty is legal when it captures (the placed stone gains liberties)."""
    game = ko_position()
    play(game, [(4, 4), (4, 3)])
    assert game.is_valid_move(2, 1) is True


# --- passing --------------------------------------------------------------------------------------------------------
def test_pass_after_game_over_is_ignored():
    game = GoGame(5)
    game.pass_turn()
    game.pass_turn()
    player = game.current_player
    game.pass_turn()
    assert game.game_over is True and game.passes == 2 and game.current_player == player
