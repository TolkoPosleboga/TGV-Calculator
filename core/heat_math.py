import math
from typing import Dict, Any, List
from catalogs.catalog_heat import EQUIPMENT_CATALOG_HEAT, HeatingSolution

ALPHA_INT = 8.7
ALPHA_EXT = 23.0

WALL_MATERIALS = {"brick_solid": 0.56, "brick_hollow": 0.35, "aerated_d400": 0.12, "aerated_d600": 0.20, "wood": 0.15}
INSULATION_MATERIALS = {"none": 0.0, "minwool": 0.040, "penoplex": 0.030}
WINDOW_TYPES = {"single_chamber": 0.32, "double_chamber": 0.45, "triple_chamber": 0.55}


def calculate_heat_loss(
        city_temp: float, t_inside: float, wall_area: float, wall_mat: str, wall_thick: float,
        insul_mat: str, insul_thick: float, window_area: float, window_type: str,
        roof_area: float, roof_insul: float, floor_area: float,
        gsop: float = 0
) -> Dict[str, Any]:
    delta_t = t_inside - city_temp
    if delta_t <= 0:
        return {"error": "Температура внутри должна быть выше уличной"}

    r_wall_base = (1 / ALPHA_INT) + (wall_thick / WALL_MATERIALS.get(wall_mat, 0.5)) + (1 / ALPHA_EXT)
    r_wall_actual = r_wall_base

    if insul_mat != "none" and insul_thick > 0:
        r_wall_actual += (insul_thick / INSULATION_MATERIALS.get(insul_mat, 0.04))

    q_wall = (wall_area * delta_t / r_wall_actual) if r_wall_actual > 0 else 0

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

    compliance = {
        "r_req": 0.0,
        "is_compliant": True,
        "req_insul_thick": 0.0,
        "message": "ГСОП не задан. Проверка не выполнена."
    }

    if gsop > 0:
        r_req = 0.00035 * gsop + 1.4
        compliance["r_req"] = round(r_req, 2)

        if r_wall_actual >= r_req:
            compliance["is_compliant"] = True
            compliance["message"] = "Стена соответствует нормам энергоэффективности (СП 50.13330.2012)."
        else:
            compliance["is_compliant"] = False
            delta_r = r_req - r_wall_actual
            lambda_insul = INSULATION_MATERIALS.get(insul_mat, 0.04) if insul_mat != "none" else 0.04
            req_add_insul = delta_r * lambda_insul
            compliance["req_insul_thick"] = round(req_add_insul, 3)
            compliance[
                "message"] = f"Стена НЕ соответствует нормам. Требуется дополнительное утепление (мин. {round(req_add_insul * 100, 1)} см)."

    return {
        "delta_t": round(delta_t, 1),
        "r_wall": round(r_wall_actual, 2),
        "r_wall_base": round(r_wall_base, 2),
        "q_wall_w": round(q_wall, 0), "q_window_w": round(q_window, 0),
        "q_roof_w": round(q_roof, 0), "q_floor_w": round(q_floor, 0),
        "total_loss_w": round(total_transmission, 0),
        "total_with_infiltration_w": round(total_with_infiltration, 0),
        "boiler_power_kw": round(boiler_power_kw, 1),
        "compliance": compliance
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


def calculate_hydraulics(power_w: float, t_supply: float, t_return: float, velocity: float = 0.6) -> Dict[str, Any]:
    dt = t_supply - t_return
    if dt <= 0:
        return {"error": "Температура подачи должна быть выше обратки"}
    if velocity <= 0:
        velocity = 0.6

    flow_m3h = (power_w * 3.6) / (4.18 * 1000 * dt)
    area_req_m2 = (flow_m3h / 3600.0) / velocity
    d_req_mm = math.sqrt(4 * area_req_m2 / math.pi) * 1000

    std_diameters = [15, 20, 25, 32, 40, 50, 65, 80, 100]
    selected_d = next((d for d in std_diameters if d >= d_req_mm), std_diameters[-1])

    system_volume_l = (power_w / 1000.0) * 15
    tank_volume_l = system_volume_l * 0.1 * 1.5

    return {
        "flow_m3h": round(flow_m3h, 2),
        "d_req_mm": round(d_req_mm, 1),
        "selected_d_mm": selected_d,
        "system_volume_l": round(system_volume_l, 0),
        "tank_volume_l": round(tank_volume_l, 0)
    }


def calculate_underfloor_heating(area_m2: float, spacing_mm: float, heat_loss_w: float, t_supply: float,
                                 t_return: float) -> Dict[str, Any]:
    if area_m2 <= 0 or spacing_mm <= 0:
        return {"error": "Площадь и шаг должны быть больше нуля"}

    pipe_per_m2 = 1000.0 / spacing_mm
    total_pipe_length = area_m2 * pipe_per_m2 * 1.1
    max_loop_length = 80.0
    num_loops = math.ceil(total_pipe_length / max_loop_length)
    if num_loops == 0: num_loops = 1

    delta_t = t_supply - t_return
    if delta_t <= 0:
        return {"error": "Температура подачи должна быть выше обратки"}

    flow_m3h = (heat_loss_w * 3.6) / (4.18 * 1000 * delta_t)
    flow_l_min = flow_m3h * 1000 / 60.0

    return {
        "total_pipe_length": round(total_pipe_length, 1),
        "num_loops": num_loops,
        "loop_length": round(total_pipe_length / num_loops, 1),
        "flow_m3h": round(flow_m3h, 2),
        "flow_l_min": round(flow_l_min, 1),
        "collector_outputs": max(2, num_loops)
    }


def find_heat_equipment(power_kw: float, rad_factor: float) -> Dict[str, Any]:
    by_cat = {
        "boiler": {"basic": [], "industrial": []},
        "radiator": {"basic": [], "industrial": []},
        "pump": {"basic": [], "industrial": []}
    }

    for item in EQUIPMENT_CATALOG_HEAT:
        if item.category == "boiler" and item.power_kw >= power_kw * 0.95:
            by_cat["boiler"][item.segment].append(item)
        elif item.category == "radiator" and item.power_kw * rad_factor >= 1.0 and power_kw < 500:
            by_cat["radiator"][item.segment].append(item)
        elif item.category == "pump" and power_kw < 500:
            by_cat["pump"][item.segment].append(item)

    matched = []
    missing = []

    # Котлы
    if by_cat["boiler"]["basic"]:
        matched.extend(by_cat["boiler"]["basic"])
    elif by_cat["boiler"]["industrial"]:
        matched.extend(by_cat["boiler"]["industrial"])
    else:
        missing.append({"category": "Котёл", "power": round(power_kw, 1)})

    # Радиаторы
    if by_cat["radiator"]["basic"]:
        matched.extend(by_cat["radiator"]["basic"])
    elif by_cat["radiator"]["industrial"]:
        matched.extend(by_cat["radiator"]["industrial"])
    elif power_kw >= 500:
        missing.append({"category": "Радиатор", "power_factor": "Требуется расчет секций/панелей"})
    else:
        missing.append({"category": "Радиатор", "power_factor": round(rad_factor, 2)})

    # Насосы
    if by_cat["pump"]["basic"]:
        matched.extend(by_cat["pump"]["basic"])
    elif by_cat["pump"]["industrial"]:
        matched.extend(by_cat["pump"]["industrial"])
    elif power_kw >= 500:
        missing.append({"category": "Насос", "power_factor": "Требуется промышленный насос"})

    return {
        "solutions": matched,
        "requires_professional": len(missing) > 0,
        "missing": missing
    }


def generate_heat_report(city_name: str, res: Dict, hydr: Dict, wall_mat: str, insul_mat: str, win_type: str,
                         solutions_data: Dict = None) -> str:
    flow = hydr.get("flow_m3h", 0)
    d_mm = hydr.get("selected_d_mm", 0)
    tank = hydr.get("tank_volume_l", 0)

    comp = res.get("compliance", {})
    comp_text = ""
    if comp and comp.get("r_req", 0) > 0:
        comp_text = f"\nПРОВЕРКА ЭНЕРГОЭФФЕКТИВНОСТИ:\n{comp.get('message')}\nR_треб = {comp.get('r_req')} (м²·°С)/Вт, R_факт = {res.get('r_wall')} (м²·°С)/Вт\n"

    lines = [
        "=" * 60, "ОТЧЁТ ПО ТЕПЛОТЕХНИЧЕСКОМУ РАСЧЁТУ", "=" * 60,
        f"Температура внутри: {res.get('delta_t', 0) + 0} °C (ΔT = {res['delta_t']} °C)", "",
        "-" * 40, "СОПРОТИВЛЕНИЯ И ТЕПЛОПОТЕРИ", "-" * 40,
        f"Сопротивление стены (R): {res['r_wall']} (м²·°С)/Вт",
        f"Потери через стены: {res['q_wall_w']} Вт", f"Потери через окна: {res['q_window_w']} Вт",
        f"Потери через крышу: {res['q_roof_w']} Вт", f"Потери через пол: {res['q_floor_w']} Вт",
        f"Суммарные трансмиссионные потери: {res['total_loss_w']} Вт",
        f"С учётом инфильтрации (+10%): {res['total_with_infiltration_w']} Вт", "",
        comp_text,
        "-" * 40, "ГИДРАВЛИКА", "-" * 40,
        f"Расход теплоносителя: {flow} м³/ч",
        f"Рекомендуемый диаметр труб (внутр.): Ду{d_mm} мм",
        f"Объем расширительного бака: {tank} литров", "",
        "-" * 40, "ПОДБОР ОБОРУДОВАНИЯ", "-" * 40,
        f"Требуемая мощность котла (+15%): {res['boiler_power_kw']} кВт"
    ]

    if solutions_data and solutions_data.get("requires_professional"):
        lines.extend(["", "-" * 40, "ВНИМАНИЕ: ТРЕБУЕТСЯ ПРОФЕССИОНАЛЬНЫЙ ПОДБОР", "-" * 40])
        for m in solutions_data["missing"]:
            if m["category"] == "Котёл":
                lines.append(f"Нет подходящего котла (Требуется: {m['power']} кВт)")
            elif m["category"] == "Радиатор":
                lines.append(f"Нет подходящего радиатора для заданных условий")

    lines.append("=" * 60)
    return "\n".join(lines)