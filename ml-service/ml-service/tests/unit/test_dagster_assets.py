"""Unit tests for Dagster load generation assets."""
from unittest import mock

import pytest
from dagster import build_asset_context

from threads_ml_dagster.load_generation.assets.fake_users import fake_users
from threads_ml_dagster.load_generation.assets.posts import generated_posts


class TestFakeUsersAsset:
    """Test fake_users asset."""

    def test_creates_users_when_below_target(self):
        """Should create users when count is below target."""
        # Arrange - mock database session
        mock_session = mock.Mock()
        mock_session.close = mock.Mock()
        mock_session.commit = mock.Mock()
        mock_session.add = mock.Mock()

        # Mock database resource
        mock_db = mock.Mock()
        mock_db.return_value = mock_session

        # Mock Ollama resource
        mock_ollama = mock.Mock()
        mock_ollama.generate_display_name = mock.Mock(return_value="TestUser")

        # Build proper Dagster context with resources
        context = build_asset_context(resources={"db": mock_db, "ollama": mock_ollama})

        # Mock count_fake_users to return 0 (no existing users)
        with mock.patch(
            "threads_ml_dagster.load_generation.assets.fake_users.count_fake_users",
            return_value=0,
        ):
            with mock.patch(
                "threads_ml_dagster.load_generation.assets.fake_users.FakeUserFactory"
            ) as mock_factory_class:
                # Mock factory instance
                mock_factory = mock.Mock()
                mock_user = mock.Mock()
                mock_user.id = "test-user-id-123"
                mock_user.username = "test_bot"
                mock_factory.create_fake_user = mock.Mock(return_value=mock_user)
                mock_factory_class.return_value = mock_factory
                mock_factory_class.INTERESTS = ["sports", "tech", "anime", "cars", "food"]

                # Act
                result = fake_users(context)

        # Assert
        assert result["status"] == "created"
        assert result["created"] == 8  # Should create 8 users
        assert mock_session.commit.called
        assert mock_session.add.call_count == 8

    def test_skips_creation_when_sufficient_users_exist(self):
        """Should skip creation when target count is met."""
        # Arrange
        mock_session = mock.Mock()
        mock_session.close = mock.Mock()

        mock_db = mock.Mock()
        mock_db.return_value = mock_session

        mock_ollama = mock.Mock()

        context = build_asset_context(resources={"db": mock_db, "ollama": mock_ollama})

        # Mock count_fake_users to return 8 (target met)
        with mock.patch(
            "threads_ml_dagster.load_generation.assets.fake_users.count_fake_users",
            return_value=8,
        ):
            # Act
            result = fake_users(context)

        # Assert
        assert result["status"] == "sufficient"
        assert result["count"] == 8
        assert mock_session.close.called
        # Should not commit anything
        assert not hasattr(mock_session, "commit") or not mock_session.commit.called

    def test_cycles_through_interests_for_8_users(self):
        """Should cycle through 5 interests to create 8 users."""
        # Arrange
        mock_session = mock.Mock()
        mock_session.close = mock.Mock()
        mock_session.commit = mock.Mock()
        mock_session.add = mock.Mock()

        mock_db = mock.Mock()
        mock_db.return_value = mock_session

        mock_ollama = mock.Mock()
        mock_ollama.generate_display_name = mock.Mock(return_value="TestUser")

        context = build_asset_context(resources={"db": mock_db, "ollama": mock_ollama})

        with mock.patch(
            "threads_ml_dagster.load_generation.assets.fake_users.count_fake_users",
            return_value=0,
        ):
            with mock.patch(
                "threads_ml_dagster.load_generation.assets.fake_users.FakeUserFactory"
            ) as mock_factory_class:
                mock_factory = mock.Mock()
                mock_user = mock.Mock()
                mock_user.id = "test-id"
                mock_user.username = "test_bot"
                mock_factory.create_fake_user = mock.Mock(return_value=mock_user)
                mock_factory_class.return_value = mock_factory
                mock_factory_class.INTERESTS = ["sports", "tech", "anime", "cars", "food"]

                # Act
                fake_users(context)

                # Assert - verify interests cycle correctly
                # Should call create_fake_user 8 times with interests:
                # sports, tech, anime, cars, food, sports, tech, anime
                calls = mock_factory.create_fake_user.call_args_list
                assert len(calls) == 8

                expected_interests = ["sports", "tech", "anime", "cars", "food", "sports", "tech", "anime"]
                actual_interests = [call[0][0] for call in calls]
                assert actual_interests == expected_interests


class TestGeneratedPostsAsset:
    """Test generated_posts asset."""

    def test_generates_posts_from_fake_users(self):
        """Should generate 3-5 posts from fake users."""
        # Arrange
        mock_session = mock.Mock()
        mock_session.close = mock.Mock()
        mock_session.commit = mock.Mock()
        mock_session.add = mock.Mock()

        mock_db = mock.Mock()
        mock_db.return_value = mock_session

        mock_ollama = mock.Mock()
        mock_ollama.generate_post = mock.Mock(return_value="Test post content")

        context = build_asset_context(resources={"db": mock_db, "ollama": mock_ollama})

        # Create mock users
        mock_user = mock.Mock()
        mock_user.id = "user-123"
        mock_user.username = "test_bot"
        mock_user.bio = "Passionate about tech"

        with mock.patch(
            "threads_ml_dagster.load_generation.assets.posts.get_fake_users",
            return_value=[mock_user],
        ):
            with mock.patch(
                "threads_ml_dagster.load_generation.assets.posts.extract_interest_from_bio",
                return_value="tech",
            ):
                with mock.patch("threads_ml_dagster.load_generation.assets.posts.random.randint", return_value=3):
                    with mock.patch("threads_ml_dagster.load_generation.assets.posts.random.choice", return_value=mock_user):
                        # Act
                        result = generated_posts(context)

        # Assert
        assert result["status"] == "success"
        assert result["posts_created"] == 3
        assert mock_ollama.generate_post.call_count == 3
        assert mock_session.add.call_count == 3
        assert mock_session.commit.called

    def test_returns_error_when_no_fake_users(self):
        """Should return error status when no fake users exist."""
        # Arrange
        mock_session = mock.Mock()
        mock_session.close = mock.Mock()

        mock_db = mock.Mock()
        mock_db.return_value = mock_session

        mock_ollama = mock.Mock()

        context = build_asset_context(resources={"db": mock_db, "ollama": mock_ollama})

        with mock.patch(
            "threads_ml_dagster.load_generation.assets.posts.get_fake_users",
            return_value=[],
        ):
            # Act
            result = generated_posts(context)

        # Assert
        assert result["status"] == "no_fake_users"
        assert result["posts_created"] == 0
        assert mock_session.close.called

    def test_handles_ollama_generation_errors_gracefully(self):
        """Should continue generating posts even if one fails."""
        # Arrange
        mock_session = mock.Mock()
        mock_session.close = mock.Mock()
        mock_session.commit = mock.Mock()
        mock_session.add = mock.Mock()

        mock_db = mock.Mock()
        mock_db.return_value = mock_session

        # Mock Ollama to fail on first call, succeed on second
        mock_ollama = mock.Mock()
        mock_ollama.generate_post = mock.Mock(
            side_effect=[Exception("Ollama error"), "Success post", "Another success"]
        )

        context = build_asset_context(resources={"db": mock_db, "ollama": mock_ollama})

        mock_user = mock.Mock()
        mock_user.id = "user-123"
        mock_user.username = "test_bot"
        mock_user.bio = "Tech enthusiast"

        with mock.patch(
            "threads_ml_dagster.load_generation.assets.posts.get_fake_users",
            return_value=[mock_user],
        ):
            with mock.patch(
                "threads_ml_dagster.load_generation.assets.posts.extract_interest_from_bio",
                return_value="tech",
            ):
                with mock.patch("threads_ml_dagster.load_generation.assets.posts.random.randint", return_value=3):
                    with mock.patch("threads_ml_dagster.load_generation.assets.posts.random.choice", return_value=mock_user):
                        # Act
                        result = generated_posts(context)

        # Assert
        assert result["status"] == "success"
        assert result["posts_created"] == 2  # 1 failed, 2 succeeded
        assert mock_session.add.call_count == 2
