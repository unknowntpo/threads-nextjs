"""Continuous load generation schedule (every 1 minute)."""
from dagster import ScheduleDefinition

from threads_ml_dagster.load_generation.jobs.continuous import continuous_simulation


# Schedule: Every 1 minute
continuous_schedule = ScheduleDefinition(
    job=continuous_simulation,
    cron_schedule="*/1 * * * *",  # Every minute
    name="continuous_load_generation_schedule",
)
