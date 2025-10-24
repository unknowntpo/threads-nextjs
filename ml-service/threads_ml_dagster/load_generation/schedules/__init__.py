"""Dagster schedules for load generation."""
from threads_ml_dagster.load_generation.schedules.continuous_schedule import (
    continuous_schedule,
)

__all__ = ["continuous_schedule"]
