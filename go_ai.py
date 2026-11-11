import random
from go_game import GoGame

class SimpleGoAI:
    """Picks a uniformly random legal move (random.choice over the legal points, scanned row by row).

    `rng` is an optional random.Random for reproducible games; by default the global random module is used."""
    def __init__(self, game: GoGame, color: int, rng=None):
        self.game = game
        self.color = color
        self.rng = rng if rng is not None else random

    def make_move(self) -> tuple[int, int]:
        valid_moves = []
        for y in range(self.game.board_size):
            for x in range(self.game.board_size):
                if self.game.is_valid_move(x, y):
                    valid_moves.append((x, y))

        if not valid_moves:
            return None  # Pass if no valid moves

        return self.rng.choice(valid_moves)
