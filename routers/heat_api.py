from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core import heat_math
from catalogs.catalog_heat import EQUIPMENT_CATALOG_HEAT

router = APIRouter(prefix="/api/heating", tags=["Отопление"])


class HeatRequest(BaseModel):
    t_outside: float
    t_inside: float
    wall_area: float
    wall_mat: str
    wall_thick: float
    insul_mat: str
    insul_thick: float
    window_area: float
    window_type: str
    roof_area: float
    roof_insul: float
    floor_area: float
    t_supply: float
    t_return: float
    connection_type: str
    uf_area: float
    uf_spacing: float
    pipe_velocity: float
    gsop: float = 0


@router.post("/calculate")
def calculate_heating(data: HeatRequest):
    try:
        res = heat_math.calculate_heat_loss(
            city_temp=data.t_outside, t_inside=data.t_inside,
            wall_area=data.wall_area, wall_mat=data.wall_mat, wall_thick=data.wall_thick,
            insul_mat=data.insul_mat, insul_thick=data.insul_thick,
            window_area=data.window_area, window_type=data.window_type,
            roof_area=data.roof_area, roof_insul=data.roof_insul,
            floor_area=data.floor_area,
            gsop=data.gsop
        )

        if "error" in res:
            raise HTTPException(status_code=400, detail=res["error"])

        corr = heat_math.calculate_radiator_correction(data.t_supply, data.t_return, data.t_inside)

        hydr = heat_math.calculate_hydraulics(
            power_w=res["total_with_infiltration_w"],
            t_supply=data.t_supply,
            t_return=data.t_return,
            velocity=data.pipe_velocity
        )

        uf = None
        if data.uf_area > 0:
            uf = heat_math.calculate_underfloor_heating(
                area_m2=data.uf_area, spacing_mm=data.uf_spacing,
                heat_loss_w=res["total_with_infiltration_w"],
                t_supply=data.t_supply, t_return=data.t_return
            )

        solutions = heat_math.find_heat_equipment(res["boiler_power_kw"], corr["power_factor"])

        report = heat_math.generate_heat_report(
            "Город", res, hydr, data.wall_mat, data.insul_mat, data.window_type
        )

        return {
            "results": res,
            "radiator_correction": corr,
            "hydraulics": hydr,
            "underfloor_results": uf,
            "solutions": [s.model_dump() for s in solutions],
            "report": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))