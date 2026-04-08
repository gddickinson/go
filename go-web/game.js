/**
 * Go Game - Core game logic
 * Handles board state, move validation, captures, ko rule, and scoring.
 */

let BOARD_SIZE = 9;
let board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
let currentPlayer = 'black';
let gameOver = false;
let passes = 0;
let ko = null;
let moveHistory = [];

function createBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 40px)`;

    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const intersection = document.createElement('div');
            intersection.className = 'intersection';
            intersection.dataset.x = x;
            intersection.dataset.y = y;
            intersection.onclick = () => makeMove(x, y);
            boardElement.appendChild(intersection);
        }
    }
    updateBoard();
}

function updateBoard() {
    const intersections = document.getElementsByClassName('intersection');
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const stone = board[y][x];
            const intersection = intersections[y * BOARD_SIZE + x];
            intersection.innerHTML = stone ?
                `<div class="stone ${stone}"></div>` : '';
        }
    }

    document.getElementById('status').textContent =
        gameOver ? 'Game Over!' : `${currentPlayer}'s turn`;
}

function isValidPosition(x, y) {
    return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

function getAdjacent(x, y) {
    return [[x+1, y], [x-1, y], [x, y+1], [x, y-1]]
        .filter(([nx, ny]) => isValidPosition(nx, ny));
}

function getGroup(x, y, color) {
    const group = new Set();
    const stack = [[x, y]];

    while (stack.length > 0) {
        const [cx, cy] = stack.pop();
        if (!isValidPosition(cx, cy) || board[cy][cx] !== color) continue;
        const pos = `${cx},${cy}`;
        if (group.has(pos)) continue;

        group.add(pos);
        getAdjacent(cx, cy).forEach(([nx, ny]) => {
            if (board[ny][nx] === color) {
                stack.push([nx, ny]);
            }
        });
    }

    return group;
}

function countLiberties(group) {
    const liberties = new Set();
    for (const pos of group) {
        const [x, y] = pos.split(',').map(Number);
        getAdjacent(x, y).forEach(([nx, ny]) => {
            if (board[ny][nx] === null) {
                liberties.add(`${nx},${ny}`);
            }
        });
    }
    return liberties;
}

function makeMove(x, y) {
    if (gameOver || board[y][x] !== null || (`${x},${y}` === ko)) return;

    // Save current state for undo
    moveHistory.push({
        board: board.map(row => [...row]),
        player: currentPlayer,
        ko: ko
    });

    board[y][x] = currentPlayer;
    const capturedGroups = [];

    // Check for captures
    getAdjacent(x, y).forEach(([nx, ny]) => {
        if (board[ny][nx] === (currentPlayer === 'black' ? 'white' : 'black')) {
            const group = getGroup(nx, ny, board[ny][nx]);
            if (countLiberties(group).size === 0) {
                capturedGroups.push(group);
            }
        }
    });

    // Remove captured stones
    let totalCaptured = 0;
    capturedGroups.forEach(group => {
        totalCaptured += group.size;
        group.forEach(pos => {
            const [cx, cy] = pos.split(',').map(Number);
            board[cy][cx] = null;
        });
    });

    // Check if move is suicide
    const ownGroup = getGroup(x, y, currentPlayer);
    if (countLiberties(ownGroup).size === 0 && totalCaptured === 0) {
        board[y][x] = null;
        moveHistory.pop();
        return;
    }

    // Set ko point if exactly one stone was captured
    ko = totalCaptured === 1 ? Array.from(capturedGroups[0])[0] : null;

    // Switch players
    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    passes = 0;

    updateBoard();

    // AI move if it's white's turn
    if (currentPlayer === 'white') {
        setTimeout(aiMove, 500);
    }
}

function pass() {
    passes++;
    if (passes >= 2) {
        gameOver = true;
    } else {
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
        if (currentPlayer === 'white') {
            setTimeout(aiMove, 500);
        }
    }
    updateBoard();
}

function undo() {
    if (moveHistory.length === 0) return;

    const lastState = moveHistory.pop();
    board = lastState.board;
    currentPlayer = lastState.player;
    ko = lastState.ko;
    passes = 0;
    gameOver = false;

    updateBoard();
}

function resetGame() {
    board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
    currentPlayer = 'black';
    gameOver = false;
    passes = 0;
    ko = null;
    moveHistory = [];
    createBoard();
}

function changeBoardSize() {
    BOARD_SIZE = parseInt(document.getElementById('boardSize').value);
    resetGame();
}

function toggleDebug() {
    const debugMode = document.getElementById('debug').style.display !== 'block';
    document.getElementById('debug').style.display = debugMode ? 'block' : 'none';
    if (debugMode) {
        document.getElementById('debug').textContent =
            `Board Size: ${BOARD_SIZE}x${BOARD_SIZE}, Moves: ${moveHistory.length}`;
    }
}
