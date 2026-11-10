# core/vent_math.py
import math
from typing import Dict, Any, List
from catalogs.catalog_vent import EquipmentSolution, EQUIPMENT_CATALOG

STANDARD_ROUND_DIAMETERS = [100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250]
AIR_NORM_PER_PERSON = {"office": 40.0, "classroom": 40.0, "industrial": 30.0, "residential": 30.0}
AIR_CHANGE_RATE = {"office": 2.0, "classroom": 2.0, "industrial": 1.5, "residential": 0.35}
LOCAL_LOSS_COEFFICIENT = {"office": 2.5, "classroom": 2.5, "industrial": 3.5, "residential": 2.0}
EQUIPMENT_RESISTANCE_PA = 230.0
SAFETY_FACTOR_PRESSURE = 1.15
SAFETY_FACTOR_FLOW = 1.10
AIR_DENSITY = 1.2
AIR_KINEMATIC_VISCOSITY = 1.5e-5
ROUGHNESS_MM = 0.1


def calculate_air_exchange(length: float, width: float, height: float, people: int, heat_gain_kw: float,
                           t_inside: float, t_outside: float, room_type: str) -> Dict[str, Any]:
    volume = length * width * height
    L_people = people * AIR_NORM_PER_PERSON[room_type]
    L_rate = volume * AIR_CHANGE_RATE[room_type]
    delta_t = t_inside - t_outside
    L_heat = 0.0 if delta_t <= 0 else (3600.0 * heat_gain_kw) / (AIR_DENSITY * 1.005 * delta_t)
    L_max = max(L_people, L_rate, L_heat)
    return {"volume_m3": round(volume, 2), "L_people_m3h": round(L_people, 2),
            "L_rate_m3h": round(L_rate, 2), "L_heat_m3h": round(L_heat, 2),
            "L_max_m3h": round(L_max, 2), "delta_t": round(delta_t, 2)}


def select_duct(L: float, shape: str) -> Dict[str, Any]:
    area_req = L / 3600.0 / 5.0
    if shape == "round":
        d_req = math.sqrt(4.0 * area_req / math.pi) * 1000.0
        d_sel = next((d for d in STANDARD_ROUND_DIAMETERS if d >= d_req), STANDARD_ROUND_DIAMETERS[-1])
        area = math.pi * (d_sel / 1000.0) ** 2 / 4.0
        v = L / 3600.0 / area
        return {"shape": "round", "diameter_mm": d_sel, "area_m2": round(area, 4), "velocity_ms": round(v, 2),
                "equivalent_diameter_m": round(d_sel / 1000.0, 4)}
    else:
        b = math.sqrt(area_req / 2.0);
        a = 2.0 * b
        a_mm = math.ceil(a * 1000 / 50) * 50;
        b_mm = math.ceil(b * 1000 / 50) * 50
        if a_mm / b_mm > 3.0: b_mm = math.ceil(a_mm / 3.0 / 50) * 50
        area = (a_mm / 1000.0) * (b_mm / 1000.0)
        v = L / 3600.0 / area
        d_eq = 2.0 * (a_mm / 1000.0) * (b_mm / 1000.0) / ((a_mm / 1000.0) + (b_mm / 1000.0))
        return {"shape": "rect", "width_mm": a_mm, "height_mm": b_mm, "aspect_ratio": round(a_mm / b_mm, 2),
                "area_m2": round(area, 4), "velocity_ms": round(v, 2), "equivalent_diameter_m": round(d_eq, 4)}


def calculate_pressure_loss(L: float, duct: Dict, length: float, room: str) -> Dict[str, Any]:
    v = duct["velocity_ms"];
    d_eq = duct["equivalent_diameter_m"]
    Re = v * d_eq / AIR_KINEMATIC_VISCOSITY
    lam = 0.11 * (((ROUGHNESS_MM / 1000.0) / d_eq) + (68.0 / Re)) ** 0.25
    dyn = AIR_DENSITY * v ** 2 / 2.0
    fr = lam * (length / d_eq) * dyn
    zeta = LOCAL_LOSS_COEFFICIENT[room]
    loc = zeta * dyn
    total_before = fr + loc + EQUIPMENT_RESISTANCE_PA
    total = total_before * SAFETY_FACTOR_PRESSURE
    return {"total_loss_pa": round(total, 2), "friction_loss_pa": round(fr, 2), "local_loss_pa": round(loc, 2)}


def select_equipment_base(L: float, pressure: Dict, t_inside: float, t_outside: float) -> Dict[str, Any]:
    L_fan = L * SAFETY_FACTOR_FLOW
    P_fan = pressure["total_loss_pa"]
    dt = t_inside - t_outside
    Q = (L * AIR_DENSITY * 1.005 * dt) / 3600.0 if dt > 0 else 0.0
    return {"fan_flow_m3h": round(L_fan, 2), "fan_pressure_pa": round(P_fan, 2), "heater_power_kw": round(Q, 2)}


# НОВАЯ ФУНКЦИЯ: РАСЧЕТ РЕКУПЕРАЦИИ
def calculate_recuperation(L: float, t_inside: float, t_outside: float, efficiency_pct: float,
                           electricity_tariff: float, days: int) -> Dict[str, Any]:
    if t_inside <= t_outside or efficiency_pct <= 0:
        return {"q_saved_kw": 0, "energy_saved_kwh": 0, "money_saved_rub": 0, "frost_warning": ""}

    efficiency = efficiency_pct / 100.0
    delta_t = t_inside - t_outside

    # 1. Сэкономленная тепловая мощность (кВт)
    # Q = L * rho * c * dt * eff / 3600
    q_saved_kw = (L * AIR_DENSITY * 1.005 * delta_t * efficiency) / 3600.0

    # 2. Сэкономленная энергия за сезон (кВт*ч)
    hours = days * 24
    energy_saved_kwh = q_saved_kw * hours

    # 3. Экономия денег (руб)
    money_saved = energy_saved_kwh * electricity_tariff

    # 4. Предупреждение об обмерзании
    frost_warning = ""
    if t_outside < -15 and efficiency_pct > 60:
        frost_warning = "При температуре ниже -15°C роторный/пластинчатый рекуператор может обмерзать. Требуется байпас или предварительный подогрев."

    return {
        "q_saved_kw": round(q_saved_kw, 2),
        "energy_saved_kwh": round(energy_saved_kwh, 0),
        "money_saved_rub": round(money_saved, 0),
        "frost_warning": frost_warning
    }


def find_solutions(L: float, P: float, Q: float) -> List[EquipmentSolution]:
    L_req = L * 1.05
    matched = []
    for item in EQUIPMENT_CATALOG:
        if item.max_flow < L_req: continue
        if item.category == "unit" and item.max_pressure < P: continue
        if item.category == "heater" and item.heater_power < Q: continue
        matched.append(item)
    return matched


def generate_vent_report(air: Dict, duct: Dict, pressure: Dict, equipment: Dict, recup: Dict = None) -> str:
    lines = [
        "=" * 60, "ОТЧЁТ ПО РАСЧЁТУ ВЕНТИЛЯЦИИ", "=" * 60,
        f"Объём помещения: {air['volume_m3']} м³",
        f"Расход воздуха: {air['L_max_m3h']} м³/ч",
        f"Сечение воздуховода: {duct.get('diameter_mm', '')} мм" if duct[
                                                                        'shape'] == 'round' else f"Сечение: {duct['width_mm']}×{duct['height_mm']} мм",
        f"Скорость в канале: {duct['velocity_ms']} м/с",
        f"Потери давления: {pressure['total_loss_pa']} Па",
        f"Требуемый вентилятор: {equipment['fan_flow_m3h']} м³/ч, {equipment['fan_pressure_pa']} Па",
        f"Мощность нагрева (калорифер): {equipment['heater_power_kw']} кВт",
    ]
    if recup and recup.get("q_saved_kw", 0) > 0:
        lines.extend([
            "", "-" * 40, "РЕКУПЕРАЦИЯ ТЕПЛА", "-" * 40,
            f"Экономия мощности: {recup['q_saved_kw']} кВт",
            f"Экономия энергии за сезон: {recup['energy_saved_kwh']} кВт*ч",
            f"Экономия денег за сезон: {recup['money_saved_rub']} руб."
        ])
    lines.append("=" * 60)
    return "\n".join(lines)