"""Continuous load generation job (runs every 1 minute)."""
from dagster import job

from threads_ml_dagster.load_generation.assets.interactions import (
    simulated_interactions,
)
from threads_ml_dagster.load_generation.assets.posts import generated_posts


@job
def continuous_simulation():
    """Generate posts and interactions continuously."""
    posts = generated_posts()
    simulated_interactions(generated_posts=posts)
