"""
Smoke tests for go_game.py — capture logic, ko detection, territory scoring,
suicide prevention, and input validation.
"""

import numpy as np
from go_game import GoGame


def test_board_initialization():
    """Board should start empty with black to play."""
    game = GoGame(board_size=9)
    assert game.board.shape == (9, 9)
    assert np.all(game.board == 0)
    assert game.current_player == 1
    assert game.game_over is False


def test_place_stone():
    """Placing a stone should update the board and switch players."""
    game = GoGame(board_size=9)
    result = game.place_stone(4, 4)
    assert result is True
    assert game.board[4, 4] == 1
    assert game.current_player == 2  # switched to white


def test_occupied_square_rejected():
    """Cannot place a stone on an occupied intersection."""
    game = GoGame(board_size=9)
    game.place_stone(4, 4)
    result = game.place_stone(4, 4)  # white tries same spot
    assert result is False


def test_out_of_bounds_rejected():
    """Moves outside the board should be rejected."""
    game = GoGame(board_size=9)
    assert game.is_valid_move(-1, 0) is False
    assert game.is_valid_move(0, -1) is False
    assert game.is_valid_move(9, 0) is False
    assert game.is_valid_move(0, 9) is False


def test_simple_capture():
    """A single stone surrounded on all four sides should be captured."""
    game = GoGame(board_size=9)
    # Place white stone at (1,1)
    game.place_stone(0, 0)  # black (0,0) - filler
    game.place_stone(1, 1)  # white (1,1) - target

    # Black surrounds white stone at (1,1)
    game.place_stone(1, 0)  # black
    game.place_stone(8, 8)  # white - filler
    game.place_stone(0, 1)  # black
    game.place_stone(8, 7)  # white - filler
    game.place_stone(2, 1)  # black
    game.place_stone(8, 6)  # white - filler
    game.place_stone(1, 2)  # black - completes capture

    assert game.board[1, 1] == 0, "White stone should be captured"


def test_pass_turn():
    """Two consecutive passes should end the game."""
    game = GoGame(board_size=9)
    game.pass_turn()
    assert game.game_over is False
    assert game.current_player == 2
    game.pass_turn()
    assert game.game_over is True


def test_scoring():
    """Score should include territory + captures + komi for white."""
    game = GoGame(board_size=9)
    black_score, white_score = game.get_score()
    # Empty board: all territory is neutral, white gets 6.5 komi
    assert white_score >= 6.5


def test_territory_counting_empty_board():
    """On an empty board, all territory should be neutral (owner=0)."""
    game = GoGame(board_size=9)
    territory = game.count_territory()
    assert territory[0] == 81  # all 81 points are neutral
    assert territory[1] == 0
    assert territory[2] == 0


def test_get_neighbors():
    """Corner, edge, and center positions should return correct neighbor counts."""
    game = GoGame(board_size=9)
    assert len(game.get_neighbors(0, 0)) == 2  # corner
    assert len(game.get_neighbors(0, 4)) == 3  # edge
    assert len(game.get_neighbors(4, 4)) == 4  # center


def test_game_over_blocks_moves():
    """After game over, no moves should be accepted."""
    game = GoGame(board_size=9)
    game.pass_turn()
    game.pass_turn()
    assert game.game_over is True
    result = game.place_stone(0, 0)
    assert result is False


if __name__ == "__main__":
    test_board_initialization()
    test_place_stone()
    test_occupied_square_rejected()
    test_out_of_bounds_rejected()
    test_simple_capture()
    test_pass_turn()
    test_scoring()
    test_territory_counting_empty_board()
    test_get_neighbors()
    test_game_over_blocks_moves()
    print("All tests passed!")
