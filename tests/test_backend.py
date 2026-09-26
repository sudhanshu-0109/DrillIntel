import pytest
from fastapi.testclient import TestClient
from apps.api.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert "subsystems" in data
    assert data["subsystems"]["api"]["status"] == "HEALTHY"
    assert data["subsystems"]["ml"]["status"] == "HEALTHY"

def test_wells_list():
    res = client.get("/api/wells")
    assert res.status_code == 200
    wells = res.json()
    assert len(wells) >= 5
    well_ids = [w["well_id"] for w in wells]
    assert "NWIS-ASSAM-003" in well_ids
    assert "NWIS-ASSAM-001" in well_ids

def test_nearby_offsets():
    res = client.get("/api/wells/nearby?well_id=NWIS-ASSAM-003&radius=15")
    assert res.status_code == 200
    offsets = res.json()
    assert len(offsets) >= 3
    # Top offset should be NWIS-ASSAM-001 due to formation match, depth overlap, and historical events
    top_offset = offsets[0]
    assert top_offset["well_id"] == "NWIS-ASSAM-001"
    assert top_offset["distance_km"] < 5.0
    assert top_offset["relevance_score"] > 80.0

def test_well_detail_and_formations():
    res = client.get("/api/wells/NWIS-ASSAM-003")
    assert res.status_code == 200
    w = res.json()
    assert w["well_id"] == "NWIS-ASSAM-003"
    assert len(w["formations"]) >= 5

    res_curr_form = client.get("/api/formations/current?well_id=NWIS-ASSAM-003&depth=3280")
    assert res_curr_form.status_code == 200
    curr_f = res_curr_form.json()
    assert curr_f["formation_name"] == "Tipam Sandstone"

def test_historical_events():
    res = client.get("/api/wells/NWIS-ASSAM-001/events")
    assert res.status_code == 200
    events = res.json()
    assert len(events) >= 1
    assert any(e["event_type"] == "stuck_pipe" for e in events)

def test_documents_and_pages():
    res = client.get("/api/documents?well_id=NWIS-ASSAM-001")
    assert res.status_code == 200
    docs = res.json()
    assert len(docs) >= 1
    
    # Check page 14 of DDR-0032
    page_res = client.get("/api/documents/DDR-0032/pages/14")
    assert page_res.status_code == 200
    p = page_res.json()
    assert "DIAGNOSIS: Differential sticking" in p["text_content"]

def test_rag_query():
    res = client.post("/api/ai/query", json={
        "query": "Show previous stuck pipe incidents near the current depth in Tipam Sandstone",
        "well_id": "NWIS-ASSAM-003",
        "current_depth": 3280.0,
        "current_formation": "Tipam Sandstone"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["confidence_level"] == "HIGH"
    assert len(data["retrieved_evidence"]) > 0
    # Must cite DDR-0032
    doc_ids = [e["document_id"] for e in data["retrieved_evidence"]]
    assert "DDR-0032" in doc_ids

def test_ml_risk_and_shap():
    res = client.get("/api/risk/current?well_id=NWIS-ASSAM-003")
    assert res.status_code == 200
    data = res.json()
    assert "probability" in data
    assert "risk_class" in data
    assert "shap_contributors" in data

def test_alerts_and_audit():
    res = client.get("/api/alerts?well_id=NWIS-ASSAM-003")
    assert res.status_code == 200
    alerts = res.json()
    assert len(alerts) >= 1
    
    alert_id = alerts[0]["alert_id"]
    ack_res = client.post(f"/api/alerts/{alert_id}/acknowledge", json={
        "notes": "Acknowledged by rig engineering team. Circulating and monitoring torque."
    })
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "ACKNOWLEDGED"
    assert ack_res.json()["acknowledged_by"] is not None

def test_admin_and_provenance():
    ds_res = client.get("/api/data-sources")
    assert ds_res.status_code == 200
    sources = ds_res.json()
    assert len(sources) >= 4
    provenance_types = [s["provenance"] for s in sources]
    assert "SYNTHETIC" in provenance_types
    assert "PUBLIC" in provenance_types

    models_res = client.get("/api/models")
    assert models_res.status_code == 200
    models = models_res.json()
    assert len(models) >= 3
    assert any(m["model_id"] == "stuck-pipe-xgb-v1" for m in models)
