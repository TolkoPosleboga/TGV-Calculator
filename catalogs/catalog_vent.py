# catalogs/catalog_vent.py
from pydantic import BaseModel
from typing import Optional, List, Literal


class EquipmentSolution(BaseModel):
    category: Literal["unit", "fan", "duct", "heater", "filter", "recuperator"]
    brand: str
    model: str
    type: str
    max_flow: float
    max_pressure: float
    heater_power: float
    price_rub: int
    url: str
    note: Optional[str] = None


EQUIPMENT_CATALOG: List[EquipmentSolution] = [
    # ... (Приточные установки, вентиляторы, воздуховоды, калориферы, фильтры остаются без изменений) ...
    EquipmentSolution(category="unit", brand="Ostberg", model="SAU 200 C3 RC", type="Приточная установка", max_flow=770,
                      max_pressure=350, heater_power=5.0, price_rub=129021,
                      url="https://4-20.ru/search/?q=SAU+200+C3+RC", note="Швеция, фильтр G4, электрический нагрев"),
    EquipmentSolution(category="unit", brand="SHUFT", model="ECO-A 800", type="Приточная установка", max_flow=780,
                      max_pressure=450, heater_power=9.2, price_rub=158461,
                      url="https://ves-climat.ru/search/?q=ECO-A+800", note="Россия, фильтр F5, нагрев"),
    EquipmentSolution(category="fan", brand="Naveka", model="V(AC1)-315", type="Канальный вентилятор", max_flow=760,
                      max_pressure=400, heater_power=0, price_rub=7816,
                      url="https://splitcenter.ru/search/?q=V(AC1)-315", note="Россия, Ø315, 150 Вт"),
    EquipmentSolution(category="duct", brand="Вентарт", model="Круглый Ø250", type="Воздуховод", max_flow=9999,
                      max_pressure=9999, heater_power=0, price_rub=450,
                      url="https://ventar-s.ru/search/?q=воздуховод+250", note="Оцинкованная сталь, 1 м.п."),
    EquipmentSolution(category="heater", brand="Naveka", model="E7.5-250", type="Канальный калорифер", max_flow=1000,
                      max_pressure=50, heater_power=7.5, price_rub=17850,
                      url="https://svetelektro.net/search/?q=E7.5-250", note="Россия, Ø250, 380В"),
    EquipmentSolution(category="filter", brand="Вентарт", model="ФЛК-200", type="Канальный фильтр", max_flow=800,
                      max_pressure=60, heater_power=0, price_rub=690, url="https://ventar-s.ru/search/?q=ФЛК-200",
                      note="Россия, Ø200, класс G3"),

    # РЕКУПЕРАТОРЫ
    EquipmentSolution(category="recuperator", brand="Zilon", model="ZRV-500", type="Рекуператор", max_flow=500,
                      max_pressure=300, heater_power=0, price_rub=85000, url="https://air-sity.ru/search/?q=ZRV-500",
                      note="Россия, КПД 65%, пластинчатый"),
    EquipmentSolution(category="recuperator", brand="Systemair", model="SAVE VTR 150/K", type="Рекуператор",
                      max_flow=500, max_pressure=550, heater_power=0, price_rub=210779,
                      url="https://climat-pm.ru/search/?q=SAVE+VTR+150", note="Швеция, КПД 85%, роторный"),
    EquipmentSolution(category="recuperator", brand="Ostberg", model="HERU 100 T EC", type="Рекуператор", max_flow=800,
                      max_pressure=700, heater_power=0, price_rub=350000, url="https://4-20.ru/search/?q=HERU+100+T",
                      note="Швеция, роторный, КПД 85%"),
]