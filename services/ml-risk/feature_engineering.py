import math
import numpy as np
import pandas as pd
from typing import List, Dict, Any

def compute_mechanical_specific_energy(
    wob_kn: float,
    torque_knm: float,
    rpm: float,
    rop_mhr: float,
    bit_diameter_inch: float = 8.5
) -> float:
    """
    Calculate Mechanical Specific Energy (MSE) in MPa / psi.
    Teale's formula adapted for metric drilling parameters.
    """
    if rop_mhr <= 0.05:
        rop_mhr = 0.05  # Prevent division by zero
    
    bit_area_m2 = math.pi * ((bit_diameter_inch * 0.0254) / 2.0) ** 2
    # Axial component: WOB (kN) / Area (m^2) -> kPa / 1000 -> MPa
    axial_mpe = (wob_kn / 1000.0) / bit_area_m2
    # Rotary component: 2 * pi * RPM * Torque / (Area * ROP)
    rotary_mpe = (2.0 * math.pi * rpm * (torque_knm * 1000.0)) / (bit_area_m2 * (rop_mhr / 3600.0) * 1e6)
    mse_total = axial_mpe + rotary_mpe
    return round(float(np.clip(mse_total, 10.0, 5000.0)), 2)

def extract_rolling_features(history: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Extract rolling features from a sequence of recent drilling parameter samples (e.g. last 10-30 ticks).
    """
    if not history:
        return {
            "torque_current": 20.0,
            "torque_rolling_mean": 20.0,
            "torque_rolling_std": 0.5,
            "delta_torque_15m": 0.0,
            "rop_current": 12.0,
            "delta_rop_15m": 0.0,
            "rop_drop_ratio": 0.0,
            "spp_current": 180.0,
            "delta_spp_15m": 0.0,
            "flow_delta": 0.0,
            "mse": 320.0,
            "torque_pressure_corr": 0.1
        }
    
    df = pd.DataFrame(history)
    
    # Current values
    current = df.iloc[-1]
    
    # Rolling calculations
    torque_series = df["torque"].astype(float)
    rop_series = df["rop"].astype(float)
    spp_series = df["standpipe_pressure"].astype(float)
    
    torque_curr = float(current["torque"])
    torque_mean = float(torque_series.mean())
    torque_std = float(torque_series.std() if len(torque_series) > 1 else 0.0)
    
    # Baseline comparison (earliest sample in current window vs latest)
    torque_init = float(df.iloc[0]["torque"])
    delta_torque = torque_curr - torque_init
    
    rop_curr = float(current["rop"])
    rop_init = float(df.iloc[0]["rop"])
    delta_rop = rop_curr - rop_init
    rop_drop_ratio = (rop_init - rop_curr) / max(0.5, rop_init) if rop_curr < rop_init else 0.0
    
    spp_curr = float(current["standpipe_pressure"])
    spp_init = float(df.iloc[0]["standpipe_pressure"])
    delta_spp = spp_curr - spp_init
    
    flow_in = float(current["flow_in"])
    flow_out = float(current["flow_out"])
    flow_delta = flow_out - flow_in
    
    # Calculate MSE
    mse = compute_mechanical_specific_energy(
        wob_kn=float(current["wob"]),
        torque_knm=torque_curr,
        rpm=float(current["rpm"]),
        rop_mhr=rop_curr
    )
    
    # Torque and pressure correlation
    corr = 0.0
    if len(df) >= 3 and torque_series.std() > 0 and spp_series.std() > 0:
        c = np.corrcoef(torque_series, spp_series)[0, 1]
        if not np.isnan(c):
            corr = float(c)
            
    return {
        "torque_current": round(torque_curr, 2),
        "torque_rolling_mean": round(torque_mean, 2),
        "torque_rolling_std": round(torque_std, 2),
        "delta_torque_15m": round(delta_torque, 2),
        "rop_current": round(rop_curr, 2),
        "delta_rop_15m": round(delta_rop, 2),
        "rop_drop_ratio": round(float(np.clip(rop_drop_ratio, 0.0, 1.0)), 2),
        "spp_current": round(spp_curr, 2),
        "delta_spp_15m": round(delta_spp, 2),
        "flow_delta": round(flow_delta, 1),
        "mse": round(mse, 1),
        "torque_pressure_corr": round(corr, 2)
    }
