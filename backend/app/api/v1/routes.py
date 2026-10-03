from fastapi import APIRouter

from app.api.v1.endpoints import assistant, categories, health, problems, routing, stats

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(categories.router)
api_router.include_router(problems.router)
api_router.include_router(routing.router)
api_router.include_router(assistant.router)
api_router.include_router(stats.router)
