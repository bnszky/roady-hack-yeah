from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String, Text, false
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin, str_enum
from app.models.enums import CategoryStatus

if TYPE_CHECKING:
    from app.models.problem import Problem


class Category(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    icon: Mapped[str] = mapped_column(
        String(64), nullable=False, default="circle-alert", server_default="circle-alert"
    )
    description: Mapped[str | None] = mapped_column(Text)
    # Whether users are asked how severe the problem is (1-5).
    is_importance_level_required: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=false()
    )
    status: Mapped[CategoryStatus] = mapped_column(
        str_enum(CategoryStatus, 16),
        nullable=False,
        default=CategoryStatus.APPROVED,
        server_default=CategoryStatus.APPROVED.value,
        index=True,
    )

    problems: Mapped[list["Problem"]] = relationship(back_populates="category")
