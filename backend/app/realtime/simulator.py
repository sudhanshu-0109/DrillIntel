import asyncio
import datetime
import math
import random
from typing import Dict, Any, List, Set
from fastapi import WebSocket
from app.ml.feature_engineering import extract_rolling_features
from app.ml.risk_models import risk_engine
from app.database import SessionLocal
from app.models_db import Alert, RiskPrediction, RealTimeMeasurement

class RealTimeSimulator:
    def __init__(self):
        self.is_running = False
        self.speed_multiplier = 1.0
        self.active_well_id = "NWIS-ASSAM-003"
        self.current_step = 0
        self.max_steps = 120
        self.subscribers: Set[WebSocket] = set()
        
        # State tracking
        self.current_depth = 3275.0
        self.current_formation = "Tipam Sandstone"
        self.history: List[Dict[str, Any]] = []
        self.latest_point: Dict[str, Any] = {}
        self.latest_prediction: Dict[str, Any] = {}
        self.last_update_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self.task: asyncio.Task = None

    def start(self):
        self.is_running = True
        if self.task is None or self.task.done():
            self.task = asyncio.create_task(self._simulation_loop())

    def pause(self):
        self.is_running = False

    def reset(self):
        self.is_running = False
        self.current_step = 0
        self.current_depth = 3275.0
        self.current_formation = "Tipam Sandstone"
        self.history.clear()
        self._generate_step(0)

    def set_speed(self, speed: float):
        self.speed_multiplier = max(0.5, min(10.0, speed))

    async def connect_client(self, websocket: WebSocket):
        await websocket.accept()
        self.subscribers.add(websocket)
        if self.latest_point:
            await websocket.send_json({
                "type": "TELEMETRY",
                "data": self.latest_point,
                "prediction": self.latest_prediction,
                "is_running": self.is_running,
                "speed": self.speed_multiplier
            })

    def disconnect_client(self, websocket: WebSocket):
        self.subscribers.discard(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        dead_clients = set()
        for client in self.subscribers:
            try:
                await client.send_json(message)
            except Exception:
                dead_clients.add(client)
        for dead in dead_clients:
            self.subscribers.discard(dead)

    def _generate_step(self, step: int) -> Dict[str, Any]:
        self.current_step = step
        self.current_depth = round(3275.0 + (step * 0.075), 2)
        self.current_formation = "Tipam Sandstone"
        
        noise_tq = random.uniform(-0.4, 0.4)
        noise_rop = random.uniform(-0.3, 0.3)
        noise_spp = random.uniform(-1.5, 1.5)
        
        if step < 30:
            torque = 18.2 + noise_tq
            rop = 14.2 + noise_rop
            wob = 110.0 + random.uniform(-3, 3)
            rpm = 120.0 + random.uniform(-2, 2)
            spp = 182.0 + noise_spp
            hookload = 1250.0 + random.uniform(-10, 10)
            flow_in = 2400.0
            flow_out = 2395.0 + random.uniform(-10, 10)
        elif step < 60:
            progress = (step - 30) / 30.0
            torque = 18.5 + (progress * 7.0) + (noise_tq * 1.5)
            rop = 14.0 - (progress * 4.5) + noise_rop
            wob = 112.0 + (progress * 8.0)
            rpm = 118.0 - (progress * 8.0)
            spp = 184.0 + (progress * 8.0) + noise_spp
            hookload = 1260.0 + (progress * 30.0)
            flow_in = 2400.0
            flow_out = 2390.0 + random.uniform(-15, 15)
        elif step < 90:
            progress = (step - 60) / 30.0
            torque = 25.5 + (progress * 8.5) + (noise_tq * 2.5)
            rop = 9.5 - (progress * 6.5) + noise_rop
            wob = 120.0 + (progress * 15.0)
            rpm = 110.0 - (progress * 25.0)
            spp = 192.0 + (progress * 16.0) + noise_spp
            hookload = 1290.0 + (progress * 90.0)
            flow_in = 2400.0
            flow_out = 2380.0 + random.uniform(-20, 20)
        else:
            torque = 34.5 + random.uniform(-1.0, 2.0)
            rop = 2.4 + random.uniform(-0.4, 0.4)
            wob = 135.0 + random.uniform(-5, 5)
            rpm = 80.0 + random.uniform(-4, 4)
            spp = 210.0 + random.uniform(-3, 3)
            hookload = 1390.0 + random.uniform(-15, 15)
            flow_in = 2400.0
            flow_out = 2375.0 + random.uniform(-25, 25)
            
        mud_weight = 1.22
        ecd = round(mud_weight + (spp * 0.0012), 2)
        
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        point = {
            "well_id": self.active_well_id,
            "timestamp": timestamp,
            "measured_depth": self.current_depth,
            "rop": round(rop, 2),
            "wob": round(wob, 1),
            "rpm": round(rpm, 1),
            "torque": round(torque, 2),
            "hookload": round(hookload, 1),
            "standpipe_pressure": round(spp, 1),
            "flow_in": round(flow_in, 1),
            "flow_out": round(flow_out, 1),
            "mud_weight": mud_weight,
            "ecd": ecd,
            "formation": self.current_formation
        }
        
        self.history.append(point)
        if len(self.history) > 60:
            self.history.pop(0)
            
        self.latest_point = point
        self.last_update_iso = timestamp
        
        features = extract_rolling_features(self.history)
        prob, risk_class, shap_items, explanation = risk_engine.predict_stuck_pipe(
            features=features,
            depth=self.current_depth,
            formation=self.current_formation
        )
        
        self.latest_prediction = {
            "prediction_id": f"PRED-{self.active_well_id[-3:]}-{step}",
            "well_id": self.active_well_id,
            "event_type": "stuck_pipe",
            "probability": round(prob, 2),
            "risk_class": risk_class,
            "prediction_timestamp": timestamp,
            "model_version": "stuck-pipe-xgb-v1",
            "depth": self.current_depth,
            "formation": self.current_formation,
            "top_features": shap_items[:4],
            "explanation": explanation,
            "shap_contributors": shap_items,
            "data_quality": "NOMINAL"
        }
        
        if risk_class == "HIGH" and step >= 75:
            self._ensure_high_risk_alert()
            
        return point

    def _ensure_high_risk_alert(self):
        db = SessionLocal()
        try:
            alert = db.query(Alert).filter(
                Alert.well_id == self.active_well_id,
                Alert.status == "OPEN"
            ).first()
            if not alert:
                new_alert = Alert(
                    alert_id=f"ALT-{self.active_well_id[-3:]}-001",
                    well_id=self.active_well_id,
                    event_type="stuck_pipe",
                    severity="HIGH",
                    depth=self.current_depth,
                    formation=self.current_formation,
                    probability=self.latest_prediction["probability"],
                    model_version="stuck-pipe-xgb-v1",
                    reason=self.latest_prediction["explanation"],
                    top_features=self.latest_prediction["top_features"],
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
                db.add(new_alert)
                db.commit()
        except Exception as e:
            print(f"Alert creation error: {e}")
        finally:
            db.close()

    async def _simulation_loop(self):
        while self.is_running:
            step = (self.current_step + 1) % self.max_steps
            point = self._generate_step(step)
            
            await self.broadcast({
                "type": "TELEMETRY",
                "data": point,
                "prediction": self.latest_prediction,
                "is_running": self.is_running,
                "speed": self.speed_multiplier
            })
            
            sleep_duration = max(0.1, 1.0 / self.speed_multiplier)
            await asyncio.sleep(sleep_duration)

realtime_simulator = RealTimeSimulator()
realtime_simulator._generate_step(0)
