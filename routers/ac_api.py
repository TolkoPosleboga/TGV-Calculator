from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core import ac_math
import traceback

router = APIRouter(prefix="/api/ac", tags=["Кондиционирование"])


class AcRequest(BaseModel):
    area: float
    height: float
    people: int
    lighting_lux: float
    lighting_w_m2: float
    window_area: float
    room_type: str
    window_type: str

    t_out_x: float
    t_out_p: float
    t_out_t: float

    hum_out_x: float = 70.0
    hum_out_p: float = 70.0
    hum_out_t: float = 55.0

    t_in_x: float
    t_in_p: float
    t_in_t: float

    t_supply_x: float
    t_supply_p: float
    t_supply_t: float

    t_exhaust_x: float
    t_exhaust_p: float
    t_exhaust_t: float

    enthalpy_out_x: float
    enthalpy_out_p: float
    enthalpy_out_t: float

    enthalpy_ex_x: float
    enthalpy_ex_p: float
    enthalpy_ex_t: float


@router.post("/calculate")
def calculate_ac(data: AcRequest):
    try:
        climate_data = ac_math.calculate_full_climate(
            area=data.area, height=data.height, people=data.people,
            t_out_x=data.t_out_x, t_out_p=data.t_out_p, t_out_t=data.t_out_t,
            t_in_x=data.t_in_x, t_in_p=data.t_in_p, t_in_t=data.t_in_t,
            t_supply_x=data.t_supply_x, t_supply_p=data.t_supply_p, t_supply_t=data.t_supply_t,
            t_exhaust_x=data.t_exhaust_x, t_exhaust_p=data.t_exhaust_p, t_exhaust_t=data.t_exhaust_t,
            enthalpy_out_x=data.enthalpy_out_x, enthalpy_out_p=data.enthalpy_out_p, enthalpy_out_t=data.enthalpy_out_t,
            enthalpy_ex_x=data.enthalpy_ex_x, enthalpy_ex_p=data.enthalpy_ex_p, enthalpy_ex_t=data.enthalpy_ex_t,
            lighting_lux=data.lighting_lux, lighting_w_m2=data.lighting_w_m2, window_area=data.window_area,
            room_type=data.room_type, window_type=data.window_type
        )

        q_req_kw = climate_data["max_q_cond"] / 1000.0
        solutions_data = ac_math.find_ac_equipment(q_req_kw)
        report = ac_math.generate_ac_report(climate_data, solutions_data)

        return {
            "results": climate_data,
            "solutions": [s.model_dump() for s in solutions_data["solutions"]],
            "requires_professional": solutions_data["requires_professional"],
            "missing": solutions_data["missing"],
            "report": report
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))