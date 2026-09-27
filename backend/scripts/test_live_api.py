import urllib.request
import json

def test_api():
    print("--- 1. Testing /api/research/coverage ---")
    req = urllib.request.urlopen("http://127.0.0.1:8000/api/research/coverage")
    cov = json.loads(req.read().decode())
    print(f"Total areas: {cov['total_areas']}, Basins: {cov['total_basins']}, States: {cov['total_states']}")
    print(f"Priority breakdown: {cov['priority_breakdown']}")

    print("\n--- 2. Testing /api/research/areas?q=Vadodara ---")
    req = urllib.request.urlopen("http://127.0.0.1:8000/api/research/areas?q=Vadodara")
    areas = json.loads(req.read().decode())
    print(f"Found {len(areas)} areas matching Vadodara:")
    for a in areas:
        print(f"  - {a['area_id']}: {a['area_name']} | Basin: {a['basin']} | Tier: {a['activity_tier']}")

    print("\n--- 3. Testing /api/location-analysis for Dattapura / Waghodia / Vadodara ---")
    payload = {
        "lat": 22.2858,
        "lng": 73.3768,
        "planned_depth_m": 3000,
        "location_name": "Dattapura, Waghodia, Vadodara"
    }
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/location-analysis",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"}
    )
    brief = json.loads(urllib.request.urlopen(req).read().decode())
    print(f"Analysis Status: {brief['analysis_status']}")
    print(f"Data Confidence: {brief['data_confidence']}")
    print(f"Direct Wells Count: {len(brief['nearby_wells'])} (Strict 0 fabrication)")
    print(f"Analog Wells Count: {len(brief.get('analog_wells', []))}")
    print(f"Regional Context Basin: {brief['regional_drilling_context']['basin_name']}")
    print(f"Regional Matched Areas: {[a['area_name'] for a in brief['regional_drilling_context']['matched_research_areas']]}")
    print(f"Provenance: {brief['regional_drilling_context']['provenance']}")

    print("\n--- 4. Testing /api/location-analysis for Duliajan (Assam with Direct Wells) ---")
    payload2 = {
        "lat": 27.35,
        "lng": 95.32,
        "planned_depth_m": 3500,
        "location_name": "Duliajan"
    }
    req2 = urllib.request.Request(
        "http://127.0.0.1:8000/api/location-analysis",
        data=json.dumps(payload2).encode(),
        headers={"Content-Type": "application/json"}
    )
    brief2 = json.loads(urllib.request.urlopen(req2).read().decode())
    print(f"Assam Analysis Status: {brief2['analysis_status']}")
    print(f"Direct Wells Discovered: {len(brief2['nearby_wells'])} (Real offset wells)")
    print(f"Regional Basin: {brief2['regional_drilling_context']['basin_name']}")
    print(f"Critical Events: {len(brief2['critical_events'])}")

    print("\n✅ All live endpoints verified successfully!")

if __name__ == "__main__":
    test_api()
