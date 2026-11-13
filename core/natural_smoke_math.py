import math
from typing import Dict, Any


def calculate_gravity_pressure(height_m: float, t_in: float, t_out: float) -> float:
    rho_in = 353.0 / (273.0 + t_in)
    rho_out = 353.0 / (273.0 + t_out)
    delta_p = height_m * (rho_out - rho_in) * 9.81
    return delta_p if delta_p > 0 else 0.0


def calculate_natural_ventilation(height_m: float, t_in: float, t_out: float, duct_area_m2: float, local_zeta: float) -> \
Dict[str, Any]:
    # ЗАЩИТА ОТ ДЕЛЕНИЯ НА НОЛЬ
    if duct_area_m2 <= 0:
        return {"error": "Площадь сечения шахты должна быть больше нуля."}
    if local_zeta < 0:
        return {"error": "Сумма местных сопротивлений не может быть отрицательной."}

    lambda_fr = 0.02
    d_eq = math.sqrt(4 * duct_area_m2 / math.pi)
    r_total = lambda_fr * (height_m / d_eq) + local_zeta

    delta_p = calculate_gravity_pressure(height_m, t_in, t_out)
    rho_in = 353.0 / (273.0 + t_in)

    if r_total > 0 and rho_in > 0:
        velocity = math.sqrt((2 * delta_p) / (r_total * rho_in))
        flow_m3h = velocity * duct_area_m2 * 3600.0
    else:
        velocity = 0.0
        flow_m3h = 0.0

    warning = ""
    if velocity > 2.0:
        warning = "Скорость воздуха в шахте превышает 2 м/с. Для естественной вентиляции это слишком много (увеличьте сопротивление или уменьшите сечение)."
    elif not delta_p > 0:
        warning = "Гравитационное давление отсутствует (опрокидывание тяги). Проверьте температуры."

    return {
        "gravity_pressure_pa": round(delta_p, 1),
        "velocity_ms": round(velocity, 2),
        "flow_m3h": round(flow_m3h, 1),
        "is_working": delta_p > 0,
        "warning": warning
    }


def calculate_corridor_smoke_exhaust(door_width: float, door_height: float, num_doors: int) -> Dict[str, Any]:
    G_one_door = 3420.0 * door_width * (door_height ** 1.5)
    rho_smoke = 0.61
    L_one_door = G_one_door / rho_smoke
    L_total = L_one_door * num_doors

    return {
        "mass_flow_kg_h": round(G_one_door * num_doors, 1),
        "volume_flow_m3h": round(L_total, 1),
        "per_door_m3h": round(L_one_door, 1)
    }


def calculate_stairwell_pressurization(door_width: float, door_height: float, num_floors: int) -> Dict[str, Any]:
    open_door_area = door_width * door_height
    L_open = 1.2 * open_door_area * 3600.0
    L_closed = 150.0 * (num_floors - 1)
    L_total = L_open + L_closed

    return {
        "open_door_flow_m3h": round(L_open, 1),
        "closed_doors_flow_m3h": round(L_closed, 1),
        "total_flow_m3h": round(L_total, 1)
    }