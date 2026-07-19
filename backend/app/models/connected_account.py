"""
ConnectedAccount model — stores OAuth tokens per platform per user.
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin
from app.models.scheduled_post import Platform


class ConnectedAccount(Base, TimestampMixin):
    __tablename__ = "connected_accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        __import__("sqlalchemy.dialects.postgresql", fromlist=["UUID"]).UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        __import__("sqlalchemy.dialects.postgresql", fromlist=["UUID"]).UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    platform: Mapped[Platform] = mapped_column(
        Enum(Platform, name="platform_enum"), nullable=False
    )
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    platform_user_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scopes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)

    # Relationship
    user = relationship("User", back_populates="connected_accounts")
    scheduled_posts = relationship("ScheduledPost", back_populates="connected_account", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<ConnectedAccount id={self.id} platform={self.platform} user={self.user_id}>"
