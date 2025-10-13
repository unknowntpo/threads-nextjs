"""Pytest configuration and fixtures."""
import pytest


@pytest.fixture(scope="function", autouse=True)
async def cleanup_async_engine():
    """Cleanup async engine after each test to prevent event loop issues."""
    yield
    # Dispose engine after each test to prevent event loop reuse issues
    from app.infrastructure.database.connection import async_engine

    await async_engine.dispose()
