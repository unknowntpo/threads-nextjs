"""Quick test script to verify ML recommendations with real data."""
import asyncio
import sys
from pathlib import Path

# Add project root
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select
from app.infrastructure.database.connection import get_sync_session
from app.infrastructure.database.models import User
from httpx import ASGITransport, AsyncClient
from app.main import app


async def test_recommendations():
    """Test ML recommendations with real users from database."""
    print("=" * 60)
    print("ML-Powered Recommendation System Test")
    print("=" * 60)

    # Get a real user from database
    session = get_sync_session()
    try:
        user_stmt = select(User.id, User.username).limit(1)
        result = session.execute(user_stmt)
        user_row = result.fetchone()

        if not user_row:
            print("ERROR: No users found in database!")
            return

        user_id = user_row[0]
        username = user_row[1] if len(user_row) > 1 else "Unknown"

        print(f"\nTesting recommendations for user:")
        print(f"  User ID: {user_id}")
        print(f"  Username: {username}")
        print()

    finally:
        session.close()

    # Call recommendation API
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        print("Calling ML recommendation endpoint...")
        response = await client.post(
            "/recommendations/generate",
            json={
                "user_id": user_id,
                "limit": 5,
            },
        )

        print(f"Status Code: {response.status_code}\n")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ SUCCESS! Generated {data['count']} recommendations")
            print(f"Model Version: {data.get('model_version', 'N/A')}")
            print("\nRecommendations:")
            print("-" * 60)

            for i, rec in enumerate(data['recommendations'], 1):
                print(f"{i}. Post ID: {rec['post_id']}")
                print(f"   Score: {rec['score']:.4f}")
                print(f"   Reason: {rec['reason']}")
                print()

        else:
            print(f"❌ FAILED: {response.text}")

    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_recommendations())
