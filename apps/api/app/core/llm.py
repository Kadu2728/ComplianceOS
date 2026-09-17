"""Language-model provider abstraction (decision D35).

`DisabledProvider` (default) keeps the Compliance Agent deterministic; `AnthropicProvider` calls
the Claude API through the official SDK; `FakeProvider` records requests and returns canned
outputs for tests. A provider only transports text: what goes in and what comes out is decided
in `services/agent_llm.py`, which owns the data boundary and the guardrails (docs/ai.md).
"""

import logging
from dataclasses import dataclass, field
from typing import Any, Protocol

import anthropic

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class LLMError(Exception):
    """The provider is disabled, unreachable, over quota or misbehaving. The message is a short
    machine code (never provider text), safe to store in the audit log and to log."""


@dataclass(frozen=True)
class LLMRequest:
    system: str
    user: str
    schema: dict[str, Any]  # JSON schema the completion must satisfy
    max_tokens: int


@dataclass(frozen=True)
class LLMResponse:
    text: str
    model: str
    stop_reason: str
    input_tokens: int
    output_tokens: int
    request_id: str | None = None


class LLMProvider(Protocol):
    enabled: bool
    model: str | None

    def complete(self, request: LLMRequest) -> LLMResponse: ...


class DisabledProvider:
    enabled = False
    model = None

    def complete(self, request: LLMRequest) -> LLMResponse:
        raise LLMError("disabled")


@dataclass
class FakeProvider:
    """Test double: returns `outputs` in order (the last one repeats) and keeps every request so
    tests can assert on what would have been sent to a real model."""

    outputs: list[str]
    stop_reason: str = "end_turn"
    model: str | None = "fake-model"
    error: str | None = None
    enabled: bool = True
    requests: list[LLMRequest] = field(default_factory=list)

    def complete(self, request: LLMRequest) -> LLMResponse:
        self.requests.append(request)
        if self.error:
            raise LLMError(self.error)
        text = self.outputs[min(len(self.requests), len(self.outputs)) - 1]
        return LLMResponse(
            text=text,
            model=self.model or "fake-model",
            stop_reason=self.stop_reason,
            input_tokens=len(request.system) // 4 + len(request.user) // 4,
            output_tokens=len(text) // 4,
            request_id="fake-request",
        )


class AnthropicProvider:
    """Claude through the official SDK. One request per question, no conversation state, no
    caching across organizations (the only cacheable block is the static system prompt)."""

    enabled = True

    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        effort: str,
        timeout: float,
        base_url: str | None = None,
        client: anthropic.Anthropic | None = None,
    ) -> None:
        self.model: str | None = model
        self._effort = effort
        # `client` is injected by tests; production always builds the real one.
        self._client = client or anthropic.Anthropic(
            api_key=api_key, base_url=base_url, timeout=timeout, max_retries=1
        )

    def complete(self, request: LLMRequest) -> LLMResponse:
        try:
            response = self._client.messages.create(
                model=self.model or "",
                max_tokens=request.max_tokens,
                system=[
                    {
                        "type": "text",
                        "text": request.system,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                messages=[{"role": "user", "content": request.user}],
                output_config={
                    "effort": self._effort,
                    "format": {"type": "json_schema", "schema": request.schema},
                },
            )
        except anthropic.RateLimitError as exc:
            raise LLMError("provider_rate_limited") from exc
        except anthropic.APIStatusError as exc:
            # Provider messages may echo request details; keep only the status.
            logger.warning("llm provider status=%s", exc.status_code)
            raise LLMError(f"provider_status_{exc.status_code}") from exc
        except anthropic.APIConnectionError as exc:  # includes timeouts
            raise LLMError("provider_unreachable") from exc
        text = "".join(block.text for block in response.content if block.type == "text")
        return LLMResponse(
            text=text,
            model=response.model,
            stop_reason=response.stop_reason or "end_turn",
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
            request_id=response._request_id,
        )


_provider: LLMProvider | None = None


def build_provider() -> LLMProvider:
    s = get_settings()
    if s.llm_provider == "anthropic":
        return AnthropicProvider(
            api_key=s.anthropic_api_key or "",
            model=s.llm_model,
            effort=s.llm_effort,
            timeout=s.llm_timeout_seconds,
            base_url=s.llm_base_url,
        )
    return DisabledProvider()


def get_llm_provider() -> LLMProvider:
    global _provider
    if _provider is None:
        _provider = build_provider()
    return _provider


def set_llm_provider(provider: LLMProvider | None) -> None:
    global _provider
    _provider = provider
