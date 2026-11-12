from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from core import vent_math
import traceback

router = APIRouter(prefix="/api/ventilation", tags=["Вентиляция"])

class LocalResistance(BaseModel):
    name: str
    qty: int
    zeta: float

class DuctSection(BaseModel):
    name: str
    length: float
    resistances: List[LocalResistance]

class VentRequest(BaseModel):
    length: float
    width: float
    height: float
    people: int
    heat_gain_kw: float
    moisture_gain_g_h: float
    hazard_g_h: float
    mpc_mg_m3: float
    t_inside: float
    t_outside: float
    room_type: str
    duct_shape: str
    duct_material: str
    recup_efficiency: float
    electricity_tariff: float
    season_days: int
    sections: List[DuctSection]
    distance_m: float

@router.post("/calculate")
def calculate_ventilation(data: VentRequest):
    try:
        air = vent_math.calculate_air_exchange(
            length=data.length, width=data.width, height=data.height,
            people=data.people, heat_gain_kw=data.heat_gain_kw,
            moisture_gain_g_h=data.moisture_gain_g_h, hazard_g_h=data.hazard_g_h, mpc_mg_m3=data.mpc_mg_m3,
            t_inside=data.t_inside, t_outside=data.t_outside, room_type=data.room_type
        )

        duct = vent_math.select_duct(air["L_max_m3h"], data.duct_shape)
        sections_dict = [sec.model_dump() for sec in data.sections]

        pressure = vent_math.calculate_pressure_loss(air["L_max_m3h"], duct, sections_dict, data.duct_material)
        equipment = vent_math.select_equipment_base(air["L_max_m3h"], pressure, data.t_inside, data.t_outside)

        recup = vent_math.calculate_recuperation(
            L=air["L_max_m3h"], t_inside=data.t_inside, t_outside=data.t_outside,
            efficiency_pct=data.recup_efficiency, electricity_tariff=data.electricity_tariff,
            days=data.season_days
        )

        solutions_data = vent_math.find_solutions(air["L_max_m3h"], pressure["total_loss_pa"], equipment["heater_power_kw"])

        best_fan = next((s for s in solutions_data["solutions"] if s.category in ['fan', 'unit']), None)
        fan_noise = best_fan.noise_db if best_fan else 65

        acoustics = vent_math.calculate_acoustics(fan_noise, sections_dict, data.distance_m, data.room_type)

        report = vent_math.generate_vent_report(air, duct, pressure, equipment, recup, solutions_data)

        return {
            "air_exchange": air,
            "duct": duct,
            "pressure_loss": pressure,
            "equipment": equipment,
            "recuperation": recup,
            "solutions": [s.model_dump() for s in solutions_data["solutions"]],
            "requires_professional": solutions_data["requires_professional"],
            "missing": solutions_data["missing"],
            "acoustics": acoustics,
            "report": report
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))