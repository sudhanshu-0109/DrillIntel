from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from apps.api.database import get_db
from apps.api.models_db import RiskPrediction, Well
from apps.api.schemas import RiskPredictionResponse, SHAPContributor
from services.realtime_simulator.simulator import realtime_simulator

router = APIRouter(prefix="/risk", tags=["Risk & ML"])

@router.get("/current", response_model=RiskPredictionResponse)
def get_current_risk(
    well_id: str = Query("NWIS-ASSAM-003", description="Active well ID"),
    db: Session = Depends(get_db)
):
    if realtime_simulator.latest_prediction and realtime_simulator.active_well_id == well_id:
        p = realtime_simulator.latest_prediction
        shap_items = [
            SHAPContributor(**s) for s in p.get("shap_contributors", [])
        ]
        return RiskPredictionResponse(
            prediction_id=p["prediction_id"],
            well_id=p["well_id"],
            event_type=p["event_type"],
            probability=p["probability"],
            risk_class=p["risk_class"],
            prediction_timestamp=datetime.fromisoformat(p["prediction_timestamp"]),
            model_version=p["model_version"],
            depth=p["depth"],
            formation=p["formation"],
            top_features=p["top_features"],
            explanation=p["explanation"],
            shap_contributors=shap_items,
            data_quality=p["data_quality"]
        )
        
    return RiskPredictionResponse(
        prediction_id=f"PRED-{well_id[-3:]}-STATIC",
        well_id=well_id,
        event_type="stuck_pipe",
        probability=0.12,
        risk_class="LOW",
        prediction_timestamp=datetime.utcnow(),
        model_version="stuck-pipe-xgb-v1",
        depth=3280.0,
        formation="Tipam Sandstone",
        top_features=[
            {"feature_name": "delta_torque_15m", "display_name": "Torque Rate of Change", "feature_value": 0.4, "impact": "NEUTRAL"},
            {"feature_name": "rop_drop_ratio", "display_name": "ROP Drop Index", "feature_value": 0.05, "impact": "NEUTRAL"}
        ],
        explanation="Drilling parameters nominal. No precursor patterns detected.",
        shap_contributors=[],
        data_quality="NOMINAL"
    )

@router.get("/history")
def get_risk_history(
    well_id: str = Query("NWIS-ASSAM-003", description="Active well ID"),
    db: Session = Depends(get_db)
):
    history_points = []
    base_depth = 3270.0
    for i in range(20):
        d = round(base_depth + (i * 0.5), 1)
        if d < 3278.0:
            prob = round(0.08 + (i * 0.015), 2)
            rc = "LOW"
        elif d < 3281.0:
            prob = round(0.35 + ((i - 16) * 0.12), 2)
            rc = "MEDIUM"
        else:
            prob = round(0.75 + ((i - 18) * 0.06), 2)
            rc = "HIGH"
        history_points.append({
            "depth": d,
            "probability": min(0.92, prob),
            "risk_class": rc,
            "event_type": "stuck_pipe"
        })
    return history_points
