"""
Unit & Integration Tests: Research Ingestion Layer
==================================================
Tests CSV/XLSX loading, reconciliation, validation, normalization,
catalog indexing, provenance handling, and API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.research_ingestion import (
    research_loader, research_validator, research_normalizer,
    research_sources, research_catalog
)

client = TestClient(app)


def test_research_loader_and_reconciliation():
    """Verify CSV and XLSX both load 48 rows with 0 cell-by-cell discrepancies."""
    csv_records, discrepancies, audit_meta = research_loader.compare_and_reconcile()
    assert len(csv_records) == 48
    assert audit_meta["columns_count"] == 17
    assert len(discrepancies) == 0
    assert audit_meta["reconciliation_status"] == "MATCH"


def test_research_validation():
    """Verify validation passes for canonical dataset and catches missing required fields."""
    csv_records = research_loader.load_raw_csv()
    valid, invalid, errors, warnings = research_validator.validate_batch(csv_records)
    assert len(valid) == 48
    assert len(invalid) == 0

    # Test malformed record
    bad_record = {"area_name": "Incomplete Area"}
    is_valid, errs, warns = research_validator.validate_record(bad_record, 0)
    assert not is_valid
    assert len(errs) > 0


def test_research_normalization():
    """Verify text cleaning, coordinate mapping, and NationalActivityArea construction."""
    sample = {
        "area_id": "IN-CB-03",
        "area_name": "Padra–Karjan Cambay corridor",
        "state_or_region": "Gujarat",
        "basin": "Cambay",
        "environment": "Onshore",
        "activity_tier": "ACTIVE_CURRENT",
        "nwis_data_priority": "VERY_HIGH"
    }
    normalized = research_normalizer.normalize_record(sample)
    assert normalized.area_id == "IN-CB-03"
    assert normalized.anchor_latitude == 22.24
    assert normalized.anchor_longitude == 73.08
    assert normalized.provenance == "RESEARCH_MANIFEST"
    assert normalized.research_version == "2026-09"


def test_research_catalog_indexing():
    """Verify catalog populates all 48 areas and generates coverage summary."""
    report = research_catalog.initialize_index()
    assert report.total_records == 48
    assert report.status in ("SUCCESS", "PARTIAL")

    areas = research_catalog.get_all_areas()
    assert len(areas) == 48

    summary = research_catalog.generate_national_coverage_summary()
    assert summary.total_areas == 48
    assert summary.total_basins == 27
    assert summary.total_states == 30
    assert summary.priority_breakdown["VERY_HIGH"] >= 15
    assert len(summary.data_acquisition_roadmap) == 48


def test_api_research_coverage():
    """Test GET /api/research/coverage endpoint."""
    res = client.get("/api/research/coverage")
    assert res.status_code == 200
    data = res.json()
    assert data["total_areas"] == 48
    assert len(data["basin_coverage"]) > 20
    assert len(data["state_coverage"]) > 20
    assert len(data["data_acquisition_roadmap"]) == 48


def test_api_research_areas_search():
    """Test GET /api/research/areas with search and basin filters."""
    # Free-text search
    res = client.get("/api/research/areas?q=Vadodara")
    assert res.status_code == 200
    areas = res.json()
    assert len(areas) > 0
    assert any(a["area_id"] == "IN-CB-03" for a in areas)

    # Basin filter
    res_b = client.get("/api/research/areas?basin=Cambay")
    assert res_b.status_code == 200
    cambay_areas = res_b.json()
    assert len(cambay_areas) >= 4

    # Priority filter
    res_p = client.get("/api/research/areas?priority=VERY_HIGH")
    assert res_p.status_code == 200
    vh_areas = res_p.json()
    assert len(vh_areas) >= 15


def test_api_research_context():
    """Test GET /api/research/context endpoint for coordinates."""
    # Test coordinates near Vadodara (22.30, 73.18)
    res = client.get("/api/research/context?lat=22.30&lng=73.18&location_name=Vadodara")
    assert res.status_code == 200
    data = res.json()
    assert data["is_hydrocarbon_region"] is True
    assert "Cambay" in data["basin_name"]
    assert len(data["matched_research_areas"]) > 0
    assert data["provenance"] == "RESEARCH_MANIFEST"
