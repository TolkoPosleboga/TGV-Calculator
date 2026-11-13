from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core import vent_extra
import traceback

router = APIRouter(prefix="/api/vent_extra", tags=["Доп. расчеты Вентиляции"])

class CondensationRequest(BaseModel):
    t_exhaust: float
    humidity: float
    t_out: float
    insul_thick_mm: float

class HumidityRequest(BaseModel):
    W_g_h: float
    L_m3h: float
    t_exhaust: float
    d_supply_g_kg: float = 0.0

@router.post("/condensation")
def check_condensation(data: CondensationRequest):
    try:
        return vent_extra.calculate_condensation_check(
            t_exhaust=data.t_exhaust,
            humidity=data.humidity,
            t_out=data.t_out,
            insul_thick_mm=data.insul_thick_mm
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/humidity")
def calc_humidity(data: HumidityRequest):
    try:
        res = vent_extra.calculate_exhaust_humidity(
            W_g_h=data.W_g_h,
            L_m3h=data.L_m3h,
            t_exhaust=data.t_exhaust,
            d_supply_g_kg=data.d_supply_g_kg
        )
        if "error" in res:
            raise HTTPException(status_code=400, detail=res["error"])
        return res
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))