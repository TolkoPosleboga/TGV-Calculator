# core/gas_math.py
import math
from typing import Dict, Any, List
from catalogs.catalog_gas import GAS_CATALOG, GasEquipment

CALORIFIC_VALUE = 9.45
BOILER_EFFICIENCY = 0.92
GAS_DENSITY = 0.73
GAS_VISCOSITY = 1.43e-6


def calculate_gas_system(
        boiler_power_kw: float, has_stove: bool, has_water_heater: bool,
        room_volume: float, room_height: float, combustion_chamber: str,
        chimney_height: float, pipe_length: float, local_zeta: float,
        window_area: float
) -> Dict[str, Any]:
    # 1. Расход газа
    v_boiler = boiler_power_kw / (CALORIFIC_VALUE * BOILER_EFFICIENCY)
    v_stove = 1.2 if has_stove else 0.0
    v_heater = 2.5 if has_water_heater else 0.0
    v_total = v_boiler + v_stove + v_heater

    # 2. Подбор счётчика и трубы
    selected_meter = next((item for item in sorted(GAS_CATALOG, key=lambda x: x.max_flow) if
                           item.category == "meter" and item.max_flow >= v_total), None)
    selected_pipe = next((item for item in sorted(GAS_CATALOG, key=lambda x: x.max_flow) if
                          item.category == "pipe" and item.max_flow >= v_total), None)

    # 3. Гидравлика
    d_inner_m = 0.020
    if selected_pipe:
        if "Ду20" in selected_pipe.model:
            d_inner_m = 0.021
        elif "Ду25" in selected_pipe.model:
            d_inner_m = 0.027
        elif "Ду32" in selected_pipe.model:
            d_inner_m = 0.035

    pipe_area = math.pi * d_inner_m ** 2 / 4.0
    velocity = v_total / 3600.0 / pipe_area
    Re = velocity * d_inner_m / GAS_VISCOSITY

    delta = 0.0001
    lambda_fr = 0.11 * ((delta / d_inner_m) + (68 / Re)) ** 0.25 if Re > 0 else 0

    dynamic_pressure = GAS_DENSITY * velocity ** 2 / 2.0
    p_friction = lambda_fr * (pipe_length / d_inner_m) * dynamic_pressure
    p_local = local_zeta * dynamic_pressure
    p_total = p_friction + p_local

    velocity_warning = "Скорость газа > 7 м/с! Увеличьте диаметр." if velocity > 7.0 else ""

    # 4. Дымоход
    chimney_area = 0
    chimney_warning = ""
    if combustion_chamber == "open":
        chimney_area = v_boiler / (3600 * 1.5)
        d_chimney_mm = math.sqrt(4 * chimney_area / math.pi) * 1000
        if d_chimney_mm < 100:
            d_chimney_mm = 100
        if chimney_height < 5:
            chimney_warning = "Высота дымохода менее 5 м недопустима по СП 7.13130!"
    else:
        d_chimney_mm = 0

    # 5. Вентиляция
    v_exhaust = room_volume * 3
    if has_stove and v_exhaust < 30:
        v_exhaust = 30
    v_supply = v_exhaust + (v_total * 1.2)

    # 6. Проверка требований к котельной
    boiler_room_warnings = []
    if room_volume < 15.0:
        boiler_room_warnings.append("Объём помещения менее 15 м³ (СП 62.13330, п. 6.1.18)")

    required_window_area = room_volume * 0.03
    if window_area < required_window_area:
        boiler_room_warnings.append(
            f"Площадь окна меньше нормы (нужно {required_window_area:.2f} м², по факту {window_area} м²)")

    # 7. Комплект безопасности
    safety_items = []
    if boiler_power_kw > 0:
        sensor = next((item for item in GAS_CATALOG if "Сигнализатор" in item.type), None)
        valve = next((item for item in GAS_CATALOG if "Клапан" in item.type), None)
        if sensor: safety_items.append(sensor)
        if valve: safety_items.append(valve)

    return {
        "v_boiler": round(v_boiler, 2),
        "v_total": round(v_total, 2),
        "meter": selected_meter.model if selected_meter else "Требуется промышленный счётчик",
        "pipe": selected_pipe.model if selected_pipe else "Требуется расчет",
        "velocity": round(velocity, 2),
        "p_friction": round(p_friction, 1),
        "p_local": round(p_local, 1),
        "p_total": round(p_total, 1),
        "velocity_warning": velocity_warning,
        "d_chimney_mm": round(d_chimney_mm, 0),
        "chimney_warning": chimney_warning,
        "v_exhaust": round(v_exhaust, 1),
        "v_supply": round(v_supply, 1),
        "boiler_room_warnings": boiler_room_warnings,
        "safety_items": [item.model_dump() for item in safety_items]
    }