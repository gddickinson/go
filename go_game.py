import numpy as np
from typing import List, Tuple, Set, Dict

class GoGame:
    def __init__(self, board_size: int = 19):
        self.board_size = board_size
        self.board = np.zeros((board_size, board_size), dtype=int)
        self.current_player = 1  # 1 for black, 2 for white
        self.previous_board = None
        self.ko_point = None
        self.game_over = False
        self.passes = 0
        self.captured_stones = {1: 0, 2: 0}

    def place_stone(self, x: int, y: int) -> bool:
        if self.game_over or not self.is_valid_move(x, y):
            return False

        self.previous_board = self.board.copy()
        self.board[y, x] = self.current_player

        captured = self.remove_captured_stones(3 - self.current_player)
        self.captured_stones[self.current_player] += captured

        if captured == 0:
            self.remove_captured_stones(self.current_player)

        if np.array_equal(self.board, self.previous_board):
            self.board = self.previous_board
            return False

        self.ko_point = self.detect_ko()
        self.passes = 0
        self.switch_player()
        return True

    def pass_turn(self):
        self.passes += 1
        if self.passes == 2:
            self.game_over = True
        else:
            self.switch_player()

    def is_valid_move(self, x: int, y: int) -> bool:
        if x < 0 or x >= self.board_size or y < 0 or y >= self.board_size:
            return False
        if self.board[y, x] != 0:
            return False
        if (x, y) == self.ko_point:
            return False
        return True

    def remove_captured_stones(self, player: int) -> int:
        captured = 0
        for y in range(self.board_size):
            for x in range(self.board_size):
                if self.board[y, x] == player:
                    group = self.get_connected_stones(x, y)
                    if not any(self.has_liberties(stone) for stone in group):
                        for stone_x, stone_y in group:
                            self.board[stone_y, stone_x] = 0
                            captured += 1
        return captured

    def get_connected_stones(self, x: int, y: int) -> Set[Tuple[int, int]]:
        color = self.board[y, x]
        visited = set()
        stack = [(x, y)]
        while stack:
            current = stack.pop()
            if current not in visited:
                visited.add(current)
                cx, cy = current
                for nx, ny in self.get_neighbors(cx, cy):
                    if self.board[ny, nx] == color:
                        stack.append((nx, ny))
        return visited

    def has_liberties(self, stone: Tuple[int, int]) -> bool:
        x, y = stone
        return any(self.board[ny, nx] == 0 for nx, ny in self.get_neighbors(x, y))

    def get_neighbors(self, x: int, y: int) -> List[Tuple[int, int]]:
        neighbors = []
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < self.board_size and 0 <= ny < self.board_size:
                neighbors.append((nx, ny))
        return neighbors

    def detect_ko(self) -> Tuple[int, int]:
        if self.previous_board is None:
            return None
        diff = self.board - self.previous_board
        if np.count_nonzero(diff) == 1:
            y, x = np.where(diff != 0)
            return (int(x), int(y))
        return None

    def switch_player(self):
        self.current_player = 3 - self.current_player

    def get_score(self) -> Tuple[float, float]:
        territory = self.count_territory()
        black_score = self.captured_stones[1] + territory[1]
        white_score = self.captured_stones[2] + territory[2] + 6.5  # 6.5 komi
        return black_score, white_score

    def count_territory(self) -> Dict[int, int]:
        territory = {0: 0, 1: 0, 2: 0}
        visited = set()

        for y in range(self.board_size):
            for x in range(self.board_size):
                if (x, y) not in visited and self.board[y, x] == 0:
                    region = self.get_connected_empty(x, y)
                    visited.update(region)
                    owner = self.determine_territory_owner(region)
                    territory[owner] += len(region)

        return territory

    def get_connected_empty(self, x: int, y: int) -> Set[Tuple[int, int]]:
        visited = set()
        stack = [(x, y)]
        while stack:
            current = stack.pop()
            if current not in visited:
                visited.add(current)
                cx, cy = current
                for nx, ny in self.get_neighbors(cx, cy):
                    if self.board[ny, nx] == 0:
                        stack.append((nx, ny))
        return visited

    def determine_territory_owner(self, region: Set[Tuple[int, int]]) -> int:
        black_adjacent = False
        white_adjacent = False

        for x, y in region:
            for nx, ny in self.get_neighbors(x, y):
                if self.board[ny, nx] == 1:
                    black_adjacent = True
                elif self.board[ny, nx] == 2:
                    white_adjacent = True

        if black_adjacent and not white_adjacent:
            return 1
        elif white_adjacent and not black_adjacent:
            return 2
        else:
            return 0  # Neutral territory
