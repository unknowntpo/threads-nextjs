"""Unit tests for collaborative filtering recommender."""

from datetime import datetime

import pytest

from app.domain.entities.interaction import Interaction
from app.domain.entities.recommendation import Recommendation
from app.infrastructure.ml.collaborative_filter import CollaborativeFilterRecommender


@pytest.fixture
def large_interaction_dataset():
    """Controlled dataset showing clear similarity patterns."""
    interactions = []
    interaction_id = 1

    # Define user groups with controlled interactions
    # Group A: Tech enthusiasts - similar but not identical
    # user1: likes python, react, docker
    for post in ["python", "react", "docker"]:
        interactions.append(
            Interaction(
                id=str(interaction_id),
                user_id="user1",
                post_id=post,
                interaction_type="like",
                created_at=datetime.now(),
            )
        )
        interaction_id += 1

    # user2: likes python, react, kubernetes (similar to user1)
    for post in ["python", "react", "kubernetes"]:
        interactions.append(
            Interaction(
                id=str(interaction_id),
                user_id="user2",
                post_id=post,
                interaction_type="like",
                created_at=datetime.now(),
            )
        )
        interaction_id += 1

    # user3: likes python, docker, typescript (similar to user1)
    for post in ["python", "docker", "typescript"]:
        interactions.append(
            Interaction(
                id=str(interaction_id),
                user_id="user3",
                post_id=post,
                interaction_type="like",
                created_at=datetime.now(),
            )
        )
        interaction_id += 1

    # user4: likes all major tech
    for post in ["python", "react", "docker", "kubernetes", "typescript"]:
        interactions.append(
            Interaction(
                id=str(interaction_id),
                user_id="user4",
                post_id=post,
                interaction_type="like",
                created_at=datetime.now(),
            )
        )
        interaction_id += 1

    # user5: likes rust, golang, python (different subset)
    for post in ["rust", "golang", "python"]:
        interactions.append(
            Interaction(
                id=str(interaction_id),
                user_id="user5",
                post_id=post,
                interaction_type="like",
                created_at=datetime.now(),
            )
        )
        interaction_id += 1

    # Group B: Sports fans (user6-10) - love sports posts
    sports_posts = ["football", "basketball", "tennis", "baseball", "soccer"]
    sports_users = ["user6", "user7", "user8", "user9", "user10"]

    for user in sports_users:
        for post in sports_posts:
            interactions.append(
                Interaction(
                    id=str(interaction_id),
                    user_id=user,
                    post_id=post,
                    interaction_type="like",
                    created_at=datetime.now(),
                )
            )
            interaction_id += 1

    # Group C: Mixed interests (user11-13) - like BOTH tech and sports
    mixed_users = ["user11", "user12", "user13"]
    for user in mixed_users:
        for post in ["python", "react", "docker"]:  # Like 3 tech posts
            interactions.append(
                Interaction(
                    id=str(interaction_id),
                    user_id=user,
                    post_id=post,
                    interaction_type="like",
                    created_at=datetime.now(),
                )
            )
            interaction_id += 1
        for post in sports_posts[:3]:  # Like 3 sports posts
            interactions.append(
                Interaction(
                    id=str(interaction_id),
                    user_id=user,
                    post_id=post,
                    interaction_type="like",
                    created_at=datetime.now(),
                )
            )
            interaction_id += 1

    # Group D: Casual users (user14-16) - few random interactions
    casual_users = ["user14", "user15", "user16"]
    casual_posts = ["random1", "random2"]
    for user in casual_users:
        for post in casual_posts:
            interactions.append(
                Interaction(
                    id=str(interaction_id),
                    user_id=user,
                    post_id=post,
                    interaction_type="view",
                    created_at=datetime.now(),
                )
            )
            interaction_id += 1

    # Group E: Power user (user17) - interacts with EVERYTHING
    all_posts = (
        ["python", "react", "docker", "kubernetes", "typescript"] + sports_posts + casual_posts
    )
    for post in all_posts:
        interactions.append(
            Interaction(
                id=str(interaction_id),
                user_id="user17",
                post_id=post,
                interaction_type="share",
                created_at=datetime.now(),
            )
        )
        interaction_id += 1

    # Add a few more users with unique preferences
    # User18: Only Python and React
    for post in ["python", "react"]:
        interactions.append(
            Interaction(
                id=str(interaction_id),
                user_id="user18",
                post_id=post,
                interaction_type="like",
                created_at=datetime.now(),
            )
        )
        interaction_id += 1

    # User19: Only football
    interactions.append(
        Interaction(
            id=str(interaction_id),
            user_id="user19",
            post_id="football",
            interaction_type="like",
            created_at=datetime.now(),
        )
    )
    interaction_id += 1

    # User20: Mix of tech and one sport
    for post in ["python", "docker", "football"]:
        interactions.append(
            Interaction(
                id=str(interaction_id),
                user_id="user20",
                post_id=post,
                interaction_type="comment",
                created_at=datetime.now(),
            )
        )
        interaction_id += 1

    return interactions


@pytest.mark.asyncio
async def test_generate_recommendations_returns_list():
    """Should return a list of recommendations for a user."""
    # Create mock interactions data
    interactions = [
        Interaction(
            id="1",
            user_id="user1",
            post_id="post1",
            interaction_type="like",
            created_at=datetime.now(),
        ),
        Interaction(
            id="2",
            user_id="user1",
            post_id="post2",
            interaction_type="view",
            created_at=datetime.now(),
        ),
        Interaction(
            id="3",
            user_id="user2",
            post_id="post1",
            interaction_type="like",
            created_at=datetime.now(),
        ),
        Interaction(
            id="4",
            user_id="user2",
            post_id="post3",
            interaction_type="share",
            created_at=datetime.now(),
        ),
    ]

    recommender = CollaborativeFilterRecommender(interactions=interactions)
    await recommender.train()

    recommendations = await recommender.generate_recommendations("user1", limit=10)

    assert isinstance(recommendations, list)
    assert all(isinstance(r, Recommendation) for r in recommendations)
    assert all(r.user_id == "user1" for r in recommendations)


@pytest.mark.asyncio
async def test_recommendations_sorted_by_score():
    """Recommendations should be sorted by score in descending order."""
    interactions = [
        Interaction("1", "user1", "post1", "like", datetime.now()),
        Interaction("2", "user1", "post2", "view", datetime.now()),
        Interaction("3", "user2", "post1", "like", datetime.now()),
        Interaction("4", "user2", "post3", "share", datetime.now()),
        Interaction("5", "user3", "post1", "like", datetime.now()),
        Interaction("6", "user3", "post3", "like", datetime.now()),
    ]

    recommender = CollaborativeFilterRecommender(interactions=interactions)
    await recommender.train()

    recommendations = await recommender.generate_recommendations("user1", limit=10)

    scores = [r.score for r in recommendations]
    assert scores == sorted(scores, reverse=True)


@pytest.mark.asyncio
async def test_exclude_post_ids():
    """Should exclude specified post IDs from recommendations."""
    interactions = [
        Interaction("1", "user1", "post1", "like", datetime.now()),
        Interaction("2", "user2", "post1", "like", datetime.now()),
        Interaction("3", "user2", "post2", "share", datetime.now()),
    ]

    recommender = CollaborativeFilterRecommender(interactions=interactions)
    await recommender.train()

    recommendations = await recommender.generate_recommendations(
        "user1", limit=10, exclude_post_ids=["post1"]
    )

    post_ids = [r.post_id for r in recommendations]
    assert "post1" not in post_ids


@pytest.mark.asyncio
async def test_large_dataset_visualization(large_interaction_dataset):
    """Test with 20 users and 30 posts - better visualization."""
    recommender = CollaborativeFilterRecommender(
        interactions=large_interaction_dataset,
        n_neighbors=5,
    )
    await recommender.train()

    # Test recommendations for multiple users
    recommendations = await recommender.generate_recommendations("user1", limit=10)

    assert isinstance(recommendations, list)
    assert len(recommendations) > 0
    assert all(isinstance(r, Recommendation) for r in recommendations)
    assert all(r.user_id == "user1" for r in recommendations)
    assert all(0 <= r.score <= 1.0 for r in recommendations)
