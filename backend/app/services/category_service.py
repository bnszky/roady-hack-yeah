import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models import Category, CategoryStatus, Problem, ProblemStatus
from app.schemas.category import CategoryBase, CategoryRead, CategoryUpdate


class CategoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_all(self, status: CategoryStatus | None = None) -> list[CategoryRead]:
        problems_count = func.count(Problem.id).label("problems_count")
        stmt = (
            select(Category, problems_count)
            .outerjoin(Problem, Problem.category_id == Category.id)
            .group_by(Category.id)
            .order_by(Category.name)
        )
        if status is not None:
            stmt = stmt.where(Category.status == status)
        rows = (await self.db.execute(stmt)).all()
        return [self._to_read(category, count) for category, count in rows]

    async def get(self, category_id: uuid.UUID) -> Category:
        category = await self.db.get(Category, category_id)
        if category is None:
            raise NotFoundError("Category not found")
        return category

    async def get_read(self, category_id: uuid.UUID) -> CategoryRead:
        category = await self.get(category_id)
        return self._to_read(category, await self._problems_count(category_id))

    async def find_by_name(self, name: str) -> Category | None:
        stmt = select(Category).where(func.lower(Category.name) == name.strip().lower())
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def create(
        self, data: CategoryBase, status: CategoryStatus = CategoryStatus.APPROVED
    ) -> Category:
        if await self.find_by_name(data.name):
            raise ConflictError(f"Category '{data.name}' already exists")
        category = Category(**data.model_dump(), status=status)
        category.name = category.name.strip()
        self.db.add(category)
        await self.db.flush()
        return category

    async def create_read(self, data: CategoryBase) -> CategoryRead:
        category = await self.create(data)
        await self.db.commit()
        return await self.get_read(category.id)

    async def update(self, category_id: uuid.UUID, data: CategoryUpdate) -> CategoryRead:
        category = await self.get(category_id)
        changes = data.model_dump(exclude_unset=True)
        if "name" in changes:
            existing = await self.find_by_name(changes["name"])
            if existing and existing.id != category.id:
                raise ConflictError(f"Category '{changes['name']}' already exists")
            changes["name"] = changes["name"].strip()
        for field, value in changes.items():
            setattr(category, field, value)
        await self.db.commit()
        return await self.get_read(category_id)

    async def delete(self, category_id: uuid.UUID) -> None:
        category = await self.get(category_id)
        if await self._problems_count(category_id):
            raise ConflictError("Category has problems - reassign or reject it instead")
        await self.db.delete(category)
        await self.db.commit()

    async def approve(self, category_id: uuid.UUID) -> CategoryRead:
        category = await self.get(category_id)
        category.status = CategoryStatus.APPROVED
        await self.db.commit()
        return await self.get_read(category_id)

    async def reject(
        self, category_id: uuid.UUID, reassign_to_category_id: uuid.UUID | None
    ) -> CategoryRead:
        category = await self.get(category_id)
        if reassign_to_category_id is not None:
            if reassign_to_category_id == category_id:
                raise ValidationError("Cannot reassign problems to the rejected category")
            target = await self.get(reassign_to_category_id)
            if target.status != CategoryStatus.APPROVED:
                raise ValidationError("Target category must be approved")
            await self.db.execute(
                update(Problem)
                .where(Problem.category_id == category_id)
                .values(category_id=reassign_to_category_id)
            )
        else:
            await self.db.execute(
                update(Problem)
                .where(Problem.category_id == category_id)
                .values(status=ProblemStatus.REJECTED, status_note="Category rejected")
            )
        category.status = CategoryStatus.REJECTED
        await self.db.commit()
        return await self.get_read(category_id)

    async def _problems_count(self, category_id: uuid.UUID) -> int:
        stmt = select(func.count(Problem.id)).where(Problem.category_id == category_id)
        return (await self.db.execute(stmt)).scalar_one()

    @staticmethod
    def _to_read(category: Category, problems_count: int) -> CategoryRead:
        read = CategoryRead.model_validate(category)
        read.problems_count = problems_count
        return read
