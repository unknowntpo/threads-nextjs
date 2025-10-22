#!/bin/bash
#
# Startup script for e2-micro VM
# Installs Docker, Docker Compose, and deploys PostgreSQL + Dagster services
#

set -e

# Update system packages
apt-get update
apt-get upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    DOCKER_COMPOSE_VERSION="v2.24.0"
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
fi

# Create docker-compose directory
mkdir -p /opt/threads
cd /opt/threads

# Create docker-compose.yml for PostgreSQL + Dagster
cat > docker-compose.yml <<'EOF'
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: threads
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    command: |
      sh -c 'cat <<'\''EOFINNER'\'' | sh
      #!/bin/sh
      docker-entrypoint.sh postgres &
      PID=$!
      until pg_isready -U ${POSTGRES_USER} -h localhost; do sleep 1; done
      psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "CREATE DATABASE dagster" 2>/dev/null || true
      wait $PID
      EOFINNER
      '
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  ollama:
    image: ollama/ollama:latest
    restart: unless-stopped
    ports:
      - '11434:11434'
    volumes:
      - ollama_data:/root/.ollama
    healthcheck:
      test: ['CMD', 'ollama', 'list']
      interval: 30s
      timeout: 10s
      retries: 3
    entrypoint: >
      sh -c "
        ollama serve &
        OLLAMA_PID=\$\$!
        sleep 5
        ollama pull gemma3:270m
        wait \$\$OLLAMA_PID
      "

  dagster_webserver:
    image: ghcr.io/unknowntpo/threads-ml:latest
    restart: unless-stopped
    ports:
      - '3001:3001'
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/threads
      DAGSTER_DATABASE_URL: postgresql://postgres:${DAGSTER_POSTGRES_PASSWORD}@postgres:5432/dagster
      OLLAMA_BASE_URL: http://ollama:11434
      DAGSTER_HOME: /app/dagster_home
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - dagster_data:/app/dagster_home
    entrypoint:
      - uv
      - run
      - dagster-webserver
      - -h
      - 0.0.0.0
      - -p
      - '3001'
      - -w
      - /app/workspace.yaml
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3001/server_info']
      interval: 30s
      timeout: 10s
      retries: 3

  dagster_daemon:
    image: ghcr.io/unknowntpo/threads-ml:latest
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/threads
      DAGSTER_DATABASE_URL: postgresql://postgres:${DAGSTER_POSTGRES_PASSWORD}@postgres:5432/dagster
      OLLAMA_BASE_URL: http://ollama:11434
      DAGSTER_HOME: /app/dagster_home
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - dagster_data:/app/dagster_home
    entrypoint:
      - uv
      - run
      - dagster-daemon
      - run

volumes:
  postgres_data:
  ollama_data:
  dagster_data:
EOF

# Create .env file with secrets
cat > .env <<EOF
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
DAGSTER_POSTGRES_PASSWORD=${DAGSTER_POSTGRES_PASSWORD}
EOF

# Start services
echo "Starting Docker Compose services..."
docker-compose up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 30

# Check service status
docker-compose ps

echo "Startup script completed successfully!"
