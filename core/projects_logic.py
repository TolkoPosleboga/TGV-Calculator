"""Чистая логика модуля «Проекты»: агрегация спецификации."""
from __future__ import annotations
from datetime import datetime, timezone
from core.projects_models import Project


def build_specification(project: Project) -> dict:
    """Формирует сводную спецификацию оборудования по всем помещениям."""
    acc = {}
    for room in project.rooms:
        for item in room.equipment:
            key = (item.module, item.category, item.name, item.model or "", item.manufacturer or "", item.unit)
            if key not in acc:
                acc[key] = {
                    "module": item.module, "category": item.category,
                    "name": item.name, "model": item.model,
                    "manufacturer": item.manufacturer, "unit": item.unit,
                    "total_quantity": 0.0, "priced_quantity": 0.0, "priced_cost": 0.0
                }
            bucket = acc[key]
            bucket["total_quantity"] += item.quantity
            if item.price is not None:
                bucket["priced_quantity"] += item.quantity
                bucket["priced_cost"] += item.quantity * item.price

    lines = []
    for bucket in acc.values():
        avg_price = None
        total_price = None
        if bucket["priced_quantity"] > 0:
            avg_price = round(bucket["priced_cost"] / bucket["priced_quantity"], 2)
            total_price = round(bucket["priced_cost"], 2)

        lines.append({
            "module": bucket["module"], "category": bucket["category"],
            "name": bucket["name"], "model": bucket["model"],
            "manufacturer": bucket["manufacturer"], "unit": bucket["unit"],
            "total_quantity": round(bucket["total_quantity"], 2),
            "avg_price": avg_price, "total_price": total_price
        })

    lines.sort(key=lambda x: (x["module"], x["category"], x["name"]))
    total_sum = round(sum((line["total_price"] or 0.0) for line in lines), 2)

    return {
        "project_id": project.id,
        "project_name": project.name,
        "lines": lines,
        "total_sum": total_sum,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }