"""Compliance Agent language-model layer (D35): grounding, guardrails, fallback, data boundary
and rate limits — with a fake provider, so no network and no cost."""

import json
from datetime import date, timedelta

import pytest

from app.core.config import get_settings
from app.core.llm import FakeProvider, set_llm_provider
from tests.conftest import invite_and_accept, make_client, signup
from tests.test_insights import SHORT


def _draft(answer: str, refs: list[dict[str, str]] | None = None, **flags) -> str:  # noqa: ANN003
    return json.dumps(
        {
            "answer": answer,
            "refs": refs or [],
            "interpretation": flags.get("interpretation", False),
            "out_of_scope": flags.get("out_of_scope", False),
        }
    )


@pytest.fixture
def world(emails):  # noqa: ANN001, ANN201
    """Owner + member (no audit.read), a short diagnostic with one crítico (AA-03) that has an
    overdue action, and a second organization for the boundary checks."""
    owner = make_client()
    oid = signup(owner, email="owner@acme.com.br")["org_id"]
    member = invite_and_accept(owner, oid, emails, email="member@acme.com.br", role="member")
    base = f"/api/v1/orgs/{oid}"
    owner.post(f"{base}/assessment/start", json={"mode": "short"})
    for code in SHORT:
        owner.put(
            f"{base}/assessment/answers/{code}", json={"value": "nao" if code == "AA-03" else "sim"}
        )
    owner.post(f"{base}/assessment/complete")
    risks = {r["origin_question_code"]: r for r in owner.get(f"{base}/risks").json()["items"]}
    action = owner.post(
        f"{base}/actions",
        json={
            "title": "Ativar MFA no e-mail",
            "risk_id": risks["AA-03"]["id"],
            "due_date": (date.today() - timedelta(days=3)).isoformat(),
        },
    ).json()
    other = make_client()
    other_org = signup(other, email="outsider@outra.com.br")["org_id"]
    return {
        "owner": owner,
        "member": member,
        "base": base,
        "risk": risks["AA-03"],
        "action": action,
        "other": other,
        "other_base": f"/api/v1/orgs/{other_org}",
    }


def test_disabled_provider_serves_canonical_questions_only(world) -> None:  # noqa: ANN001
    o, base = world["owner"], world["base"]
    status = o.get(f"{base}/agent/status").json()
    assert status == {"free_text": False, "model": None, "question_max_length": 500}
    # Canonical text (accents and punctuation ignored) → the deterministic answer, no model.
    r = o.post(f"{base}/agent/ask", json={"question": "quais sao meus maiores riscos"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["source"] == "deterministic" and body["model"] is None
    assert any(ref["id"] == world["risk"]["id"] for ref in body["basis"])
    # Anything else needs the model.
    r = o.post(f"{base}/agent/ask", json={"question": "Qual risco tem prazo mais próximo?"})
    assert r.status_code == 503
    assert "não está habilitado" in r.json()["message"]


def test_grounded_answer_keeps_only_refs_from_the_bundle_and_audits(world) -> None:  # noqa: ANN001
    o, base, risk, action = world["owner"], world["base"], world["risk"], world["action"]
    fake = FakeProvider(
        outputs=[
            _draft(
                "Comece pelo risco de acesso: a ação de MFA está atrasada.",
                refs=[
                    {"kind": "risk", "id": risk["id"]},
                    {"kind": "action", "id": action["id"]},
                    {"kind": "risk", "id": "00000000-0000-0000-0000-000000000000"},
                    {"kind": "risk", "id": risk["id"]},  # duplicate
                ],
                interpretation=True,
            )
        ]
    )
    set_llm_provider(fake)
    assert o.get(f"{base}/agent/status").json()["free_text"] is True

    r = o.post(f"{base}/agent/ask", json={"question": "Por onde eu começo?"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["source"] == "model" and body["model"] == "fake-model"
    assert body["interpretation"] is True and body["out_of_scope"] is False
    assert [(b["kind"], b["title"]) for b in body["basis"]] == [
        ("risk", risk["title"]),
        ("action", "Ativar MFA no e-mail"),
    ]
    assert "operacional" in body["caveat"].lower() or "jurídic" in body["caveat"].lower()

    # What the model saw: the static system prompt, the bundle and the question — no e-mails.
    req = fake.requests[0]
    assert "<dados_da_organizacao>" in req.user and "<pergunta>\nPor onde eu começo?" in req.user
    assert "owner@acme.com.br" not in req.user and "member@acme.com.br" not in req.user
    assert risk["title"] in req.user
    assert req.schema["required"] == ["answer", "refs", "interpretation", "out_of_scope"]
    assert req.max_tokens == get_settings().llm_max_output_tokens

    # One audit row per question: outcome and counters, never the answer text.
    log = o.get(f"{base}/audit-log?limit=5").json()["items"]
    entry = next(e for e in log if e["action"] == "agent.asked")
    assert entry["data"]["outcome"] == "answered" and entry["data"]["refs"] == 2
    assert entry["data"]["question"] == "Por onde eu começo?"
    assert "Comece pelo risco" not in json.dumps(entry)


def test_member_bundle_has_no_activity_feed(world) -> None:  # noqa: ANN001
    """The bundle is built inside the caller's permissions: roles without audit.read never send
    the activity feed to the model (same rule as GET /agent/context)."""
    fake = FakeProvider(outputs=[_draft("ok")])
    set_llm_provider(fake)
    world["member"].post(f"{world['base']}/agent/ask", json={"question": "O que fazer hoje?"})
    world["owner"].post(f"{world['base']}/agent/ask", json={"question": "O que fazer hoje?"})
    member_bundle = json.loads(
        fake.requests[0].user.split("<dados_da_organizacao>\n")[1].split("\n</dados")[0]
    )
    owner_bundle = json.loads(
        fake.requests[1].user.split("<dados_da_organizacao>\n")[1].split("\n</dados")[0]
    )
    assert member_bundle["recent_activity"] is None
    assert isinstance(owner_bundle["recent_activity"], list) and owner_bundle["recent_activity"]


def test_forbidden_claim_is_rejected_and_falls_back_when_possible(world) -> None:  # noqa: ANN001
    o, base = world["owner"], world["base"]
    set_llm_provider(FakeProvider(outputs=[_draft("A empresa está em conformidade com a LGPD.")]))
    # Free text: nothing to fall back to → 503, audited as rejected.
    r = o.post(f"{base}/agent/ask", json={"question": "Estamos bem?"})
    assert r.status_code == 503
    entry = next(
        e
        for e in o.get(f"{base}/audit-log?limit=5").json()["items"]
        if e["action"] == "agent.asked"
    )
    assert entry["data"]["outcome"] == "rejected_claim"
    # Canonical question: the deterministic answer replaces the rejected one.
    r = o.post(f"{base}/agent/ask", json={"question": "Quais riscos estão sem ação?"})
    assert r.status_code == 200 and r.json()["source"] == "deterministic"


@pytest.mark.parametrize(
    ("provider", "outcome"),
    [
        (FakeProvider(outputs=["not json"]), "invalid_output"),
        (FakeProvider(outputs=[_draft("x")], stop_reason="refusal"), "refused"),
        (FakeProvider(outputs=[_draft("x")], stop_reason="max_tokens"), "truncated"),
        (
            FakeProvider(outputs=[_draft("x")], error="provider_unreachable"),
            "error_provider_unreachable",
        ),
    ],
)
def test_provider_failures_degrade_gracefully(world, provider, outcome) -> None:  # noqa: ANN001
    o, base = world["owner"], world["base"]
    set_llm_provider(provider)
    r = o.post(f"{base}/agent/ask", json={"question": "Qual é o risco mais urgente?"})
    assert r.status_code == 503
    assert r.json()["code"] == "error"
    entry = next(
        e
        for e in o.get(f"{base}/audit-log?limit=5").json()["items"]
        if e["action"] == "agent.asked"
    )
    assert entry["data"]["outcome"] == outcome


def test_focus_record_is_tenant_scoped(world) -> None:  # noqa: ANN001
    o, base, risk = world["owner"], world["base"], world["risk"]
    fake = FakeProvider(
        outputs=[_draft("Este risco importa porque…", refs=[{"kind": "risk", "id": risk["id"]}])]
    )
    set_llm_provider(fake)
    focus = {"kind": "risk", "id": risk["id"]}
    r = o.post(
        f"{base}/agent/ask", json={"question": "Por que este risco importa?", "focus": focus}
    )
    assert r.status_code == 200, r.text
    assert r.json()["basis"][0]["id"] == risk["id"]
    bundle = json.loads(
        fake.requests[0].user.split("<dados_da_organizacao>\n")[1].split("\n</dados")[0]
    )
    assert (
        bundle["focus"]["title"] == risk["title"]
        and bundle["focus"]["open_actions"][0]["title"] == "Ativar MFA no e-mail"
    )
    entry = next(
        e
        for e in o.get(f"{base}/audit-log?limit=5").json()["items"]
        if e["action"] == "agent.asked"
    )
    assert entry["entity_type"] == "risk" and entry["entity_id"] == risk["id"]
    # Another organization's risk id: 404, and the model is never called.
    r = world["other"].post(
        f"{world['other_base']}/agent/ask", json={"question": "Explique este risco", "focus": focus}
    )
    assert r.status_code == 404 and len(fake.requests) == 1


def test_question_validation_and_rate_limit(world) -> None:  # noqa: ANN001
    o, base = world["owner"], world["base"]
    set_llm_provider(FakeProvider(outputs=[_draft("ok")]))
    assert o.post(f"{base}/agent/ask", json={"question": "a"}).status_code == 422
    assert o.post(f"{base}/agent/ask", json={"question": "x" * 501}).status_code == 422
    assert (
        o.post(
            f"{base}/agent/ask",
            json={"question": "ok?", "focus": {"kind": "document", "id": world["risk"]["id"]}},
        ).status_code
        == 422
    )
    limit = get_settings().llm_user_minute_limit
    codes = [
        o.post(f"{base}/agent/ask", json={"question": f"Pergunta {i}?"}).status_code
        for i in range(limit + 1)
    ]
    assert codes[:limit] == [200] * limit and codes[limit] == 429


# --- provider adapter: request shape and error mapping, with the SDK client stubbed ---------------


class _Usage:
    input_tokens = 321
    output_tokens = 45


class _Block:
    def __init__(self, type_: str, text: str = "") -> None:
        self.type = type_
        self.text = text
        self.thinking = ""


class _Message:
    def __init__(self) -> None:
        self.content = [_Block("thinking"), _Block("text", '{"answer":"ok","refs":[],')]
        self.content.append(_Block("text", '"interpretation":false,"out_of_scope":false}'))
        self.model = "claude-opus-5"
        self.stop_reason = "end_turn"
        self.usage = _Usage()
        self._request_id = "req_123"


class _Messages:
    def __init__(self, error: Exception | None = None) -> None:
        self.calls: list[dict] = []
        self.error = error

    def create(self, **kwargs):  # noqa: ANN003, ANN201
        self.calls.append(kwargs)
        if self.error:
            raise self.error
        return _Message()


class _Client:
    def __init__(self, error: Exception | None = None) -> None:
        self.messages = _Messages(error)


def test_anthropic_provider_request_shape_and_text_blocks() -> None:
    from app.core.llm import AnthropicProvider, LLMRequest

    client = _Client()
    provider = AnthropicProvider(
        api_key="k",
        model="claude-opus-5",
        effort="medium",
        timeout=5.0,
        client=client,  # type: ignore[arg-type]
    )
    out = provider.complete(
        LLMRequest(system="S", user="U", schema={"type": "object"}, max_tokens=99)
    )
    call = client.messages.calls[0]
    assert call["model"] == "claude-opus-5" and call["max_tokens"] == 99
    assert call["system"] == [{"type": "text", "text": "S", "cache_control": {"type": "ephemeral"}}]
    assert call["messages"] == [{"role": "user", "content": "U"}]
    assert call["output_config"] == {
        "effort": "medium",
        "format": {"type": "json_schema", "schema": {"type": "object"}},
    }
    # Thinking blocks are skipped; text blocks are joined.
    assert json.loads(out.text)["answer"] == "ok"
    assert (out.model, out.stop_reason, out.input_tokens, out.output_tokens, out.request_id) == (
        "claude-opus-5",
        "end_turn",
        321,
        45,
        "req_123",
    )


def test_anthropic_provider_maps_sdk_errors_to_short_codes() -> None:
    import anthropic
    import httpx2

    from app.core.llm import AnthropicProvider, LLMError, LLMRequest

    request = httpx2.Request("POST", "https://api.anthropic.com/v1/messages")
    cases = [
        (
            anthropic.RateLimitError(
                "slow down", response=httpx2.Response(429, request=request), body=None
            ),
            "provider_rate_limited",
        ),
        (
            anthropic.APIStatusError(
                "boom", response=httpx2.Response(529, request=request), body=None
            ),
            "provider_status_529",
        ),
        (anthropic.APIConnectionError(request=request), "provider_unreachable"),
    ]
    for error, code in cases:
        provider = AnthropicProvider(
            api_key="k",
            model="m",
            effort="low",
            timeout=5.0,
            client=_Client(error),  # type: ignore[arg-type]
        )
        with pytest.raises(LLMError, match=code):
            provider.complete(LLMRequest(system="S", user="U", schema={}, max_tokens=1))
