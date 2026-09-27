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
NEARBY OFFSET WELLS (Discovered via spatial & geological multi-criteria similarity)
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

## 🏛️ Repository Architecture

```
nwis/
│
├── frontend/                    # Independent React 18 + TypeScript + Vite UI
│   ├── src/
│   │   ├── components/          # Reusable UI widgets, layout & risk cards
│   │   ├── pages/               # 12 domain pages (Command Center, Risk, RAG, etc.)
│   │   ├── services/            # REST API client & WebSocket streaming manager
│   │   ├── store/               # Zustand application & telemetry state
│   │   ├── types/               # TypeScript domain interfaces
│   │   └── App.tsx / main.tsx
│   ├── public/                  # Static assets
│   ├── package.json             # Frontend dependencies & scripts
│   ├── vite.config.ts           # Vite configuration
│   ├── tsconfig*.json           # TypeScript configuration
│   ├── Dockerfile               # Nginx production container
│   ├── .env.example             # Frontend environment template
│   └── README.md                # Frontend documentation
│
├── backend/                     # Independent FastAPI Python Intelligence Backend
│   ├── app/
│   │   ├── main.py              # Application entrypoint & middleware
│   │   ├── config.py            # Pydantic configuration & env loading
│   │   ├── database.py          # SQLAlchemy engine, session maker, get_db
│   │   ├── auth.py              # PBKDF2 hashing & JWT authentication
│   │   ├── models_db.py         # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request & response schemas
│   │   ├── models/              # Entity model package
│   │   ├── routers/             # REST & WebSocket routers
│   │   ├── ml/                  # Feature engineering & ML risk models (XGBoost + SHAP)
│   │   ├── rag/                 # Institutional memory retrieval & RAG engine
│   │   ├── realtime/            # Telemetry simulator & WebSocket manager
│   │   ├── services/            # Domain services (spatial correlation, document AI)
│   │   └── utils/               # Utilities
│   ├── migrations/              # Database migrations
│   ├── scripts/
│   │   ├── seed_demo_data.py    # Seed generator (5+ Assam wells, 150+ DDRs)
│   │   └── run_demo_workflow.py # Automated end-to-end verification script
│   ├── tests/
│   │   └── test_backend.py      # Pytest test suite (10/10 tests)
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile               # Python production container
│   ├── nwis_demo.db             # Pre-seeded SQLite demo database
│   ├── .env.example             # Backend environment template
│   └── README.md                # Backend documentation
│
├── data/                        # Shared datasets
│   ├── public/                  # Open benchmark proxy data
│   ├── authorized/              # Authorized OIL/NDR datasets
│   ├── synthetic/               # Synthesized Upper Assam stratigraphy & DDR corpus
│   └── derived/                 # Extracted features, embeddings & predictions
│
├── docs/                        # Specifications & Architecture Documentation
│   ├── ARCHITECTURE.md          # System architecture breakdown
│   ├── ML_RAG_SPECIFICATION.md  # ML risk & RAG pipeline specification
│   └── SIH_DEMO_WALKTHROUGH.md  # Hackathon jury walkthrough script
│
├── infra/                       # Shared infrastructure configurations
│   └── nginx.conf               # Nginx reverse proxy configuration
│
├── docker-compose.yml           # Production multi-service Docker composition
├── .env.example                 # Root environment reference
├── .gitignore                   # Version control ignore rules
└── README.md                    # Root repository documentation
```

---

## 🇮🇳 India-Wide Drilling Intelligence & Research Manifest Layer

NWIS is expanded from an Assam-focused demo into a national, location-aware drilling intelligence platform using the research datasets in `nwis/researchFiles/`.

```
nwis/
├── researchFiles/
│   ├── nwis_india_hydrocarbon_drilling_activity_master.csv  # CANONICAL structured manifest (UTF-8)
│   └── nwis_india_hydrocarbon_drilling_activity_master.xlsx # Human audit / reference copy
```

### 1. Dual Version Audit & Canonical Designation
- **Canonical Source:** `nwis_india_hydrocarbon_drilling_activity_master.csv` is designated as the primary machine-ingestion dataset.
- **Reference Copy:** `nwis_india_hydrocarbon_drilling_activity_master.xlsx` serves as the human audit copy.
- **Reconciliation Status:** Full cell-by-cell audit across all 48 records and 17 columns confirms 100% equivalence (0 conflicting values).

### 2. Research Ingestion Architecture (`backend/app/services/research_ingestion/`)
- `research_models.py`: Strongly typed Pydantic & dataclass definitions for `NationalActivityArea`, `RegionalDrillingContext`, `NationalCoverageSummary`, and `IngestionReport`.
- `research_loader.py`: Dual-format loader with cell-by-cell cross-verification and reconciliation tracking.
- `research_validation.py`: Strict domain vocabulary enforcement, coordinate bounding checks, and non-fabrication guarantees.
- `research_normalizer.py`: Standardizes regional nomenclature, unicode punctuation, and geo-anchors across all 48 activity corridors.
- `research_catalog.py`: In-memory spatial index, SQLite database synchronizer, spatial distance scoring, and prioritized acquisition roadmap generator.
- `research_sources.py`: Source citation registry tracking institutional references (DGH, OIL, ONGC, Cairn, MoPNG) under snapshot version `2026-09`.

### 3. Absolute Non-Fabrication Rule & `RESEARCH_MANIFEST` Provenance
- Research manifest rows represent **National Drilling Activity & Geographic Intelligence**.
- **Rule:** Manifest rows are NEVER converted into fabricated operational well records, fake formation tops, synthetic mud loss incidents, or invented pressure logs.
- Dedicated provenance tag: **`RESEARCH_MANIFEST`** strictly isolates area intelligence from operational logs (`DIRECT`, `REGIONAL`, `ANALOG`, `SYNTHETIC`, `PUBLIC`, `AUTHORIZED`, `DERIVED`).
- Activity tier does not equal geological risk. Risk predictions remain strictly evidence-backed.

### 4. India-Wide Sedimentary Basin Support & Location Analysis
- Supports all **27 Indian Sedimentary Basins** across Category I (mature/producing), Category II (proven commercial), Category III (prospective), and Category IV (frontier/deepwater).
- Location search orchestrates a **10-step Pan-India workflow**:
  ```
  1. Geocode location query (e.g. "Dattapura, Waghodia, Vadodara")
  2. Resolve coordinates (e.g. 22.2858° N, 73.3768° E)
  3. Determine Indian administrative context (Vadodara District, Gujarat)
  4. Determine geological sedimentary basin context (Cambay Basin, South Cambay Block)
  5. Search direct nearby offset wells (5km → 15km → 30km radius)
  6. Search national research activity manifest (e.g. Padra-Karjan Oil/Gas Corridor IN-CB-03)
  7. If direct wells are absent, discover technical analog wells by depth & casing design
  8. Inspect documented regional hazards, stratigraphy, and watch items
  9. Calculate defensible data confidence level (MODERATE/LOW with zero fabricated events)
  10. Generate comprehensive Engineering Brief with dedicated Regional Drilling Context
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

### Option 1: Docker Compose (Full Stack)

```bash
# 1. Clone repository
git clone <repo-url> nwis
cd nwis

# 2. Launch full stack (Postgres + pgvector + FastAPI + Web UI)
docker compose up --build
```
- **Web UI:** `http://localhost:3000`
- **FastAPI Docs:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/api/health`

---

### Option 2: Local Development (Separate Frontend & Backend)

The system includes a zero-dependency dual-mode database layer that runs out-of-the-box using SQLite.

#### 1. Backend Setup:
```bash
cd backend

# Create & activate virtual environment (optional but recommended)
python -m venv .venv
.venv\Scripts\activate   # On Windows
# source .venv/bin/activate  # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Seed the database (automatic on startup in DEMO_MODE=true)
python scripts/seed_demo_data.py

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API runs at: `http://localhost:8000` (Docs: `http://localhost:8000/docs`).

#### 2. Frontend Setup:
```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing & Verification

### Backend Pytest Suite (28 Tests):
```bash
cd backend
python -m pytest tests/ -v
```
Includes:
- `test_research_ingestion.py`: CSV/XLSX loading, reconciliation, deduplication, normalization, catalog search, REST endpoints.
- `test_india_wide_location.py`: Pan-India location tests (Assam, Vadodara/Dattapura, Barmer, Ankleshwar, Kakinada, Cauvery, Mahanadi, Mumbai Offshore, Andaman, Frontier, Zero-data).
- `test_backend.py`: Core RAG, ML risk, alerts, audit, health, offset well correlation.

### Full Automated E2E Demo Scenario:
```bash
cd backend
python scripts/run_demo_workflow.py
```

### Frontend Build & Typecheck:
```bash
cd frontend
npx tsc -b
npm run build
```

---

## 🌐 National Research REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/research/coverage` | Nationwide research coverage, basin breakdown & Data Acquisition Roadmap |
| `GET` | `/api/research/areas` | Filtered search by text query, basin, state, data priority, or activity tier |
| `GET` | `/api/research/areas/{id}` | Get detailed intelligence for a specific research manifest area |
| `GET` | `/api/research/context` | Regional drilling context & hazards for coordinates (`lat`, `lng`) |
| `GET` | `/api/research/basin/{basin}` | List all research manifest areas in a specific sedimentary basin |
| `GET` | `/api/research/state/{state}` | List all research manifest areas in a specific Indian state / UT |
| `POST`| `/api/research/refresh` | Admin endpoint to re-scan `researchFiles/`, validate, normalize, and sync |

---

## 🔑 Demo Personas (Pre-seeded)

All accounts use password: `nwis2026`

| Persona | Username | Role | Primary Workflow |
| :--- | :--- | :--- | :--- |
| **Piter Saikia** | `driller_piter` | `DRILLING_ENGINEER` | Monitors active well, reviews alerts, plans new wells, inspects DDR evidence |
| **Naveen Barua** | `sup_barua` | `DRILLING_SUPERVISOR` | Situation awareness, operational mitigation reviews |
| **Anamika Gogoi** | `geo_gogoi` | `GEOLOGIST` | Subsurface formation correlation & stratigraphy tops |
| **Ranjan Borkotoky**| `mud_borkotoky` | `MUD_ENGINEER` | Lost circulation, mud weight, and ECD monitoring |
| **System Admin** | `admin` | `ADMIN` | Model registry, data provenance, national coverage roadmap, audit logs |

---

## 📜 Data Provenance Classes

To maintain petroleum data confidentiality and NDR compliance, all records in the system are explicitly tagged:
- **`RESEARCH_MANIFEST`**: Documented national activity areas from official DGH/OIL/ONGC publications (Macro area intelligence).
- **`PUBLIC DATA`**: Open benchmark datasets (Equinor Volve, Utah FORGE).
- **`AUTHORIZED DATA`**: Restricted OIL/NDR datasets accessible under authorized credentials.
- **`SYNTHETIC / DEMO`**: Clearly labelled synthetic proxy data simulating Upper Assam geology (Tipam & Girujan).
- **`DERIVED`**: Engineered features, ML predictions, and SHAP attributions.

> **CRITICAL RULE**: Research manifest rows and synthetic observations are NEVER displayed as genuine unverified offset well records.

