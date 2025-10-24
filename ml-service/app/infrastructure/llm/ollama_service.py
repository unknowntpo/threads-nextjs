"""Ollama LLM service implementation."""
import os
from typing import Optional

from ollama import Client

from app.domain.services.llm_interface import LLMInterface


class OllamaService(LLMInterface):
    """Ollama-based LLM service using Gemma 3 270M."""

    def __init__(self, base_url: Optional[str] = None, model: str = "gemma3:270m"):
        """Initialize Ollama client.

        Args:
            base_url: Ollama server URL (defaults to env var or docker service)
            model: Model name to use
        """
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
        self.model = model
        self.client = Client(host=self.base_url)

    def _create_system_prompt(self, interest: str, context: str = "user") -> str:
        """Create system prompt for given interest and context.

        Args:
            interest: User's interest topic
            context: Type of prompt - "user" (default), "passionate", or "helper"
        """
        if context == "passionate":
            return f"You are a Threads user who is passionate about {interest}."
        elif context == "helper":
            return f"You are helping generate usernames for a {interest} enthusiast."
        else:  # "user" or default
            return f"You are a Threads user who is interested in {interest}."

    def generate_post(self, interest: str) -> str:
        """Generate post content based on interest."""
        system_prompt = self._create_system_prompt(interest, "passionate")
        user_prompt = (
            f"Create a short social media post about {interest}. "
            f"Make it casual and engaging. Maximum 280 characters. "
            f"Do not use hashtags."
        )
        prompt = f"{system_prompt}\n\n{user_prompt}"

        response = self.client.generate(model=self.model, prompt=prompt)
        content = response['response'].strip()

        # Truncate if too long
        if len(content) > 280:
            content = content[:277] + "..."

        return content

    def generate_comment(self, post_content: str, interest: str) -> str:
        """Generate comment for a post."""
        system_prompt = self._create_system_prompt(interest)
        user_prompt = (
            f"Write a short, natural comment (1-2 sentences) on this post: \"{post_content}\". "
            f"Be friendly and relevant to the topic."
        )
        prompt = f"{system_prompt}\n\n{user_prompt}"

        response = self.client.generate(model=self.model, prompt=prompt)
        return response['response'].strip()

    def should_interact(self, post_content: str, interest: str) -> bool:
        """Decide if user would interact with post."""
        system_prompt = self._create_system_prompt(interest)
        user_prompt = (
            f"Would you interact with this post: \"{post_content}\"? "
            f"Answer ONLY 'yes' or 'no', nothing else."
        )
        prompt = f"{system_prompt}\n\n{user_prompt}"

        response = self.client.generate(model=self.model, prompt=prompt)
        answer = response['response'].strip().lower()

        # More lenient matching - check if yes appears anywhere in first few words
        first_word = answer.split()[0] if answer.split() else ''
        return 'yes' in first_word or 'yes' in answer[:10]

    def generate_display_name(self, interest: str) -> str:
        """Generate realistic display name."""
        system_prompt = self._create_system_prompt(interest, "helper")
        user_prompt = (
            f"Create a short, catchy display name (1-2 words) "
            f"for a {interest} enthusiast. "
            f"Just return the name, nothing else."
        )
        prompt = f"{system_prompt}\n\n{user_prompt}"

        response = self.client.generate(model=self.model, prompt=prompt)
        name = response['response'].strip()

        # Clean up any quotes or extra text
        name = name.replace('"', '').replace("'", '')

        # Handle empty response or whitespace-only response
        if not name or not name.split():
            return f"{interest}_fan"

        # Take first word only
        name = name.split()[0]

        return name[:20]  # Limit length
