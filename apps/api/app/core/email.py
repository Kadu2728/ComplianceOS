"""E-mail sending abstraction (decision D11). Production provider is not chosen yet."""

import logging
from dataclasses import dataclass, field
from typing import Protocol

from app.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class EmailMessage:
    to: str
    subject: str
    text: str


class EmailSender(Protocol):
    def send(self, message: EmailMessage) -> None: ...


class ConsoleEmailSender:
    def send(self, message: EmailMessage) -> None:
        # Never log the body in production: reset/invitation links are secrets.
        logger.info("email to=%s subject=%s", message.to, message.subject)
        if get_settings().app_env != "production":
            logger.info("email body:\n%s", message.text)


@dataclass
class CapturingEmailSender:
    sent: list[EmailMessage] = field(default_factory=list)

    def send(self, message: EmailMessage) -> None:
        self.sent.append(message)


_sender: EmailSender | None = None


def get_email_sender() -> EmailSender:
    global _sender
    if _sender is None:
        provider = get_settings().email_provider
        _sender = CapturingEmailSender() if provider == "capture" else ConsoleEmailSender()
    return _sender


def set_email_sender(sender: EmailSender | None) -> None:
    global _sender
    _sender = sender
