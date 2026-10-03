from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.assistant import (
    ReportDraft,
    ReportDraftRequest,
    ResponseDraft,
    ResponseDraftRequest,
)
from app.services.assistant_service import AssistantService

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/report-draft", response_model=ReportDraft, summary="Voice report -> draft")
async def report_draft(data: ReportDraftRequest, db: DbSession) -> ReportDraft:
    """Matches spoken text to a category (or proposes a new one). Nothing is saved - after the
    user confirms, submit `POST /problems`; otherwise let them rephrase and call again.
    """
    return await AssistantService(db).report_draft(data)


@router.post("/response-draft", response_model=ResponseDraft, summary="Voice answer -> draft")
async def response_draft(data: ResponseDraftRequest, db: DbSession) -> ResponseDraft:
    """Interprets a spoken YES/NO (+ severity) answer.

    Submit via `POST /problems/{id}/responses` after the user confirms.
    """
    return await AssistantService(db).response_draft(data)
