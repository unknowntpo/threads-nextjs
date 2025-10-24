"""Dagster asset for generating posts from fake users."""
import random
import uuid
from datetime import datetime

from dagster import asset

from app.infrastructure.database.models import Post
from app.infrastructure.database.queries import extract_interest_from_bio, get_fake_users


@asset(deps=["fake_users"], required_resource_keys={"db", "ollama"})
def generated_posts(context):
    """Generate 3-5 posts from random fake users.

    Uses Ollama to create interest-based content.
    """
    db = context.resources.db
    ollama = context.resources.ollama
    session = db()

    fake_user_list = get_fake_users(session)
    context.log.info(f"Found {len(fake_user_list)} fake users in database")

    if not fake_user_list:
        context.log.warning("No fake users found, cannot generate posts")
        session.close()
        return {"status": "no_fake_users", "posts_created": 0}

    # Generate 3-5 posts (higher count for better interactions)
    posts_to_create = random.randint(3, 5)
    context.log.info(f"Generating {posts_to_create} posts from fake users")
    posts_created = 0

    for i in range(posts_to_create):
        user = random.choice(fake_user_list)
        interest = extract_interest_from_bio(user.bio)

        context.log.info(f"Post {i+1}/{posts_to_create}: Selected user {user.username} (interest={interest})")

        if not interest:
            context.log.warning(f"No interest found for user {user.username}, skipping")
            continue

        try:
            context.log.info(f"Calling Ollama to generate post about '{interest}'...")
            content = ollama.generate_post(interest)
            context.log.info(f"Ollama generated: {content[:80]}..." if len(content) > 80 else f"Ollama generated: {content}")

            post = Post(
                id=str(uuid.uuid4()),
                user_id=user.id,
                content=content,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

            session.add(post)
            posts_created += 1
            context.log.info(f"Post created: id={post.id[:8]}..., user={user.username}")
        except Exception as e:
            context.log.error(f"Error generating post for {user.username}: {e}")
            continue

    session.commit()
    context.log.info(f"Post generation complete: {posts_created}/{posts_to_create} posts created successfully")
    session.close()

    return {"status": "success", "posts_created": posts_created}
