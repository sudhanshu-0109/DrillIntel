# eRTMAC–NWIS Architecture & Technical Specification

## 1. System Context & Architecture Diagram

```mermaid
graph TD
    subgraph Data Sources
        OIL_eRTMAC["OIL eRTMAC Stream (Proxy/Live)"]
        NDR_Archive["NDR / DGH Historical Archive"]
        Public_Volve["Equinor Volve Public Benchmark"]
        Public_FORGE["Utah FORGE Geothermal Benchmark"]
    end

    subgraph Data Provenance & Ingestion Layer
        Parser["Layout-Aware Parser / OCR"]
        Chunker["Depth & Event-Aware Chunker"]
        ProvenanceTag["Provenance Governance (Public/Auth/Synth/Derived)"]
    end

    subgraph Storage Layer
        Postgres[("PostgreSQL 16 Master DB")]
        PostGIS[("PostGIS 3D Spatial Geometry")]
        pgvector[("pgvector Embeddings Index")]
    end

    subgraph Core Engines
        SpatialEngine["Multi-Criteria Offset Engine\n(Distance, Formation, Depth Overlap, Trajectory)"]
        RAGEngine["Depth-Aware Grounded RAG\n(BM25 Lexical + Dense Semantic Retrieval)"]
        Simulator["Realtime WITSML Telemetry Simulator\n(1-second interval, 1x-5x Speed)"]
        FeatureStore["Rolling Feature Engineering\n(Delta Torque, ROP Drop Index, MSE, ECD)"]
        MLEngine["ML Risk Engine\n(XGBoost Precursor Classifier)"]
        SHAPEngine["SHAP Explainability Engine\n(Local Feature Attribution)"]
    end

    subgraph Decision Support & API
        FastAPI["FastAPI REST & WebSocket Layer"]
        AlertEngine["Evidence-Backed Alert Engine\n(What, Where, When, Why, Evidence, Source)"]
        AuditTrail["Immutable Audit Trail & RBAC"]
    end

    subgraph Frontend Workspace
        CommandCenter["Command Center Dashboard"]
        OffsetMap["Geospatial Offset Map"]
        Correlation["Formation Correlation View"]
        DocAI["Document Intelligence & Viewer"]
        Assistant["Context-Aware AI Assistant"]
        LiveOps["Live Telemetry Monitoring"]
    end

    OIL_eRTMAC --> Simulator
    NDR_Archive --> Parser
    Public_Volve --> Parser
    Public_FORGE --> Simulator

    Parser --> Chunker --> ProvenanceTag --> Postgres
    ProvenanceTag --> pgvector

    Simulator --> FeatureStore --> MLEngine --> SHAPEngine
    Postgres --> SpatialEngine
    PostGIS --> SpatialEngine
    pgvector --> RAGEngine

    SpatialEngine --> AlertEngine
    RAGEngine --> AlertEngine
    SHAPEngine --> AlertEngine
    MLEngine --> AlertEngine

    AlertEngine --> FastAPI
    FastAPI --> CommandCenter
    FastAPI --> OffsetMap
    FastAPI --> Correlation
    FastAPI --> DocAI
    FastAPI --> Assistant
    FastAPI --> LiveOps
    CommandCenter --> AuditTrail
```

## 2. Multi-Criteria Offset Relevance Scoring

Rather than relying solely on surface Euclidean distance, NWIS computes a progressive composite relevance score:

$$\text{Relevance Score} = 0.25 \cdot S_{\text{dist}} + 0.25 \cdot S_{\text{formation}} + 0.20 \cdot S_{\text{depth}} + 0.15 \cdot S_{\text{trajectory}} + 0.15 \cdot S_{\text{event}}$$

Where:
- $S_{\text{dist}}$: Exponential spatial decay over the configured search radius ($15 \text{ km}$).
- $S_{\text{formation}}$: Exact lithological match in target formation (e.g. Tipam Sandstone = 1.0).
- $S_{\text{depth}}$: Overlap in exploration depth window ($|MD_{\text{active}} \pm 300\text{m}| \cap |0, TD_{\text{offset}}|$).
- $S_{\text{trajectory}}$: 3D wellbore lateral divergence calculated via directional survey inclination and azimuth.
- $S_{\text{event}}$: Verified historical operational events (stuck pipe, mud loss, kick) recorded in the same formation.

## 3. Real-Time Streaming Architecture

### MVP:
- Native WebSocket connection (`/ws/live-well/{well_id}`) delivering structured JSON packets at 1 Hz.
- Normalizes incoming measurements once in Zustand state to prevent whole-dashboard re-renders.

### Future Enterprise Integration:
- Apache Kafka topic: `ertmac.rig.witsml.v1`
- MQTT edge broker deployed at wellsite rig cabins.
- WITSML 1.4.1 / 2.0 XML schema translation microservice.
