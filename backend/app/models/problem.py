import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, Text, true
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin, str_enum
from app.models.enums import ProblemStatus

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.problem_report import ProblemReport


class Problem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A single real-world problem at a location; aggregates all reports about it."""

    __tablename__ = "problems"
    __table_args__ = (Index("ix_problems_lat_lng", "latitude", "longitude"),)

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    status: Mapped[ProblemStatus] = mapped_column(
        str_enum(ProblemStatus, 16),
        nullable=False,
        default=ProblemStatus.NEW,
        server_default=ProblemStatus.NEW.value,
        index=True,
    )
    status_note: Mapped[str | None] = mapped_column(Text)

    # Aggregates recomputed from reports on every new report.
    is_observable: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=true(), index=True
    )
    reports_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    confirmations_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0", index=True
    )
    denials_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    consecutive_denials: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    importance_level_average: Mapped[float | None] = mapped_column(Float, index=True)
    first_reported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )

    category: Mapped["Category"] = relationship(back_populates="problems", lazy="joined")
    reports: Mapped[list["ProblemReport"]] = relationship(
        back_populates="problem",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="desc(ProblemReport.reported_at)",
    )
