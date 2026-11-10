# core/heat_math.py
import math
from typing import Dict, Any, List
from catalogs.catalog_heat import EQUIPMENT_CATALOG_HEAT, HeatingSolution

ALPHA_INT = 8.7
ALPHA_EXT = 23.0

WALL_MATERIALS = {
    "brick_solid": 0.56, "brick_hollow": 0.35, "aerated_d400": 0.12,
    "aerated_d600": 0.20, "wood": 0.15
}
INSULATION_MATERIALS = {"none": 0.0, "minwool": 0.040, "penoplex": 0.030}
WINDOW_TYPES = {"single_chamber": 0.32, "double_chamber": 0.45, "triple_chamber": 0.55}


def calculate_heat_loss(
        city_temp: float, t_inside: float, wall_area: float, wall_mat: str, wall_thick: float,
        insul_mat: str, insul_thick: float, window_area: float, window_type: str,
        roof_area: float, roof_insul: float, floor_area: float
) -> Dict[str, Any]:
    delta_t = t_inside - city_temp
    if delta_t <= 0:
        return {"error": "Температура внутри должна быть выше уличной"}

    r_wall_base = (1 / ALPHA_INT) + (wall_thick / WALL_MATERIALS.get(wall_mat, 0.5)) + (1 / ALPHA_EXT)
    if insul_mat != "none" and insul_thick > 0:
        r_wall_base += (insul_thick / INSULATION_MATERIALS.get(insul_mat, 0.04))
    q_wall = (wall_area * delta_t / r_wall_base) if r_wall_base > 0 else 0

    r_window = WINDOW_TYPES.get(window_type, 0.45)
    q_window = (window_area * delta_t / r_window) if r_window > 0 else 0

    r_roof = (1 / ALPHA_INT) + (roof_insul / INSULATION_MATERIALS["minwool"]) + (
                1 / ALPHA_EXT) if roof_insul > 0 else 3.0
    q_roof = (roof_area * delta_t / r_roof) if r_roof > 0 else 0

    r_floor = 3.0
    q_floor = (floor_area * delta_t / r_floor) if r_floor > 0 else 0

    total_transmission = q_wall + q_window + q_roof + q_floor
    total_with_infiltration = total_transmission * 1.10
    boiler_power_kw = (total_with_infiltration * 1.15) / 1000.0

    return {
        "delta_t": round(delta_t, 1), "r_wall": round(r_wall_base, 2),
        "q_wall_w": round(q_wall, 0), "q_window_w": round(q_window, 0),
        "q_roof_w": round(q_roof, 0), "q_floor_w": round(q_floor, 0),
        "total_loss_w": round(total_transmission, 0),
        "total_with_infiltration_w": round(total_with_infiltration, 0),
        "boiler_power_kw": round(boiler_power_kw, 1)
    }


def calculate_radiator_correction(t_supply: float, t_return: float, t_room: float) -> Dict[str, Any]:
    dt_nominal = (90 + 70) / 2 - 20
    dt_actual = (t_supply + t_return) / 2 - t_room
    if dt_actual <= 0:
        return {"power_factor": 0.0, "dt_actual": 0.0, "warning": "Температура в системе ниже комнатной!"}
    power_factor = (dt_actual / dt_nominal) ** 1.3
    return {"power_factor": round(power_factor, 3), "dt_actual": round(dt_actual, 1), "warning": ""}


def apply_connection_factor(power_factor: float, connection_type: str) -> float:
    factors = {"side": 1.0, "diagonal": 1.0, "bottom": 0.85, "bottom_diverted": 0.9}
    return power_factor * factors.get(connection_type, 1.0)


def find_heat_equipment(power_kw: float, rad_factor: float) -> List[HeatingSolution]:
    matched = []
    for item in EQUIPMENT_CATALOG_HEAT:
        if item.category == "boiler" and item.power_kw >= power_kw * 0.95:
            matched.append(item)
        elif item.category == "radiator" and item.power_kw * rad_factor >= 1.0:
            matched.append(item)
    return matched


# --- НОВАЯ ФУНКЦИЯ: РАСЧЕТ ТЕПЛОГО ПОЛА ---
def calculate_underfloor_heating(area_m2: float, spacing_mm: float, heat_loss_w: float, t_supply: float,
                                 t_return: float) -> Dict[str, Any]:
    if area_m2 <= 0 or spacing_mm <= 0:
        return {"error": "Площадь и шаг должны быть больше нуля"}

    # 1. Расчет длины трубы
    # На 1 м² при шаге 150 мм нужно 1000/150 = 6.67 метров трубы.
    pipe_per_m2 = 1000.0 / spacing_mm
    # Добавляем 10% на повороты и подводку к коллектору (примерно)
    total_pipe_length = area_m2 * pipe_per_m2 * 1.1

    # 2. Количество контуров (петель)
    # По нормам, длина одной петли не должна превышать 80-100 м (иначе насос не продавит).
    # Берем максимум 80 метров на петлю.
    max_loop_length = 80.0
    num_loops = math.ceil(total_pipe_length / max_loop_length)
    if num_loops == 0: num_loops = 1

    # 3. Расход воды
    # Q = G * c * dt  => G = Q / (c * dt)
    # c = 4.18 кДж/кг*С, плотность воды 1000 кг/м3
    delta_t = t_supply - t_return
    if delta_t <= 0:
        return {"error": "Температура подачи должна быть выше обратки"}

    # Расход в м3/ч = (Q_вт * 3.6) / (4.18 * 1000 * dt)
    flow_m3h = (heat_loss_w * 3.6) / (4.18 * 1000 * delta_t)
    flow_l_min = flow_m3h * 1000 / 60.0

    # 4. Подбор коллектора (по количеству выходов)
    # Округляем до стандартных значений (2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)
    collector_outputs = max(2, num_loops)

    return {
        "total_pipe_length": round(total_pipe_length, 1),
        "num_loops": num_loops,
        "loop_length": round(total_pipe_length / num_loops, 1),
        "flow_m3h": round(flow_m3h, 2),
        "flow_l_min": round(flow_l_min, 1),
        "collector_outputs": collector_outputs
    }


def generate_heat_report(city_name: str, res: Dict, wall_mat: str, insul_mat: str, win_type: str) -> str:
    lines = [
        "=" * 60, "ОТЧЁТ ПО ТЕПЛОТЕХНИЧЕСКОМУ РАСЧЁТУ", "=" * 60,
        f"Температура внутри: {res.get('delta_t', 0) + 0} °C (ΔT = {res['delta_t']} °C)", "",
        "-" * 40, "СОПРОТИВЛЕНИЯ И ТЕПЛОПОТЕРИ", "-" * 40,
        f"Сопротивление стены (R): {res['r_wall']} (м²·°С)/Вт",
        f"Потери через стены: {res['q_wall_w']} Вт", f"Потери через окна: {res['q_window_w']} Вт",
        f"Потери через крышу: {res['q_roof_w']} Вт", f"Потери через пол: {res['q_floor_w']} Вт",
        f"Суммарные трансмиссионные потери: {res['total_loss_w']} Вт",
        f"С учётом инфильтрации (+10%): {res['total_with_infiltration_w']} Вт", "",
        "-" * 40, "ПОДБОР ОБОРУДОВАНИЯ", "-" * 40,
        f"Требуемая мощность котла (+15%): {res['boiler_power_kw']} кВт", "=" * 60,
    ]
    return "\n".join(lines)