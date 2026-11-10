# catalogs/catalog_vent.py
from pydantic import BaseModel
from typing import Optional, List, Literal


class EquipmentSolution(BaseModel):
    category: Literal["unit", "fan", "duct", "heater", "filter"]
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
    EquipmentSolution(category="unit", brand="Ostberg", model="SAU 200 C3 RC", type="Приточная установка", max_flow=770,
                      max_pressure=350, heater_power=5.0, price_rub=129021,
                      url="https://4-20.ru/search/?q=SAU+200+C3+RC", note="Швеция, фильтр G4, электрический нагрев"),
    EquipmentSolution(category="unit", brand="Ostberg", model="SAU 250 E1", type="Приточная установка", max_flow=830,
                      max_pressure=400, heater_power=14.7, price_rub=118030,
                      url="https://www.vc-systems.ru/search/?q=SAU+250+E1", note="Водяной нагрев, фильтр F5"),
    EquipmentSolution(category="unit", brand="SHUFT", model="ECO-A 800", type="Приточная установка", max_flow=780,
                      max_pressure=450, heater_power=9.2, price_rub=158461,
                      url="https://ves-climat.ru/search/?q=ECO-A+800", note="Россия, фильтр F5, нагрев"),
    EquipmentSolution(category="unit", brand="Energolux", model="Energy W 1000", type="Приточная установка",
                      max_flow=1000, max_pressure=500, heater_power=12.0, price_rub=206141,
                      url="https://dn.ru/search/?text=Energy+W+1000", note="Россия, водяной нагрев, 380В"),
    EquipmentSolution(category="unit", brand="Salda", model="RIS 1900 VEL EKO", type="Приточная установка",
                      max_flow=1900, max_pressure=700, heater_power=18.0, price_rub=655452,
                      url="https://ruair.ru/search/?q=RIS+1900", note="Литва, автоматика EKO"),

    EquipmentSolution(category="fan", brand="Naveka", model="V(AC1)-315", type="Канальный вентилятор", max_flow=760,
                      max_pressure=400, heater_power=0, price_rub=7816,
                      url="https://splitcenter.ru/search/?q=V(AC1)-315", note="Россия, Ø315, 150 Вт"),
    EquipmentSolution(category="fan", brand="VANVENT", model="BDTX 160", type="Канальный вентилятор", max_flow=390,
                      max_pressure=250, heater_power=0, price_rub=8375, url="https://minus3.ru/search/?q=BDTX+160",
                      note="Россия, Ø160, низкий шум"),
    EquipmentSolution(category="fan", brand="Система", model="ВР 80-75 № 10", type="Радиальный вентилятор",
                      max_flow=25000, max_pressure=1200, heater_power=0, price_rub=185000,
                      url="https://ventzv.ru/search/?q=ВР+80-75+№+10", note="Промышленный, 15 кВт, 380В"),
    EquipmentSolution(category="fan", brand="Система", model="ВЦ 14-46 № 20", type="Радиальный вентилятор",
                      max_flow=160000, max_pressure=2000, heater_power=0, price_rub=1250000,
                      url="https://ventzv.ru/search/?q=ВЦ+14-46+№+20", note="Тяжелый промышленный, 110 кВт"),

    EquipmentSolution(category="duct", brand="Вентарт", model="Круглый Ø250", type="Воздуховод", max_flow=9999,
                      max_pressure=9999, heater_power=0, price_rub=450,
                      url="https://ventar-s.ru/search/?q=воздуховод+250", note="Оцинкованная сталь, 1 м.п."),
    EquipmentSolution(category="duct", brand="Вентарт", model="Прямоугольный 1000x500", type="Воздуховод",
                      max_flow=9999, max_pressure=9999, heater_power=0, price_rub=3200,
                      url="https://ventar-s.ru/search/?q=воздуховод+1000х500", note="Оцинкованная сталь, 1 м.п."),

    EquipmentSolution(category="heater", brand="Naveka", model="E7.5-250", type="Канальный калорифер", max_flow=1000,
                      max_pressure=50, heater_power=7.5, price_rub=17850,
                      url="https://svetelektro.net/search/?q=E7.5-250", note="Россия, Ø250, 380В"),
    EquipmentSolution(category="heater", brand="Тепломаш", model="КЭВ-П6000В", type="Канальный калорифер",
                      max_flow=6000, max_pressure=150, heater_power=60.0, price_rub=95000,
                      url="https://teplomash.ru/search/?q=КЭВ-П6000В", note="Промышленный, водяной, 380В"),

    EquipmentSolution(category="filter", brand="Вентарт", model="ФЛК-200", type="Канальный фильтр", max_flow=800,
                      max_pressure=60, heater_power=0, price_rub=690, url="https://ventar-s.ru/search/?q=ФЛК-200",
                      note="Россия, Ø200, класс G3"),
    EquipmentSolution(category="filter", brand="Вентарт", model="ФК-1000x500", type="Канальный фильтр", max_flow=10000,
                      max_pressure=150, heater_power=0, price_rub=45000,
                      url="https://ventar-s.ru/search/?q=ФК-1000х500", note="Промышленный, рамный, класс F5"),
]