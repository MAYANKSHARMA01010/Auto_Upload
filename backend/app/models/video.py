"""
Video model — stores uploaded video and thumbnail metadata.
"""
import uuid

from sqlalchemy import BigInteger, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class Video(Base, TimestampMixin):
    __tablename__ = "videos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Storage paths
    video_url: Mapped[str] = mapped_column(Text, nullable=False)
    video_key: Mapped[str] = mapped_column(Text, nullable=False)  # R2 object key
    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_key: Mapped[str | None] = mapped_column(Text, nullable=True)

    # FFmpeg-extracted metadata
    duration: Mapped[float | None] = mapped_column(Float, nullable=True)       # seconds
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)          # px
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)         # px
    size: Mapped[int | None] = mapped_column(BigInteger, nullable=True)        # bytes
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    original_filename: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    user = relationship("User", back_populates="videos")
    scheduled_posts = relationship(
        "ScheduledPost", back_populates="video", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Video id={self.id} user_id={self.user_id}>"
