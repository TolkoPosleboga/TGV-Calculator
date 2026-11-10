# routers/heat_api.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from core import heat_math
from catalogs.catalog_heat import HeatingSolution

router = APIRouter(prefix="/api/heating", tags=["Отопление"])


class HeatRequest(BaseModel):
    t_outside: float
    t_inside: float
    wall_area: float = Field(..., gt=0)
    wall_mat: str
    wall_thick: float
    insul_mat: str
    insul_thick: float
    window_area: float = Field(..., ge=0)
    window_type: str
    roof_area: float = Field(..., ge=0)
    roof_insul: float = Field(..., ge=0)
    floor_area: float = Field(..., ge=0)
    t_supply: float = Field(..., description="Температура подачи, °C")
    t_return: float = Field(..., description="Температура обратки, °C")
    connection_type: str = Field(..., description="Схема подключения")
    uf_area: float = Field(..., ge=0, description="Площадь теплого пола, м²")
    uf_spacing: float = Field(..., ge=0, description="Шаг укладки, мм")
    pipe_velocity: float = Field(0.6, description="Скорость теплоносителя, м/с")


class HeatResponse(BaseModel):
    results: Dict[str, Any]
    solutions: List[HeatingSolution]
    radiator_correction: Dict[str, Any]
    underfloor_results: Optional[Dict[str, Any]] = None
    hydraulics: Optional[Dict[str, Any]] = None
    report: str


@router.post("/calculate", response_model=HeatResponse)
async def calculate(request: HeatRequest):
    try:
        res = heat_math.calculate_heat_loss(
            request.t_outside, request.t_inside,
            request.wall_area, request.wall_mat, request.wall_thick,
            request.insul_mat, request.insul_thick,
            request.window_area, request.window_type,
            request.roof_area, request.roof_insul,
            request.floor_area
        )
        if "error" in res:
            raise HTTPException(status_code=400, detail=res["error"])

        corr = heat_math.calculate_radiator_correction(request.t_supply, request.t_return, request.t_inside)
        corr["power_factor"] = heat_math.apply_connection_factor(corr["power_factor"], request.connection_type)

        hydr = heat_math.calculate_hydraulics(res["total_with_infiltration_w"], request.t_supply, request.t_return,
                                              request.pipe_velocity)
        if "error" in hydr:
            raise HTTPException(status_code=400, detail=hydr["error"])

        sols = heat_math.find_heat_equipment(res["boiler_power_kw"], corr["power_factor"])

        uf_res = None
        if request.uf_area > 0:
            uf_res = heat_math.calculate_underfloor_heating(
                request.uf_area, request.uf_spacing, res["q_floor_w"], request.t_supply, request.t_return
            )
            if uf_res and "error" in uf_res:
                raise HTTPException(status_code=400, detail=uf_res["error"])

        report = heat_math.generate_heat_report(f"{request.t_outside}°C", res, hydr, request.wall_mat,
                                                request.insul_mat, request.window_type)

        return HeatResponse(
            results=res, solutions=sols, radiator_correction=corr,
            underfloor_results=uf_res, hydraulics=hydr, report=report
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))