"""Abstract interface for LLM operations."""
from abc import ABC, abstractmethod


class LLMInterface(ABC):
    """LLM service interface for content generation."""

    @abstractmethod
    def generate_post(self, interest: str) -> str:
        """Generate post content based on user interest.

        Args:
            interest: User's primary interest (e.g., "sports", "tech")

        Returns:
            Generated post content (max 280 chars)
        """
        pass

    @abstractmethod
    def generate_comment(self, post_content: str, interest: str) -> str:
        """Generate comment for a post.

        Args:
            post_content: Content of the post to comment on
            interest: Commenter's interest

        Returns:
            Generated comment text
        """
        pass

    @abstractmethod
    def should_interact(self, post_content: str, interest: str) -> bool:
        """Decide if user would interact with post based on interest.

        Args:
            post_content: Post content to evaluate
            interest: User's interest

        Returns:
            True if user would likely interact
        """
        pass

    @abstractmethod
    def generate_display_name(self, interest: str) -> str:
        """Generate realistic display name for fake user.

        Args:
            interest: User's interest

        Returns:
            Display name (e.g., "TechEnthusiast")
        """
        pass