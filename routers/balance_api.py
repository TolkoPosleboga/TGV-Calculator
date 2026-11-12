from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from core import balance_math

router = APIRouter(prefix="/api/balance", tags=["Воздушный баланс"])

class RoomBalanceItem(BaseModel):
    name: str
    supply: float
    exhaust: float

class BalanceRequest(BaseModel):
    rooms: List[RoomBalanceItem]

@router.post("/calculate")
def calculate_balance(data: BalanceRequest):
    try:
        rooms_dict = [room.model_dump() for room in data.rooms]
        result = balance_math.calculate_air_balance(rooms_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))