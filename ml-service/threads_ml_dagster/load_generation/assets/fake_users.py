"""Dagster asset for managing fake users."""
from dagster import asset

from app.domain.factories.fake_user_factory import FakeUserFactory
from app.infrastructure.database.queries import count_fake_users


@asset(required_resource_keys={"db", "ollama"})
def fake_users(context):
    """Ensure 5-10 fake users exist in database.

    Creates users with different interests if count is below target.
    """
    db = context.resources.db
    ollama = context.resources.ollama
    session = db()

    existing_count = count_fake_users(session)
    target_count = 8

    context.log.info(f"Fake users check: existing={existing_count}, target={target_count}")

    if existing_count >= target_count:
        context.log.info(f"Sufficient fake users exist ({existing_count}), skipping creation")
        session.close()
        return {"status": "sufficient", "count": existing_count}

    # Create missing users - cycle through interests until target reached
    factory = FakeUserFactory()
    created = 0
    users_needed = target_count - existing_count

    context.log.info(f"Creating {users_needed} new fake users")

    # Use modulo to cycle through interests if needed
    for i in range(users_needed):
        interest = FakeUserFactory.INTERESTS[i % len(FakeUserFactory.INTERESTS)]

        context.log.info(f"Creating fake user {i+1}/{users_needed} with interest: {interest}")
        user = factory.create_fake_user(interest, ollama, activity_level=0.7)
        context.log.info(f"Created user: {user.username} (id={user.id[:8]}...)")
        session.add(user)
        created += 1

    session.commit()
    final_count = count_fake_users(session)
    context.log.info(f"Fake users creation complete: created={created}, total={final_count}")
    session.close()

    return {"status": "created", "count": final_count, "created": created}
