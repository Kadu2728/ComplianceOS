import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.models.profile import CustomerType, DataCategory, HeadcountBand, Segment, Tristate

ShortItem = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]


class ProfileUpdate(BaseModel):
    """Partial update; every field optional so the form can be filled in steps."""

    model_config = ConfigDict(extra="forbid")
    segment: Segment | None = None
    headcount_band: HeadcountBand | None = None
    customer_type: CustomerType | None = None
    data_categories: list[DataCategory] | None = None
    sells_to_enterprise: bool | None = None
    international_transfers: Tristate | None = None
    systems: list[ShortItem] | None = Field(default=None, max_length=20)
    processes: list[ShortItem] | None = Field(default=None, max_length=20)
    notes: Annotated[str, StringConstraints(max_length=2000)] | None = None


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    organization_id: uuid.UUID
    segment: Segment | None
    headcount_band: HeadcountBand | None
    customer_type: CustomerType | None
    data_categories: list[str]
    sells_to_enterprise: bool | None
    international_transfers: Tristate | None
    systems: list[str]
    processes: list[str]
    notes: str | None
    complete: bool
    updated_at: datetime
