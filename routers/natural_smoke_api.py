from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core import natural_smoke_math

router = APIRouter(prefix="/api/smoke", tags=["Противодымная вентиляция"])

class NaturalVentRequest(BaseModel):
    height_m: float
    t_in: float
    t_out: float
    duct_area_m2: float
    local_zeta: float

class SmokeExhaustRequest(BaseModel):
    door_width: float
    door_height: float
    num_doors: int

class PressurizationRequest(BaseModel):
    door_width: float
    door_height: float
    num_floors: int

@router.post("/natural")
def calc_natural(data: NaturalVentRequest):
    try:
        return natural_smoke_math.calculate_natural_ventilation(
            data.height_m, data.t_in, data.t_out, data.duct_area_m2, data.local_zeta
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/smoke-exhaust")
def calc_smoke(data: SmokeExhaustRequest):
    try:
        return natural_smoke_math.calculate_corridor_smoke_exhaust(
            data.door_width, data.door_height, data.num_doors
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pressurization")
def calc_pressurization(data: PressurizationRequest):
    try:
        return natural_smoke_math.calculate_stairwell_pressurization(
            data.door_width, data.door_height, data.num_floors
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))