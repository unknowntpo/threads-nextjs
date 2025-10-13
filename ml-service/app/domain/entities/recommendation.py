"""Recommendation domain entity."""
from dataclasses import dataclass


@dataclass
class Recommendation:
    """Recommendation entity representing a post recommendation for a user."""

    user_id: str
    post_id: str
    score: float
    reason: str = "collaborative_filtering"

    def __post_init__(self):
        """Validate recommendation score."""
        if not 0.0 <= self.score <= 1.0:
            raise ValueError(f"Score must be between 0 and 1, got {self.score}")
