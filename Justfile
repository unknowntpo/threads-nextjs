# Justfile for managing multi-compose Docker services

# Default recipe - show available commands
default:
    @just --list

# Start all services (main + ML)
up:
    docker-compose -f docker-compose.yml -f ml-service/docker-compose.yml up -d

# Stop all services
down:
    docker-compose -f docker-compose.yml -f ml-service/docker-compose.yml down

# Build all services
build:
    docker-compose -f docker-compose.yml -f ml-service/docker-compose.yml build

# Build and start all services
up-build:
    docker-compose -f docker-compose.yml -f ml-service/docker-compose.yml up -d --build

# View logs for all services
logs:
    docker-compose -f docker-compose.yml -f ml-service/docker-compose.yml logs -f

# View logs for specific service
logs-service service:
    docker-compose -f docker-compose.yml -f ml-service/docker-compose.yml logs -f {{service}}

# Show status of all services
ps:
    docker-compose -f docker-compose.yml -f ml-service/docker-compose.yml ps

# Restart all services
restart:
    docker-compose -f docker-compose.yml -f ml-service/docker-compose.yml restart

# Restart specific service
restart-service service:
    docker-compose -f docker-compose.yml -f ml-service/docker-compose.yml restart {{service}}

# Start only main services (without ML)
up-main:
    docker-compose up -d

# Start only ML services
up-ml:
    docker-compose -f ml-service/docker-compose.yml up -d

# Stop and remove all containers, networks, volumes
clean:
    docker-compose -f docker-compose.yml -f ml-service/docker-compose.yml down -v

# Execute command in a service
exec service +command:
    docker-compose -f docker-compose.yml -f ml-service/docker-compose.yml exec {{service}} {{command}}

# Run Dagster job
dagster-job job:
    docker exec threads_dagster_webserver uv run dagster job launch --location definitions.py -j {{job}} -w /app/workspace.yaml
