"""Database resource for Dagster."""
from contextlib import contextmanager

from dagster import ConfigurableResource

from app.infrastructure.database.connection import get_sync_session


class DBResource(ConfigurableResource):
    """SQLAlchemy database session resource."""

    @contextmanager
    def get_session(self):
        """Get database session as context manager."""
        session = get_sync_session()
        try:
            yield session
        finally:
            session.close()

    def __call__(self):
        """Shorthand for getting session."""
        return get_sync_session()
