import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import (
    auth, wells, formations, documents, ai, risk, alerts, stream, admin, health,
    location_analysis, research
)
from app.services.research_ingestion import research_catalog
try:
    from scripts.seed_demo_data import seed_all
except ImportError:
    from backend.scripts.seed_demo_data import seed_all

# Create tables
Base.metadata.create_all(bind=engine)

# In demo mode, automatically ensure demo data is populated and research manifest is indexed
if settings.DEMO_MODE:
    try:
        seed_all()
    except Exception as e:
        print(f"Seed note: {e}")
    try:
        research_catalog.initialize_index()
    except Exception as e:
        print(f"Research index note: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Nearby Wells Intelligence System (eRTMAC-NWIS) for Oil India Limited (SIH26121)",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers with standard API prefix
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(wells.router, prefix=settings.API_V1_STR)
app.include_router(formations.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(risk.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(stream.router)
app.include_router(admin.router)
app.include_router(health.router)
app.include_router(location_analysis.router, prefix=settings.API_V1_STR)
app.include_router(research.router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "product": "eRTMAC-NWIS",
        "description": "Nearby Wells Intelligence System - AI-Powered Offset-Well Knowledge & Drilling Decision Support",
        "problem_statement": "SIH26121 - Oil India Limited",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
