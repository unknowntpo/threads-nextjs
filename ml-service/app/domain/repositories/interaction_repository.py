"""Interaction repository interface (port)."""
from abc import ABC, abstractmethod

from app.domain.entities.interaction import Interaction


class InteractionRepository(ABC):
    """Repository interface for user interactions."""

    @abstractmethod
    async def get_user_interactions(self, user_id: str, limit: int | None = None) -> list[Interaction]:
        """Get all interactions for a user."""
        pass

    @abstractmethod
    async def get_all_interactions(self, limit: int | None = None) -> list[Interaction]:
        """Get all interactions in the system."""
        pass

    @abstractmethod
    async def save_interaction(self, interaction: Interaction) -> None:
        """Save a new interaction."""
        pass
