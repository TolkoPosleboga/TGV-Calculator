"""Слой доступа к данным. Инкапсулирует SQL."""
from __future__ import annotations
import json
from datetime import datetime
from typing import Any
from core.projects_models import EquipmentItem, Project, Room
from db.database import get_connection

def _row_to_equipment(row: Any) -> EquipmentItem:
    return EquipmentItem(
        id=row["id"], room_id=row["room_id"], module=row["module"],
        category=row["category"], name=row["name"], model=row["model"],
        manufacturer=row["manufacturer"], quantity=row["quantity"],
        unit=row["unit"], price=row["price"]
    )

def _row_to_room(row: Any, equipment: list[EquipmentItem] | None = None) -> Room:
    return Room(
        id=row["id"], project_id=row["project_id"], name=row["name"],
        room_type=row["room_type"], area=row["area"], height=row["height"],
        parameters=json.loads(row["parameters_json"] or "{}"),
        created_at=datetime.fromisoformat(row["created_at"]),
        equipment=equipment or []
    )

def _row_to_project(row: Any, rooms: list[Room] | None = None) -> Project:
    return Project(
        id=row["id"], name=row["name"], address=row["address"],
        city=row["city"], customer=row["customer"],
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
        rooms=rooms or []
    )

class ProjectRepository:
    def create(self, data: dict) -> Project:
        with get_connection() as conn:
            cursor = conn.execute(
                "INSERT INTO projects (name, address, city, customer) VALUES (?, ?, ?, ?)",
                (data.get("name"), data.get("address"), data.get("city"), data.get("customer"))
            )
            project_id = cursor.lastrowid
            row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        return _row_to_project(row)

    def get(self, project_id: int, with_rooms: bool = True) -> Project | None:
        with get_connection() as conn:
            row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
            if not row:
                return None
            rooms = []
            if with_rooms:
                room_rows = conn.execute("SELECT * FROM rooms WHERE project_id = ?", (project_id,)).fetchall()
                for r_row in room_rows:
                    eq_rows = conn.execute("SELECT * FROM equipment_items WHERE room_id = ?", (r_row["id"],)).fetchall()
                    eq_list = [_row_to_equipment(e) for e in eq_rows]
                    rooms.append(_row_to_room(r_row, eq_list))
        return _row_to_project(row, rooms)

    def list(self) -> list[Project]:
        with get_connection() as conn:
            rows = conn.execute("SELECT * FROM projects ORDER BY updated_at DESC").fetchall()
        return [_row_to_project(r) for r in rows]

    def update(self, project_id: int, data: dict) -> Project | None:
        fields = {k: v for k, v in data.items() if v is not None}
        if not fields:
            return self.get(project_id)
        set_sql = ", ".join(f"{k} = ?" for k in fields)
        params = list(fields.values()) + [project_id]
        with get_connection() as conn:
            conn.execute(f"UPDATE projects SET {set_sql} WHERE id = ?", params)
        return self.get(project_id)

    def delete(self, project_id: int) -> bool:
        with get_connection() as conn:
            cursor = conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
            return cursor.rowcount > 0

class RoomRepository:
    def create(self, project_id: int, data: dict) -> Room:
        with get_connection() as conn:
            cursor = conn.execute(
                "INSERT INTO rooms (project_id, name, room_type, area, height, parameters_json) VALUES (?, ?, ?, ?, ?, ?)",
                (project_id, data.get("name"), data.get("room_type", "other"),
                 data.get("area"), data.get("height"),
                 json.dumps(data.get("parameters", {}), ensure_ascii=False))
            )
            room_id = cursor.lastrowid
            row = conn.execute("SELECT * FROM rooms WHERE id = ?", (room_id,)).fetchone()
        return _row_to_room(row)

class EquipmentRepository:
    def create(self, room_id: int, data: dict) -> EquipmentItem:
        with get_connection() as conn:
            cursor = conn.execute(
                "INSERT INTO equipment_items (room_id, module, category, name, model, manufacturer, quantity, unit, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (room_id, data.get("module"), data.get("category"), data.get("name"),
                 data.get("model"), data.get("manufacturer"), data.get("quantity", 1.0),
                 data.get("unit", "шт"), data.get("price"))
            )
            item_id = cursor.lastrowid
            row = conn.execute("SELECT * FROM equipment_items WHERE id = ?", (item_id,)).fetchone()
        return _row_to_equipment(row)

projects_repo = ProjectRepository()
rooms_repo = RoomRepository()
equipment_repo = EquipmentRepository()