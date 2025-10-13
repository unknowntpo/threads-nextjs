"""Generate fake user interaction data for ML model training and testing.

This script connects to the database using SQLAlchemy, fetches existing users and posts,
and generates random interactions to simulate user behavior with full type safety.
"""

import random
import argparse
import sys
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4

from sqlalchemy import select


# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.infrastructure.database.connection import get_sync_session
from app.infrastructure.database.models import Post, User, UserInteraction


# Interaction types with weights (more views than likes, etc.)
INTERACTION_TYPES: list[tuple[str, float]] = [
    ("view", 0.50),  # 50% of interactions are views
    ("click", 0.30),  # 30% are clicks
    ("like", 0.15),  # 15% are likes
    ("share", 0.05),  # 5% are shares
]


def weighted_choice(choices: list[tuple[str, float]]) -> str:
    """Choose from weighted options with type safety.

    Args:
        choices: List of (choice, weight) tuples

    Returns:
        Selected choice string
    """
    total: float = sum(weight for _, weight in choices)
    r: float = random.uniform(0, total)
    upto: float = 0
    for choice, weight in choices:
        if upto + weight >= r:
            return choice
        upto += weight
    return choices[-1][0]


def generate_interactions(num_interactions: int = 5000, days_back: int = 30) -> None:
    """Generate fake interactions for existing users and posts using SQLAlchemy.

    Args:
        num_interactions: Number of interactions to generate
        days_back: Generate interactions over this many days
    """
    print("Connecting to database with SQLAlchemy...")
    session = get_sync_session()

    try:
        # Fetch existing users with type safety
        user_stmt = select(User.id).limit(1000)
        user_result = session.execute(user_stmt)
        users: list[str] = [row[0] for row in user_result.fetchall()]

        # Fetch existing posts with type safety
        post_stmt = select(Post.id).limit(1000)
        post_result = session.execute(post_stmt)
        posts: list[str] = [row[0] for row in post_result.fetchall()]

        if not users or not posts:
            print("Error: No users or posts found in database")
            print(f"Users: {len(users)}, Posts: {len(posts)}")
            return

        print(f"Found {len(users)} users and {len(posts)} posts")
        print(f"Generating {num_interactions} interactions...")

        # Generate interactions
        interactions: list[UserInteraction] = []
        end_date: datetime = datetime.now()
        start_date: datetime = end_date - timedelta(days=days_back)

        for i in range(num_interactions):
            user_id: str = random.choice(users)
            post_id: str = random.choice(posts)
            interaction_type: str = weighted_choice(INTERACTION_TYPES)

            # Random timestamp within date range
            time_delta: float = random.uniform(0, days_back * 24 * 60 * 60)
            created_at: datetime = start_date + timedelta(seconds=time_delta)

            # Metadata based on interaction type
            metadata: dict[str, int | float] | None = None
            if interaction_type == "view":
                metadata = {"duration_seconds": random.randint(1, 300)}
            elif interaction_type == "click":
                metadata = {"scroll_depth": random.uniform(0.0, 1.0)}

            # Create UserInteraction model instance
            interaction = UserInteraction(
                id=str(uuid4()),
                user_id=user_id,
                post_id=post_id,
                interaction_type=interaction_type,
                interaction_metadata=metadata,
                created_at=created_at,
            )
            interactions.append(interaction)

            if (i + 1) % 1000 == 0:
                print(f"  Generated {i + 1}/{num_interactions} interactions...")

        # Bulk insert interactions
        print("Inserting interactions into database...")
        session.bulk_save_objects(interactions)
        session.commit()

        print(f"✓ Successfully generated {len(interactions)} interactions")

        # Get counts with type-safe queries
        view_count = session.query(UserInteraction).filter_by(interaction_type="view").count()
        click_count = (
            session.query(UserInteraction).filter_by(interaction_type="click").count()
        )
        like_count = session.query(UserInteraction).filter_by(interaction_type="like").count()
        share_count = (
            session.query(UserInteraction).filter_by(interaction_type="share").count()
        )

        print("\nInteraction statistics:")
        print(f"  view: {view_count}")
        print(f"  click: {click_count}")
        print(f"  like: {like_count}")
        print(f"  share: {share_count}")

    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate fake user interactions with SQLAlchemy")
    parser.add_argument(
        "--count",
        type=int,
        default=5000,
        help="Number of interactions to generate (default: 5000)",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=30,
        help="Generate interactions over this many days (default: 30)",
    )

    args = parser.parse_args()

    generate_interactions(num_interactions=args.count, days_back=args.days)
