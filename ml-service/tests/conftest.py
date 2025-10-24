"""Pytest configuration and fixtures."""

import pytest


def pytest_collection_modifyitems(config, items):
    """Add integration marker to tests in integration folder."""
    for item in items:
        if "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
