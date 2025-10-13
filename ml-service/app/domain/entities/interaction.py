"""Interaction domain entity."""
from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class Interaction:
    """User interaction with a post."""

    id: str
    user_id: str
    post_id: str
    interaction_type: str  # 'view', 'click', 'like', 'share'
    created_at: datetime
    metadata: dict[str, Any] | None = None

    # Interaction weights for scoring
    INTERACTION_WEIGHTS = {
        "view": 0.1,
        "click": 0.3,
        "like": 0.7,
        "share": 1.0,
    }

    def get_weight(self) -> float:
        """Get the weight for this interaction type."""
        return self.INTERACTION_WEIGHTS.get(self.interaction_type, 0.1)
