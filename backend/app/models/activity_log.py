"""
ActivityLog model — records every meaningful action in the system.
"""
import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class ActivityAction(str, enum.Enum):
    VIDEO_UPLOADED = "video_uploaded"
    THUMBNAIL_UPLOADED = "thumbnail_uploaded"
    DRAFT_SAVED = "draft_saved"
    POST_SCHEDULED = "post_scheduled"
    POST_PUBLISHED = "post_published"
    POST_FAILED = "post_failed"
    POST_DELETED = "post_deleted"
    POST_CANCELLED = "post_cancelled"
    POST_RETRIED = "post_retried"
    ACCOUNT_CONNECTED = "account_connected"
    ACCOUNT_DISCONNECTED = "account_disconnected"
    USER_REGISTERED = "user_registered"
    PASSWORD_RESET = "password_reset"
    SETTINGS_UPDATED = "settings_updated"


class ActivityLog(Base, TimestampMixin):
    __tablename__ = "activity_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action: Mapped[ActivityAction] = mapped_column(
        Enum(ActivityAction, name="activity_action_enum"), nullable=False, index=True
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    resource_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    resource_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Relationship
    user = relationship("User", back_populates="activity_logs")

    def __repr__(self) -> str:
        return f"<ActivityLog id={self.id} action={self.action}>"
