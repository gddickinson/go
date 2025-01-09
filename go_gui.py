import sys
from PyQt5.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout, QPushButton, QLabel
from PyQt5.QtGui import QPainter, QColor, QPen
from PyQt5.QtCore import Qt, QPoint
from go_game import GoGame
from go_ai import SimpleGoAI

class GoBoard(QWidget):
    def __init__(self, game: GoGame, update_status_func, ai_move_func, parent=None):
        super().__init__(parent)
        self.game = game
        self.update_status_func = update_status_func
        self.ai_move_func = ai_move_func
        self.cell_size = 30
        self.margin = 20
        self.setFixedSize(self.cell_size * (game.board_size - 1) + 2 * self.margin,
                          self.cell_size * (game.board_size - 1) + 2 * self.margin)

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)

        # Draw the board
        for i in range(self.game.board_size):
            painter.drawLine(self.margin + i * self.cell_size, self.margin,
                             self.margin + i * self.cell_size, self.height() - self.margin)
            painter.drawLine(self.margin, self.margin + i * self.cell_size,
                             self.width() - self.margin, self.margin + i * self.cell_size)

        # Draw the stones
        for y in range(self.game.board_size):
            for x in range(self.game.board_size):
                if self.game.board[y, x] != 0:
                    if self.game.board[y, x] == 1:
                        painter.setBrush(Qt.black)
                    else:
                        painter.setBrush(Qt.white)
                    painter.drawEllipse(QPoint(self.margin + x * self.cell_size,
                                               self.margin + y * self.cell_size),
                                        self.cell_size // 2 - 2,
                                        self.cell_size // 2 - 2)

    def mousePressEvent(self, event):
        x = round((event.x() - self.margin) / self.cell_size)
        y = round((event.y() - self.margin) / self.cell_size)
        if 0 <= x < self.game.board_size and 0 <= y < self.game.board_size:
            if self.game.place_stone(x, y):
                self.update()
                self.update_status_func()
                self.ai_move_func()

class GoWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.game = GoGame()
        self.ai = SimpleGoAI(self.game, 2)  # AI plays as white

        self.setWindowTitle("Go Game")
        self.setGeometry(100, 100, 600, 650)

        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)

        self.board_widget = GoBoard(self.game, self.update_status, self.ai_move, self)
        layout.addWidget(self.board_widget)

        self.status_label = QLabel("Black's turn")
        layout.addWidget(self.status_label)

        self.pass_button = QPushButton("Pass")
        self.pass_button.clicked.connect(self.pass_move)
        layout.addWidget(self.pass_button)

    def update_status(self):
        if self.game.game_over:
            black_score, white_score = self.game.get_score()
            status = f"Game Over. Black: {black_score}, White: {white_score}"
        else:
            current_player = "Black" if self.game.current_player == 1 else "White"
            status = f"{current_player}'s turn"
        self.status_label.setText(status)

    def pass_move(self):
        self.game.pass_turn()
        self.update_status()
        if not self.game.game_over:
            self.ai_move()

    def ai_move(self):
        if self.game.current_player == 2 and not self.game.game_over:
            move = self.ai.make_move()
            if move:
                x, y = move
                self.game.place_stone(x, y)
            else:
                self.game.pass_turn()
            self.board_widget.update()
            self.update_status()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = GoWindow()
    window.show()
    sys.exit(app.exec_())
