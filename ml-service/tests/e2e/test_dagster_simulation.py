"""E2E tests for Dagster fake user simulation."""
import pytest
import time
from sqlalchemy import select

from app.infrastructure.database.connection import get_sync_session
from app.infrastructure.database.models import Post, User, UserInteraction
from app.infrastructure.database.queries import count_fake_users, get_fake_users


@pytest.mark.e2e
class TestDagsterSimulation:
    """End-to-end tests for Dagster simulation workflow."""

    @pytest.fixture
    def session(self):
        """Get database session."""
        session = get_sync_session()
        yield session
        session.close()

    def test_fake_users_created(self, session):
        """Should have 5-10 fake users in database."""
        # Act
        count = count_fake_users(session)
        fake_users = get_fake_users(session)

        # Assert
        assert count >= 5, "Should have at least 5 fake users"
        assert count <= 10, "Should have at most 10 fake users"
        assert len(fake_users) == count

    def test_fake_users_have_correct_format(self, session):
        """Should have correct username and bio format."""
        # Arrange
        valid_interests = ["sports", "tech", "anime", "cars", "food"]

        # Act
        fake_users = get_fake_users(session)

        # Assert
        assert len(fake_users) > 0, "Should have fake users"

        for user in fake_users:
            # Check bio format
            assert user.bio.startswith("FAKE_USER:"), f"Bio should start with FAKE_USER: {user.bio}"
            assert "enthusiast" in user.bio, f"Bio should contain 'enthusiast': {user.bio}"

            # Check username format
            assert "_bot_" in user.username, f"Username should contain '_bot_': {user.username}"

            # Extract interest from username
            interest = user.username.split("_bot_")[0]
            assert interest in valid_interests, f"Interest should be valid: {interest}"

            # Check email
            assert user.email.endswith("@fakeuser.local"), f"Email should end with @fakeuser.local: {user.email}"

    def test_posts_generated_from_fake_users(self, session):
        """Should have posts created by fake users."""
        # Arrange
        fake_user_ids = [user.id for user in get_fake_users(session)]

        # Act
        stmt = select(Post).where(Post.user_id.in_(fake_user_ids))
        posts = list(session.execute(stmt).scalars().all())

        # Assert
        assert len(posts) > 0, "Should have posts from fake users"

        for post in posts:
            # Check post content
            assert post.content is not None
            assert len(post.content) > 0
            assert len(post.content) <= 280, f"Post content should be ≤280 chars: {len(post.content)}"

            # Check user is fake
            assert post.user_id in fake_user_ids

    def test_interactions_created_from_fake_users(self, session):
        """Should have interactions from fake users."""
        # Arrange
        fake_user_ids = [user.id for user in get_fake_users(session)]

        # Act
        stmt = select(UserInteraction).where(UserInteraction.user_id.in_(fake_user_ids))
        interactions = list(session.execute(stmt).scalars().all())

        # Assert
        assert len(interactions) > 0, "Should have interactions from fake users"

        # Check interaction types
        interaction_types = [i.interaction_type for i in interactions]
        valid_types = {"view", "like", "share", "click"}

        for itype in interaction_types:
            assert itype in valid_types, f"Invalid interaction type: {itype}"

    def test_interaction_type_distribution(self, session):
        """Should have realistic interaction type distribution."""
        # Arrange
        fake_user_ids = [user.id for user in get_fake_users(session)]

        # Act
        stmt = select(UserInteraction).where(UserInteraction.user_id.in_(fake_user_ids))
        interactions = list(session.execute(stmt).scalars().all())

        # Count by type
        type_counts = {}
        for interaction in interactions:
            itype = interaction.interaction_type
            type_counts[itype] = type_counts.get(itype, 0) + 1

        total = len(interactions)

        # Assert
        assert total > 0, "Should have interactions"

        # Views should be most common (weighted 50%)
        if "view" in type_counts and total >= 10:
            view_ratio = type_counts["view"] / total
            assert view_ratio >= 0.3, f"Views should be common: {view_ratio:.2f}"

    def test_fake_users_dont_interact_with_own_posts(self, session):
        """Fake users should not like their own posts."""
        # Arrange
        from app.infrastructure.database.models import Like

        fake_users = get_fake_users(session)
        fake_user_ids = [u.id for u in fake_users]

        # Get posts by fake users
        stmt = select(Post).where(Post.user_id.in_(fake_user_ids))
        posts = list(session.execute(stmt).scalars().all())

        # Act - check likes
        for post in posts:
            stmt = select(Like).where(
                Like.post_id == post.id, Like.user_id == post.user_id
            )
            self_likes = list(session.execute(stmt).scalars().all())

            # Assert - no self-likes
            assert len(self_likes) == 0, f"User {post.user_id} should not like their own post"

    def test_no_schema_changes(self, session):
        """Should not have is_fake_user or fake_user_metadata columns."""
        # Act - check User table columns
        from sqlalchemy import inspect

        inspector = inspect(session.bind)
        columns = [col["name"] for col in inspector.get_columns("user")]

        # Assert
        assert "is_fake_user" not in columns, "Should not have is_fake_user column"
        assert "fake_user_metadata" not in columns, "Should not have fake_user_metadata column"
        assert "bio" in columns, "Should still have bio column"

    def test_fake_users_identifiable_by_bio_only(self, session):
        """Should be able to identify fake users by bio field only."""
        # Act
        # Query using bio LIKE
        stmt = select(User).where(User.bio.like("FAKE_USER%"))
        fake_users_by_bio = list(session.execute(stmt).scalars().all())

        # Get using helper function
        fake_users_by_helper = get_fake_users(session)

        # Assert
        assert len(fake_users_by_bio) == len(fake_users_by_helper)
        assert len(fake_users_by_bio) > 0, "Should find fake users by bio"

        # All should have FAKE_USER marker
        for user in fake_users_by_bio:
            assert user.bio.startswith("FAKE_USER:")

    @pytest.mark.slow
    def test_continuous_simulation_creates_data_over_time(self, session):
        """Should continuously generate posts and interactions."""
        # Note: This test requires Dagster continuous schedule to be enabled
        # Run manually or in CI with Dagster running

        # Arrange - get initial counts
        initial_post_count = session.query(Post).filter(
            Post.user_id.in_([u.id for u in get_fake_users(session)])
        ).count()

        # Act - wait for continuous simulation (2 runs)
        time.sleep(130)  # 2 minutes + buffer

        # Re-query
        final_post_count = session.query(Post).filter(
            Post.user_id.in_([u.id for u in get_fake_users(session)])
        ).count()

        # Assert - should have more posts
        assert final_post_count > initial_post_count, \
            f"Should generate posts over time: {initial_post_count} → {final_post_count}"
