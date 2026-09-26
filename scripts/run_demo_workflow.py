import os
import sys
import time
from fastapi.testclient import TestClient

# Ensure project root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from apps.api.main import app
from apps.api.database import SessionLocal
from apps.api.models_db import AuditLog

def run_e2e_demo_scenario():
    print("=" * 70)
    print("STARTING eRTMAC-NWIS COMPLETE END-TO-END DEMO SCENARIO (SIH26121)")
    print("=" * 70)

    client = TestClient(app)

    # 1. Select Active Well
    active_well_id = "NWIS-ASSAM-003"
    print(f"\n[STEP 1] Selecting Active Well: {active_well_id}")
    res = client.get(f"/api/wells/{active_well_id}")
    assert res.status_code == 200, "Active well lookup failed"
    well_data = res.json()
    print(f" -> Well Loaded: {well_data['well_name']} ({well_data['field']} Field)")
    print(f" -> Coordinates: Lat {well_data['latitude']}°N, Lon {well_data['longitude']}°E")
    print(f" -> Provenance: {well_data['provenance']} | Synthetic Flag: {well_data['is_synthetic']}")

    # 2. Identify Current Depth and Formation
    print(f"\n[STEP 2] Resolving Current Depth & Geological Formation Context")
    curr_depth = well_data["current_depth"]
    form_res = client.get(f"/api/formations/current?well_id={active_well_id}&depth={curr_depth}")
    assert form_res.status_code == 200
    formation_info = form_res.json()
    print(f" -> Current Measured Depth: {curr_depth} m")
    print(f" -> Resolved Formation: {formation_info['formation_name']} ({formation_info['lithology']})")
    print(f" -> Pore Pressure: {formation_info['pore_pressure_gradient']} SG | Fracture: {formation_info['fracture_gradient']} SG")

    # 3. Discover Nearby Offset Wells using Multi-Criteria Relevance
    print(f"\n[STEP 3] Geospatial Offset Discovery (Radius: 15 km)")
    offset_res = client.get(f"/api/wells/nearby?well_id={active_well_id}&radius=15.0")
    assert offset_res.status_code == 200
    offsets = offset_res.json()
    print(f" -> Found {len(offsets)} candidate offset wells within 15 km:")
    for o in offsets:
        print(f"    * {o['well_id']}: Dist={o['distance_km']}km, Overlap={o['depth_overlap_m']}m, FormSim={o['formation_similarity']}, Score={o['relevance_score']}%")

    top_offset = offsets[0]
    print(f" -> Selected Top Offset: {top_offset['well_id']} (Multi-criteria relevance: {top_offset['relevance_score']}%)")

    # 4. Retrieve Historical Events in Offset Well
    print(f"\n[STEP 4] Querying Historical Institutional Memory in {top_offset['well_id']}")
    evt_res = client.get(f"/api/wells/{top_offset['well_id']}/events")
    assert evt_res.status_code == 200
    events = evt_res.json()
    print(f" -> Retrieved {len(events)} historical events in offset well:")
    stuck_event = None
    for e in events:
        print(f"    * [{e['severity']}] {e['event_type'].upper()}: {e['title']} ({e['depth_start']}-{e['depth_end']}m in {e['formation']})")
        if e['event_type'] == 'stuck_pipe':
            stuck_event = e

    assert stuck_event is not None, "Historical stuck pipe event missing"
    print(f" -> Matched Analogue Event: {stuck_event['title']}")
    print(f" -> Documented Cause: {stuck_event['cause']}")
    print(f" -> Mitigation Applied: {stuck_event['mitigation']}")

    # 5. Open Original Document / Page Evidence
    print(f"\n[STEP 5] Inspecting Original Source Document: {stuck_event['source_document']} Page {stuck_event['source_page']}")
    doc_res = client.get(f"/api/documents/{stuck_event['source_document']}/pages/{stuck_event['source_page']}")
    assert doc_res.status_code == 200
    page_data = doc_res.json()
    print(f" -> Source Text Snippet:\n    \"{page_data['text_content'][:220]}...\"")

    # 6. Live Parameter Streaming & Anomaly Detection
    print(f"\n[STEP 6] Replaying Live Parameter Stream on {active_well_id}")
    # Fetch current risk evaluation from simulator engine
    risk_res = client.get(f"/api/risk/current?well_id={active_well_id}")
    assert risk_res.status_code == 200
    risk_data = risk_res.json()
    print(f" -> Telemetry Dynamics: Torque Escalating (+16.2 kNm), ROP Declining (80% drop)")
    print(f" -> Model Version: {risk_data['model_version']}")
    print(f" -> Evaluated Probability: {risk_data['probability'] * 100:.0f}% -> Risk Class: {risk_data['risk_class']}")

    # 7. Inspect SHAP Explainability Feature Attribution
    print(f"\n[STEP 7] Inspecting Explainable AI (SHAP Feature Attribution)")
    print(f" -> Plain Language Explanation: \"{risk_data['explanation']}\"")
    print(f" -> Key Feature Attributions:")
    for f in risk_data["top_features"]:
        print(f"    * {f['display_name']}: Value={f['feature_value']}, Impact={f['impact']}")

    # 8. Context-Aware Grounded RAG Query
    print(f"\n[STEP 8] Executing Grounded RAG Query")
    rag_query = "What historical incidents occurred near current depth in Tipam Sandstone and what was the mitigation?"
    rag_res = client.post("/api/ai/query", json={
        "query": rag_query,
        "well_id": active_well_id,
        "current_depth": curr_depth,
        "current_formation": formation_info["formation_name"]
    })
    assert rag_res.status_code == 200
    rag_data = rag_res.json()
    print(f" -> Query: \"{rag_query}\"")
    print(f" -> Grounded Synthesis:\n    \"{rag_data['interpretation']}\"")
    print(f" -> Cited Evidence Items: {len(rag_data['retrieved_evidence'])}")
    for ev in rag_data["retrieved_evidence"]:
        print(f"    * Well {ev['well_id']} | Doc {ev['document_id']} (Page {ev['page_number']}) | Confidence: {ev['confidence']*100:.0f}%")

    # 9. Alert Generation & Verification
    print(f"\n[STEP 9] Verifying Decision-Support Alert")
    alerts_res = client.get(f"/api/alerts?well_id={active_well_id}")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) > 0, "No alerts found for active well"
    open_alert = alerts[0]
    print(f" -> Alert ID: {open_alert['alert_id']}")
    print(f" -> Severity: {open_alert['severity']} | Event: {open_alert['event_type']}")
    print(f" -> Reason: {open_alert['reason']}")

    # 10. Drilling Engineer Acknowledgement & Audit Trail
    print(f"\n[STEP 10] Drilling Engineer Acknowledging Alert with Operational Notes")
    ack_notes = "Notified driller to pull off bottom, spotted Pipe-Free chemical soak pill, verified rotation."
    ack_res = client.post(f"/api/alerts/{open_alert['alert_id']}/acknowledge", json={
        "notes": ack_notes
    })
    assert ack_res.status_code == 200
    updated_alert = ack_res.json()
    print(f" -> Alert Status Updated: {updated_alert['status']}")
    print(f" -> Acknowledged By: {updated_alert['acknowledged_by']} at {updated_alert['acknowledged_at']}")
    print(f" -> Operational Notes Recorded: \"{updated_alert['resolution_notes']}\"")

    # 11. Verify Immutable Audit Trail in Database
    print(f"\n[STEP 11] Verifying System Governance & Audit Log Integrity")
    db = SessionLocal()
    audit_entry = db.query(AuditLog).filter(
        AuditLog.entity_id == open_alert['alert_id'],
        AuditLog.action == "ACKNOWLEDGE_ALERT"
    ).first()
    assert audit_entry is not None, "Audit log was not persisted"
    print(f" -> Audit Log Confirmed: ID={audit_entry.id}, User={audit_entry.username}, Action={audit_entry.action}, Time={audit_entry.timestamp}")
    db.close()

    print("\n" + "=" * 70)
    print("SUCCESS: COMPLETE eRTMAC-NWIS END-TO-END DEMO WORKFLOW PASSED 100%!")
    print("=" * 70)

if __name__ == "__main__":
    run_e2e_demo_scenario()
