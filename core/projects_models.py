"""Pydantic-модели для модуля «Проекты» (чистая доменная модель)."""

from __future__ import annotations
from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field

ModuleType = Literal["vent", "heat", "gas"]


class EquipmentItemBase(BaseModel):
    module: ModuleType
    category: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    model: str | None = None
    manufacturer: str | None = None
    quantity: float = Field(1.0, gt=0)
    unit: str = Field("шт", min_length=1)
    price: float | None = Field(None, ge=0)

class EquipmentItemCreate(EquipmentItemBase):
    pass

class EquipmentItem(EquipmentItemBase):
    id: int
    room_id: int
    model_config = ConfigDict(from_attributes=True)


class RoomBase(BaseModel):
    name: str = Field(..., min_length=1)
    room_type: str = Field("other")
    area: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    parameters: dict[str, Any] = Field(default_factory=dict)

class RoomCreate(RoomBase):
    pass

class Room(RoomBase):
    id: int
    project_id: int
    created_at: datetime
    equipment: list[EquipmentItem] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1)
    address: str | None = None
    city: str | None = None
    customer: str | None = None
    notes: str | None = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1)
    address: str | None = None
    city: str | None = None
    customer: str | None = None
    notes: str | None = None

class Project(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    rooms: list[Room] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)