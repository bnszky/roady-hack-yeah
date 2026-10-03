import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    SmallInteger,
    Text,
    func,
    true,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPrimaryKeyMixin, str_enum
from app.models.enums import ReportSource

if TYPE_CHECKING:
    from app.models.problem import Problem


class ProblemReport(UUIDPrimaryKeyMixin, Base):
    """A single user submission: the initial report or a YES/NO confirmation."""

    __tablename__ = "problem_reports"
    __table_args__ = (
        CheckConstraint(
            "importance_level IS NULL OR importance_level BETWEEN 1 AND 5",
            name="ck_problem_reports_importance_level_range",
        ),
    )

    problem_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("problems.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # False = "the problem no longer exists" answer.
    is_observable: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=true()
    )
    importance_level: Mapped[int | None] = mapped_column(SmallInteger)
    description: Mapped[str | None] = mapped_column(Text)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    source: Mapped[ReportSource] = mapped_column(
        str_enum(ReportSource, 24),
        nullable=False,
        default=ReportSource.FORM,
        server_default=ReportSource.FORM.value,
    )
    transcript: Mapped[str | None] = mapped_column(Text)
    reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    problem: Mapped["Problem"] = relationship(back_populates="reports")
