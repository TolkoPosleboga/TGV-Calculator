# routers/vent_api.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal, Dict, Any, List, Optional
from core import vent_math
from catalogs.catalog_vent import EquipmentSolution

router = APIRouter(prefix="/api/ventilation", tags=["Вентиляция"])


class VentRequest(BaseModel):
    length: float = Field(..., gt=0)
    width: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    people: int = Field(..., ge=0)
    heat_gain_kw: float = Field(..., ge=0)
    t_inside: float
    t_outside: float
    room_type: Literal["office", "classroom", "industrial", "residential"]
    duct_length: float = Field(..., gt=0)
    duct_shape: Literal["round", "rect"]
    # НОВЫЕ ПОЛЯ
    recup_efficiency: float = Field(..., ge=0, le=100, description="КПД рекуператора, %")
    electricity_tariff: float = Field(..., ge=0, description="Тариф на электроэнергию, руб/кВт*ч")
    season_days: int = Field(..., ge=0, description="Длительность отопительного сезона, дней")


class VentResponse(BaseModel):
    air_exchange: Dict[str, Any]
    duct: Dict[str, Any]
    pressure_loss: Dict[str, Any]
    equipment: Dict[str, Any]
    solutions: List[EquipmentSolution]
    system_warning: Optional[str] = None
    recuperation: Optional[Dict[str, Any]] = None
    report: str


@router.post("/calculate", response_model=VentResponse)
async def calculate(request: VentRequest):
    try:
        air = vent_math.calculate_air_exchange(request.length, request.width, request.height, request.people,
                                               request.heat_gain_kw, request.t_inside, request.t_outside,
                                               request.room_type)
        duct = vent_math.select_duct(air["L_max_m3h"], request.duct_shape)
        pressure = vent_math.calculate_pressure_loss(air["L_max_m3h"], duct, request.duct_length, request.room_type)
        equip = vent_math.select_equipment_base(air["L_max_m3h"], pressure, request.t_inside, request.t_outside)
        sols = vent_math.find_solutions(equip["fan_flow_m3h"], equip["fan_pressure_pa"], equip["heater_power_kw"])

        # Расчет рекуперации
        recup = None
        if request.recup_efficiency > 0:
            recup = vent_math.calculate_recuperation(
                air["L_max_m3h"], request.t_inside, request.t_outside,
                request.recup_efficiency, request.electricity_tariff, request.season_days
            )

        warning = None
        if air["L_max_m3h"] > 50000:
            warning = "Требуемый расход превышает 50 000 м³/ч. Рекомендуется проектирование ЦПУ из секций."

        report = vent_math.generate_vent_report(air, duct, pressure, equip, recup)

        return VentResponse(air_exchange=air, duct=duct, pressure_loss=pressure,
                            equipment=equip, solutions=sols, system_warning=warning,
                            recuperation=recup, report=report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))