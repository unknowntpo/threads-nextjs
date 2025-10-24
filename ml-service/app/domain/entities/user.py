"""User domain entity."""

from dataclasses import dataclass
from datetime import datetime


@dataclass
class User:
    """User entity representing a user in the system."""

    id: str
    username: str
    email: str
    created_at: datetime
