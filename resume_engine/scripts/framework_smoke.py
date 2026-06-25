"""CI smoke: framework quickstarts compile and core adapters import."""

from __future__ import annotations

import ast
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXAMPLES = ROOT / "resume_engine" / "examples"


def check_syntax(path: Path) -> None:
    ast.parse(path.read_text(encoding="utf-8"), filename=str(path))


def main() -> int:
    for name in ("partner_plain_python.py", "partner_langgraph.py", "partner_crewai.py"):
        path = EXAMPLES / name
        if not path.is_file():
            print(f"FAIL  missing {path}")
            return 1
        check_syntax(path)
        print(f"OK    syntax {name}")

    from resume_engine import ResumeEngine  # noqa: F401
    from resume_engine.storage.remote_backend import RemoteCheckpointStore  # noqa: F401

    print("OK    resume_engine + RemoteCheckpointStore")

    from resume_engine.adapters.langgraph_adapter import wrap_langgraph_node  # noqa: F401
    from resume_engine.adapters.crewai_adapter import wrap_crewai_task  # noqa: F401

    print("OK    langgraph + crewai adapters")
    return 0


if __name__ == "__main__":
    sys.exit(main())
