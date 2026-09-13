"""Write the OpenAPI document to apps/api/openapi.json.

The web app generates TypeScript types from this file (`npm run gen:api`).
CI fails when the checked-in file is stale, so contract drift is caught at build time.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.main import app  # noqa: E402

OUT = ROOT / "openapi.json"


def main() -> int:
    check = "--check" in sys.argv
    document = json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n"
    if check:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current != document:
            print(f"{OUT} is out of date. Run: uv run python scripts/export_openapi.py")
            return 1
        print("openapi.json is up to date")
        return 0
    OUT.write_text(document, encoding="utf-8", newline="\n")
    print(f"wrote {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
