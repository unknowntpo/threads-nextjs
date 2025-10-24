"""Database query helpers for fake user simulation."""
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.database.models import Post, User


def get_fake_users(session: Session) -> list[User]:
    """Get all fake users (bio starts with FAKE_USER).

    Args:
        session: Database session

    Returns:
        List of fake User models
    """
    stmt = select(User).where(User.bio.like('FAKE_USER%'))
    return list(session.execute(stmt).scalars().all())


def extract_interest_from_bio(bio: Optional[str]) -> Optional[str]:
    """Extract interest from FAKE_USER bio.

    Args:
        bio: User bio field

    Returns:
        Interest string (e.g., "sports") or None

    Example:
        "FAKE_USER: sports enthusiast" -> "sports"
    """
    if not bio or not bio.startswith("FAKE_USER:"):
        return None

    try:
        # Split on ":" and extract first word after prefix
        parts = bio.split(":", 1)[1].strip().split()
        return parts[0] if parts else None
    except Exception:
        return None


def get_recent_posts(session: Session, hours: int = 24) -> list[Post]:
    """Get posts from last N hours.

    Args:
        session: Database session
        hours: How many hours back to fetch

    Returns:
        List of recent Post models
    """
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    stmt = select(Post).where(Post.created_at >= cutoff).order_by(Post.created_at.desc())
    return list(session.execute(stmt).scalars().all())


def count_fake_users(session: Session) -> int:
    """Count total fake users.

    Args:
        session: Database session

    Returns:
        Number of fake users
    """
    return len(get_fake_users(session))
