"""End-to-end tests for recommendations API."""
import pytest
from httpx import ASGITransport, AsyncClient


@pytest.mark.asyncio
async def test_generate_recommendations_endpoint():
    """POST /recommendations/generate should return recommendations."""
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/recommendations/generate",
            json={
                "user_id": "test-user-123",
                "limit": 10,
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert "user_id" in data
    assert data["user_id"] == "test-user-123"
    assert "recommendations" in data
    assert isinstance(data["recommendations"], list)
    assert "count" in data
    assert data["count"] == len(data["recommendations"])


@pytest.mark.asyncio
async def test_generate_recommendations_with_exclude():
    """Should exclude specified post IDs from recommendations."""
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/recommendations/generate",
            json={
                "user_id": "test-user-123",
                "limit": 10,
                "exclude_post_ids": ["post-1", "post-2"],
            },
        )

    assert response.status_code == 200
    data = response.json()
    post_ids = [rec["post_id"] for rec in data["recommendations"]]
    assert "post-1" not in post_ids
    assert "post-2" not in post_ids


@pytest.mark.asyncio
async def test_generate_recommendations_validates_limit():
    """Should validate limit parameter bounds."""
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Test limit too high
        response = await client.post(
            "/recommendations/generate",
            json={
                "user_id": "test-user-123",
                "limit": 999,
            },
        )

    assert response.status_code == 422  # Validation error
