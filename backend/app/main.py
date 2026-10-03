import edge_tts
from fastapi import FastAPI
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import api_router
from app.core.config import settings
from app.core.exceptions import ServiceNotConfiguredError, register_exception_handlers
from app.core.logging import configure_logging
from app.middleware.logging import RequestLoggingMiddleware

from openai import AsyncOpenAI

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


_groq_client: AsyncOpenAI | None = None


def get_groq_client() -> AsyncOpenAI:
    """Created on first use, so a missing GROQ_API_KEY only disables this endpoint
    instead of crashing the whole API at import time."""
    global _groq_client
    if not settings.groq_api_key:
        raise ServiceNotConfiguredError("Voice assistant is not configured (GROQ_API_KEY)")
    if _groq_client is None:
        _groq_client = AsyncOpenAI(
            api_key=settings.groq_api_key, base_url="https://api.groq.com/openai/v1"
        )
    return _groq_client


@app.get("/process-command")
async def process_command(text: str):
    client = get_groq_client()
    system_prompt = """Jesteś głosowym asystentem nawigacyjnym dla rowerzystów i osób na wózkach inwalidzkich. Użytkownik komunikuje się z Tobą w ruchu.
    Twoje główne zadania:
    1. Przyjmowanie zgłoszeń o przeszkodach (np. dziury, wysokie krawężniki, wypadki) – potwierdzaj ich przyjęcie.
    2. Wsparcie nawigacyjne – jeśli użytkownik prosi o wyznaczenie trasy, potwierdź cel podróży.
    3. Ostrzeganie – informuj o zgłoszonych wcześniej problemach na wyznaczonej trasie w pobliżu użytkownika. Nie sugerujesz nowych tras, po prostu ostrzegasz przed przeszkodami, do których się zbliża.

    Zasady:
    - Odpowiadaj BARDZO krótko, zwięźle (maksymalnie 1-2 zdania) i naturalnym tonem.
    - Bądź pomocny i empatyczny, biorąc pod uwagę ograniczenia ruchowe użytkowników.
    - Nie używaj żadnego formatowania tekstu (gwiazdek, pogrubień), ponieważ Twój tekst jest czytany przez syntezator mowy."""

    ai_response = await client.chat.completions.create(
        model="openai/gpt-oss-120b", 
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ]
    )
    
    answer = ai_response.choices[0].message.content
    print(f"User: {text} | AI: {answer}") 
    
    voice = "pl-PL-MarekNeural"

    # Build the MP3 in memory so concurrent requests don't overwrite each other's audio.
    communicate = edge_tts.Communicate(answer, voice)
    audio = bytearray()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])

    return Response(content=bytes(audio), media_type="audio/mpeg")