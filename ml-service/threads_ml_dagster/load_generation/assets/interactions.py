"""Dagster asset for simulating user interactions."""
import random
import uuid
from datetime import datetime

import requests
from dagster import asset
from sqlalchemy import select

from app.infrastructure.database.models import Post, UserInteraction
from app.infrastructure.database.queries import extract_interest_from_bio, get_fake_users


@asset(deps=["fake_users", "generated_posts"], required_resource_keys={"db", "ollama"})
def simulated_interactions(context):
    """Simulate realistic user interactions (views, likes, comments) based on ML recommendations.

    Algorithm Overview:
    1. For each fake user, call the recommendation API to get personalized post suggestions
    2. The recommendation system uses collaborative filtering to predict relevant posts
    3. Fetch recommended posts from database and filter out user's own posts
    4. For each recommended post, use Ollama LLM to decide if user would interact:
       - Prompt: "Is this post about {user_interest}?"
       - If yes, randomly choose action: view (50%), like (30%), or comment (20%)
    5. Create interaction records in database with appropriate metadata
    6. Commit all interactions and return statistics

    Key Features:
    - Uses ML recommendation API (collaborative filtering) for realistic targeting
    - Ollama-based interest matching for interaction decisions
    - Weighted random actions to simulate diverse user behavior
    - Prevents self-interactions (users don't interact with their own posts)
    - Handles cold start: users with no recommendations are skipped

    Returns:
        dict: {"status": "success", "interactions": total_count}
    """
    db = context.resources.db
    ollama = context.resources.ollama
    session = db()

    fake_user_list = get_fake_users(session)

    context.log.info(f"Interaction simulation: {len(fake_user_list)} fake users")

    if not fake_user_list:
        context.log.warning(f"No fake users found")
        session.close()
        return {"status": "no_data", "interactions": 0}

    interactions_created = 0
    interactions_by_type = {"view": 0, "like": 0, "comment": 0}

    # ML service API URL (using service name for DNS)
    ml_service_url = "http://ml-service:8000"

    # Each fake user gets recommendations and interacts
    for user in fake_user_list:
        interest = extract_interest_from_bio(user.bio)
        if not interest:
            context.log.debug(f"No interest found for user {user.username}, skipping")
            continue

        # Get recommended posts for this user via API
        try:
            response = requests.post(
                f"{ml_service_url}/recommendations/generate",
                json={"user_id": user.id, "limit": 5},
                timeout=10
            )
            response.raise_for_status()
            result = response.json()

            context.log.info(f"Recommendation API response for {user.username}: {result}")

            if not result.get("recommendations"):
                context.log.warning(f"No recommendations for user {user.username}, result: {result}")
                continue

            context.log.info(f"User {user.username} (interest={interest}) evaluating {result['count']} recommended posts")

            # Fetch the recommended posts from database
            recommended_post_ids = [rec["post_id"] for rec in result["recommendations"]]
            context.log.info(f"Fetching {len(recommended_post_ids)} recommended posts from DB")

            recommended_posts = session.execute(
                select(Post).where(Post.id.in_(recommended_post_ids))
            ).scalars().all()

            context.log.info(f"Found {len(recommended_posts)} posts in DB for user {user.username}")

            posts_evaluated = 0
            for post in recommended_posts:
                # Skip own posts
                if post.user_id == user.id:
                    context.log.debug(f"Skipping own post {post.id[:8]}...")
                    continue

                posts_evaluated += 1

                try:
                    # Check if user would interact
                    context.log.debug(f"Asking Ollama if user interested in: {post.content[:50]}...")
                    would_interact = ollama.should_interact(post.content, interest)
                    context.log.debug(f"Ollama response: would_interact={would_interact}")

                    if would_interact:
                        # Weighted random action
                        action = random.choices(
                            ['view', 'like', 'comment'], weights=[0.5, 0.3, 0.2]
                        )[0]

                        context.log.info(f"User {user.username} will '{action}' post {post.id[:8]}...")

                        if action == 'view':
                            # Create view interaction
                            duration = random.randint(5, 60)
                            interaction = UserInteraction(
                                id=str(uuid.uuid4()),
                                user_id=user.id,
                                post_id=post.id,
                                interaction_type='view',
                                interaction_metadata={'duration_seconds': duration},
                                created_at=datetime.now(datetime.timezone.utc).replace(tzinfo=None),
                            )
                            session.add(interaction)
                            interactions_created += 1
                            interactions_by_type['view'] += 1
                            context.log.info(f"Created VIEW (duration={duration}s)")

                        elif action == 'like':
                            # Check if already liked (check UserInteraction for existing like)
                            existing_like = (
                                session.query(UserInteraction)
                                .filter_by(user_id=user.id, post_id=post.id, interaction_type='like')
                                .first()
                            )

                            if not existing_like:
                                # Create interaction record for like
                                interaction = UserInteraction(
                                    id=str(uuid.uuid4()),
                                    user_id=user.id,
                                    post_id=post.id,
                                    interaction_type='like',
                                    created_at=datetime.now(datetime.timezone.utc).replace(tzinfo=None),
                                )
                                session.add(interaction)
                                interactions_created += 1
                                interactions_by_type['like'] += 1
                                context.log.info(f"Created LIKE")
                            else:
                                context.log.debug(f"Already liked, skipping")

                        elif action == 'comment':
                            context.log.debug(f"Comment generation not yet implemented")
                            # TODO: Implement comment generation

                except Exception as e:
                    context.log.error(f"Error creating interaction: {e}")
                    continue

            context.log.info(f"User {user.username} evaluated {posts_evaluated} posts")

        except Exception as e:
            context.log.error(f"Error getting recommendations for user {user.username}: {e}")
            continue

    session.commit()
    context.log.info(f"Interaction simulation complete: {interactions_created} total (views={interactions_by_type['view']}, likes={interactions_by_type['like']}, comments={interactions_by_type['comment']})")
    session.close()

    return {"status": "success", "interactions": interactions_created}
