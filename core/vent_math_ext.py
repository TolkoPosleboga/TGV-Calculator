import math
from typing import Dict, Any

AIR_DENSITY = 1.2
AIR_HEAT_CAPACITY = 1.005


def calculate_extended_vent(
        volume: float, people: int, heat_gain_kw: float,
        moisture_gain_g_h: float, hazard_g_h: float, mpc_mg_m3: float,
        room_type: str = "office"
) -> Dict[str, Any]:
    # 1. По людям
    norm_per_person = 40.0 if room_type == "office" else 30.0
    L_people = people * norm_per_person

    # 2. По кратности
    air_change_rate = 2.0 if room_type == "office" else 1.5
    L_rate = volume * air_change_rate

    # 3. По теплоизбыткам (dt = 5)
    L_heat = (3600.0 * heat_gain_kw) / (AIR_DENSITY * AIR_HEAT_CAPACITY * 5.0) if heat_gain_kw > 0 else 0.0

    # 4. По влагоизбыткам (принимаем dt влагосодержания = 3 г/кг)
    # L = W / (rho * d)
    L_moisture = moisture_gain_g_h / (AIR_DENSITY * 3.0) if moisture_gain_g_h > 0 else 0.0

    # 5. По вредным веществам (ПДК)
    # L = M / (C_mpc - C_out). Принимаем C_out = 0.3 * C_mpc
    L_hazard = 0.0
    if hazard_g_h > 0 and mpc_mg_m3 > 0:
        delta_c = mpc_mg_m3 * 0.7
        L_hazard = (hazard_g_h * 1000.0) / delta_c

    # Итог
    L_max = max(L_people, L_rate, L_heat, L_moisture, L_hazard)

    # Находим победителя
    reasons = {
        "По людям": L_people,
        "По кратности": L_rate,
        "По теплоизбыткам": L_heat,
        "По влаге": L_moisture,
        "По ПДК": L_hazard
    }
    decisive_factor = max(reasons, key=reasons.get) if L_max > 0 else "Нет данных"

    return {
        "L_people": round(L_people, 1),
        "L_rate": round(L_rate, 1),
        "L_heat": round(L_heat, 1),
        "L_moisture": round(L_moisture, 1),
        "L_hazard": round(L_hazard, 1),
        "L_max": round(L_max, 1),
        "decisive_factor": decisive_factor
    }