"""E-mail sending abstraction (decision D11).

`ConsoleEmailSender` (development) logs, `CapturingEmailSender` (tests) records, `SmtpEmailSender`
delivers through any provider's SMTP relay — the vendor choice stays open (D11) while the
production path already exists. Sending happens inside the service transaction, so a delivery
failure rolls the invitation / reset token back instead of leaving a row nobody was told about.
"""

import logging
import smtplib
import ssl
from dataclasses import dataclass, field
from email.message import EmailMessage as MimeMessage
from typing import Literal, Protocol

from app.core.config import get_settings

logger = logging.getLogger(__name__)

SmtpSecurity = Literal["starttls", "ssl", "none"]


class EmailDeliveryError(Exception):
    """The provider refused or could not be reached; mapped to 503 by the error handlers."""


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


@dataclass(frozen=True)
class SmtpEmailSender:
    """Plain-text messages over SMTP. `security` mirrors what relays offer: STARTTLS on 587
    (default), implicit TLS on 465, or none for a local relay. Credentials are optional."""

    host: str
    port: int
    sender: str
    username: str | None = None
    password: str | None = None
    security: SmtpSecurity = "starttls"
    timeout: float = 10.0

    def build(self, message: EmailMessage) -> MimeMessage:
        mime = MimeMessage()
        mime["From"] = self.sender
        mime["To"] = message.to
        mime["Subject"] = message.subject
        mime.set_content(message.text)
        return mime

    def send(self, message: EmailMessage) -> None:
        mime = self.build(message)
        try:
            if self.security == "ssl":
                client = smtplib.SMTP_SSL(
                    self.host, self.port, timeout=self.timeout, context=ssl.create_default_context()
                )
            else:
                client = smtplib.SMTP(self.host, self.port, timeout=self.timeout)
            with client:
                if self.security == "starttls":
                    client.starttls(context=ssl.create_default_context())
                if self.username:
                    client.login(self.username, self.password or "")
                client.send_message(mime)
        except (smtplib.SMTPException, OSError) as exc:
            # The exception text may echo the relay's banner; log it, never return it.
            logger.error("email delivery failed to=%s error=%s", message.to, type(exc).__name__)
            raise EmailDeliveryError from exc
        logger.info("email sent to=%s subject=%s", message.to, message.subject)


_sender: EmailSender | None = None


def build_sender() -> EmailSender:
    s = get_settings()
    if s.email_provider == "capture":
        return CapturingEmailSender()
    if s.email_provider == "smtp":
        return SmtpEmailSender(
            host=s.smtp_host,
            port=s.smtp_port,
            sender=s.smtp_from,
            username=s.smtp_username,
            password=s.smtp_password,
            security=s.smtp_security,
            timeout=s.smtp_timeout_seconds,
        )
    return ConsoleEmailSender()


def get_email_sender() -> EmailSender:
    global _sender
    if _sender is None:
        _sender = build_sender()
    return _sender


def set_email_sender(sender: EmailSender | None) -> None:
    global _sender
    _sender = sender
