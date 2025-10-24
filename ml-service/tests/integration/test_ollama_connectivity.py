"""Basic connectivity test for Ollama service."""

import pytest
from ollama import Client


@pytest.fixture
def trivial_fixture():
    """Trivial fixture for debugging 🔧"""
    print("🔧 Setting up trivial fixture")
    yield "test_data"
    print("🧹 Cleaning up trivial fixture")


@pytest.mark.integration
def test_trivial(trivial_fixture):
    """Test trivial SYNC test 🧪"""
    print(f"✅ Trivial test running with: {trivial_fixture}")
    assert trivial_fixture == "test_data"


@pytest.fixture
def ollama_client():
    """Create Ollama client fixture 🤖"""
    print("🔧 Setting up Ollama client")
    client = Client(host="http://localhost:11434")
    yield client
    print("🧹 Cleaning up Ollama client")


@pytest.mark.integration
def test_ollama_connection(ollama_client):
    """Test basic connection to Ollama service 🔌"""
    # Simple list models call to verify connection
    response = ollama_client.list()
    assert response is not None
    print(f"✅ Connected to Ollama, models: {response}")


@pytest.mark.integration
def test_ollama_simple_generate(ollama_client):
    """Test simple text generation 💬"""
    response = ollama_client.generate(
        model="gemma3:270m", prompt="Say hello in one word"
    )
    assert response is not None
    assert "response" in response
    assert len(response["response"]) > 0
    print(f"✅ Generated response: {response['response'][:100]}")
