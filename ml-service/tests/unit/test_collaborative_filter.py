"""Unit tests for collaborative filtering recommender."""
from datetime import datetime

import pytest

from app.domain.entities.interaction import Interaction
from app.domain.entities.recommendation import Recommendation
from app.infrastructure.ml.collaborative_filter import CollaborativeFilterRecommender


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
