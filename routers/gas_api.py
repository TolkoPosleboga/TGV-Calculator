from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core import gas_math
import json
from pathlib import Path

router = APIRouter(prefix="/api/gas", tags=["Газоснабжение"])


class GasRequest(BaseModel):
    city_id: str
    boiler_power_kw: float
    has_stove: bool
    has_water_heater: bool
    room_volume: float
    room_height: float
    combustion_chamber: str
    chimney_height: float
    pipe_length: float
    local_zeta: float
    window_area: float


@router.post("/calculate")
def calculate_gas(data: GasRequest):
    try:
        # Пытаемся найти город в старом справочнике
        cities_path = Path(__file__).parent.parent / "data" / "cities.json"
        city_info = None

        if cities_path.exists():
            with open(cities_path, "r", encoding="utf-8") as f:
                cities = json.load(f)
                # Ищем по ID или по названию (на случай, если пришел ID)
                city_info = next((c for c in cities if c.get("id") == data.city_id or c.get("name") == data.city_id),
                                 None)

        # Если города нет в базе (например, выбрали из нового списка СП), делаем заглушку
        if not city_info:
            city_info = {
                "name": data.city_id,
                "gas_operator": "Информация отсутствует",
                "gas_phone": "-",
                "gas_email": "-",
                "gas_site": "-",
                "connection_cost": "Неизвестно",
                "note": "Данные по газовой службе для этого населенного пункта временно не добавлены в базу."
            }

        res = gas_math.calculate_gas_system(
            boiler_power_kw=data.boiler_power_kw,
            has_stove=data.has_stove,
            has_water_heater=data.has_water_heater,
            room_volume=data.room_volume,
            room_height=data.room_height,
            combustion_chamber=data.combustion_chamber,
            chimney_height=data.chimney_height,
            pipe_length=data.pipe_length,
            local_zeta=data.local_zeta,
            window_area=data.window_area
        )

        return {
            "results": res,
            "city_info": city_info
        }
    except Exception as e:
        # Если что-то пошло не так на сервере, возвращаем текст ошибки
        raise HTTPException(status_code=500, detail=str(e))