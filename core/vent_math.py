import math
from typing import Dict, Any, List

STANDARD_ROUND_DIAMETERS = [100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250]
AIR_NORM_PER_PERSON = {"office": 40.0, "classroom": 40.0, "industrial": 30.0, "residential": 30.0}
AIR_CHANGE_RATE = {"office": 2.0, "classroom": 2.0, "industrial": 1.5, "residential": 0.35}
EQUIPMENT_RESISTANCE_PA = 230.0
SAFETY_FACTOR_PRESSURE = 1.15
SAFETY_FACTOR_FLOW = 1.10
AIR_DENSITY = 1.2
AIR_KINEMATIC_VISCOSITY = 1.5e-5
T_ASSIMILATION = 5.0

DUCT_MATERIALS_ROUGHNESS = {
    "steel_galv": 0.1,
    "steel_black": 0.15,
    "plastic": 0.005,
    "aluminum_flex": 0.5,
    "concrete": 1.5,
    "brick": 3.0
}


def calculate_air_exchange(length: float, width: float, height: float, people: int, heat_gain_kw: float,
                           moisture_gain_g_h: float, hazard_g_h: float, mpc_mg_m3: float,
                           t_inside: float, t_outside: float, room_type: str) -> Dict[str, Any]:
    volume = length * width * height
    norm_per_person = AIR_NORM_PER_PERSON.get(room_type, 30.0)
    L_people = people * norm_per_person
    rate = AIR_CHANGE_RATE.get(room_type, 1.5)
    L_rate = volume * rate
    L_heat = (3600.0 * heat_gain_kw) / (AIR_DENSITY * 1.005 * T_ASSIMILATION) if heat_gain_kw > 0 else 0.0
    L_moisture = moisture_gain_g_h / (AIR_DENSITY * 3.0) if moisture_gain_g_h > 0 else 0.0
    L_hazard = 0.0
    if hazard_g_h > 0 and mpc_mg_m3 > 0:
        delta_c = mpc_mg_m3 * 0.7
        L_hazard = (hazard_g_h * 1000.0) / delta_c

    L_max = max(L_people, L_rate, L_heat, L_moisture, L_hazard)
    delta_t_out = t_inside - t_outside
    reasons = {"По людям": L_people, "По кратности": L_rate, "По теплоизбыткам": L_heat, "По влаге": L_moisture,
               "По ПДК": L_hazard}
    decisive_factor = max(reasons, key=reasons.get) if L_max > 0 else "Нет данных"

    return {
        "volume_m3": round(volume, 2), "L_people_m3h": round(L_people, 2), "L_rate_m3h": round(L_rate, 2),
        "L_heat_m3h": round(L_heat, 2), "L_moisture_m3h": round(L_moisture, 2), "L_hazard_m3h": round(L_hazard, 2),
        "L_max_m3h": round(L_max, 2), "delta_t": round(delta_t_out, 2),
        "delta_t_heat": T_ASSIMILATION, "decisive_factor": decisive_factor
    }


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
        b = math.sqrt(area_req / 2.0)
        a = 2.0 * b
        a_mm = math.ceil(a * 1000 / 50) * 50
        b_mm = math.ceil(b * 1000 / 50) * 50
        if a_mm / b_mm > 3.0:
            b_mm = math.ceil(a_mm / 3.0 / 50) * 50
        area = (a_mm / 1000.0) * (b_mm / 1000.0)
        v = L / 3600.0 / area
        d_eq = 2.0 * (a_mm / 1000.0) * (b_mm / 1000.0) / ((a_mm / 1000.0) + (b_mm / 1000.0))
        return {"shape": "rect", "width_mm": a_mm, "height_mm": b_mm, "aspect_ratio": round(a_mm / b_mm, 2),
                "area_m2": round(area, 4), "velocity_ms": round(v, 2), "equivalent_diameter_m": round(d_eq, 4)}


def calculate_pressure_loss(L: float, duct: Dict, sections: List[Dict], duct_material: str) -> Dict[str, Any]:
    v = duct["velocity_ms"]
    d_eq = duct["equivalent_diameter_m"]
    Re = v * d_eq / AIR_KINEMATIC_VISCOSITY

    roughness_mm = DUCT_MATERIALS_ROUGHNESS.get(duct_material, 0.1)
    roughness_m = roughness_mm / 1000.0

    if Re > 0:
        lam = 0.11 * ((roughness_m / d_eq) + (68.0 / Re)) ** 0.25
    else:
        lam = 0.02

    dyn = AIR_DENSITY * v ** 2 / 2.0

    total_friction = 0.0
    total_local = 0.0
    sections_result = []

    for sec in sections:
        length = sec.get("length", 0.0)
        sec_total_zeta = sum(res.get("qty", 1) * res.get("zeta", 0.0) for res in sec.get("resistances", []))

        fr = lam * (length / d_eq) * dyn
        loc = sec_total_zeta * dyn

        total_friction += fr
        total_local += loc

        sections_result.append({
            "name": sec.get("name", "Участок"),
            "length": length,
            "total_zeta": round(sec_total_zeta, 2),
            "friction_pa": round(fr, 2),
            "local_pa": round(loc, 2)
        })

    total_before = total_friction + total_local + EQUIPMENT_RESISTANCE_PA
    total = total_before * SAFETY_FACTOR_PRESSURE

    return {
        "total_loss_pa": round(total, 2), "friction_loss_pa": round(total_friction, 2),
        "local_loss_pa": round(total_local, 2), "sections_breakdown": sections_result,
        "roughness_mm": roughness_mm, "lambda": round(lam, 4)
    }


def select_equipment_base(L: float, pressure: Dict, t_inside: float, t_outside: float) -> Dict[str, Any]:
    L_fan = L * SAFETY_FACTOR_FLOW
    P_fan = pressure["total_loss_pa"]
    dt = t_inside - t_outside
    Q = (L * AIR_DENSITY * 1.005 * dt) / 3600.0 if dt > 0 else 0.0
    return {"fan_flow_m3h": round(L_fan, 2), "fan_pressure_pa": round(P_fan, 2), "heater_power_kw": round(Q, 2)}


def calculate_recuperation(L: float, t_inside: float, t_outside: float, efficiency_pct: float,
                           electricity_tariff: float, days: int) -> Dict[str, Any]:
    if t_inside <= t_outside or efficiency_pct <= 0:
        return {"q_saved_kw": 0, "energy_saved_kwh": 0, "money_saved_rub": 0, "frost_warning": ""}
    efficiency = efficiency_pct / 100.0
    delta_t = t_inside - t_outside
    q_saved_kw = (L * AIR_DENSITY * 1.005 * delta_t * efficiency) / 3600.0
    hours = days * 24
    energy_saved_kwh = q_saved_kw * hours
    money_saved = energy_saved_kwh * electricity_tariff
    frost_warning = "При температуре ниже -15°C роторный/пластинчатый рекуператор может обмерзать. Требуется байпас или предварительный подогрев." if (
            t_outside < -15 and efficiency_pct > 60) else ""
    return {"q_saved_kw": round(q_saved_kw, 2), "energy_saved_kwh": round(energy_saved_kwh, 0),
            "money_saved_rub": round(money_saved, 0), "frost_warning": frost_warning}


def find_solutions(L: float, P: float, Q: float) -> Dict[str, Any]:
    from catalogs.catalog_vent import EQUIPMENT_CATALOG
    L_req = L * 1.05

    by_cat = {}
    for item in EQUIPMENT_CATALOG:
        if item.category not in by_cat:
            by_cat[item.category] = {"basic": [], "industrial": []}
        if item.max_flow >= L_req:
            if item.category in ["fan", "unit"] and item.max_pressure < P:
                continue
            if item.category == "heater" and item.heater_power < Q:
                continue
            by_cat[item.category][item.segment].append(item)

    matched = []
    missing = []

    if by_cat.get("fan", {}).get("basic") or by_cat.get("unit", {}).get("basic"):
        matched.extend(by_cat.get("fan", {}).get("basic", []))
        matched.extend(by_cat.get("unit", {}).get("basic", []))
    elif by_cat.get("fan", {}).get("industrial") or by_cat.get("unit", {}).get("industrial"):
        matched.extend(by_cat.get("fan", {}).get("industrial", []))
        matched.extend(by_cat.get("unit", {}).get("industrial", []))
    else:
        missing.append({"category": "Вентилятор/Установка", "flow": round(L_req, 1), "pressure": round(P, 1)})

    if by_cat.get("heater", {}).get("basic"):
        matched.extend(by_cat.get("heater", {}).get("basic", []))
    elif by_cat.get("heater", {}).get("industrial"):
        matched.extend(by_cat.get("heater", {}).get("industrial", []))
    elif Q > 0:
        missing.append({"category": "Калорифер", "power": round(Q, 1)})

    for cat in ["duct", "filter", "recuperator"]:
        if by_cat.get(cat, {}).get("basic"):
            matched.extend(by_cat.get(cat, {}).get("basic", []))
        elif by_cat.get(cat, {}).get("industrial"):
            matched.extend(by_cat.get(cat, {}).get("industrial", []))

    return {
        "solutions": matched,
        "requires_professional": len(missing) > 0,
        "missing": missing
    }


def generate_vent_report(air: Dict, duct: Dict, pressure: Dict, equipment: Dict, recup: Dict = None,
                         solutions_data: Dict = None) -> str:
    duct_str = f"{duct.get('diameter_mm', '')} мм" if duct[
                                                          'shape'] == 'round' else f"{duct['width_mm']}×{duct['height_mm']} мм"
    lines = [
        "=" * 60, "ОТЧЁТ ПО РАСЧЁТУ ВЕНТИЛЯЦИИ", "=" * 60,
        f"Объём помещения: {air['volume_m3']} м³", f"Расход воздуха: {air['L_max_m3h']} м³/ч",
        f"Сечение воздуховода: {duct_str}", f"Скорость в канале: {duct['velocity_ms']} м/с",
        f"Шероховатость материала: {pressure.get('roughness_mm', 0.1)} мм (λ = {pressure.get('lambda', 0.02)})",
        f"Потери давления: {pressure['total_loss_pa']} Па",
        f"Требуемый вентилятор: {equipment['fan_flow_m3h']} м³/ч, {equipment['fan_pressure_pa']} Па",
        f"Мощность нагрева (калорифер): {equipment['heater_power_kw']} кВт",
    ]
    if recup and recup.get("q_saved_kw", 0) > 0:
        lines.extend(["", "-" * 40, "РЕКУПЕРАЦИЯ ТЕПЛА", "-" * 40, f"Экономия мощности: {recup['q_saved_kw']} кВт",
                      f"Экономия энергии за сезон: {recup['energy_saved_kwh']} кВт*ч",
                      f"Экономия денег за сезон: {recup['money_saved_rub']} руб."])

    if solutions_data and solutions_data.get("requires_professional"):
        lines.extend(["", "-" * 40, "ВНИМАНИЕ: ТРЕБУЕТСЯ ПРОФЕССИОНАЛЬНЫЙ ПОДБОР", "-" * 40])
        for m in solutions_data["missing"]:
            if m["category"] == "Вентилятор/Установка":
                lines.append(f"Нет подходящего вентилятора/установки (Требуется: {m['flow']} м³/ч, {m['pressure']} Па)")
            elif m["category"] == "Калорифер":
                lines.append(f"Нет подходящего калорифера (Требуется: {m['power']} кВт)")

    lines.append("=" * 60)
    return "\n".join(lines)


def calculate_acoustics(fan_noise_db: int, sections: List[Dict], distance_m: float, room_type: str) -> Dict[str, Any]:
    allowed_noise = 40 if room_type == "office" else 80
    total_length = sum(sec.get("length", 0.0) for sec in sections)
    attenuation_duct = total_length * 0.1

    total_bends = 0
    for sec in sections:
        for res in sec.get("resistances", []):
            if "Отвод" in res.get("name", ""):
                total_bends += res.get("qty", 1)
    attenuation_bends = total_bends * 3.0

    spatial_attenuation = 20 * math.log10(distance_m) + 8 if distance_m > 0 else 0
    attenuation_grille = 5.0

    final_noise = fan_noise_db - attenuation_duct - attenuation_bends - attenuation_grille - spatial_attenuation

    is_compliant = final_noise <= allowed_noise
    required_silencer = 0

    if not is_compliant:
        required_silencer = round(final_noise - allowed_noise, 1)
        message = f"Уровень шума превышен на {required_silencer} дБА. Требуется установка шумоглушителя."
    else:
        message = "Уровень шума соответствует нормам."

    return {
        "fan_noise": fan_noise_db,
        "attenuation_duct": round(attenuation_duct, 1),
        "attenuation_bends": round(attenuation_bends, 1),
        "spatial_attenuation": round(spatial_attenuation, 1),
        "final_noise": round(final_noise, 1),
        "allowed_noise": allowed_noise,
        "is_compliant": is_compliant,
        "required_silencer": required_silencer,
        "message": message
    }