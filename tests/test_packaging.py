"""pyproject.toml must name an importable build backend and list the modules, so `pip install .` works."""
import importlib
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def test_build_backend_importable_and_modules_exist():
    meta = tomllib.loads((ROOT / "pyproject.toml").read_text())
    backend = meta["build-system"]["build-backend"]
    importlib.import_module(backend.split(":")[0])
    for mod in meta["tool"]["setuptools"]["py-modules"]:
        assert (ROOT / f"{mod}.py").exists(), mod
