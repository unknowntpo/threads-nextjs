"""Post repository implementation using SQLAlchemy."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.post import Post as PostEntity
from app.domain.repositories.post_repository import PostRepository
from app.infrastructure.database.models import Post as PostModel


class SQLAlchemyPostRepository(PostRepository):
    """SQLAlchemy implementation of post repository."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_post_by_id(self, post_id: str) -> PostEntity | None:
        """Get a post by ID."""
        stmt = select(PostModel).where(PostModel.id == post_id)
        result = await self.session.execute(stmt)
        db_post = result.scalar_one_or_none()

        if db_post is None:
            return None

        return PostEntity(
            id=db_post.id,
            user_id=db_post.user_id,
            content=db_post.content,
            created_at=db_post.created_at,
            updated_at=db_post.updated_at,
        )

    async def get_all_posts(self, limit: int | None = None) -> list[PostEntity]:
        """Get all posts."""
        stmt = select(PostModel)
        if limit:
            stmt = stmt.limit(limit)

        result = await self.session.execute(stmt)
        db_posts = result.scalars().all()

        return [
            PostEntity(
                id=db_post.id,
                user_id=db_post.user_id,
                content=db_post.content,
                created_at=db_post.created_at,
                updated_at=db_post.updated_at,
            )
            for db_post in db_posts
        ]

    async def get_recent_posts(self, limit: int = 100) -> list[PostEntity]:
        """Get recent posts ordered by creation date."""
        stmt = select(PostModel).order_by(PostModel.created_at.desc()).limit(limit)
        result = await self.session.execute(stmt)
        db_posts = result.scalars().all()

        return [
            PostEntity(
                id=db_post.id,
                user_id=db_post.user_id,
                content=db_post.content,
                created_at=db_post.created_at,
                updated_at=db_post.updated_at,
            )
            for db_post in db_posts
        ]
