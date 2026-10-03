from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# Supabase's transaction pooler (pgbouncer, port 6543) does not support
# prepared statements. Disable both asyncpg's cache and SQLAlchemy's cache,
# otherwise you get "prepared statement ... already exists" (esp. on reconnect).
_ASYNC_PG_CONNECT_ARGS = {"statement_cache_size": 0, "prepared_statement_cache_size": 0}

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    connect_args=_ASYNC_PG_CONNECT_ARGS,
)

async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
