# Tiltfile for Local Kubernetes Development
# https://docs.tilt.dev/

# Allow k8s contexts (Docker Desktop, minikube, kind)
allow_k8s_contexts(['docker-desktop', 'minikube', 'kind-kind'])

# Load Kubernetes manifests from kustomize
k8s_yaml(kustomize('k8s/overlays/local'))

# ============================================================================
# Docker Images
# ============================================================================

# Next.js Application
docker_build(
  'nextjs-local',
  context='.',
  dockerfile='Dockerfile',
  # Only rebuild when these files change
  only=[
    'app/',
    'public/',
    'styles/',
    'prisma/',
    'auth.ts',
    'middleware.ts',
    'lib/',
    'components/',
    'package.json',
    'pnpm-lock.yaml',
    'tsconfig.json',
    'next.config.mjs',
    '.env',
    '.env.local',
    '.env.production',
  ],
  # Live update for faster development
  live_update=[
    sync('./app', '/app/app'),
    sync('./components', '/app/components'),
    sync('./lib', '/app/lib'),
    sync('./public', '/app/public'),
    sync('./styles', '/app/styles'),
    # Restart Next.js server on package.json changes
    sync('./package.json', '/app/package.json'),
    run('cd /app && pnpm install', trigger=['./package.json']),
  ],
)

# ML Service
docker_build(
  'ml-service-local',
  context='./ml-service',
  dockerfile='./ml-service/Dockerfile',
  only=[
    'ml-service/app/',
    'ml-service/requirements.txt',
    'ml-service/pyproject.toml',
  ],
  live_update=[
    sync('./ml-service/app', '/app/app'),
    sync('./ml-service/requirements.txt', '/app/requirements.txt'),
    run('pip install -r requirements.txt', trigger=['./ml-service/requirements.txt']),
  ],
)

# ============================================================================
# Kubernetes Resources
# ============================================================================

# PostgreSQL Database
k8s_resource(
  'postgres',
  port_forwards=['5432:5432'],
  labels=['database'],
  resource_deps=[],
)

# ML Service
k8s_resource(
  'ml-service',
  port_forwards=['8000:8000'],
  labels=['backend'],
  resource_deps=['postgres'],
  # Auto-rebuild on code changes
  auto_init=True,
  trigger_mode=TRIGGER_MODE_AUTO,
)

# Next.js Application
k8s_resource(
  'nextjs',
  port_forwards=['3000:3000'],
  labels=['frontend'],
  resource_deps=['postgres', 'ml-service'],
  # Auto-rebuild on code changes
  auto_init=True,
  trigger_mode=TRIGGER_MODE_AUTO,
)

# ============================================================================
# Custom Buttons (Tilt UI)
# ============================================================================

# Database migrations
local_resource(
  'db-migrate',
  cmd='kubectl exec -it deployment/nextjs -n threads -- pnpm prisma migrate deploy',
  resource_deps=['nextjs'],
  labels=['database'],
  auto_init=False,  # Manual trigger only
  trigger_mode=TRIGGER_MODE_MANUAL,
)

# Database seed
local_resource(
  'db-seed',
  cmd='kubectl exec -it deployment/nextjs -n threads -- pnpm prisma db seed',
  resource_deps=['nextjs', 'db-migrate'],
  labels=['database'],
  auto_init=False,  # Manual trigger only
  trigger_mode=TRIGGER_MODE_MANUAL,
)

# Generate Prisma client
local_resource(
  'prisma-generate',
  cmd='kubectl exec -it deployment/nextjs -n threads -- pnpm prisma generate',
  resource_deps=['nextjs'],
  labels=['database'],
  auto_init=False,  # Manual trigger only
  trigger_mode=TRIGGER_MODE_MANUAL,
)

# Run tests
local_resource(
  'test-nextjs',
  cmd='kubectl exec -it deployment/nextjs -n threads -- pnpm test',
  resource_deps=['nextjs'],
  labels=['testing'],
  auto_init=False,  # Manual trigger only
  trigger_mode=TRIGGER_MODE_MANUAL,
)

# Lint code
local_resource(
  'lint',
  cmd='pnpm lint',
  labels=['quality'],
  auto_init=False,  # Manual trigger only
  trigger_mode=TRIGGER_MODE_MANUAL,
)

# ============================================================================
# Helper Functions
# ============================================================================

# Print startup message
print("""
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 Threads Local Development Environment                   ║
║                                                               ║
║   Services:                                                   ║
║   - Next.js:    http://localhost:3000                         ║
║   - ML Service: http://localhost:8000                         ║
║   - PostgreSQL: localhost:5432                                ║
║                                                               ║
║   Tilt UI:      http://localhost:10350                        ║
║                                                               ║
║   Quick commands:                                             ║
║   - 'q' to quit                                               ║
║   - 'r' to rebuild all                                        ║
║   - Click resource names to view logs                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
""")

# Watch for additional file changes
watch_file('k8s/overlays/local')
watch_file('k8s/base')
