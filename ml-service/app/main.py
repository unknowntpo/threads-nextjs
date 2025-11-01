"""FastAPI application entry point."""

from fastapi import FastAPI

from app.presentation.api.routers import recommendations


app = FastAPI(
    title="Threads ML Service",
    description="ML-powered feed recommendation service",
    version="0.1.1",
)

# Include routers
app.include_router(recommendations.router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "threads-ml-service",
        "version": "0.1.2",  # Testing ArgoCD Image Updater
    }
