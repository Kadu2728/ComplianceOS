from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


@lru_cache
def get_engine() -> Engine:
    """Engine is built lazily so the application imports and serves /health without a DB."""
    url = get_settings().database_url
    if not url:
        raise RuntimeError("DATABASE_URL is not configured.")
    return create_engine(url, pool_pre_ping=True)


def get_db() -> Generator[Session, None, None]:
    factory = sessionmaker(bind=get_engine(), autoflush=False, expire_on_commit=False)
    db = factory()
    try:
        yield db
    finally:
        db.close()
