"""Recommender service interface (port)."""
from abc import ABC, abstractmethod

from app.domain.entities.recommendation import Recommendation


class RecommenderInterface(ABC):
    """Interface for recommendation algorithms."""

    @abstractmethod
    async def generate_recommendations(
        self,
        user_id: str,
        limit: int = 50,
        exclude_post_ids: list[str] | None = None,
    ) -> list[Recommendation]:
        """Generate recommendations for a user.

        Args:
            user_id: ID of the user to generate recommendations for
            limit: Maximum number of recommendations to return
            exclude_post_ids: List of post IDs to exclude from recommendations

        Returns:
            List of recommendations sorted by score (descending)
        """
        pass

    @abstractmethod
    async def train(self) -> None:
        """Train or update the recommendation model."""
        pass
