"""Ollama LLM resource for Dagster."""
import os

from dagster import ConfigurableResource

from app.infrastructure.llm.ollama_service import OllamaService


class OllamaResource(ConfigurableResource):
    """Ollama LLM service resource."""

    base_url: str = "http://ollama:11434"
    model: str = "gemma3:270m"

    def get_service(self) -> OllamaService:
        """Get Ollama service instance."""
        return OllamaService(base_url=self.base_url, model=self.model)

    def __getattr__(self, name):
        """Delegate method calls to OllamaService."""
        service = self.get_service()
        return getattr(service, name)
