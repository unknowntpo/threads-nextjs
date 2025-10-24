"""Recommendations API router."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.recommendation_dto import GenerateRecommendationsRequest as UseCaseRequest
from app.presentation.api.dependencies import get_db_session, get_generate_recommendations_use_case
from app.presentation.schemas.recommendation_schemas import (
    GenerateRecommendationsRequest,
    GenerateRecommendationsResponse,
)


router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post("/generate", response_model=GenerateRecommendationsResponse)
async def generate_recommendations(
    request: GenerateRecommendationsRequest,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> GenerateRecommendationsResponse:
    """Generate personalized recommendations for a user.

    Args:
        request: Request containing user_id and parameters
        session: Database session

    Returns:
        Response containing list of recommendations
    """
    # Create use case with injected dependencies
    use_case = await get_generate_recommendations_use_case(session)

    # Convert API request to use case request
    use_case_request = UseCaseRequest(
        user_id=request.user_id,
        limit=request.limit,
        exclude_post_ids=request.exclude_post_ids,
    )

    # Execute use case
    result = await use_case.execute(use_case_request)

    # Convert use case response to API response
    return GenerateRecommendationsResponse(
        user_id=result.user_id,
        recommendations=[
            {
                "post_id": rec.post_id,
                "score": rec.score,
                "reason": rec.reason,
            }
            for rec in result.recommendations
        ],
        count=result.count,
        model_version=result.model_version,
    )
