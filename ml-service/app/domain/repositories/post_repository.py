"""Post repository interface (port)."""

from abc import ABC, abstractmethod

from app.domain.entities.post import Post


class PostRepository(ABC):
    """Repository interface for posts."""

    @abstractmethod
    async def get_post_by_id(self, post_id: str) -> Post | None:
        """Get a post by ID."""
        pass

    @abstractmethod
    async def get_all_posts(self, limit: int | None = None) -> list[Post]:
        """Get all posts."""
        pass

    @abstractmethod
    async def get_recent_posts(self, limit: int = 100) -> list[Post]:
        """Get recent posts ordered by creation date."""
        pass
