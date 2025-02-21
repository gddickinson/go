# Go Game

A simple implementation of the ancient board game Go (also known as Weiqi, Baduk) with a graphical user interface built using PyQt5 and a basic AI opponent.

![Go Game Screenshot](https://raw.githubusercontent.com/username/go-game/main/screenshots/gameplay.png)

## Features

- Full implementation of Go game rules including:
  - Stone capture
  - Ko rule prevention
  - Territory scoring
  - Komi (6.5 points advantage for white)
- Simple GUI with:
  - Interactive board for placing stones
  - Game status display
  - Pass button for skipping turns
- AI opponent that makes random valid moves

## Requirements

- Python 3.6+
- PyQt5
- NumPy

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/username/go-game.git
   cd go-game
   ```

2. Install the required dependencies:
   ```
   pip install numpy pyqt5
   ```

## Usage

Run the main script to start the game:

```
python go_main.py
```

### Game Controls

- **Place a stone**: Click on an intersection on the board
- **Pass your turn**: Click the "Pass" button
- **End the game**: Both players pass consecutively

## Project Structure

- `go_game.py`: Core game logic and rules implementation
- `go_ai.py`: Simple AI implementation
- `go_gui.py`: GUI implementation using PyQt5
- `go_main.py`: Main entry point to run the application

## Game Rules

This implementation follows standard Go rules:

1. Players take turns placing stones on the intersections of the board
2. Black plays first
3. Stones that are completely surrounded by the opponent's stones are captured
4. The Ko rule prevents immediate recapture of a single stone
5. The game ends when both players pass consecutively
6. Territory is counted based on surrounded empty intersections
7. White receives a 6.5 point komi (compensation for black's first-move advantage)

## AI Implementation

The current AI implementation (`SimpleGoAI` class) makes random valid moves. This provides a basic opponent but isn't very challenging. Future improvements could include more sophisticated algorithms like Monte Carlo Tree Search.

## Future Enhancements

- Implement a stronger AI using techniques like MCTS or neural networks
- Add game history and the ability to review moves
- Support for different board sizes (9x9, 13x13, 19x19)
- Save/load game functionality
- Network play support
- Implement handicap stones for balanced gameplay

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The rules of Go are based on standard Japanese rules
- Thanks to the PyQt5 team for the excellent GUI framework
- Inspired by the rich history of Go spanning over 2,500 years
