from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Body
from services.realtime_simulator.simulator import realtime_simulator

router = APIRouter(tags=["Real-Time Streaming & Simulator"])

@router.websocket("/ws/live-well/{well_id}")
async def websocket_live_well(websocket: WebSocket, well_id: str):
    realtime_simulator.active_well_id = well_id
    await realtime_simulator.connect_client(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "PING":
                await websocket.send_text("PONG")
            elif data == "START":
                realtime_simulator.start()
            elif data == "PAUSE":
                realtime_simulator.pause()
            elif data == "RESET":
                realtime_simulator.reset()
    except WebSocketDisconnect:
        realtime_simulator.disconnect_client(websocket)
    except Exception:
        realtime_simulator.disconnect_client(websocket)

@router.post("/api/simulator/start")
def start_simulation():
    realtime_simulator.start()
    return {"status": "RUNNING", "message": "Telemetry simulation started"}

@router.post("/api/simulator/pause")
def pause_simulation():
    realtime_simulator.pause()
    return {"status": "PAUSED", "message": "Telemetry simulation paused"}

@router.post("/api/simulator/reset")
def reset_simulation():
    realtime_simulator.reset()
    return {"status": "RESET", "message": "Telemetry simulation reset to baseline"}

@router.post("/api/simulator/speed")
def set_simulation_speed(speed: float = Body(..., embed=True)):
    realtime_simulator.set_speed(speed)
    return {"status": "UPDATED", "speed": realtime_simulator.speed_multiplier}

@router.get("/api/simulator/status")
def get_simulation_status():
    return {
        "is_running": realtime_simulator.is_running,
        "speed": realtime_simulator.speed_multiplier,
        "current_step": realtime_simulator.current_step,
        "current_depth": realtime_simulator.current_depth,
        "current_formation": realtime_simulator.current_formation,
        "latest_point": realtime_simulator.latest_point,
        "latest_prediction": realtime_simulator.latest_prediction,
        "subscribers_count": len(realtime_simulator.subscribers)
    }
