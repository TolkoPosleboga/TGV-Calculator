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


def calculate_water_heater(
        L_m3h: float,
        t_air_in: float,
        t_air_out: float,
        t_w_in: float,
        t_w_out: float
) -> Dict[str, Any]:
    if t_air_out <= t_air_in:
        return {"error": "Температура воздуха на выходе должна быть выше, чем на входе"}
    if t_w_in <= t_w_out:
        return {"error": "Температура подачи воды должна быть выше обратки"}

    # Q = L * rho * c * dt / 3600 (в кВт)
    q_kw = (L_m3h * 1.2 * 1.005 * (t_air_out - t_air_in)) / 3600.0

    # G = 3.6 * Q / (c_w * dt_w) (в м3/ч)
    g_w_m3h = (3.6 * q_kw) / (4.18 * (t_w_in - t_w_out))

    # Скорость воды в трубках (примем условный диаметр 15 мм для оценки)
    d_inner = 0.015
    area = math.pi * (d_inner ** 2) / 4.0
    v_water = (g_w_m3h / 3600.0) / area

    warning = ""
    if v_water > 1.5:
        warning = "Скорость воды в трубках выше 1.5 м/с. Возможен шум. Рекомендуется увеличить диаметр патрубков."
    elif v_water < 0.2:
        warning = "Скорость воды слишком низкая. Возможно завоздушивание системы."

    return {
        "q_kw": round(q_kw, 2),
        "g_w_m3h": round(g_w_m3h, 3),
        "g_w_ls": round(g_w_m3h * 1000 / 3600, 2),
        "v_water": round(v_water, 2),
        "warning": warning
    }


def calculate_diaphragm(dP_pa: float, D_mm: float, L_m3h: float) -> Dict[str, Any]:
    if dP_pa <= 0:
        return {"error": "Гасимое давление должно быть больше нуля"}
    if D_mm <= 0 or L_m3h <= 0:
        return {"error": "Диаметр воздуховода и расход должны быть больше нуля"}

    area_m2 = math.pi * ((D_mm / 1000.0) ** 2) / 4.0
    v_ms = L_m3h / 3600.0 / area_m2

    # Динамическое давление
    Pd_pa = 1.2 * (v_ms ** 2) / 2.0

    # Требуемый коэффициент местного сопротивления
    zeta_req = dP_pa / Pd_pa if Pd_pa > 0 else 0

    # Диаметр отверстия диафрагмы (упрощенная формула для тонкой шайбы)
    # zeta = (D^2/d^2 - 1)^2  =>  d = D / sqrt(sqrt(zeta) + 1)
    d_hole_mm = D_mm / math.sqrt(math.sqrt(zeta_req) + 1)

    warning = ""
    if d_hole_mm < 20:
        warning = "Диаметр отверстия менее 20 мм. Диафрагма может забиваться пылью."

    return {
        "zeta": round(zeta_req, 1),
        "Pd": round(Pd_pa, 1),
        "d_hole_mm": round(d_hole_mm, 1),
        "velocity": round(v_ms, 2),
        "warning": warning
    }