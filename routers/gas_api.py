# routers/gas_api.py
import json
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any
from core import gas_math

router = APIRouter(prefix="/api/gas", tags=["Газоснабжение"])

CITIES_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'cities.json')
with open(CITIES_PATH, 'r', encoding='utf-8') as f:
    CITIES = {c['id']: c for c in json.load(f)}


class GasRequest(BaseModel):
    city_id: str
    boiler_power_kw: float = Field(..., gt=0)
    has_stove: bool
    has_water_heater: bool
    room_volume: float = Field(..., gt=0)
    room_height: float = Field(..., gt=0)
    combustion_chamber: str
    chimney_height: float = Field(..., ge=0)
    pipe_length: float = Field(..., gt=0)
    local_zeta: float = Field(..., ge=0)
    window_area: float = Field(..., ge=0, description="Площадь окна в котельной, м²")


class GasResponse(BaseModel):
    results: Dict[str, Any]
    city_info: Dict[str, Any]


@router.post("/calculate", response_model=GasResponse)
async def calculate(request: GasRequest):
    if request.city_id not in CITIES:
        raise HTTPException(status_code=400, detail="Город не найден в справочнике")

    city = CITIES[request.city_id]

    try:
        res = gas_math.calculate_gas_system(
            request.boiler_power_kw, request.has_stove, request.has_water_heater,
            request.room_volume, request.room_height, request.combustion_chamber,
            request.chimney_height, request.pipe_length, request.local_zeta,
            request.window_area
        )
        return GasResponse(results=res, city_info=city)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))