import math
from typing import Dict, Any, List
from catalogs.catalog_ac import AC_CATALOG, AcEquipment


def calculate_full_climate(
        area: float, height: float, people: int,
        t_out_x: float, t_out_p: float, t_out_t: float,
        t_in_x: float, t_in_p: float, t_in_t: float,
        t_supply_x: float, t_supply_p: float, t_supply_t: float,
        t_exhaust_x: float, t_exhaust_p: float, t_exhaust_t: float,
        enthalpy_out_x: float, enthalpy_out_p: float, enthalpy_out_t: float,
        enthalpy_ex_x: float, enthalpy_ex_p: float, enthalpy_ex_t: float,
        lighting_lux: float, lighting_w_m2: float, window_area: float,
        room_type: str, window_type: str,
        co2_out: float = 0.8, co2_in: float = 3.2
) -> Dict[str, Any]:
    volume = area * height

    # Коэффициенты для разных типов помещений (Явное, Полное, Влага)
    q_sens_x_norm, q_sens_t_norm = 100, 100
    q_tot_x_norm, q_tot_t_norm = 130, 130
    w_x_norm, w_t_norm = 40, 40

    if room_type in ["industrial_light", "industrial_heavy"]:
        q_sens_x_norm, q_sens_t_norm = 120, 72
        q_tot_x_norm, q_tot_t_norm = 160, 146
        w_x_norm, w_t_norm = 55, 107
    elif room_type == "sport":
        q_sens_x_norm, q_sens_t_norm = 150, 100
        q_tot_x_norm, q_tot_t_norm = 200, 180
        w_x_norm, w_t_norm = 80, 150
    elif room_type in ["living", "kitchen"]:
        q_sens_x_norm, q_sens_t_norm = 90, 60
        q_tot_x_norm, q_tot_t_norm = 120, 100
        w_x_norm, w_t_norm = 30, 60
    elif room_type in ["corridor", "stairwell"]:
        q_sens_x_norm, q_sens_t_norm = 0, 0
        q_tot_x_norm, q_tot_t_norm = 0, 0
        w_x_norm, w_t_norm = 0, 0
    elif room_type == "server_room":
        q_sens_x_norm, q_sens_t_norm = 0, 0
        q_tot_x_norm, q_tot_t_norm = 0, 0
        w_x_norm, w_t_norm = 0, 0
    elif room_type == "smoking":
        q_sens_x_norm, q_sens_t_norm = 120, 90
        q_tot_x_norm, q_tot_t_norm = 150, 120
        w_x_norm, w_t_norm = 50, 80

        # ... (далее по коду l_norm)
        l_norm = people * 60
        if room_type in ["industrial_light", "industrial_heavy"]:
            l_norm = people * 30
        elif room_type == "sport":
            l_norm = people * 80
        elif room_type == "smoking":
            l_norm = people * 100
        elif room_type in ["corridor", "stairwell"]:
            l_norm = 0

    q_people_sens_x = people * q_sens_x_norm
    q_people_sens_t = people * q_sens_t_norm
    q_people_total_x = people * q_tot_x_norm
    q_people_total_t = people * q_tot_t_norm
    w_people_x = people * w_x_norm
    w_people_t = people * w_t_norm
    co2_people = people * 25

    q_light = lighting_lux * area * lighting_w_m2

    win_factor = 1.0
    if window_type == "double_chamber":
        win_factor = 0.8
    elif window_type == "triple_chamber":
        win_factor = 0.6

    q_solar = window_area * 200 * win_factor if t_out_t > 20 else 0

    periods = [
        {"name": "Холодный (ХПГ)", "t_out": t_out_x, "t_in": t_in_x, "t_sup": t_supply_x, "t_exh": t_exhaust_x,
         "I_out": enthalpy_out_x, "I_exh": enthalpy_ex_x},
        {"name": "Переходный (ППГ)", "t_out": t_out_p, "t_in": t_in_p, "t_sup": t_supply_p, "t_exh": t_exhaust_p,
         "I_out": enthalpy_out_p, "I_exh": enthalpy_ex_p},
        {"name": "Теплый (ТПГ)", "t_out": t_out_t, "t_in": t_in_t, "t_sup": t_supply_t, "t_exh": t_exhaust_t,
         "I_out": enthalpy_out_t, "I_exh": enthalpy_ex_t}
    ]

    results = []
    max_air_exchange = 0

    for p in periods:
        is_warm = "Теплый" in p["name"]

        q_sens = q_people_sens_t if is_warm else q_people_sens_x
        q_total = q_people_total_t if is_warm else q_people_total_x
        w_total = w_people_t if is_warm else w_people_x

        if is_warm:
            q_sens += q_light + q_solar
            q_total += q_light + q_solar
        else:
            q_sens += q_light
            q_total += q_light

        dt_sens = p["t_exh"] - p["t_sup"]
        dt_total = abs(p["I_exh"] - p["I_out"])

        if dt_sens <= 0: dt_sens = 1
        if dt_total <= 0: dt_total = 1

        # Влагосодержание (d) - принимаем dt_d = 3 г/кг
        dt_d_g_kg = 3.0

        l_sens = (q_sens * 3600) / (1000 * 1.2 * dt_sens)
        l_total = (q_total * 3600) / (1000 * 1.2 * dt_total)

        # ИСПРАВЛЕНО: убрано деление на 1000
        l_w = w_total / (1.2 * dt_d_g_kg)

        l_co2 = 0
        if co2_in > co2_out:
            l_co2 = co2_people / (co2_in - co2_out)

        l_norm = people * 60
        if room_type in ["industrial_light", "industrial_heavy"]:
            l_norm = people * 30
        elif room_type == "sport":
            l_norm = people * 80

        l_calc = max(l_sens, l_total, l_w, l_co2)
        l_final = max(l_calc, l_norm) if l_norm > 0 else l_calc

        if l_final > max_air_exchange:
            max_air_exchange = l_final

        q_vent = (l_final * 1.2 * 1.005 * dt_sens) / 3600
        q_cond = max(0, q_total - q_vent)

        results.append({
            "period": p["name"],
            "q_sens": round(q_sens, 0),
            "q_total": round(q_total, 0),
            "w": round(w_total, 0),
            "dt_sens": round(dt_sens, 1),
            "dt_total": round(dt_total, 1),
            "l_sens": round(l_sens, 0),
            "l_total": round(l_total, 0),
            "l_w": round(l_w, 0),
            "l_co2": round(l_co2, 0),
            "l_norm": round(l_norm, 0),
            "l_calc": round(l_final, 0),
            "q_vent": round(q_vent, 0),
            "q_cond": round(q_cond, 0)
        })

    return {
        "table": results,
        "max_air_exchange": round(max_air_exchange, 0),
        "max_q_cond": max(r["q_cond"] for r in results)
    }


def find_ac_equipment(q_req_kw: float) -> Dict[str, Any]:
    by_cat = {
        "split": {"basic": [], "industrial": []},
        "cassette": {"basic": [], "industrial": []},
        "vrf": {"basic": [], "industrial": []},
        "chiller": {"basic": [], "industrial": []}
    }

    for item in AC_CATALOG:
        if item.power_kw >= q_req_kw * 0.95:
            by_cat[item.category][item.segment].append(item)

    matched = []
    missing = []

    if q_req_kw <= 10.0:
        if by_cat["split"]["basic"]:
            matched.extend(by_cat["split"]["basic"])
            matched.extend(by_cat["cassette"]["basic"])
        else:
            missing.append({"category": "Бытовой кондиционер", "power": round(q_req_kw, 1)})
    elif 10.0 < q_req_kw <= 50.0:
        if by_cat["vrf"]["industrial"]:
            matched.extend(by_cat["vrf"]["industrial"])
        else:
            missing.append({"category": "Полупромышленная VRF-система", "power": round(q_req_kw, 1)})
    else:
        if by_cat["chiller"]["industrial"]:
            matched.extend(by_cat["chiller"]["industrial"])
        else:
            missing.append({"category": "Промышленный чиллер", "power": round(q_req_kw, 1)})

    return {
        "solutions": matched,
        "requires_professional": len(missing) > 0,
        "missing": missing
    }


def generate_ac_report(climate_data: Dict, solutions_data: Dict) -> str:
    lines = [
        "=" * 60, "ОТЧЁТ ПО КОНДИЦИОНИРОВАНИЮ И ВОЗДУХООБМЕНУ", "=" * 60,
        f"Расчетный воздухообмен: {climate_data['max_air_exchange']} м³/ч",
        f"Максимальная мощность на охлаждение: {climate_data['max_q_cond'] / 1000:.2f} кВт", "",
        "СВОДНАЯ ТАБЛИЦА ВОЗДУХООБМЕНОВ:"
    ]

    for r in climate_data["table"]:
        lines.append(
            f"[{r['period']}] L_явн={r['l_sens']}, L_полн={r['l_total']}, L_влага={r['l_w']}, L_CO2={r['l_co2']}, Итог={r['l_calc']} м³/ч")

    if solutions_data.get("requires_professional"):
        lines.extend(["", "-" * 40, "ВНИМАНИЕ: ТРЕБУЕТСЯ ПРОФЕССИОНАЛЬНЫЙ ПОДБОР", "-" * 40])
        for m in solutions_data["missing"]:
            lines.append(f"Нет подходящего оборудования (Требуется: {m['power']} кВт)")

    lines.append("=" * 60)
    return "\n".join(lines)