"""
India-Wide Location Analysis & No-Well Fallback Test Suite
==========================================================
Tests the complete Location Analysis flow across all major Indian hydrocarbon
regions, verifying geocoding, basin classification, research manifest matching,
direct well retrieval where available, no-well fallback logic, and provenance.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.location_analysis.location_service import location_service
from app.services.location_analysis.regional_knowledge import classify_location_basin

client = TestClient(app)


def test_assam_duliajan():
    """Assam: Duliajan (Direct offset wells in database)."""
    brief = location_service.analyze(
        lat=27.3584,
        lng=95.3182,
        planned_depth_m=3200.0,
        location_name="Duliajan, Assam"
    )
    assert brief["analysis_status"] == "OK"
    assert brief["data_confidence"] in ("HIGH", "MODERATE")
    assert len(brief["nearby_wells"]) > 0
    assert len(brief["depth_risk_profile"]) > 0
    assert brief["regional_drilling_context"]["is_hydrocarbon_region"] is True
    assert "Assam" in brief["regional_drilling_context"]["basin_name"]


def test_dattapura_waghodia_vadodara_test():
    """
    Gujarat: Dattapura, Waghodia, Vadodara.
    Crucial test representing the user workflow:
    - No direct offset wells within 30km
    - Resolves to Gujarat / Cambay Basin
    - Matches IN-CB-03 (Padra/Karjan) and Cambay research manifest records
    - Discovers technical depth analogs
    - Strictly avoids fabricating fake well logs
    - Produces defensible Engineering Brief with RESEARCH_MANIFEST provenance
    """
    brief = location_service.analyze(
        lat=22.30,
        lng=73.18,
        planned_depth_m=3000.0,
        location_name="Dattapura, Waghodia, Vadodara"
    )
    assert brief["analysis_status"] in ("PARTIAL", "OK")
    assert brief["data_confidence"] in ("MODERATE", "LOW")
    assert len(brief["nearby_wells"]) == 0  # No direct offset wells fabricated!
    assert len(brief["analog_wells"]) > 0   # Technical analogs provided
    assert brief["regional_drilling_context"]["is_hydrocarbon_region"] is True
    assert "Cambay" in brief["regional_drilling_context"]["basin_name"]
    assert len(brief["regional_drilling_context"]["matched_research_areas"]) > 0

    # Verify Padra / Karjan / Cambay context is matched
    matched_ids = [a["area_id"] for a in brief["regional_drilling_context"]["matched_research_areas"]]
    assert "IN-CB-03" in matched_ids or "IN-CB-02" in matched_ids

    # Verify summary mentions regional research manifest & lack of direct offset wells
    summary = brief["area_risk_summary"]
    assert "REGIONAL RESEARCH CONTEXT" in summary or "Cambay" in summary
    assert "NO direct well headers" in summary or "DIRECT OFFSET STATUS" in summary
    assert "RESEARCH_MANIFEST" in brief["provenance_notes"]


def test_rajasthan_barmer():
    """Rajasthan: Barmer (Cairn / Mangala / Bhagyam / Aishwariya core)."""
    brief = location_service.analyze(
        lat=25.7521,
        lng=71.3967,
        planned_depth_m=2500.0,
        location_name="Barmer, Rajasthan"
    )
    assert brief["regional_drilling_context"]["is_hydrocarbon_region"] is True
    assert "Rajasthan" in brief["regional_drilling_context"]["basin_name"]
    matched_ids = [a["area_id"] for a in brief["regional_drilling_context"]["matched_research_areas"]]
    assert "IN-RJ-01" in matched_ids


def test_gujarat_ankleshwar_mehsana():
    """Gujarat: Ankleshwar & Mehsana Cambay clusters."""
    brief_ank = location_service.analyze(
        lat=21.6264,
        lng=73.0033,
        planned_depth_m=2200.0,
        location_name="Ankleshwar, Gujarat"
    )
    assert "Cambay" in brief_ank["regional_drilling_context"]["basin_name"]
    matched_ids = [a["area_id"] for a in brief_ank["regional_drilling_context"]["matched_research_areas"]]
    assert "IN-CB-02" in matched_ids or "IN-CB-03" in matched_ids

    brief_meh = location_service.analyze(
        lat=23.35,
        lng=72.40,
        planned_depth_m=2800.0,
        location_name="Mehsana, Gujarat"
    )
    assert "Cambay" in brief_meh["regional_drilling_context"]["basin_name"]
    matched_meh = [a["area_id"] for a in brief_meh["regional_drilling_context"]["matched_research_areas"]]
    assert "IN-CB-01" in matched_meh


def test_andhra_pradesh_kakinada_rajahmundry():
    """Andhra Pradesh: Kakinada & Rajahmundry (Krishna-Godavari Basin)."""
    brief_kak = location_service.analyze(
        lat=16.95,
        lng=82.25,
        planned_depth_m=3500.0,
        location_name="Kakinada, Andhra Pradesh"
    )
    assert "Krishna" in brief_kak["regional_drilling_context"]["basin_name"]
    matched_kak = [a["area_id"] for a in brief_kak["regional_drilling_context"]["matched_research_areas"]]
    assert any("IN-KG" in mid for mid in matched_kak)

    brief_raj = location_service.analyze(
        lat=17.0005,
        lng=81.8040,
        planned_depth_m=3000.0,
        location_name="Rajahmundry, Andhra Pradesh"
    )
    assert "Krishna" in brief_raj["regional_drilling_context"]["basin_name"]
    matched_raj = [a["area_id"] for a in brief_raj["regional_drilling_context"]["matched_research_areas"]]
    assert "IN-KG-01" in matched_raj


def test_tamil_nadu_nagapattinam_cauvery():
    """Tamil Nadu: Nagapattinam / Cauvery Basin."""
    brief = location_service.analyze(
        lat=10.7656,
        lng=79.8424,
        planned_depth_m=2800.0,
        location_name="Nagapattinam, Tamil Nadu"
    )
    assert "Cauvery" in brief["regional_drilling_context"]["basin_name"]
    matched_ids = [a["area_id"] for a in brief["regional_drilling_context"]["matched_research_areas"]]
    assert "IN-CAU-01" in matched_ids


def test_odisha_mahanadi_cuttack():
    """Odisha: Mahanadi / Cuttack / Jagatsinghpur."""
    brief = location_service.analyze(
        lat=20.4625,
        lng=85.8828,
        planned_depth_m=2600.0,
        location_name="Cuttack, Odisha"
    )
    assert "Mahanadi" in brief["regional_drilling_context"]["basin_name"]
    matched_ids = [a["area_id"] for a in brief["regional_drilling_context"]["matched_research_areas"]]
    assert "IN-MN-01" in matched_ids or "IN-OIL-OR-01" in matched_ids


def test_western_offshore_mumbai_high():
    """Western Offshore: Mumbai High."""
    brief = location_service.analyze(
        lat=19.42,
        lng=71.33,
        planned_depth_m=2000.0,
        location_name="Mumbai High, Maharashtra offshore"
    )
    assert "Mumbai" in brief["regional_drilling_context"]["basin_name"]
    matched_ids = [a["area_id"] for a in brief["regional_drilling_context"]["matched_research_areas"]]
    assert "IN-MO-01" in matched_ids


def test_andaman_vijayapuram():
    """Andaman & Nicobar: Vijayapuram exploration cluster."""
    brief = location_service.analyze(
        lat=11.6670,
        lng=92.7400,
        planned_depth_m=3000.0,
        location_name="Vijayapuram, Andaman"
    )
    assert "Andaman" in brief["regional_drilling_context"]["basin_name"]
    matched_ids = [a["area_id"] for a in brief["regional_drilling_context"]["matched_research_areas"]]
    assert any("IN-AN" in mid or "IN-OIL-AN" in mid for mid in matched_ids)


def test_frontier_low_data_location():
    """Frontier location: Bastar / Chhattisgarh."""
    brief = location_service.analyze(
        lat=19.20,
        lng=81.60,
        planned_depth_m=1500.0,
        location_name="Bastar, Chhattisgarh"
    )
    assert brief["regional_drilling_context"]["is_hydrocarbon_region"] is True
    assert brief["data_confidence"] in ("LOW", "MODERATE")


def test_zero_data_outside_india():
    """Zero-data scenario: Coordinate outside Indian sedimentary basins."""
    brief = location_service.analyze(
        lat=0.0,
        lng=0.0,
        planned_depth_m=3000.0,
        location_name="Null Island (Zero Data Test)"
    )
    assert brief["analysis_status"] == "INSUFFICIENT_DATA"
    assert brief["data_confidence"] == "INSUFFICIENT"
    assert len(brief["nearby_wells"]) == 0
