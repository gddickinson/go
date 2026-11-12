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
        self.dead_stones: Set[Tuple[int, int]] = set()  # marked after the game ends, see toggle_dead()

    def place_stone(self, x: int, y: int) -> bool:
        if self.game_over or not self.is_valid_move(x, y):
            return False

        self.previous_board = self.board.copy()
        self.board[y, x] = self.current_player

        captured = self.remove_captured_stones(3 - self.current_player)
        self.captured_stones[self.current_player] += captured

        # is_valid_move() has already rejected suicide, so the new stone's group always keeps a liberty.
        self.ko_point = self.detect_ko(x, y)
        self.passes = 0
        self.switch_player()
        return True

    def pass_turn(self):
        if self.game_over:
            return
        self.passes += 1
        self.ko_point = None  # the ko ban only applies to the move right after the capture
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
        if self.is_suicide(x, y, self.current_player):
            return False
        return True

    def is_suicide(self, x: int, y: int, player: int) -> bool:
        """True if a stone of `player` at the empty point (x, y) would leave its own group with no liberties
        without capturing anything (suicide is not allowed)."""
        for nx, ny in self.get_neighbors(x, y):
            color = self.board[ny, nx]
            if color == 0:
                return False
            liberties = len(self.get_liberties(nx, ny))
            if color == player and liberties > 1:
                return False  # joins a group that keeps another liberty
            if color != player and liberties == 1:
                return False  # captures the neighbouring group, freeing a liberty
        return True

    def is_eye(self, x: int, y: int, player: int) -> bool:
        """Simple eye test used by the AI: (x, y) is empty, every orthogonal neighbour is `player`'s stone, and the
        opponent holds at most one diagonal point (none if the point is on the edge or in a corner)."""
        if self.board[y, x] != 0:
            return False
        if any(self.board[ny, nx] != player for nx, ny in self.get_neighbors(x, y)):
            return False
        diagonals = [(x + dx, y + dy) for dx, dy in ((-1, -1), (1, -1), (-1, 1), (1, 1))]
        on_board = [(a, b) for a, b in diagonals if 0 <= a < self.board_size and 0 <= b < self.board_size]
        enemy = sum(1 for a, b in on_board if self.board[b, a] == 3 - player)
        return enemy == 0 if len(on_board) < 4 else enemy < 2

    def get_liberties(self, x: int, y: int) -> Set[Tuple[int, int]]:
        """Empty points adjacent to the group containing the stone at (x, y)."""
        liberties = set()
        for sx, sy in self.get_connected_stones(x, y):
            for nx, ny in self.get_neighbors(sx, sy):
                if self.board[ny, nx] == 0:
                    liberties.add((nx, ny))
        return liberties

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

    def detect_ko(self, x: int, y: int) -> Tuple[int, int]:
        """Simple ko after the stone just played at (x, y): if it captured exactly one stone, is a lone stone and has
        exactly one liberty (the point it just captured), the opponent may not play there on the next move.
        Returns that point, or None."""
        if self.previous_board is None:
            return None
        captured = np.argwhere((self.previous_board != 0) & (self.board == 0))
        if len(captured) != 1:
            return None
        if len(self.get_connected_stones(x, y)) != 1 or len(self.get_liberties(x, y)) != 1:
            return None
        cy, cx = captured[0]
        return (int(cx), int(cy))

    def switch_player(self):
        self.current_player = 3 - self.current_player

    def toggle_dead(self, x: int, y: int) -> bool:
        """After the game has ended, mark (or unmark) the whole group at (x, y) as dead before scoring.
        Returns False if the game is not over or (x, y) holds no stone."""
        if not self.game_over or not (0 <= x < self.board_size and 0 <= y < self.board_size) or self.board[y, x] == 0:
            return False
        group = self.get_connected_stones(x, y)
        if group <= self.dead_stones:
            self.dead_stones -= group
        else:
            self.dead_stones |= group
        return True

    def scoring_board(self) -> np.ndarray:
        """The board with dead stones taken off (the position that is scored)."""
        board = self.board.copy()
        for x, y in self.dead_stones:
            board[y, x] = 0
        return board

    def get_score(self) -> Tuple[float, float]:
        """Territory scoring (as in Japanese rules): territory + prisoners, where stones marked dead count as
        prisoners for the opponent and their points as the opponent's territory; White adds 6.5 komi."""
        territory = self.count_territory()
        dead = {1: 0, 2: 0}
        for x, y in self.dead_stones:
            dead[int(self.board[y, x])] += 1
        black_score = self.captured_stones[1] + dead[2] + territory[1]
        white_score = self.captured_stones[2] + dead[1] + territory[2] + 6.5  # 6.5 komi
        return black_score, white_score

    def count_territory(self) -> Dict[int, int]:
        territory = {0: 0, 1: 0, 2: 0}
        visited = set()
        board = self.scoring_board()

        for y in range(self.board_size):
            for x in range(self.board_size):
                if (x, y) not in visited and board[y, x] == 0:
                    region = self.get_connected_empty(x, y, board)
                    visited.update(region)
                    owner = self.determine_territory_owner(region, board)
                    territory[owner] += len(region)

        return territory

    def get_connected_empty(self, x: int, y: int, board: np.ndarray = None) -> Set[Tuple[int, int]]:
        board = self.board if board is None else board
        visited = set()
        stack = [(x, y)]
        while stack:
            current = stack.pop()
            if current not in visited:
                visited.add(current)
                cx, cy = current
                for nx, ny in self.get_neighbors(cx, cy):
                    if board[ny, nx] == 0:
                        stack.append((nx, ny))
        return visited

    def determine_territory_owner(self, region: Set[Tuple[int, int]], board: np.ndarray = None) -> int:
        board = self.board if board is None else board
        black_adjacent = False
        white_adjacent = False

        for x, y in region:
            for nx, ny in self.get_neighbors(x, y):
                if board[ny, nx] == 1:
                    black_adjacent = True
                elif board[ny, nx] == 2:
                    white_adjacent = True

        if black_adjacent and not white_adjacent:
            return 1
        elif white_adjacent and not black_adjacent:
            return 2
        else:
            return 0  # Neutral territory
