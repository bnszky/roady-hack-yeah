import json
import logging
from datetime import UTC, datetime
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ExternalServiceError, ServiceNotConfiguredError
from app.models import CategoryStatus
from app.schemas.assistant import (
    ReportDraft,
    ReportDraftRequest,
    ResponseDraft,
    ResponseDraftRequest,
)
from app.schemas.category import CategoryProposal, CategoryRead
from app.schemas.problem import ProblemRead
from app.services.category_service import CategoryService
from app.services.problem_service import ProblemService

logger = logging.getLogger(__name__)

SUGGESTED_ICONS = [
    "arrow-up-down",
    "construction",
    "volume-x",
    "footprints",
    "triangle-alert",
    "accessibility",
    "ban",
    "traffic-cone",
    "lightbulb-off",
    "signpost",
    "car",
    "trash-2",
    "droplets",
    "snowflake",
    "tree-pine",
    "circle-alert",
]

REPORT_SYSTEM_PROMPT = """\
You are the assistant of Routy - an app where people with reduced mobility, blind and elderly \
users report accessibility problems in the city (broken elevators, holes, missing sound at \
traffic lights, etc.). The user describes a problem by voice (usually in Polish).

Match the description to ONE of the provided categories. Only if none fits, propose a new \
category (short Polish name, Polish description, icon from the allowed list, and whether \
asking about severity 1-5 makes sense - e.g. a broken elevator is just broken: false; an \
uneven surface can be mild or severe: true).

ALWAYS estimate severity (importance_level) 1-5 from the context - how much the problem \
hinders a person in a wheelchair, a blind or an elderly pedestrian:
1 - minor inconvenience (small crack, slightly uneven, easy to pass)
2 - bothersome (passable, but you have to be careful)
3 - clear obstruction (slows you down, needs a detour)
4 - serious obstruction (dangerous, very hard to pass in a wheelchair or for a blind person)
5 - complete blockage or hazard (impassable, the only route is blocked, accident, someone \
got hurt, a huge deep hole)
Intensifiers raise the score ("wielka", "ogromna", "głęboka", "niebezpieczna", "nie da się \
przejść/przejechać", "ktoś się przewrócił", "wózek utknął"); softeners lower it ("mała", \
"drobna", "trochę", "lekko"). Without such cues use the typical severity for the problem: \
"jest dziura w drodze" -> 2, "ogromna głęboka dziura, wózek nie przejedzie" -> 5, \
"winda nie działa" -> 4 (wheelchair users cannot get through).
Write a short, clean description in the user's language.

Respond ONLY with JSON:
{"category_id": "<id from the list or null>",
 "new_category": null | {"name": str, "description": str, "icon": str,
                         "is_importance_level_required": bool},
 "description": str,
 "importance_level": 1-5,
 "confidence": 0.0-1.0}
"""

RESPONSE_SYSTEM_PROMPT = """\
You are the assistant of Routy. The user was near a reported accessibility problem and was \
asked by voice: "Does this problem still exist?" and, if applicable, "How severe is it for \
you from 1 to 5?". Interpret the spoken answer (usually Polish).

is_observable: true if the problem still exists, false if it no longer exists, null if unclear.
importance_level: 1-5 if the user gave a severity, else null.

Respond ONLY with JSON: {"is_observable": true|false|null, "importance_level": null|1-5,
"confidence": 0.0-1.0}
"""


def _clamp_level(value: Any) -> int | None:
    try:
        level = int(value)
    except (TypeError, ValueError):
        return None
    return level if 1 <= level <= 5 else None


def _clamp_confidence(value: Any) -> float:
    try:
        return max(0.0, min(1.0, float(value)))
    except (TypeError, ValueError):
        return 0.0


class AssistantService:
    def __init__(self, db: AsyncSession):
        self.categories = CategoryService(db)
        self.problems = ProblemService(db)

    async def _chat_json(self, system: str, user: str) -> dict[str, Any]:
        if not settings.deepseek_api_key:
            raise ServiceNotConfiguredError("Assistant is not configured (DEEPSEEK_API_KEY)")
        body = {
            "model": settings.deepseek_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "response_format": {"type": "json_object"},
            "thinking": {"type": "disabled"},
            "temperature": 0.1,
            "stream": False,
        }
        headers = {"Authorization": f"Bearer {settings.deepseek_api_key}"}
        url = f"{settings.deepseek_base_url.rstrip('/')}/chat/completions"
        try:
            async with httpx.AsyncClient(timeout=settings.deepseek_timeout_s) as client:
                response = await client.post(url, json=body, headers=headers)
        except httpx.HTTPError as exc:
            raise ExternalServiceError(f"Assistant unavailable: {exc}") from exc
        if response.status_code != 200:
            logger.warning("DeepSeek error %s: %s", response.status_code, response.text[:500])
            raise ExternalServiceError(f"Assistant error ({response.status_code})")
        try:
            content = response.json()["choices"][0]["message"]["content"]
            return json.loads(content)
        except (KeyError, IndexError, ValueError) as exc:
            raise ExternalServiceError("Assistant returned an invalid response") from exc

    async def report_draft(self, data: ReportDraftRequest) -> ReportDraft:
        categories = [
            c for c in await self.categories.list_all() if c.status != CategoryStatus.REJECTED
        ]
        catalog = [
            {
                "id": str(c.id),
                "name": c.name,
                "description": c.description,
            }
            for c in categories
        ]
        user_prompt = json.dumps(
            {"categories": catalog, "allowed_icons": SUGGESTED_ICONS, "user_text": data.text},
            ensure_ascii=False,
        )
        result = await self._chat_json(REPORT_SYSTEM_PROMPT, user_prompt)

        by_id = {str(c.id): c for c in categories}
        category: CategoryRead | None = by_id.get(str(result.get("category_id") or ""))
        proposal: CategoryProposal | None = None
        if category is None and isinstance(result.get("new_category"), dict):
            raw = result["new_category"]
            try:
                proposal = CategoryProposal(
                    name=str(raw.get("name", "")).strip(),
                    description=raw.get("description"),
                    icon=raw.get("icon") if raw.get("icon") in SUGGESTED_ICONS else "circle-alert",
                    is_importance_level_required=bool(raw.get("is_importance_level_required")),
                )
            except ValueError:
                proposal = None
            if proposal is not None:
                existing = await self.categories.find_by_name(proposal.name)
                if existing is not None and existing.status != CategoryStatus.REJECTED:
                    category = await self.categories.get_read(existing.id)
                    proposal = None

        # Severity is estimated from context for every report (it sizes the map marker).
        importance = _clamp_level(result.get("importance_level"))

        existing_problem = None
        if category is not None:
            duplicate = await self.problems.find_duplicate(
                category.id, data.latitude, data.longitude
            )
            if duplicate is not None:
                existing_problem = ProblemRead.model_validate(duplicate)

        missing: list[str] = []
        if category is None and proposal is None:
            missing.append("category")
        if importance is None:
            missing.append("importance_level")

        return ReportDraft(
            category=category,
            proposed_category=proposal,
            description=(result.get("description") or data.text).strip(),
            importance_level=importance,
            latitude=data.latitude,
            longitude=data.longitude,
            reported_at=datetime.now(UTC),
            existing_problem=existing_problem,
            missing_fields=missing,
            confidence=_clamp_confidence(result.get("confidence")),
            transcript=data.text,
        )

    async def response_draft(self, data: ResponseDraftRequest) -> ResponseDraft:
        asks_severity = True
        context: dict[str, Any] = {"user_text": data.text}
        if data.problem_id is not None:
            problem = await self.problems.get(data.problem_id)
            asks_severity = problem.category.is_importance_level_required
            context["problem"] = {
                "category": problem.category.name,
                "description": problem.description,
                "asks_severity": asks_severity,
            }
        result = await self._chat_json(
            RESPONSE_SYSTEM_PROMPT, json.dumps(context, ensure_ascii=False)
        )

        observable = result.get("is_observable")
        is_observable = observable if isinstance(observable, bool) else None
        importance = (
            _clamp_level(result.get("importance_level"))
            if asks_severity and is_observable
            else None
        )
        missing: list[str] = []
        if is_observable is None:
            missing.append("is_observable")
        elif is_observable and asks_severity and importance is None:
            missing.append("importance_level")

        return ResponseDraft(
            is_observable=is_observable,
            importance_level=importance,
            missing_fields=missing,
            confidence=_clamp_confidence(result.get("confidence")),
            transcript=data.text,
        )
