"""
AnalyticsCache model — stores 24-hour social insights & analytics cache directly in PostgreSQL Cache DB.
Independent of primary DB foreign keys for seamless cross-database caching.
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, TimestampMixin


class AnalyticsCache(Base, TimestampMixin):
    __tablename__ = "analytics_cache"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    cache_key: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    data: Mapped[dict] = mapped_column(JSON, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    def __repr__(self) -> str:
        return f"<AnalyticsCache key={self.cache_key} user={self.user_id}>"
