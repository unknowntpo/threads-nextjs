"""FastAPI dependencies for dependency injection."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.use_cases.generate_recommendations import GenerateRecommendationsUseCase
from app.infrastructure.database.connection import get_async_session
from app.infrastructure.database.interaction_repository_impl import (
    SQLAlchemyInteractionRepository,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session dependency."""
    async with get_async_session() as session:
        yield session


async def get_generate_recommendations_use_case(
    session: AsyncSession,
) -> GenerateRecommendationsUseCase:
    """Get generate recommendations use case with dependencies injected."""
    interaction_repo = SQLAlchemyInteractionRepository(session)
    return GenerateRecommendationsUseCase(interaction_repo)
