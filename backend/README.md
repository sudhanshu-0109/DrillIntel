# eRTMAC-NWIS Backend

FastAPI, AI/ML, and RAG Intelligence Backend for the **Nearby Wells Intelligence System (eRTMAC–NWIS)** (SIH26121 — Oil India Limited).

## Architecture Overview

```
backend/
├── app/
│   ├── main.py              # FastAPI application root & middleware
│   ├── config.py            # Pydantic Settings configuration
│   ├── database.py          # SQLAlchemy engine, session maker, get_db
│   ├── auth.py              # PBKDF2 password hashing & JWT token verification
│   ├── models_db.py         # SQLAlchemy ORM models (Well, Formation, Event, etc.)
│   ├── schemas.py           # Pydantic request & response DTOs
│   ├── models/              # Re-exports models from models_db
│   ├── schemas/             # Re-exports schemas from schemas
│   ├── routers/             # API routers (wells, formations, risk, ai, alerts, etc.)
│   ├── ml/                  # Feature engineering & ML risk models (XGBoost + SHAP)
│   ├── rag/                 # Institutional memory retrieval & RAG engine
│   ├── realtime/            # Telemetry simulator & WebSocket manager
│   ├── services/            # Domain services (spatial correlation, document AI)
│   └── utils/               # Shared backend utilities
├── migrations/              # Database migration scripts
├── scripts/
│   ├── seed_demo_data.py    # Complete database seeding script
│   └── run_demo_workflow.py # End-to-end automated demo validation
├── tests/
│   └── test_backend.py      # Automated Pytest suite
├── requirements.txt         # Python dependencies
├── Dockerfile               # Production container definition
├── nwis_demo.db             # Pre-seeded SQLite demo database
├── .env.example             # Backend environment template
└── README.md
```

## Setup & Running

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Optional: Configure environment
cp .env.example .env

# 5. Seed database (automatic on startup in DEMO_MODE=true)
python scripts/seed_demo_data.py

# 6. Start backend development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Testing & Validation

```bash
# Run full Pytest test suite:
pytest tests/ -v

# Run the complete end-to-end workflow validation script:
python scripts/run_demo_workflow.py
```

## API Documentation
Once running, interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Endpoint: `http://localhost:8000/api/health`
