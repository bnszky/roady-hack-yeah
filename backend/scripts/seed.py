"""Seed categories (idempotent) and optionally demo problems around Kraków.

Usage (from backend/, after `alembic upgrade head`):
    uv run python -m scripts.seed            # categories only
    uv run python -m scripts.seed --demo     # + demo problems with confirmations
"""

import argparse
import asyncio
import random
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select

from app.db.session import async_session_factory, engine
from app.models import Category, Problem, ReportSource
from app.schemas.category import CategoryCreate
from app.schemas.problem import ProblemCreate, ProblemResponseCreate
from app.services.category_service import CategoryService
from app.services.problem_service import ProblemService

CATEGORIES = [
    CategoryCreate(
        name="Zepsuta winda",
        icon="arrow-up-down",
        description="Winda nie działa lub jest wyłączona z użytku.",
        is_importance_level_required=False,
    ),
    CategoryCreate(
        name="Dziury w ścieżce",
        icon="construction",
        description="Ubytki w nawierzchni chodnika lub ścieżki.",
        is_importance_level_required=True,
    ),
    CategoryCreate(
        name="Brak dźwięku przy sygnalizacji świetlnej",
        icon="volume-x",
        description="Sygnalizator dla niewidomych nie wydaje dźwięku.",
        is_importance_level_required=False,
    ),
    CategoryCreate(
        name="Nierówna nawierzchnia",
        icon="footprints",
        description="Wystające płyty, kostka, korzenie - utrudnienie dla wózków i pieszych.",
        is_importance_level_required=True,
    ),
    CategoryCreate(
        name="Wysoki krawężnik / brak podjazdu",
        icon="accessibility",
        description="Brak obniżenia krawężnika lub rampy.",
        is_importance_level_required=True,
    ),
    CategoryCreate(
        name="Zablokowany chodnik",
        icon="ban",
        description="Przejście zablokowane przez auta, hulajnogi, roboty budowlane.",
        is_importance_level_required=True,
    ),
    CategoryCreate(
        name="Uszkodzona ścieżka dotykowa",
        icon="signpost",
        description="Brak lub zniszczone pasy prowadzące dla osób niewidomych.",
        is_importance_level_required=False,
    ),
]

# Around Kraków city centre / Tauron Arena.
DEMO_CENTER = (50.0647, 19.9450)
DEMO_SPREAD_DEG = 0.025
DEMO_PROBLEMS = 30


async def seed_categories() -> list[Category]:
    async with async_session_factory() as db:
        service = CategoryService(db)
        created = 0
        for data in CATEGORIES:
            if await service.find_by_name(data.name) is None:
                await service.create(data)
                created += 1
        await db.commit()
        print(f"Categories: {created} created, {len(CATEGORIES) - created} already existed")
        return list((await db.execute(select(Category))).scalars().all())


async def seed_demo(categories: list[Category]) -> None:
    async with async_session_factory() as db:
        existing = (await db.execute(select(func.count(Problem.id)))).scalar_one()
        if existing:
            print(f"Demo skipped: {existing} problems already exist")
            return
        service = ProblemService(db)
        rng = random.Random(2026)
        now = datetime.now(UTC)
        for _ in range(DEMO_PROBLEMS):
            category = rng.choice(categories)
            lat = DEMO_CENTER[0] + rng.uniform(-DEMO_SPREAD_DEG, DEMO_SPREAD_DEG)
            lng = DEMO_CENTER[1] + rng.uniform(-DEMO_SPREAD_DEG, DEMO_SPREAD_DEG) * 1.5
            base_level = rng.randint(1, 5)
            reported_at = now - timedelta(days=rng.randint(3, 30), hours=rng.randint(0, 23))

            def level(base: int = base_level, scaled: bool = category.is_importance_level_required):
                if not scaled:
                    return None
                return max(1, min(5, base + rng.choice([-1, 0, 0, 1])))

            result = await service.create_report(
                ProblemCreate(
                    category_id=category.id,
                    description=f"{category.name} - zgłoszenie testowe",
                    importance_level=level(),
                    latitude=lat,
                    longitude=lng,
                    reported_at=reported_at,
                    source=rng.choice([ReportSource.FORM, ReportSource.VOICE]),
                )
            )
            problem_id = result.problem.id
            confirmations = rng.choice([0, 1, 2, 4, 5, 6, 8, 12])
            denials = rng.choice([0, 0, 0, 1, 3])
            answers = [True] * confirmations + [False] * denials
            for i, still_there in enumerate(answers):
                await service.add_response(
                    problem_id,
                    ProblemResponseCreate(
                        is_observable=still_there,
                        importance_level=level() if still_there else None,
                        reported_at=reported_at + timedelta(hours=6 * (i + 1)),
                    ),
                )
        print(f"Demo: {DEMO_PROBLEMS} problems created")


async def main(demo: bool) -> None:
    categories = await seed_categories()
    if demo:
        await seed_demo([c for c in categories if c.status == "approved"])
    await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--demo", action="store_true", help="Also create demo problems")
    asyncio.run(main(parser.parse_args().demo))
