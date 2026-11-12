from typing import Dict, Any, List


def calculate_air_balance(rooms: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_supply = 0.0
    total_exhaust = 0.0

    processed_rooms = []

    for room in rooms:
        supply = float(room.get("supply", 0))
        exhaust = float(room.get("exhaust", 0))

        total_supply += supply
        total_exhaust += exhaust

        processed_rooms.append({
            "name": room.get("name", "Помещение"),
            "supply": round(supply, 1),
            "exhaust": round(exhaust, 1)
        })

    imbalance = total_supply - total_exhaust
    imbalance_percent = (abs(imbalance) / max(total_supply, total_exhaust, 1)) * 100

    warning = ""
    if abs(imbalance) > 0:
        if imbalance > 0:
            warning = f"Дисбаланс: Приток превышает вытяжку на {round(imbalance, 1)} м³/ч. Рекомендуется добавить вытяжные системы (например, в санузлах или коридорах)."
        else:
            warning = f"Дисбаланс: Вытяжка превышает приток на {round(abs(imbalance), 1)} м³/ч. Рекомендуется добавить приточные системы."

    if imbalance_percent < 5:
        status = "Сбалансировано"
        is_balanced = True
    elif imbalance_percent < 15:
        status = "Незначительный дисбаланс"
        is_balanced = False
    else:
        status = "Критический дисбаланс"
        is_balanced = False

    return {
        "rooms": processed_rooms,
        "total_supply": round(total_supply, 1),
        "total_exhaust": round(total_exhaust, 1),
        "imbalance": round(imbalance, 1),
        "imbalance_percent": round(imbalance_percent, 1),
        "status": status,
        "is_balanced": is_balanced,
        "warning": warning
    }