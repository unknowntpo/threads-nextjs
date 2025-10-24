"""Data Transfer Objects for recommendations."""

from pydantic import BaseModel, Field


class GenerateRecommendationsRequest(BaseModel):
    """Request for generating recommendations."""

    user_id: str = Field(..., description="User ID to generate recommendations for")
    limit: int = Field(50, ge=1, le=100, description="Maximum number of recommendations")
    exclude_post_ids: list[str] = Field(
        default_factory=list, description="Post IDs to exclude from recommendations"
    )


class RecommendationDTO(BaseModel):
    """Recommendation data transfer object."""

    post_id: str
    score: float = Field(..., ge=0.0, le=1.0)
    reason: str


class GenerateRecommendationsResponse(BaseModel):
    """Response containing recommendations."""

    user_id: str
    recommendations: list[RecommendationDTO]
    count: int
    model_version: str = "collaborative_filtering_v1"
