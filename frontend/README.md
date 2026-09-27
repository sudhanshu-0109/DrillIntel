# eRTMAC-NWIS Frontend

The React 18 + TypeScript + Vite user interface for the **Nearby Wells Intelligence System (eRTMAC–NWIS)** (SIH26121 — Oil India Limited).

## Features
- **Real-Time Command Center**: Live telemetry, ROP, WOB, RPM, Torque, SPP, and Flow Out feeds via WebSockets.
- **Offset Well Intelligence**: 2D/3D geospatial visualization, offset well distance/azimuth scoring, and formation correlation.
- **AI Geotechnical Assistant & RAG**: Institutional memory retrieval from historical Daily Drilling Reports (DDR) and Well Completion Reports (WCR) with cited page previews.
- **Explainable ML Drilling Risk Engine**: Real-time stuck pipe, lost circulation, and kick risk predictions powered by XGBoost with SHAP attribution bars.
- **Drilling Governance & Alerts**: Alert triage, role-based acknowledge/escalate workflows, and immutable audit logging.

## Prerequisites
- Node.js >= 20.x
- npm >= 10.x

## Setup & Running

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional, defaults to localhost:8000)
cp .env.example .env

# 3. Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Production Build & Typecheck

```bash
# Typecheck
npx tsc --noEmit

# Production build
npm run build

# Preview build
npm run preview
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base URL for FastAPI REST backend | `http://localhost:8000/api` |
| `VITE_WS_URL` | WebSocket URL for live telemetry | `ws://localhost:8000` |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional GIS map key | None |
