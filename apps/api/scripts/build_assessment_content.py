"""Build the seed content for assessment template v1 from the product draft.

Source of truth for wording: docs/product/assessment-v1-scope.md §13 (Product Strategist draft).
Output: apps/api/app/content/assessment_v1.json — the file the seed loads. Regulatory fields stay
null until the Compliance Researcher pass (docs/regulatory/sources-v1.md); the UI must not show a
legal basis while they are null. `[VERIFY]` markers are stripped from help text for display but the
flag `needs_verification` is kept so the product can label the content as unverified.

Usage: uv run python scripts/build_assessment_content.py
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "docs" / "product" / "assessment-v1-scope.md"
OUT = ROOT / "apps" / "api" / "app" / "content" / "assessment_v1.json"

SECTION_RE = re.compile(r"^### Seção (\d) — (.+)$")
HEAD_RE = re.compile(r"^\*\*([A-Z]{2}-\d{2})\*\*(?: · (curto))? · I=(\d)$")
ERA_RE = re.compile(r'^E: (?P<e>.+?) · R: "(?P<r>.+?)" \((?P<c>[a-z]+)\) · A: "(?P<a>.+?)"\.?$')


def main() -> int:
    text = SRC.read_text(encoding="utf-8")
    body = text.split("## 13. Draft question bank v1")[1].split("Totals:")[0]
    sections: list[dict] = []
    questions: list[dict] = []
    section_id = 0
    order = 0
    lines = body.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if m := SECTION_RE.match(line):
            section_id = int(m.group(1))
            order = 0
            sections.append({"id": section_id, "name": m.group(2).strip()})
        elif m := HEAD_RE.match(line):
            code, short, impact = m.group(1), bool(m.group(2)), int(m.group(3))
            pergunta = lines[i + 1].strip().removeprefix("Pergunta: ")
            porque = lines[i + 2].strip().removeprefix("Por que importa: ")
            era = ERA_RE.match(lines[i + 3].strip())
            assert era, f"{code}: cannot parse E/R/A line: {lines[i + 3]!r}"
            order += 1
            needs_verification = "[VERIFY]" in porque
            help_text = re.sub(r"\s*`?\[VERIFY\]`?", "", porque).strip()
            questions.append(
                {
                    "code": code,
                    "section": section_id,
                    "order": order,
                    "text": pergunta,
                    "help_text": help_text,
                    "needs_verification": needs_verification,
                    "answer_type": "scale_v1",
                    "short_mode": short,
                    "impact": impact,
                    "weight": 3 if impact == 4 else 2 if impact == 3 else 1,
                    "expected_evidence": era.group("e").rstrip("."),
                    "derived_risk_title": era.group("r"),
                    "derived_risk_category": era.group("c"),
                    "remediation_action_title": era.group("a"),
                    "regulatory_basis": None,
                    "classification": None,
                }
            )
            i += 3
        i += 1
    assert len(questions) == 42, len(questions)
    assert sum(q["short_mode"] for q in questions) == 12
    assert len(sections) == 7
    content = {
        "template_code": "lgpd-smb",
        "version": 1,
        "title": "Diagnóstico de proteção de dados — v1",
        "content_source": "docs/product/assessment-v1-scope.md §13",
        "regulatory_register": "docs/regulatory/sources-v1.md",
        "last_verified": None,
        "changelog": (
            "Initial draft. Regulatory basis pending Compliance Researcher pass "
            "and human legal review."
        ),
        "sections": sections,
        "questions": questions,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT} ({len(questions)} questions, {len(sections)} sections)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
