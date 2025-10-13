"""Interaction repository implementation using SQLAlchemy."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.interaction import Interaction
from app.domain.repositories.interaction_repository import InteractionRepository
from app.infrastructure.database.models import UserInteraction


class SQLAlchemyInteractionRepository(InteractionRepository):
    """SQLAlchemy implementation of interaction repository."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_interactions(
        self, user_id: str, limit: int | None = None
    ) -> list[Interaction]:
        """Get all interactions for a user."""
        stmt = select(UserInteraction).where(UserInteraction.user_id == user_id)
        if limit:
            stmt = stmt.limit(limit)

        result = await self.session.execute(stmt)
        db_interactions = result.scalars().all()

        return [
            Interaction(
                id=db_int.id,
                user_id=db_int.user_id,
                post_id=db_int.post_id,
                interaction_type=db_int.interaction_type,
                created_at=db_int.created_at,
                metadata=db_int.interaction_metadata,
            )
            for db_int in db_interactions
        ]

    async def get_all_interactions(self, limit: int | None = None) -> list[Interaction]:
        """Get all interactions in the system."""
        stmt = select(UserInteraction)
        if limit:
            stmt = stmt.limit(limit)

        result = await self.session.execute(stmt)
        db_interactions = result.scalars().all()

        return [
            Interaction(
                id=db_int.id,
                user_id=db_int.user_id,
                post_id=db_int.post_id,
                interaction_type=db_int.interaction_type,
                created_at=db_int.created_at,
                metadata=db_int.interaction_metadata,
            )
            for db_int in db_interactions
        ]

    async def save_interaction(self, interaction: Interaction) -> None:
        """Save a new interaction."""
        db_interaction = UserInteraction(
            id=interaction.id,
            user_id=interaction.user_id,
            post_id=interaction.post_id,
            interaction_type=interaction.interaction_type,
            created_at=interaction.created_at,
            interaction_metadata=interaction.metadata,
        )
        self.session.add(db_interaction)
        await self.session.flush()
