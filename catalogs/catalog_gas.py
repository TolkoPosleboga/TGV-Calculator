# catalogs/catalog_gas.py
from pydantic import BaseModel
from typing import Optional, List, Literal


class GasEquipment(BaseModel):
    category: Literal["meter", "pipe", "safety"]
    brand: str
    model: str
    type: str
    max_flow: float
    size: str
    price_rub: int
    url: str
    note: Optional[str] = None


GAS_CATALOG: List[GasEquipment] = [
    # Счётчики
    GasEquipment(category="meter", brand="Вектор", model="G1.6", type="Газовый счётчик", max_flow=2.5, size="G1.6",
                 price_rub=4200, url="https://ekb-gaz.ru", note="Диафрагменный, до 2.5 м³/ч"),
    GasEquipment(category="meter", brand="Elster", model="G2.5", type="Газовый счётчик", max_flow=4.0, size="G2.5",
                 price_rub=5800, url="https://ekb-gaz.ru", note="Диафрагменный, до 4 м³/ч"),
    GasEquipment(category="meter", brand="Вектор", model="G4", type="Газовый счётчик", max_flow=6.0, size="G4",
                 price_rub=7500, url="https://ekb-gaz.ru", note="Диафрагменный, до 6 м³/ч"),
    GasEquipment(category="meter", brand="Elster", model="G6", type="Газовый счётчик", max_flow=10.0, size="G6",
                 price_rub=12000, url="https://ekb-gaz.ru", note="Диафрагменный, до 10 м³/ч"),

    # Трубы
    GasEquipment(category="pipe", brand="ПНД", model="Ду20 (25 мм)", type="Газовая труба", max_flow=3.5, size="Ду20",
                 price_rub=120, url="https://ekb-gaz.ru", note="Полиэтиленовая, 1 м.п."),
    GasEquipment(category="pipe", brand="ПНД", model="Ду25 (32 мм)", type="Газовая труба", max_flow=6.0, size="Ду25",
                 price_rub=180, url="https://ekb-gaz.ru", note="Полиэтиленовая, 1 м.п."),
    GasEquipment(category="pipe", brand="ПНД", model="Ду32 (40 мм)", type="Газовая труба", max_flow=12.0, size="Ду32",
                 price_rub=250, url="https://ekb-gaz.ru", note="Полиэтиленовая, 1 м.п."),

    # Комплекты безопасности
    GasEquipment(category="safety", brand="СИКЗ", model="СИКЗ-МК-2 (CH4)", type="Сигнализатор загазованности",
                 max_flow=0, size="1/2\"", price_rub=12500, url="https://ekb-gaz.ru",
                 note="Датчик метана с отсечным клапаном"),
    GasEquipment(category="safety", brand="Газовик", model="КЗЭ-15", type="Клапан электромагнитный", max_flow=0,
                 size="Ду15", price_rub=6500, url="https://ekb-gaz.ru", note="Отсечной клапан, нормально закрытый"),
]