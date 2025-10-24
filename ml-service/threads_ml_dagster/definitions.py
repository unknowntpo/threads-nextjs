"""Top-level Dagster definitions for ML service."""
import os

from dagster import Definitions, load_assets_from_package_module

from threads_ml_dagster.load_generation import assets, jobs, resources, schedules

# Load all load generation assets
load_gen_assets = load_assets_from_package_module(assets)

# Define load generation resources
load_gen_resources = {
    "db": resources.DBResource(),
    "ollama": resources.OllamaResource(
        base_url=os.getenv("OLLAMA_BASE_URL", "http://ollama:11434"),
        model="gemma3:270m",
    ),
}

# Create combined definitions
defs = Definitions(
    assets=load_gen_assets,
    jobs=[jobs.continuous_simulation, jobs.manual_simulation],
    schedules=[schedules.continuous_schedule],
    resources=load_gen_resources,
)
