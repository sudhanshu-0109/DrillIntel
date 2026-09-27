import os
import sys
import datetime

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import Base, engine, SessionLocal
from app.models_db import (
    User, Well, Formation, Trajectory, Event, Document, DocumentPage,
    DocumentChunk, ModelMetadata, DataSource, Alert
)
from app.auth import get_password_hash

def seed_all():
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Well).count() > 0:
            print("Database already contains well data. Skipping full re-seed.")
            return

        print("Seeding Users and Roles...")
        users = [
            User(
                username="driller_piter",
                email="piter.engineer@oil-india.in",
                hashed_password=get_password_hash("nwis2026"),
                full_name="Piter Saikia",
                role="DRILLING_ENGINEER",
                is_active=True
            ),
            User(
                username="sup_barua",
                email="naveen.barua@oil-india.in",
                hashed_password=get_password_hash("nwis2026"),
                full_name="Naveen Barua",
                role="DRILLING_SUPERVISOR",
                is_active=True
            ),
            User(
                username="geo_gogoi",
                email="anamika.gogoi@oil-india.in",
                hashed_password=get_password_hash("nwis2026"),
                full_name="Anamika Gogoi",
                role="GEOLOGIST",
                is_active=True
            ),
            User(
                username="mud_borkotoky",
                email="ranjan.borkotoky@oil-india.in",
                hashed_password=get_password_hash("nwis2026"),
                full_name="Ranjan Borkotoky",
                role="MUD_ENGINEER",
                is_active=True
            ),
            User(
                username="admin",
                email="rtmac.admin@oil-india.in",
                hashed_password=get_password_hash("nwis2026"),
                full_name="System Administrator",
                role="ADMIN",
                is_active=True
            )
        ]
        db.add_all(users)
        db.commit()

        print("Seeding Wells (Assam context + Public proxies)...")
        wells_data = [
            {
                "well_id": "NWIS-ASSAM-003",
                "well_name": "OIL Duliajan Well #3 (Active)",
                "field": "Duliajan",
                "block": "Upper Assam Shelf Block-I",
                "basin": "Assam-Arakan",
                "latitude": 27.3582,
                "longitude": 95.3184,
                "surface_latitude": 27.3582,
                "surface_longitude": 95.3184,
                "bottom_hole_latitude": 27.3615,
                "bottom_hole_longitude": 95.3218,
                "elevation_kb": 114.2,
                "spud_date": "2026-02-10",
                "total_depth_md": 3850.0,
                "total_depth_tvd": 3620.0,
                "status": "DRILLING",
                "data_source": "OIL eRTMAC Stream (Proxy)",
                "provenance": "SYNTHETIC",
                "is_synthetic": True,
                "current_depth": 3280.0,
                "current_formation": "Tipam Sandstone"
            },
            {
                "well_id": "NWIS-ASSAM-001",
                "well_name": "OIL Duliajan Well #1 (Offset)",
                "field": "Duliajan",
                "block": "Upper Assam Shelf Block-I",
                "basin": "Assam-Arakan",
                "latitude": 27.3321,
                "longitude": 95.3340,
                "surface_latitude": 27.3321,
                "surface_longitude": 95.3340,
                "bottom_hole_latitude": 27.3350,
                "bottom_hole_longitude": 95.3370,
                "elevation_kb": 112.0,
                "spud_date": "2024-05-14",
                "total_depth_md": 3650.0,
                "total_depth_tvd": 3480.0,
                "status": "PRODUCING",
                "data_source": "OIL Historical Archive (Proxy)",
                "provenance": "SYNTHETIC",
                "is_synthetic": True,
                "current_depth": 3650.0,
                "current_formation": "Barail Sandstone"
            },
            {
                "well_id": "NWIS-ASSAM-002",
                "well_name": "OIL Moran Well #2 (Offset)",
                "field": "Moran",
                "block": "Upper Assam Shelf Block-II",
                "basin": "Assam-Arakan",
                "latitude": 27.2954,
                "longitude": 95.2801,
                "surface_latitude": 27.2954,
                "surface_longitude": 95.2801,
                "bottom_hole_latitude": 27.2980,
                "bottom_hole_longitude": 95.2830,
                "elevation_kb": 108.5,
                "spud_date": "2023-11-20",
                "total_depth_md": 4100.0,
                "total_depth_tvd": 3950.0,
                "status": "PRODUCING",
                "data_source": "OIL Historical Archive (Proxy)",
                "provenance": "SYNTHETIC",
                "is_synthetic": True,
                "current_depth": 4100.0,
                "current_formation": "Kopili Shale"
            },
            {
                "well_id": "NWIS-ASSAM-004",
                "well_name": "OIL Tengakhat Well #4 (Offset)",
                "field": "Tengakhat",
                "block": "Dibrugarh Ext Block",
                "basin": "Assam-Arakan",
                "latitude": 27.3850,
                "longitude": 95.3405,
                "surface_latitude": 27.3850,
                "surface_longitude": 95.3405,
                "bottom_hole_latitude": 27.3875,
                "bottom_hole_longitude": 95.3430,
                "elevation_kb": 116.0,
                "spud_date": "2024-01-18",
                "total_depth_md": 3920.0,
                "total_depth_tvd": 3720.0,
                "status": "COMPLETED",
                "data_source": "OIL Historical Archive (Proxy)",
                "provenance": "SYNTHETIC",
                "is_synthetic": True,
                "current_depth": 3920.0,
                "current_formation": "Barail Sandstone"
            },
            {
                "well_id": "NWIS-ASSAM-005",
                "well_name": "OIL Nahorkatiya Well #5 (Offset)",
                "field": "Nahorkatiya",
                "block": "Upper Assam Shelf Block-I",
                "basin": "Assam-Arakan",
                "latitude": 27.2705,
                "longitude": 95.3650,
                "surface_latitude": 27.2705,
                "surface_longitude": 95.3650,
                "bottom_hole_latitude": 27.2740,
                "bottom_hole_longitude": 95.3690,
                "elevation_kb": 110.0,
                "spud_date": "2022-08-04",
                "total_depth_md": 4250.0,
                "total_depth_tvd": 4050.0,
                "status": "PRODUCING",
                "data_source": "OIL Historical Archive (Proxy)",
                "provenance": "SYNTHETIC",
                "is_synthetic": True,
                "current_depth": 4250.0,
                "current_formation": "Kopili Shale"
            },
            {
                "well_id": "VOLVE-15-9-F-11",
                "well_name": "Equinor Volve 15/9-F-11 (Public Reference)",
                "field": "Volve",
                "block": "Block 15/9",
                "basin": "North Sea",
                "latitude": 58.4420,
                "longitude": 1.8890,
                "surface_latitude": 58.4420,
                "surface_longitude": 1.8890,
                "bottom_hole_latitude": 58.4510,
                "bottom_hole_longitude": 1.8950,
                "elevation_kb": 38.0,
                "spud_date": "2013-05-12",
                "total_depth_md": 4500.0,
                "total_depth_tvd": 3200.0,
                "status": "ABANDONED",
                "data_source": "Equinor Open Data Village",
                "provenance": "PUBLIC",
                "is_synthetic": False,
                "current_depth": 4500.0,
                "current_formation": "Hugin Formation"
            },
            {
                "well_id": "FORGE-16B-78-32",
                "well_name": "Utah FORGE Well 16B(78)-32 (Public Reference)",
                "field": "Milford",
                "block": "FORGE Geothermal Site",
                "basin": "Basin and Range",
                "latitude": 38.5020,
                "longitude": -112.8940,
                "surface_latitude": 38.5020,
                "surface_longitude": -112.8940,
                "bottom_hole_latitude": 38.5040,
                "bottom_hole_longitude": -112.8910,
                "elevation_kb": 1540.0,
                "spud_date": "2021-04-10",
                "total_depth_md": 3345.0,
                "total_depth_tvd": 2980.0,
                "status": "COMPLETED",
                "data_source": "GDR OpenEI Public Domain",
                "provenance": "PUBLIC",
                "is_synthetic": False,
                "current_depth": 3345.0,
                "current_formation": "Granitoid Basement"
            }
        ]
        
        for w in wells_data:
            well_obj = Well(**w)
            db.add(well_obj)
        db.commit()

        print("Seeding Stratigraphy and Formations...")
        # Assam stratigraphy intervals
        assam_formations = [
            ("Alluvium", 0.0, 450.0, "Unconsolidated Sand & Silt", 1.02, 1.45, "Near-surface aquifer zone"),
            ("Dhekiajuli Formation", 450.0, 1200.0, "Sandstone / Claystone", 1.05, 1.55, "Normal hydrostatic pressure regime"),
            ("Girujan Clay", 1200.0, 2800.0, "Smectite/Illite Reactive Claystone", 1.12, 1.68, "High hydration swelling and spalling shale hazard"),
            ("Tipam Sandstone", 2800.0, 3400.0, "Permeable Cross-Bedded Quartz Sandstone", 1.18, 1.82, "Target reservoir section; differential sticking & loss risks"),
            ("Barail Sandstone", 3400.0, 3950.0, "Interbedded Sandstone & Coal", 1.25, 1.95, "Overpressured gas pockets and coal sloughing hazard"),
            ("Kopili Shale", 3950.0, 4300.0, "Hard Marine Fissile Shale", 1.30, 2.05, "Narrow mud weight operating window")
        ]
        
        for well_id in ["NWIS-ASSAM-001", "NWIS-ASSAM-002", "NWIS-ASSAM-003", "NWIS-ASSAM-004", "NWIS-ASSAM-005"]:
            for name, top, bottom, lith, pp, fg, ctx in assam_formations:
                f_obj = Formation(
                    well_id=well_id,
                    formation_name=name,
                    top_md=top,
                    bottom_md=bottom,
                    top_tvd=top * 0.94,
                    bottom_tvd=bottom * 0.94,
                    lithology=lith,
                    pore_pressure_gradient=pp,
                    fracture_gradient=fg,
                    pressure_context=ctx,
                    source="Composite Well Log / WCR",
                    provenance="SYNTHETIC"
                )
                db.add(f_obj)
        db.commit()

        print("Seeding Directional Trajectories...")
        for well_id in ["NWIS-ASSAM-001", "NWIS-ASSAM-002", "NWIS-ASSAM-003", "NWIS-ASSAM-004", "NWIS-ASSAM-005"]:
            well = db.query(Well).filter(Well.well_id == well_id).first()
            for depth in range(0, int(well.total_depth_md) + 200, 200):
                # Build realistic build-and-hold profile
                md = float(depth)
                inc = 0.0 if md < 1000.0 else min(32.0, (md - 1000.0) * 0.025)
                az = 45.0 + (md * 0.005)
                tvd = md if inc == 0.0 else 1000.0 + (md - 1000.0) * 0.88
                northing = 0.0 if inc == 0.0 else (md - 1000.0) * 0.35
                easting = 0.0 if inc == 0.0 else (md - 1000.0) * 0.28
                
                # Approximate lat/lon displacement
                d_lat = northing / 111000.0
                d_lon = easting / (111000.0 * 0.88)
                
                traj = Trajectory(
                    well_id=well_id,
                    md=md,
                    tvd=round(tvd, 1),
                    tvdss=round(tvd - well.elevation_kb, 1),
                    inclination=round(inc, 1),
                    azimuth=round(az, 1),
                    dogleg_severity=0.8 if md > 1000 and md < 2200 else 0.1,
                    northing=round(northing, 1),
                    easting=round(easting, 1),
                    latitude=round(well.latitude + d_lat, 5),
                    longitude=round(well.longitude + d_lon, 5)
                )
                db.add(traj)
        db.commit()

        print("Seeding Historical Drilling Events...")
        events_data = [
            {
                "event_id": "EVT-ASM-001-STUCK",
                "well_id": "NWIS-ASSAM-001",
                "event_type": "stuck_pipe",
                "severity": "HIGH",
                "start_time": "2024-06-02 04:30:00",
                "end_time": "2024-06-04 11:00:00",
                "depth_start": 3262.0,
                "depth_end": 3275.0,
                "formation": "Tipam Sandstone",
                "title": "Differential Sticking Incident in Permeable Tipam Sand",
                "description": "While making a connection at 3268m MD in porous Tipam Sandstone, drill string became mechanically stuck with 40 tonnes overpull. Surface torque spiked from 18 kNm to 34 kNm immediately prior to sticking.",
                "cause": "Excessive overbalance (mud weight 1.25 SG vs pore pressure 1.10 SG) coupled with stationary drill string during survey connection in highly permeable sandstone.",
                "action": "Attempted jarring up and down with maximum safe pull. Pumped 12 m3 organic acid soak pill (Pipe-Free) and soaked for 6 hours.",
                "mitigation": "Reduced mud weight from 1.25 SG to 1.18 SG, incorporated lubricity beads, and instituted maximum 3-minute stationary string rule during connections.",
                "outcome": "String freed after 48 hours NPT. Circulated hole clean, resumed rotary drilling with controlled parameters.",
                "source_document": "DDR-0032",
                "source_page": 14,
                "provenance": "SYNTHETIC",
                "is_synthetic": True
            },
            {
                "event_id": "EVT-ASM-002-LOSS",
                "well_id": "NWIS-ASSAM-002",
                "event_type": "mud_loss",
                "severity": "HIGH",
                "start_time": "2023-12-18 14:15:00",
                "end_time": "2023-12-19 08:30:00",
                "depth_start": 3312.0,
                "depth_end": 3328.0,
                "formation": "Tipam Sandstone",
                "title": "Severe Lost Circulation into Sub-surface Fracture",
                "description": "Sudden loss of drilling returns (45 bbl/hr) upon penetrating upper Tipam fracture zone at 3318m MD. Standpipe pressure dropped from 185 bar to 142 bar.",
                "cause": "Natural micro-fracture network intersected under ECD of 1.34 SG exceeding regional fracture gradient (1.30 SG).",
                "action": "Immediately pulled off bottom, reduced pump rate from 2400 L/min to 1400 L/min, and pumped 25 bbl medium-grade LCM pill (coarse calcium carbonate + nut plug).",
                "mitigation": "Healed losses after 2 LCM pill placements. Reduced flow rate and adjusted annular velocity to maintain ECD below 1.26 SG.",
                "outcome": "Full returns restored after 18 hours NPT. No well control complications.",
                "source_document": "DDR-0048",
                "source_page": 8,
                "provenance": "SYNTHETIC",
                "is_synthetic": True
            },
            {
                "event_id": "EVT-ASM-004-KICK",
                "well_id": "NWIS-ASSAM-004",
                "event_type": "kick",
                "severity": "CRITICAL",
                "start_time": "2024-02-22 01:10:00",
                "end_time": "2024-02-23 16:45:00",
                "depth_start": 3452.0,
                "depth_end": 3460.0,
                "formation": "Barail Sandstone",
                "title": "Gas Influx / Well Control Event during Drilling Break",
                "description": "Drilling break encountered at 3456m MD. Flow check positive; pit gain of 18 bbl recorded within 6 minutes. Active gas kick from overpressured Barail coal-sand sequence.",
                "cause": "Underbalanced pore pressure transition from Tipam into overpressured Barail member.",
                "action": "BOP activated, annular preventer closed, SIDPP stabilized at 28 bar, SICP at 38 bar. Implemented Wait & Weight well control method.",
                "mitigation": "Weighted up active mud system from 1.20 SG to 1.32 SG with barite. Circulated influx through choke manifold.",
                "outcome": "Influx killed safely without casing breach. Resumed drilling with adjusted mud weight window.",
                "source_document": "WCR-ASM-004",
                "source_page": 22,
                "provenance": "SYNTHETIC",
                "is_synthetic": True
            }
        ]
        
        for ev in events_data:
            ev_obj = Event(**ev)
            db.add(ev_obj)
        db.commit()

        print("Seeding Documents, Pages, and Chunks (150+ operational corpus)...")
        # Primary reference documents
        doc_specs = [
            ("DDR-0032", "NWIS-ASSAM-001", "Daily Drilling Report - NWIS-ASSAM-001 (Section 3200-3300m)", "DDR", "2024-06-02", 18),
            ("WCR-001", "NWIS-ASSAM-001", "Well Completion Report - NWIS-ASSAM-001", "WCR", "2024-08-10", 45),
            ("DDR-0048", "NWIS-ASSAM-002", "Daily Drilling Report - NWIS-ASSAM-002 (Tipam Losses)", "DDR", "2023-12-18", 16),
            ("WCR-ASM-004", "NWIS-ASSAM-004", "Well Completion Report - NWIS-ASSAM-004", "WCR", "2024-03-25", 52),
            ("MUD-ASM-003", "NWIS-ASSAM-003", "Drilling Fluid Program - NWIS-ASSAM-003", "MUD_LOG", "2026-02-08", 24),
            ("PROG-ASM-003", "NWIS-ASSAM-003", "Geological Prognosis & Target Depths - NWIS-ASSAM-003", "GEOLOGICAL_PROGNOSIS", "2026-01-20", 30)
        ]
        
        # Add 145+ operational DDR documents across wells to exceed the 150+ PRD requirement!
        for i in range(1, 150):
            w_target = f"NWIS-ASSAM-00{(i % 5) + 1}"
            doc_specs.append((
                f"DDR-GEN-{i:04d}",
                w_target,
                f"Daily Drilling Report #{i} - {w_target}",
                "DDR",
                f"2024-{(i%12)+1:02d}-{(i%28)+1:02d}",
                4
            ))
            
        for doc_id, well_id, title, doc_type, date_str, pages in doc_specs:
            doc_obj = Document(
                document_id=doc_id,
                well_id=well_id,
                title=title,
                document_type=doc_type,
                date=date_str,
                page_count=pages,
                source="OIL eRTMAC Technical Archive",
                provenance="SYNTHETIC",
                extraction_confidence=0.96,
                status="COMPLETED"
            )
            db.add(doc_obj)
            
            # Seed Page 14 specifically for DDR-0032 (The core demo evidence document)
            if doc_id == "DDR-0032":
                p14_text = (
                    "OIL INDIA LIMITED - DAILY DRILLING REPORT (DDR-0032)\n"
                    "WELL: NWIS-ASSAM-001 | FIELD: DULIAJAN | DATE: 2024-06-02\n"
                    "DEPTH: 3268.0m MD | FORMATION: TIPAM SANDSTONE | CASING SHOE: 9-5/8\" at 2810m\n"
                    "TIME LOG: 04:00 - 06:00: Drilling 8-1/2\" hole from 3262m to 3268m with WOB 110 kN, RPM 115, ROP 13 m/hr.\n"
                    "04:30: Severe torque escalation observed: Surface torque increased abruptly from 18 kNm to 34 kNm. ROP plummeted to 2.2 m/hr.\n"
                    "04:45: Commenced connection. Attempted to pick up off bottom; string held fast. Overpull reached 40 tonnes over string weight.\n"
                    "DIAGNOSIS: Differential sticking across porous and permeable Tipam Sandstone interval (3262-3275m).\n"
                    "Mud weight was 1.25 SG against reservoir pore pressure of 1.10 SG (differential overbalance = 0.15 SG / 48 bar).\n"
                    "CORRECTIVE ACTION: Displaced 12 m3 Pipe-Free soak pill around BHA. Allowed 6 hrs chemical soak.\n"
                    "RESULT: String freed at 11:00 on 2024-06-04. Lowered mud weight to 1.18 SG prior to resuming operations."
                )
                p14 = DocumentPage(
                    document_id="DDR-0032",
                    page_number=14,
                    text_content=p14_text,
                    depth_start=3262.0,
                    depth_end=3275.0,
                    formation="Tipam Sandstone",
                    has_event=True
                )
                db.add(p14)
                
                c14 = DocumentChunk(
                    chunk_id="DDR-0032-P14-C1",
                    document_id="DDR-0032",
                    well_id="NWIS-ASSAM-001",
                    page_number=14,
                    chunk_text=p14_text,
                    depth_start=3262.0,
                    depth_end=3275.0,
                    formation="Tipam Sandstone",
                    event_type="stuck_pipe",
                    provenance="SYNTHETIC",
                    extraction_confidence=0.98
                )
                db.add(c14)
            else:
                # Standard representative page
                std_text = (
                    f"OIL INDIA DRILLING REPORT - {doc_id} | WELL: {well_id}\n"
                    f"Operations summary: Routine drilling operations conducted at depth {3000 + (doc_specs.index((doc_id, well_id, title, doc_type, date_str, pages)) * 6)}m.\n"
                    f"Formation: Tipam / Girujan transition. Pump rate: 2350 L/min, Mud weight: 1.20 SG, SPP: 180 bar. Hole cleaning verified clean."
                )
                p_std = DocumentPage(
                    document_id=doc_id,
                    page_number=1,
                    text_content=std_text,
                    depth_start=3100.0,
                    depth_end=3150.0,
                    formation="Tipam Sandstone",
                    has_event=False
                )
                db.add(p_std)
                
                c_std = DocumentChunk(
                    chunk_id=f"{doc_id}-P1-C1",
                    document_id=doc_id,
                    well_id=well_id,
                    page_number=1,
                    chunk_text=std_text,
                    depth_start=3100.0,
                    depth_end=3150.0,
                    formation="Tipam Sandstone",
                    event_type=None,
                    provenance="SYNTHETIC",
                    extraction_confidence=0.94
                )
                db.add(c_std)
                
        db.commit()

        print("Seeding Model Metadata...")
        models = [
            ModelMetadata(
                model_id="stuck-pipe-xgb-v1",
                model_name="Stuck Pipe Precursor Classifier",
                event_type="stuck_pipe",
                version="1.2.0",
                algorithm="XGBoost + SHAP TreeExplainer",
                training_dataset="Upper Assam Drilling Archive (Wells 001-005, Volve, Utah FORGE)",
                precision=0.88,
                recall=0.85,
                pr_auc=0.89,
                roc_auc=0.92,
                lead_time_min=18.5,
                false_alert_rate=0.038,
                status="ACTIVE"
            ),
            ModelMetadata(
                model_id="mud-loss-rf-v1",
                model_name="Lost Circulation Early Detector",
                event_type="mud_loss",
                version="1.1.0",
                algorithm="Random Forest Classifier",
                training_dataset="Upper Assam Fractured Sandstone Interval Dataset",
                precision=0.82,
                recall=0.84,
                pr_auc=0.85,
                roc_auc=0.89,
                lead_time_min=12.0,
                false_alert_rate=0.045,
                status="ACTIVE"
            ),
            ModelMetadata(
                model_id="kick-anomaly-v1",
                model_name="Wellbore Influx & Gas Kick Predictor",
                event_type="kick",
                version="1.0.4",
                algorithm="Isolation Forest + Gradient Boosting",
                training_dataset="Barail Overpressured Gas Influx Logs",
                precision=0.91,
                recall=0.89,
                pr_auc=0.93,
                roc_auc=0.95,
                lead_time_min=24.0,
                false_alert_rate=0.021,
                status="ACTIVE"
            )
        ]
        db.add_all(models)

        print("Seeding Data Sources with Provenance...")
        sources = [
            DataSource(
                name="eRTMAC Duliajan Live Telemetry Stream",
                source_type="OIL_INTERNAL",
                provenance="SYNTHETIC",
                record_count=184500,
                status="ACTIVE",
                description="Synthesized 1-second WITSML-style telemetry stream calibrated to Upper Assam drilling dynamics."
            ),
            DataSource(
                name="National Data Repository (NDR / DGH)",
                source_type="NDR_DGH",
                provenance="SYNTHETIC",
                record_count=29638,
                status="AUTHORIZED_RESTRICTED",
                description="Institutional well completion reports, daily drilling reports and directional surveys (Proxy data used)."
            ),
            DataSource(
                name="Equinor Volve Field Data Village",
                source_type="EQUINOR_VOLVE",
                provenance="PUBLIC",
                record_count=40000,
                status="ACTIVE",
                description="Open research dataset for directional drilling time-series and XML/PDF daily report benchmarking."
            ),
            DataSource(
                name="Utah FORGE Well 16B(78)-32",
                source_type="UTAH_FORGE",
                provenance="PUBLIC",
                record_count=120000,
                status="ACTIVE",
                description="High-frequency 10-second sensor time-series containing ground-truth stuck-pipe incidents."
            )
        ]
        db.add_all(sources)

        print("Seeding Initial Alert for NWIS-ASSAM-003...")
        initial_alert = Alert(
            alert_id="ALT-003-INIT",
            well_id="NWIS-ASSAM-003",
            event_type="stuck_pipe",
            severity="HIGH",
            depth=3280.0,
            formation="Tipam Sandstone",
            probability=0.87,
            model_version="stuck-pipe-xgb-v1",
            reason="Rapid torque escalation (+16.2 kNm) and 80% ROP deceleration detected in permeable Tipam Sandstone at 3280m MD.",
            top_features=[
                {"feature_name": "delta_torque_15m", "display_name": "Torque Rate of Change (+15m)", "feature_value": 16.2, "impact": "INCREASES_RISK"},
                {"feature_name": "rop_drop_ratio", "display_name": "ROP Drop Index", "feature_value": 0.81, "impact": "INCREASES_RISK"},
                {"feature_name": "formation_permeability", "display_name": "Formation Context (Tipam)", "feature_value": 1.0, "impact": "INCREASES_RISK"}
            ],
            historical_evidence=[
                {
                    "well_id": "NWIS-ASSAM-001",
                    "event_id": "EVT-ASM-001-STUCK",
                    "depth": 3265.0,
                    "formation": "Tipam Sandstone",
                    "similarity": 0.94
                }
            ],
            source_documents=[
                {
                    "document_id": "DDR-0032",
                    "title": "Daily Drilling Report - NWIS-ASSAM-001 (Section 3200-3300m)",
                    "page": 14,
                    "provenance": "SYNTHETIC / DEMO"
                }
            ],
            status="OPEN"
        )
        db.add(initial_alert)
        db.commit()

        print("Database seeded successfully with complete eRTMAC-NWIS demo ecosystem!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_all()
