"""Dagster resources for load generation."""
from threads_ml_dagster.load_generation.resources.db import DBResource
from threads_ml_dagster.load_generation.resources.ollama import OllamaResource

__all__ = ["DBResource", "OllamaResource"]
