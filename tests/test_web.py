"""Web interface tests: every exported endpoint answers, the static build is complete, and the JS engine tests pass.

Run: python -m pytest -q tests/test_web.py
"""
import shutil
import subprocess
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from web.app import STATIC, STATIC_ENDPOINTS, app  # noqa: E402

client = TestClient(app)


def test_index_served():
    r = client.get("/")
    assert r.status_code == 200 and "static/main.js" in r.text


@pytest.mark.parametrize("path", STATIC_ENDPOINTS)
def test_endpoint(path):
    r = client.get("/api" + path)
    assert r.status_code == 200, r.text
    assert r.json() is not None


def test_static_build(tmp_path):
    sys.path.insert(0, str(ROOT / "scripts"))
    import build_static
    build_static.build(tmp_path / "site")
    assert (tmp_path / "site" / "index.html").read_text().count("APP_STATIC") == 1
    for path in STATIC_ENDPOINTS:
        assert (tmp_path / "site" / "api" / (path.strip("/") + ".json")).exists()


def test_static_assets_referenced_exist():
    html = (STATIC / "index.html").read_text()
    for name in ("style.css", "main.js"):
        assert f"static/{name}" in html and (STATIC / name).exists()


@pytest.mark.skipif(not shutil.which("node"), reason="node not installed")
def test_js_engine():
    tests = sorted(STATIC.glob("*.test.mjs"))
    for t in tests:
        r = subprocess.run(["node", str(t)], capture_output=True, text=True)
        assert r.returncode == 0, r.stdout + r.stderr


# --- project-specific ------------------------------------------------------------------------------------------------
def test_info_facts():
    d = client.get("/api/info").json()
    assert d["board_sizes"] == [9, 13, 19] and d["komi"] == 6.5


def test_demo_is_a_python_ai_game():
    from web.app import DEMO
    from web.go_record import ai_game
    d = client.get("/api/demo").json()
    assert d == ai_game(DEMO["size"], DEMO["seed"], DEMO["max_moves"])
    assert d["final"]["game_over"] and d["moves"][-2:] == [None, None] and len(d["moves"]) < DEMO["max_moves"]


def test_replay_ko_and_suicide():
    ko = [[1, 0], [2, 0], [0, 1], [3, 1], [1, 2], [2, 2], [2, 1], [1, 1], [2, 1]]
    r = client.post("/api/replay", json={"size": 5, "moves": ko}).json()
    assert r["results"][-1] is False and r["final"]["ko_point"] == [2, 1]
    r = client.post("/api/replay", json={"size": 9, "moves": [[4, 4], None, None, [0, 0]]}).json()
    assert r["results"] == [True, True, True, False] and r["final"]["game_over"] is True
    assert r["final"]["score"] == {"1": 80.0, "2": 6.5}


def test_replay_with_dead_stones():
    moves = [[2, 0], [3, 0], [2, 1], [3, 1], [2, 2], [3, 2], [2, 3], [3, 3], [2, 4], [3, 4], [0, 2], [0, 0], None, None]
    r = client.post("/api/replay", json={"size": 5, "moves": moves, "dead": [[0, 0]]}).json()
    assert r["dead_results"] == [True] and r["final"]["dead"] == [[0, 0]]
    assert r["final"]["score"] == {"1": 10.0, "2": 11.5}


def test_replay_rejects_bad_input():
    assert client.post("/api/replay", json={"size": 1, "moves": []}).status_code == 422
    assert client.post("/api/replay", json={"size": 9, "moves": [[1, 2, 3]]}).status_code == 400


def _close(a, b):
    if isinstance(a, dict):
        return a.keys() == b.keys() and all(_close(a[k], b[k]) for k in a)
    if isinstance(a, list):
        return len(a) == len(b) and all(_close(x, y) for x, y in zip(a, b))
    if isinstance(a, float) or isinstance(b, float):
        return abs(a - b) <= 1e-9 * max(1.0, abs(b))
    return a == b


def test_engine_fixture_is_current():
    """tests/fixtures/go_engine_fixtures.json must match what the Python code produces now."""
    import json
    sys.path.insert(0, str(ROOT / "scripts"))
    import make_engine_fixtures
    stored = json.loads(make_engine_fixtures.OUT.read_text())
    assert _close(make_engine_fixtures.build(), stored), "re-run python scripts/make_engine_fixtures.py"
