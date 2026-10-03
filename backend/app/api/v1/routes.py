from fastapi import APIRouter

from app.api.v1.endpoints import health, places, trips

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(places.router)
api_router.include_router(trips.router)
