"""Integration tests for fake user factory."""
import pytest

from app.domain.factories.fake_user_factory import FakeUserFactory
from app.infrastructure.llm.ollama_service import OllamaService


class TestFakeUserFactory:
    """Test fake user creation."""

    def test_create_fake_user_valid_interest(self):
        """Should create fake user with valid interest."""
        # Arrange
        llm_service = OllamaService(base_url="http://localhost:11434")
        interest = "sports"

        # Act
        user = FakeUserFactory.create_fake_user(interest, llm_service)

        # Assert
        assert user.username.startswith(f"{interest}_bot_")
        assert user.bio == f"FAKE_USER: {interest} enthusiast"
        assert user.email.endswith("@fakeuser.local")
        assert user.display_name is not None
        assert len(user.display_name) > 0
        assert user.id is not None

    def test_create_fake_user_invalid_interest(self):
        """Should raise error for invalid interest."""
        # Arrange
        llm_service = OllamaService(base_url="http://localhost:11434")
        interest = "invalid_interest"

        # Act & Assert
        with pytest.raises(ValueError, match="Interest must be one of"):
            FakeUserFactory.create_fake_user(interest, llm_service)

    def test_create_fake_user_all_interests(self):
        """Should create users for all supported interests."""
        # Arrange
        llm_service = OllamaService(base_url="http://localhost:11434")
        interests = FakeUserFactory.INTERESTS

        # Act & Assert
        for interest in interests:
            user = FakeUserFactory.create_fake_user(interest, llm_service)
            assert user.bio == f"FAKE_USER: {interest} enthusiast"
            assert user.username.startswith(f"{interest}_bot_")

    def test_bio_format_marker(self):
        """Should have FAKE_USER marker in bio."""
        # Arrange
        llm_service = OllamaService(base_url="http://localhost:11434")

        # Act
        user = FakeUserFactory.create_fake_user("tech", llm_service)

        # Assert
        assert user.bio.startswith("FAKE_USER:")
        assert "enthusiast" in user.bio
