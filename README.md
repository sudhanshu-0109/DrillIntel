# eRTMAC–NWIS (Nearby Wells Intelligence System)

### AI-Powered Offset-Well Knowledge & Drilling Decision Support Platform
**SIH Problem Statement: SIH26121 • Oil India Limited (OIL)**

---

## 🌟 Executive Overview

During drilling operations, real-time telemetry streaming from an active well is traditionally isolated from the wealth of historical institutional memory locked in offset wells, Well Completion Reports (WCR), and Daily Drilling Reports (DDR).

**eRTMAC–NWIS** bridges this gap by acting as an institutional memory and decision-support layer for Oil India Limited's eRTMAC (enhanced Real-Time Monitoring & Analytics Center).

### Core Product Promise:
> *"What happened in nearby wells? Is the current well entering a similar situation? What evidence supports the alert?"*

---

## 🎯 Primary End-to-End Workflow

```
ACTIVE WELL (NWIS-ASSAM-003)
  ↓
CURRENT DEPTH (~3280m)
  ↓
CURRENT FORMATION (Tipam Sandstone)
  ↓
NEARBY OFFSET WELLS (Discovered via PostGIS spatial & geological similarity)
  ↓
HISTORICAL EVENTS (Differential sticking at 3262-3275m in NWIS-ASSAM-001)
  ↓
LIVE PARAMETER PATTERN (Torque escalates from 18 to 34 kNm, ROP drops 80%)
  ↓
ML RISK PREDICTION (XGBoost Stuck Pipe Classifier: 87% Probability, HIGH)
  ↓
SHAP EXPLANATION (Torque delta +16.2 kNm, ROP drop index 0.81, Tipam Sandstone)
  ↓
RAG EVIDENCE RETRIEVAL (Retrieves historical DDR-0032 Page 14)
  ↓
SOURCE DOCUMENT INSPECTION (Original daily report text with chemical soak pill)
  ↓
ENGINEER-IN-THE-LOOP ALERT (Drilling engineer acknowledges alert & logs audit trail)
```

---

## 🏛️ Monorepo Architecture

```
nwis/
  apps/
    web/                   # React 19 + TypeScript + Vite + Tailwind CSS + Zustand
    api/                   # FastAPI + Pydantic v2 + SQLAlchemy ORM
  services/
    document_ai/           # Layout-aware parser, metadata extractor & semantic chunker
    rag/                   # Hybrid lexical + vector retrieval & grounded synthesis
    ml_risk/               # XGBoost & Random Forest risk models + SHAP tree explainer
    realtime_simulator/    # WITSML-style telemetry generator & WebSocket broadcaster
    correlation/           # PostGIS & multi-criteria geological offset relevance engine
  data/
    public/                # Equinor Volve & Utah FORGE benchmark proxy data
    authorized/            # Authorized OIL / NDR datasets (when provisioned)
    synthetic/             # Synthesized Upper Assam stratigraphy & DDR corpus
    derived/               # Extracted features, embeddings & predictions
  models/                  # Model weights & metadata registry
  scripts/
    seed_demo_data.py      # Deterministic seed generator (5+ Assam wells, 150+ DDRs)
    run_demo_workflow.py   # Automated 12-step SIH demo verification script
  tests/
    test_backend.py        # Pytest test suite covering all APIs, RAG, ML, and Auth
  docker-compose.yml       # Production deployment (Postgres 16 + PostGIS + pgvector)
  README.md                # System documentation
  .env.example             # Environment configuration template
```

---

## 🎨 Visual System & Design Tokens

Designed following a modern drilling command center aesthetic:

| Role | Token / Hex | Purpose |
| :--- | :--- | :--- |
| **Canvas** | `#FBF4E6` | Warm cream operational background |
| **Navigation** | `#111111` | Icon-first dark sidebar rail & primary controls |
| **Brand Brown** | `#88713C` | Oil India themed accents, titles & active borders |
| **Research / Evidence** | `#FF9AD5` | Documents, RAG, and historical citations |
| **Operations** | `#F5D867` | Live workflow, telemetry, and activity |
| **Geology / Correlation** | `#9BAB64` | Formations, stratigraphy, and spatial map |
| **Live / Technical** | `#B7CBEB` | Sensor parameters and engineering metrics |
| **Semantic Green** | `#2E7D32` | Nominal / safe operations |
| **Semantic Amber** | `#ED6C02` | Precursor warning / elevated risk |
| **Semantic Red** | `#D32F2F` | Critical alert / active hazard |

---

## 🚀 Quick Start Guide

### Option 1: Docker Compose (Production Setup)

```bash
# 1. Clone repository
git clone <repo-url> nwis
cd nwis

# 2. Copy environment file
cp .env.example .env

# 3. Launch full stack (Postgres + pgvector + FastAPI + Web UI)
docker compose up --build
```
- **Web UI:** `http://localhost:3000`
- **FastAPI Docs:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/api/health`

---

### Option 2: Local Development (Zero-Docker Mode)

The system includes a zero-dependency dual-mode database layer that runs out-of-the-box using SQLite with python spatial/vector math.

#### 1. Backend Setup:
```bash
# Install dependencies
python -m pip install -r requirements.txt

# Seed the database with 5+ Assam wells, formations, trajectories, and 150+ DDRs
python scripts/seed_demo_data.py

# Start FastAPI server
python -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup:
```bash
cd apps/web

# Install packages
npm install

# Start Vite dev server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing & Verification

Run the comprehensive pytest suite:
```bash
python -m pytest tests/test_backend.py -v
```

Run the automated 12-step end-to-end SIH demonstration workflow:
```bash
python scripts/run_demo_workflow.py
```

---

## 🔑 Demo Personas (Pre-seeded)

All accounts use password: `nwis2026`

| Persona | Username | Role | Primary Workflow |
| :--- | :--- | :--- | :--- |
| **Piter Saikia** | `driller_piter` | `DRILLING_ENGINEER` | Monitors active well, reviews alerts, inspects DDR evidence |
| **Naveen Barua** | `sup_barua` | `DRILLING_SUPERVISOR` | Situation awareness, operational mitigation reviews |
| **Anamika Gogoi** | `geo_gogoi` | `GEOLOGIST` | Subsurface formation correlation & stratigraphy tops |
| **Ranjan Borkotoky**| `mud_borkotoky` | `MUD_ENGINEER` | Lost circulation, mud weight, and ECD monitoring |
| **System Admin** | `admin` | `ADMIN` | Model registry, data provenance, and immutable audit logs |

---

## 📜 Data Provenance Classes

To maintain petroleum data confidentiality and NDR compliance, all records in the system are explicitly tagged:
- **`PUBLIC DATA`**: Open benchmark datasets (Equinor Volve, Utah FORGE).
- **`AUTHORIZED DATA`**: Restricted OIL/NDR datasets accessible under authorized credentials.
- **`SYNTHETIC / DEMO`**: Clearly labelled synthetic proxy data simulating Upper Assam geology (Tipam & Girujan).
- **`DERIVED`**: Engineered features, ML predictions, and SHAP attributions.

> **CRITICAL RULE**: Synthetic observations are NEVER displayed as genuine Oil India historical data.
