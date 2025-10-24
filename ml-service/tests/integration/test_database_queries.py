"""Integration tests for database query helpers."""
import pytest
from datetime import datetime, timedelta

from app.infrastructure.database.connection import get_sync_session
from app.infrastructure.database.models import Post, User
from app.infrastructure.database.queries import (
    count_fake_users,
    extract_interest_from_bio,
    get_fake_users,
    get_recent_posts,
)


class TestDatabaseQueries:
    """Test database query helper functions."""

    @pytest.fixture
    def session(self):
        """Get database session."""
        session = get_sync_session()
        yield session
        session.close()

    def test_extract_interest_from_bio_valid(self):
        """Should extract interest from valid FAKE_USER bio."""
        # Arrange
        bio = "FAKE_USER: sports enthusiast"

        # Act
        interest = extract_interest_from_bio(bio)

        # Assert
        assert interest == "sports"

    def test_extract_interest_from_bio_invalid(self):
        """Should return None for invalid bio."""
        # Arrange
        bio = "Regular user bio"

        # Act
        interest = extract_interest_from_bio(bio)

        # Assert
        assert interest is None

    def test_extract_interest_from_bio_none(self):
        """Should return None for None bio."""
        # Act
        interest = extract_interest_from_bio(None)

        # Assert
        assert interest is None

    def test_extract_interest_from_bio_different_interests(self):
        """Should extract different interests correctly."""
        # Arrange
        test_cases = [
            ("FAKE_USER: tech enthusiast", "tech"),
            ("FAKE_USER: anime enthusiast", "anime"),
            ("FAKE_USER: cars enthusiast", "cars"),
            ("FAKE_USER: food enthusiast", "food"),
        ]

        # Act & Assert
        for bio, expected_interest in test_cases:
            assert extract_interest_from_bio(bio) == expected_interest

    def test_get_fake_users_filters_correctly(self, session):
        """Should only return users with FAKE_USER bio."""
        # Act
        fake_users = get_fake_users(session)

        # Assert
        for user in fake_users:
            assert user.bio is not None
            assert user.bio.startswith("FAKE_USER:")

    def test_count_fake_users_matches_get_fake_users(self, session):
        """Should return same count as len(get_fake_users)."""
        # Act
        fake_users = get_fake_users(session)
        count = count_fake_users(session)

        # Assert
        assert count == len(fake_users)

    def test_get_recent_posts_time_filter(self, session):
        """Should only return posts within time window."""
        # Arrange
        hours = 24
        cutoff = datetime.utcnow() - timedelta(hours=hours)

        # Act
        recent_posts = get_recent_posts(session, hours=hours)

        # Assert
        for post in recent_posts:
            assert post.created_at >= cutoff

    def test_get_recent_posts_ordered_desc(self, session):
        """Should return posts ordered by created_at DESC."""
        # Act
        recent_posts = get_recent_posts(session, hours=168)  # 1 week

        # Assert
        if len(recent_posts) > 1:
            for i in range(len(recent_posts) - 1):
                assert recent_posts[i].created_at >= recent_posts[i + 1].created_at
