from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from core import balance_math, vent_math

router = APIRouter(prefix="/api/balance", tags=["Воздушный баланс"])


class RoomBalanceItem(BaseModel):
    name: str
    supply: float
    exhaust: float


class BalanceRequest(BaseModel):
    rooms: List[RoomBalanceItem]


class RoomSyncItem(BaseModel):
    id: int
    length: float
    width: float
    height: float
    people: int
    heat_gain_kw: float
    moisture_gain_g_h: float
    hazard_g_h: float
    mpc_mg_m3: float
    room_type: str
    system_type: str
    t_inside: float
    t_outside: float


class BalanceSyncRequest(BaseModel):
    rooms: List[RoomSyncItem]


@router.post("/calculate")
def calculate_balance(data: BalanceRequest):
    try:
        rooms_dict = [room.model_dump() for room in data.rooms]
        result = balance_math.calculate_air_balance(rooms_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync")
def sync_balance(data: BalanceSyncRequest):
    try:
        results = []
        for r in data.rooms:
            air = vent_math.calculate_air_exchange(
                length=r.length, width=r.width, height=r.height,
                people=r.people, heat_gain_kw=r.heat_gain_kw,
                moisture_gain_g_h=r.moisture_gain_g_h, hazard_g_h=r.hazard_g_h, mpc_mg_m3=r.mpc_mg_m3,
                t_inside=r.t_inside, t_outside=r.t_outside, room_type=r.room_type
            )
            L_max = air["L_max_m3h"]

            supply = 0.0
            exhaust = 0.0
            if r.system_type == 'supply':
                supply = L_max
            elif r.system_type == 'exhaust':
                exhaust = L_max
            else:
                supply = L_max
                exhaust = L_max

            results.append({"id": r.id, "supply": round(supply, 1), "exhaust": round(exhaust, 1)})
        return {"rooms": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))