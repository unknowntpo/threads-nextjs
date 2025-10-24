"""Factory for creating fake users."""
import uuid
from datetime import datetime
from typing import Optional

from app.domain.services.llm_interface import LLMInterface
from app.infrastructure.database.models import User


class FakeUserFactory:
    """Factory for creating realistic fake users with interests."""

    INTERESTS = ["sports", "tech", "anime", "cars", "food"]

    @staticmethod
    def create_fake_user(
        interest: str,
        llm_service: LLMInterface,
        activity_level: float = 0.5,
    ) -> User:
        """Create a fake user with given interest.

        Args:
            interest: Primary interest (must be in INTERESTS)
            llm_service: LLM service for generating display name
            activity_level: Activity probability (0.0-1.0)

        Returns:
            User model instance (not yet persisted)
        """
        if interest not in FakeUserFactory.INTERESTS:
            raise ValueError(f"Interest must be one of: {FakeUserFactory.INTERESTS}")

        user_id = str(uuid.uuid4())
        short_id = user_id[:6]
        username = f"{interest}_bot_{short_id}"

        # Generate display name via LLM
        try:
            display_name = llm_service.generate_display_name(interest)
        except Exception:
            # Fallback if LLM fails
            display_name = f"{interest.capitalize()}Fan"

        # Create bio with FAKE_USER marker
        bio = f"FAKE_USER: {interest} enthusiast"

        # Fake email
        email = f"{username}@fakeuser.local"

        return User(
            id=user_id,
            username=username,
            display_name=display_name,
            bio=bio,
            email=email,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
