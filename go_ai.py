import random
from go_game import GoGame

class SimpleGoAI:
    def __init__(self, game: GoGame, color: int):
        self.game = game
        self.color = color

    def make_move(self) -> tuple[int, int]:
        valid_moves = []
        for y in range(self.game.board_size):
            for x in range(self.game.board_size):
                if self.game.is_valid_move(x, y):
                    valid_moves.append((x, y))

        if not valid_moves:
            return None  # Pass if no valid moves

        return random.choice(valid_moves)
