import sys
from PyQt5.QtWidgets import QApplication
from go_gui import GoWindow

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = GoWindow()
    window.show()
    sys.exit(app.exec_())
