"""Generate recommendations use case."""
from app.application.dto.recommendation_dto import (
    GenerateRecommendationsRequest,
    GenerateRecommendationsResponse,
    RecommendationDTO,
)
from app.domain.repositories.interaction_repository import InteractionRepository
from app.domain.services.recommender_interface import RecommenderInterface
from app.infrastructure.ml.collaborative_filter import CollaborativeFilterRecommender


class GenerateRecommendationsUseCase:
    """Use case for generating personalized recommendations."""

    def __init__(self, interaction_repository: InteractionRepository):
        self.interaction_repository = interaction_repository
        self.recommender: RecommenderInterface | None = None

    async def execute(
        self, request: GenerateRecommendationsRequest
    ) -> GenerateRecommendationsResponse:
        """Execute the use case to generate recommendations.

        Args:
            request: Request containing user_id and parameters

        Returns:
            Response containing list of recommendations
        """
        # Load all interactions for the recommender
        interactions = await self.interaction_repository.get_all_interactions()

        # Initialize and train recommender if not already done
        if self.recommender is None:
            self.recommender = CollaborativeFilterRecommender(interactions=interactions)
            await self.recommender.train()

        # Generate recommendations
        recommendations = await self.recommender.generate_recommendations(
            user_id=request.user_id,
            limit=request.limit,
            exclude_post_ids=request.exclude_post_ids,
        )

        # Convert to DTOs
        recommendation_dtos = [
            RecommendationDTO(
                post_id=rec.post_id,
                score=rec.score,
                reason=rec.reason,
            )
            for rec in recommendations
        ]

        return GenerateRecommendationsResponse(
            user_id=request.user_id,
            recommendations=recommendation_dtos,
            count=len(recommendation_dtos),
        )
