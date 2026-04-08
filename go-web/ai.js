/**
 * Go Game - AI opponent logic
 * Currently implements a simple random move strategy.
 */

function aiMove() {
    if (gameOver) return;

    // Simple AI: make a random legal move
    const legalMoves = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === null && `${x},${y}` !== ko) {
                legalMoves.push([x, y]);
            }
        }
    }

    if (legalMoves.length > 0) {
        const [x, y] = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        makeMove(x, y);
    } else {
        pass();
    }
}
