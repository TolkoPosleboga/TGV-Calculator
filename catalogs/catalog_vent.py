
from pydantic import BaseModel
from typing import Literal


class EquipmentSolution(BaseModel):
    id: int
    category: str
    segment: Literal["basic", "industrial"] = "basic"
    model: str
    brand: str
    min_flow: float = 0.0
    max_flow: float
    max_pressure: float = 0
    heater_power: float = 0
    price_rub: int
    url: str
    noise_db: int = 50


EQUIPMENT_CATALOG = [
    # ================== БАЗОВЫЙ СЕГМЕНТ: ВЕНТИЛЯТОРЫ КАНАЛЬНЫЕ ==================
    EquipmentSolution(id=1, category="fan", segment="basic", model="ВКМ 100", brand="Вентс",
                      min_flow=0, max_flow=100, max_pressure=150,
                      price_rub=3500, url="https://yandex.ru/search/?text=ВКМ 100", noise_db=42),
    EquipmentSolution(id=2, category="fan", segment="basic", model="ВКМ 150", brand="Вентс",
                      min_flow=0, max_flow=250, max_pressure=200,
                      price_rub=4500, url="https://yandex.ru/search/?text=ВКМ 150", noise_db=46),
    EquipmentSolution(id=3, category="fan", segment="basic", model="ВКМ 200", brand="Вентс",
                      min_flow=0, max_flow=500, max_pressure=300,
                      price_rub=6800, url="https://yandex.ru/search/?text=ВКМ 200", noise_db=52),
    EquipmentSolution(id=4, category="fan", segment="basic", model="ВКМ 250", brand="Вентс",
                      min_flow=0, max_flow=800, max_pressure=400,
                      price_rub=9500, url="https://yandex.ru/search/?text=ВКМ 250", noise_db=58),
    EquipmentSolution(id=5, category="fan", segment="basic", model="ВКМ 315", brand="Вентс",
                      min_flow=0, max_flow=1200, max_pressure=500,
                      price_rub=14000, url="https://yandex.ru/search/?text=ВКМ 315", noise_db=64),
    EquipmentSolution(id=6, category="fan", segment="basic", model="Ostberg Corrigo", brand="Ostberg",
                      min_flow=0, max_flow=2500, max_pressure=800,
                      price_rub=45000, url="https://yandex.ru/search/?text=Ostberg Corrigo", noise_db=72),

    # ================== БАЗОВЫЙ СЕГМЕНТ: ВЕНТИЛЯТОРЫ КРЫШНЫЕ И ПРОМЫШЛЕННЫЕ ==================
    EquipmentSolution(id=7, category="fan", segment="basic", model="ВР-80-75-4", brand="Вентс",
                      min_flow=0, max_flow=3000, max_pressure=900,
                      price_rub=35000, url="https://yandex.ru/search/?text=ВР-80-75", noise_db=78),
    EquipmentSolution(id=8, category="fan", segment="basic", model="ВР-80-75-6.3", brand="Вентс",
                      min_flow=0, max_flow=5000, max_pressure=1200,
                      price_rub=55000, url="https://yandex.ru/search/?text=ВР-80-75", noise_db=82),
    EquipmentSolution(id=9, category="fan", segment="basic", model="Ostberg SAVU", brand="Ostberg",
                      min_flow=0, max_flow=8000, max_pressure=1500,
                      price_rub=120000, url="https://yandex.ru/search/?text=Ostberg SAVU", noise_db=85),

    # ================== БАЗОВЫЙ СЕГМЕНТ: ПРИТОЧНЫЕ УСТАНОВКИ ==================
    EquipmentSolution(id=10, category="unit", segment="basic", model="Systemair DVC-200", brand="Systemair",
                      min_flow=0, max_flow=800, max_pressure=600,
                      price_rub=85000, url="https://yandex.ru/search/?text=Systemair DVC", noise_db=55),
    EquipmentSolution(id=11, category="unit", segment="basic", model="Systemair DVC-500", brand="Systemair",
                      min_flow=0, max_flow=2500, max_pressure=1000,
                      price_rub=180000, url="https://yandex.ru/search/?text=Systemair DVC", noise_db=65),
    EquipmentSolution(id=12, category="unit", segment="basic", model="Systemair DVC-1000", brand="Systemair",
                      min_flow=0, max_flow=5000, max_pressure=1500,
                      price_rub=350000, url="https://yandex.ru/search/?text=Systemair DVC", noise_db=75),
    EquipmentSolution(id=13, category="unit", segment="basic", model="Salda VEKA", brand="Salda",
                      min_flow=0, max_flow=1500, max_pressure=800,
                      price_rub=150000, url="https://yandex.ru/search/?text=Salda VEKA", noise_db=60),

    # ================== БАЗОВЫЙ СЕГМЕНТ: ВОЗДУХОВОДЫ ==================
    EquipmentSolution(id=14, category="duct", segment="basic", model="Круглый Ø100", brand="Вентс",
                      min_flow=0, max_flow=150, price_rub=250,
                      url="https://yandex.ru/search/?text=воздуховод 100", noise_db=0),
    EquipmentSolution(id=15, category="duct", segment="basic", model="Круглый Ø150", brand="Вентс",
                      min_flow=0, max_flow=300, price_rub=350,
                      url="https://yandex.ru/search/?text=воздуховод 150", noise_db=0),
    EquipmentSolution(id=16, category="duct", segment="basic", model="Круглый Ø200", brand="Вентс",
                      min_flow=0, max_flow=600, price_rub=500,
                      url="https://yandex.ru/search/?text=воздуховод 200", noise_db=0),
    EquipmentSolution(id=17, category="duct", segment="basic", model="Круглый Ø250", brand="Вентс",
                      min_flow=0, max_flow=1000, price_rub=700,
                      url="https://yandex.ru/search/?text=воздуховод 250", noise_db=0),
    EquipmentSolution(id=18, category="duct", segment="basic", model="Круглый Ø315", brand="Вентс",
                      min_flow=0, max_flow=1500, price_rub=950,
                      url="https://yandex.ru/search/?text=воздуховод 315", noise_db=0),

    # ================== БАЗОВЫЙ СЕГМЕНТ: КАЛОРИФЕРЫ ==================
    EquipmentSolution(id=27, category="heater", segment="basic", model="НК-1-5", brand="Т.С.Т.",
                      min_flow=0, max_flow=500, heater_power=5,
                      price_rub=8000, url="https://yandex.ru/search/?text=калорифер НК", noise_db=0),
    EquipmentSolution(id=28, category="heater", segment="basic", model="НК-2-10", brand="Т.С.Т.",
                      min_flow=0, max_flow=1000, heater_power=10,
                      price_rub=14000, url="https://yandex.ru/search/?text=калорифер НК", noise_db=0),
    EquipmentSolution(id=29, category="heater", segment="basic", model="НК-3-20", brand="Т.С.Т.",
                      min_flow=0, max_flow=2000, heater_power=20,
                      price_rub=22000, url="https://yandex.ru/search/?text=калорифер НК", noise_db=0),

    # ================== БАЗОВЫЙ СЕГМЕНТ: ФИЛЬТРЫ ==================
    EquipmentSolution(id=32, category="filter", segment="basic", model="ФВК-100", brand="Вентс",
                      min_flow=0, max_flow=150, price_rub=1500,
                      url="https://yandex.ru/search/?text=фильтр ФВК", noise_db=0),
    EquipmentSolution(id=33, category="filter", segment="basic", model="ФВК-200", brand="Вентс",
                      min_flow=0, max_flow=600, price_rub=2500,
                      url="https://yandex.ru/search/?text=фильтр ФВК", noise_db=0),
    EquipmentSolution(id=34, category="filter", segment="basic", model="ФВК-400", brand="Вентс",
                      min_flow=0, max_flow=2500, price_rub=6500,
                      url="https://yandex.ru/search/?text=фильтр ФВК", noise_db=0),

    # ================== БАЗОВЫЙ СЕГМЕНТ: РЕКУПЕРАТОРЫ ==================
    EquipmentSolution(id=36, category="recuperator", segment="basic", model="Рекуператор РВ-100", brand="Вентс",
                      min_flow=0, max_flow=100, price_rub=25000,
                      url="https://yandex.ru/search/?text=рекуператор", noise_db=35),
    EquipmentSolution(id=37, category="recuperator", segment="basic", model="ПВУ 2000", brand="Zilon",
                      min_flow=0, max_flow=2000, price_rub=180000,
                      url="https://yandex.ru/search/?text=ПВУ 2000", noise_db=60),

    # ================== ПРОМЫШЛЕННЫЙ СЕГМЕНТ: РАДИАЛЬНЫЕ ВЕНТИЛЯТОРЫ ВЦ 14-46 ==================
    EquipmentSolution(id=101, category="fan", segment="industrial", model="ВЦ 14-46 №2", brand="ВЦ",
                      min_flow=0, max_flow=800, max_pressure=900,
                      price_rub=10000, url="https://yandex.ru/search/?text=ВЦ 14-46 №2", noise_db=75),
    EquipmentSolution(id=102, category="fan", segment="industrial", model="ВЦ 14-46 №4", brand="ВЦ",
                      min_flow=0, max_flow=3000, max_pressure=1500,
                      price_rub=35000, url="https://yandex.ru/search/?text=ВЦ 14-46 №4", noise_db=82),
    EquipmentSolution(id=103, category="fan", segment="industrial", model="ВЦ 14-46 №6.3", brand="ВЦ",
                      min_flow=0, max_flow=8000, max_pressure=2500,
                      price_rub=91000, url="https://yandex.ru/search/?text=ВЦ 14-46 №6.3", noise_db=88),
    EquipmentSolution(id=104, category="fan", segment="industrial", model="ВЦ 14-46 №8", brand="ВЦ",
                      min_flow=0, max_flow=15000, max_pressure=3000,
                      price_rub=145000, url="https://yandex.ru/search/?text=ВЦ 14-46 №8", noise_db=92),
    EquipmentSolution(id=105, category="fan", segment="industrial", model="ВЦ 14-46 №10", brand="ВЦ",
                      min_flow=0, max_flow=25000, max_pressure=3500,
                      price_rub=210000, url="https://yandex.ru/search/?text=ВЦ 14-46 №10", noise_db=95),
    EquipmentSolution(id=106, category="fan", segment="industrial", model="ВЦ 14-46 №12.5", brand="ВЦ",
                      min_flow=0, max_flow=50000, max_pressure=4000,
                      price_rub=320000, url="https://yandex.ru/search/?text=ВЦ 14-46 №12.5", noise_db=98),

    # ================== ПРОМЫШЛЕННЫЙ СЕГМЕНТ: ОСЕВЫЕ ВО 06-300 ==================
    EquipmentSolution(id=107, category="fan", segment="industrial", model="ВО 06-300 №3.15", brand="ВО",
                      min_flow=0, max_flow=1500, max_pressure=200,
                      price_rub=18000, url="https://yandex.ru/search/?text=ВО 06-300", noise_db=70),
    EquipmentSolution(id=108, category="fan", segment="industrial", model="ВО 06-300 №6.3", brand="ВО",
                      min_flow=0, max_flow=6000, max_pressure=300,
                      price_rub=23000, url="https://yandex.ru/search/?text=ВО 06-300", noise_db=78),
    EquipmentSolution(id=109, category="fan", segment="industrial", model="ВО 06-300 №8", brand="ВО",
                      min_flow=0, max_flow=12000, max_pressure=400,
                      price_rub=48000, url="https://yandex.ru/search/?text=ВО 06-300", noise_db=83),
    EquipmentSolution(id=110, category="fan", segment="industrial", model="ВО 06-300 №10", brand="ВО",
                      min_flow=0, max_flow=20000, max_pressure=500,
                      price_rub=78000, url="https://yandex.ru/search/?text=ВО 06-300", noise_db=88),
    EquipmentSolution(id=111, category="fan", segment="industrial", model="ВО 06-300 №12.5", brand="ВО",
                      min_flow=0, max_flow=30000, max_pressure=600,
                      price_rub=115000, url="https://yandex.ru/search/?text=ВО 06-300", noise_db=92),

    # ================== ПРОМЫШЛЕННЫЙ СЕГМЕНТ: КРЫШНЫЕ ВКР ==================
    EquipmentSolution(id=112, category="fan", segment="industrial", model="ВКР №3.15", brand="ВКР",
                      min_flow=0, max_flow=1200, max_pressure=300,
                      price_rub=22000, url="https://yandex.ru/search/?text=ВКР вентилятор", noise_db=68),
    EquipmentSolution(id=113, category="fan", segment="industrial", model="ВКР №4", brand="ВКР",
                      min_flow=0, max_flow=2000, max_pressure=400,
                      price_rub=28000, url="https://yandex.ru/search/?text=ВКР вентилятор", noise_db=72),
    EquipmentSolution(id=114, category="fan", segment="industrial", model="ВКР №6.3", brand="ВКР",
                      min_flow=0, max_flow=5000, max_pressure=500,
                      price_rub=52000, url="https://yandex.ru/search/?text=ВКР вентилятор", noise_db=80),
    EquipmentSolution(id=115, category="fan", segment="industrial", model="ВКР №8", brand="ВКР",
                      min_flow=0, max_flow=10000, max_pressure=600,
                      price_rub=74000, url="https://yandex.ru/search/?text=ВКР вентилятор", noise_db=85),
    EquipmentSolution(id=116, category="fan", segment="industrial", model="ВКР №10", brand="ВКР",
                      min_flow=0, max_flow=18000, max_pressure=700,
                      price_rub=125000, url="https://yandex.ru/search/?text=ВКР вентилятор", noise_db=90),

    # ================== ПРОМЫШЛЕННЫЙ СЕГМЕНТ: ПРИТОЧНЫЕ УСТАНОВКИ АПК / КЦКП ==================
    EquipmentSolution(id=117, category="unit", segment="industrial", model="АПК-3", brand="АПК",
                      min_flow=0, max_flow=3000, max_pressure=800,
                      price_rub=67000, url="https://yandex.ru/search/?text=АПК приточная установка", noise_db=65),
    EquipmentSolution(id=118, category="unit", segment="industrial", model="АПК-10", brand="АПК",
                      min_flow=0, max_flow=10000, max_pressure=1200,
                      price_rub=190000, url="https://yandex.ru/search/?text=АПК приточная установка", noise_db=75),
    EquipmentSolution(id=119, category="unit", segment="industrial", model="КЦКП (по бланк-заказу)", brand="ВЕЗА",
                      min_flow=5000, max_flow=100000, max_pressure=2500,
                      price_rub=850000, url="https://yandex.ru/search/?text=КЦКП ВЕЗА", noise_db=80),

    # ================== ПРОМЫШЛЕННЫЙ СЕГМЕНТ: ВОДЯНЫЕ КАЛОРИФЕРЫ КСк 3 ==================
    EquipmentSolution(id=120, category="heater", segment="industrial", model="КСк 3-4", brand="КСк",
                      min_flow=0, max_flow=4000, heater_power=75,
                      price_rub=15000, url="https://yandex.ru/search/?text=калорифер КСк 3-4", noise_db=0),
    EquipmentSolution(id=121, category="heater", segment="industrial", model="КСк 3-8", brand="КСк",
                      min_flow=0, max_flow=10000, heater_power=150,
                      price_rub=35000, url="https://yandex.ru/search/?text=калорифер КСк 3-8", noise_db=0),
    EquipmentSolution(id=122, category="heater", segment="industrial", model="КСк 3-11", brand="КСк",
                      min_flow=0, max_flow=16000, heater_power=220,
                      price_rub=56000, url="https://yandex.ru/search/?text=калорифер КСк 3-11", noise_db=0),

    # ================== ПРОМЫШЛЕННЫЙ СЕГМЕНТ: ЯЧЕЙКОВЫЕ ФИЛЬТРЫ ФяВБ ==================
    EquipmentSolution(id=123, category="filter", segment="industrial", model="ФяВБ 514×514×32", brand="ФяВБ",
                      min_flow=0, max_flow=1500, price_rub=3100,
                      url="https://yandex.ru/search/?text=фильтр ФяВБ 514", noise_db=0),
    EquipmentSolution(id=124, category="filter", segment="industrial", model="ФяВБ 514×514×48", brand="ФяВБ",
                      min_flow=0, max_flow=2000, price_rub=3400,
                      url="https://yandex.ru/search/?text=фильтр ФяВБ 514", noise_db=0),

    # ================== ПРОМЫШЛЕННЫЙ СЕГМЕНТ: ЦИКЛОНЫ ЦН-15 ==================
    EquipmentSolution(id=125, category="cyclone", segment="industrial", model="ЦН-15-500х1УП", brand="НИИОГаз",
                      min_flow=1000, max_flow=3000, max_pressure=1200,
                      price_rub=32000, url="https://yandex.ru/search/?text=циклон ЦН-15-500", noise_db=85),
    EquipmentSolution(id=126, category="cyclone", segment="industrial", model="ЦН-15-700х1УП", brand="НИИОГаз",
                      min_flow=3000, max_flow=6000, max_pressure=1500,
                      price_rub=110000, url="https://yandex.ru/search/?text=циклон ЦН-15-700", noise_db=88),
    EquipmentSolution(id=127, category="cyclone", segment="industrial", model="ЦН-15-800х1УП", brand="НИИОГаз",
                      min_flow=5000, max_flow=10000, max_pressure=1800,
                      price_rub=190000, url="https://yandex.ru/search/?text=циклон ЦН-15-800", noise_db=90),

    # ================== ПРОМЫШЛЕННЫЙ СЕГМЕНТ: ШУМОГЛУШИТЕЛИ ГП ==================
    EquipmentSolution(id=128, category="silencer", segment="industrial", model="ГП 500×300×1000", brand="ГП",
                      min_flow=0, max_flow=2000, price_rub=4200,
                      url="https://yandex.ru/search/?text=шумоглушитель ГП", noise_db=0),
    EquipmentSolution(id=129, category="silencer", segment="industrial", model="ГП 800×500×1000", brand="ГП",
                      min_flow=0, max_flow=5000, price_rub=6900,
                      url="https://yandex.ru/search/?text=шумоглушитель ГП", noise_db=0),
    EquipmentSolution(id=130, category="silencer", segment="industrial", model="ГП 1000×700×1500", brand="ГП",
                      min_flow=0, max_flow=12000, price_rub=23000,
                      url="https://yandex.ru/search/?text=шумоглушитель ГП", noise_db=0),

    # ================== ПРОМЫШЛЕННЫЙ СЕГМЕНТ: КЛАПАНЫ КВУ ==================
    EquipmentSolution(id=131, category="valve", segment="industrial", model="КВУ 300×150", brand="КВУ",
                      min_flow=0, max_flow=800, price_rub=5400,
                      url="https://yandex.ru/search/?text=клапан КВУ", noise_db=0),
    EquipmentSolution(id=132, category="valve", segment="industrial", model="КВУ 1000×700", brand="КВУ",
                      min_flow=0, max_flow=6000, price_rub=21500,
                      url="https://yandex.ru/search/?text=клапан КВУ", noise_db=0),
    EquipmentSolution(id=133, category="valve", segment="industrial", model="КВУ 1000×1000", brand="КВУ",
                      min_flow=0, max_flow=8000, price_rub=18500,
                      url="https://yandex.ru/search/?text=клапан КВУ", noise_db=0),
]