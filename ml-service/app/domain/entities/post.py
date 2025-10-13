"""Post domain entity."""
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Post:
    """Post entity representing a post in the system."""

    id: str
    user_id: str
    content: str
    created_at: datetime
    updated_at: datetime
