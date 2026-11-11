"""Start the Go game web app locally: python run_web.py [--port 8160]  ->  http://127.0.0.1:8160"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import uvicorn  # noqa: E402

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--port", type=int, default=8160)
    ap.add_argument("--reload", action="store_true")
    a = ap.parse_args()
    print(f"Go game web app on http://127.0.0.1:{a.port}")
    uvicorn.run("web.app:app", host="127.0.0.1", port=a.port, reload=a.reload)
