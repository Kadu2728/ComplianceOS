"""Organization profile — Compliance DNA v1 (decision D28).

Context the engine may use for prioritization, radar hints and the agent's answers. It never
decides whether a legal obligation applies (Compliance Researcher §9): every use is "com base no
seu perfil", never "a lei exige". One row per organization, created on first read.
"""

import enum
import uuid
from typing import Any

from sqlalchemy import Boolean, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import Timestamps, UUIDPrimaryKey


def _enum(cls: type[enum.StrEnum], name: str) -> Enum:
    return Enum(cls, name=name, values_callable=lambda e: [m.value for m in e])


class Segment(enum.StrEnum):
    SOFTWARE_SAAS = "software_saas"
    SERVICOS = "servicos"
    COMERCIO = "comercio"
    INDUSTRIA = "industria"
    SAUDE = "saude"
    EDUCACAO = "educacao"
    FINANCEIRO = "financeiro"
    OUTRO = "outro"


class HeadcountBand(enum.StrEnum):
    ATE_9 = "ate_9"
    DE_10_A_49 = "de_10_a_49"
    DE_50_A_199 = "de_50_a_199"
    ACIMA_DE_200 = "acima_de_200"


class CustomerType(enum.StrEnum):
    B2B = "b2b"
    B2C = "b2c"
    AMBOS = "ambos"


class Tristate(enum.StrEnum):
    SIM = "sim"
    NAO = "nao"
    NAO_SEI = "nao_sei"


class DataCategory(enum.StrEnum):
    CADASTRAIS = "cadastrais"
    CONTATO = "contato"
    FINANCEIROS = "financeiros"
    SAUDE = "saude"
    BIOMETRICOS = "biometricos"
    CRIANCAS_ADOLESCENTES = "criancas_adolescentes"
    GEOLOCALIZACAO = "geolocalizacao"
    COMPORTAMENTAIS = "comportamentais"
    CREDENCIAIS = "credenciais"


# Categories whose presence raises exposure for data/subject/security risks (D30).
SENSITIVE_DATA = frozenset(
    {
        DataCategory.SAUDE,
        DataCategory.BIOMETRICOS,
        DataCategory.CRIANCAS_ADOLESCENTES,
        DataCategory.FINANCEIROS,
        DataCategory.CREDENCIAIS,
    }
)


class OrganizationProfile(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "organization_profiles"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    segment: Mapped[Segment | None] = mapped_column(_enum(Segment, "org_segment"))
    headcount_band: Mapped[HeadcountBand | None] = mapped_column(
        _enum(HeadcountBand, "org_headcount_band")
    )
    customer_type: Mapped[CustomerType | None] = mapped_column(
        _enum(CustomerType, "org_customer_type")
    )
    data_categories: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    sells_to_enterprise: Mapped[bool | None] = mapped_column(Boolean)
    international_transfers: Mapped[Tristate | None] = mapped_column(
        _enum(Tristate, "org_tristate")
    )
    systems: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    processes: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    notes: Mapped[str | None] = mapped_column(Text)

    REQUIRED_FOR_COMPLETE = ("segment", "headcount_band", "customer_type", "sells_to_enterprise")

    @property
    def complete(self) -> bool:
        return all(getattr(self, f) is not None for f in self.REQUIRED_FOR_COMPLETE) and bool(
            self.data_categories
        )
