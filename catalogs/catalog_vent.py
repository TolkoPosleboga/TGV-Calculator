from pydantic import BaseModel


class EquipmentSolution(BaseModel):
    id: int
    category: str
    model: str
    brand: str
    max_flow: float
    max_pressure: float = 0
    heater_power: float = 0
    price_rub: int
    url: str
    noise_db: int = 50  # НОВОЕ ПОЛЕ: уровень шума в дБ(А)


EQUIPMENT_CATALOG = [
    # ВЕНТИЛЯТОРЫ КАНАЛЬНЫЕ
    EquipmentSolution(id=1, category="fan", model="ВКМ 100", brand="Вентс", max_flow=100, max_pressure=150,
                      price_rub=3500, url="https://yandex.ru/search/?text=ВКМ 100", noise_db=42),
    EquipmentSolution(id=2, category="fan", model="ВКМ 150", brand="Вентс", max_flow=250, max_pressure=200,
                      price_rub=4500, url="https://yandex.ru/search/?text=ВКМ 150", noise_db=46),
    EquipmentSolution(id=3, category="fan", model="ВКМ 200", brand="Вентс", max_flow=500, max_pressure=300,
                      price_rub=6800, url="https://yandex.ru/search/?text=ВКМ 200", noise_db=52),
    EquipmentSolution(id=4, category="fan", model="ВКМ 250", brand="Вентс", max_flow=800, max_pressure=400,
                      price_rub=9500, url="https://yandex.ru/search/?text=ВКМ 250", noise_db=58),
    EquipmentSolution(id=5, category="fan", model="ВКМ 315", brand="Вентс", max_flow=1200, max_pressure=500,
                      price_rub=14000, url="https://yandex.ru/search/?text=ВКМ 315", noise_db=64),
    EquipmentSolution(id=6, category="fan", model="Ostberg Corrigo", brand="Ostberg", max_flow=2500, max_pressure=800,
                      price_rub=45000, url="https://yandex.ru/search/?text=Ostberg Corrigo", noise_db=72),

    # ВЕНТИЛЯТОРЫ КРЫШНЫЕ И ПРОМЫШЛЕННЫЕ
    EquipmentSolution(id=7, category="fan", model="ВР-80-75-4", brand="Вентс", max_flow=3000, max_pressure=900,
                      price_rub=35000, url="https://yandex.ru/search/?text=ВР-80-75", noise_db=78),
    EquipmentSolution(id=8, category="fan", model="ВР-80-75-6.3", brand="Вентс", max_flow=5000, max_pressure=1200,
                      price_rub=55000, url="https://yandex.ru/search/?text=ВР-80-75", noise_db=82),
    EquipmentSolution(id=9, category="fan", model="Ostberg SAVU", brand="Ostberg", max_flow=8000, max_pressure=1500,
                      price_rub=120000, url="https://yandex.ru/search/?text=Ostberg SAVU", noise_db=85),

    # ПРИТОЧНЫЕ УСТАНОВКИ
    EquipmentSolution(id=10, category="unit", model="Systemair DVC-200", brand="Systemair", max_flow=800,
                      max_pressure=600, price_rub=85000, url="https://yandex.ru/search/?text=Systemair DVC",
                      noise_db=55),
    EquipmentSolution(id=11, category="unit", model="Systemair DVC-500", brand="Systemair", max_flow=2500,
                      max_pressure=1000, price_rub=180000, url="https://yandex.ru/search/?text=Systemair DVC",
                      noise_db=65),
    EquipmentSolution(id=12, category="unit", model="Systemair DVC-1000", brand="Systemair", max_flow=5000,
                      max_pressure=1500, price_rub=350000, url="https://yandex.ru/search/?text=Systemair DVC",
                      noise_db=75),
    EquipmentSolution(id=13, category="unit", model="Salda VEKA", brand="Salda", max_flow=1500, max_pressure=800,
                      price_rub=150000, url="https://yandex.ru/search/?text=Salda VEKA", noise_db=60),

    # ВОЗДУХОВОДЫ
    EquipmentSolution(id=14, category="duct", model="Круглый Ø100", brand="Вентс", max_flow=150, price_rub=250,
                      url="https://yandex.ru/search/?text=воздуховод 100", noise_db=0),
    EquipmentSolution(id=15, category="duct", model="Круглый Ø150", brand="Вентс", max_flow=300, price_rub=350,
                      url="https://yandex.ru/search/?text=воздуховод 150", noise_db=0),
    EquipmentSolution(id=16, category="duct", model="Круглый Ø200", brand="Вентс", max_flow=600, price_rub=500,
                      url="https://yandex.ru/search/?text=воздуховод 200", noise_db=0),
    EquipmentSolution(id=17, category="duct", model="Круглый Ø250", brand="Вентс", max_flow=1000, price_rub=700,
                      url="https://yandex.ru/search/?text=воздуховод 250", noise_db=0),
    EquipmentSolution(id=18, category="duct", model="Круглый Ø315", brand="Вентс", max_flow=1500, price_rub=950,
                      url="https://yandex.ru/search/?text=воздуховод 315", noise_db=0),

    # КАЛОРИФЕРЫ
    EquipmentSolution(id=27, category="heater", model="НК-1-5", brand="Т.С.Т.", max_flow=500, heater_power=5,
                      price_rub=8000, url="https://yandex.ru/search/?text=калорифер НК", noise_db=0),
    EquipmentSolution(id=28, category="heater", model="НК-2-10", brand="Т.С.Т.", max_flow=1000, heater_power=10,
                      price_rub=14000, url="https://yandex.ru/search/?text=калорифер НК", noise_db=0),
    EquipmentSolution(id=29, category="heater", model="НК-3-20", brand="Т.С.Т.", max_flow=2000, heater_power=20,
                      price_rub=22000, url="https://yandex.ru/search/?text=калорифер НК", noise_db=0),

    # ФИЛЬТРЫ
    EquipmentSolution(id=32, category="filter", model="ФВК-100", brand="Вентс", max_flow=150, price_rub=1500,
                      url="https://yandex.ru/search/?text=фильтр ФВК", noise_db=0),
    EquipmentSolution(id=33, category="filter", model="ФВК-200", brand="Вентс", max_flow=600, price_rub=2500,
                      url="https://yandex.ru/search/?text=фильтр ФВК", noise_db=0),
    EquipmentSolution(id=34, category="filter", model="ФВК-400", brand="Вентс", max_flow=2500, price_rub=6500,
                      url="https://yandex.ru/search/?text=фильтр ФВК", noise_db=0),

    # РЕКУПЕРАТОРЫ
    EquipmentSolution(id=36, category="recuperator", model="Рекуператор РВ-100", brand="Вентс", max_flow=100,
                      price_rub=25000, url="https://yandex.ru/search/?text=рекуператор", noise_db=35),
    EquipmentSolution(id=37, category="recuperator", model="ПВУ 2000", brand="Zilon", max_flow=2000, price_rub=180000,
                      url="https://yandex.ru/search/?text=ПВУ 2000", noise_db=60),
]