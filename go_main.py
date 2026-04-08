"""Entry point for the Go game application."""

import sys

def main():
    """Launch the Go game GUI."""
    try:
        from PyQt5.QtWidgets import QApplication
    except ImportError:
        print("Error: PyQt5 is required. Install with: pip install PyQt5")
        sys.exit(1)

    from go_gui import GoWindow

    app = QApplication(sys.argv)
    window = GoWindow()
    window.show()
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
