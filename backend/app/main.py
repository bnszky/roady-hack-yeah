from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging
from app.middleware.logging import RequestLoggingMiddleware

configure_logging()

OPENAPI_TAGS = [
    {"name": "health", "description": "Liveness check"},
    {"name": "categories", "description": "Problem categories and user proposals"},
    {"name": "problems", "description": "Map, reports, confirmations and admin management"},
    {"name": "routes", "description": "Problems along a walking route A -> B"},
    {"name": "assistant", "description": "Voice assistant (DeepSeek) - drafts, nothing is saved"},
    {"name": "stats", "description": "Admin dashboard statistics"},
]

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    description="Routy - crowdsourced map of accessibility problems in the city.",
    openapi_tags=OPENAPI_TAGS,
)

# CORS first, so the request-logging middleware stays outermost.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global request logging for every endpoint.
app.add_middleware(RequestLoggingMiddleware)

register_exception_handlers(app)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/", include_in_schema=False)
async def root() -> dict:
    return {
        "name": settings.app_name,
        "docs": "/docs",
        "health": f"{settings.api_v1_prefix}/health",
    }
