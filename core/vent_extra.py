import math
from typing import Dict, Any

ALPHA_IN = 8.7
ALPHA_OUT = 23.0
INSULATION_LAMBDA = 0.04


def calculate_dew_point(t: float, humidity: float) -> float:
    if humidity <= 0: return -100.0
    a = 17.27
    b = 237.7
    alpha = ((a * t) / (b + t)) + math.log(humidity / 100.0)
    dew_point = (b * alpha) / (a - alpha)
    return round(dew_point, 1)


def calculate_exhaust_humidity(
        W_g_h: float,
        L_m3h: float,
        t_exhaust: float,
        d_supply_g_kg: float = 0.0
) -> Dict[str, Any]:
    if L_m3h <= 0:
        return {"error": "Расход воздуха должен быть больше нуля"}

    rho = 1.2
    d_exhaust = d_supply_g_kg + (W_g_h / (rho * L_m3h))

    a = 17.27
    b = 237.7
    p_sat = 610.78 * math.exp((a * t_exhaust) / (b + t_exhaust))
    p_v = (d_exhaust / (622 + d_exhaust)) * 101325.0
    phi = (p_v / p_sat) * 100.0 if p_sat > 0 else 0

    phi = max(0.0, min(100.0, phi))

    return {
        "d_exhaust_g_kg": round(d_exhaust, 2),
        "humidity_exhaust_pct": round(phi, 1)
    }


def calculate_condensation_check(
        t_exhaust: float,
        humidity: float,
        t_out: float,
        insul_thick_mm: float,
        lambda_insul: float = 0.04
) -> Dict[str, Any]:
    dew_point = calculate_dew_point(t_exhaust, humidity)
    r_in = 1.0 / ALPHA_IN
    r_out = 1.0 / ALPHA_OUT
    r_ins = (insul_thick_mm / 1000.0) / lambda_insul
    r_total = r_in + r_ins + r_out
    q = (t_exhaust - t_out) / r_total if r_total > 0 else 0
    t_surface_in = t_exhaust - q * r_in
    is_condensation = t_surface_in <= dew_point
    req_insul_mm = 0.0
    if is_condensation:
        r_total_req = ((t_exhaust - t_out) / (t_exhaust - dew_point)) * r_in if t_exhaust > dew_point else 0
        r_ins_req = r_total_req - r_in - r_out
        if r_ins_req > 0:
            req_insul_mm = r_ins_req * lambda_insul * 1000.0
            req_insul_mm = math.ceil(req_insul_mm / 10.0) * 10.0
    return {
        "dew_point": dew_point,
        "surface_temp": round(t_surface_in, 1),
        "is_condensation": is_condensation,
        "req_insul_mm": req_insul_mm
    }