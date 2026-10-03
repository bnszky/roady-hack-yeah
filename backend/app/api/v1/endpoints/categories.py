import uuid

from fastapi import APIRouter
from fastapi import status as http_status

from app.api.deps import DbSession
from app.models import CategoryStatus
from app.schemas.category import CategoryCreate, CategoryRead, CategoryReject, CategoryUpdate
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryRead], summary="List categories")
async def list_categories(
    db: DbSession, status: CategoryStatus | None = None
) -> list[CategoryRead]:
    """Mobile: use `status=approved`. Admin: `status=pending` lists user proposals."""
    return await CategoryService(db).list_all(status)


@router.post(
    "",
    response_model=CategoryRead,
    status_code=http_status.HTTP_201_CREATED,
    summary="Create category (admin, approved immediately)",
)
async def create_category(data: CategoryCreate, db: DbSession) -> CategoryRead:
    return await CategoryService(db).create_read(data)


@router.get("/{category_id}", response_model=CategoryRead, summary="Get category")
async def get_category(category_id: uuid.UUID, db: DbSession) -> CategoryRead:
    return await CategoryService(db).get_read(category_id)


@router.patch("/{category_id}", response_model=CategoryRead, summary="Update category")
async def update_category(
    category_id: uuid.UUID, data: CategoryUpdate, db: DbSession
) -> CategoryRead:
    return await CategoryService(db).update(category_id, data)


@router.delete(
    "/{category_id}",
    status_code=http_status.HTTP_204_NO_CONTENT,
    summary="Delete category without problems",
)
async def delete_category(category_id: uuid.UUID, db: DbSession) -> None:
    await CategoryService(db).delete(category_id)


@router.post(
    "/{category_id}/approve", response_model=CategoryRead, summary="Approve proposed category"
)
async def approve_category(category_id: uuid.UUID, db: DbSession) -> CategoryRead:
    return await CategoryService(db).approve(category_id)


@router.post(
    "/{category_id}/reject", response_model=CategoryRead, summary="Reject proposed category"
)
async def reject_category(
    category_id: uuid.UUID, db: DbSession, data: CategoryReject | None = None
) -> CategoryRead:
    """Problems are moved to `reassign_to_category_id`, or marked as rejected if not given."""
    reassign = data.reassign_to_category_id if data else None
    return await CategoryService(db).reject(category_id, reassign)
