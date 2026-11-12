from pydantic import BaseModel
from typing import Optional, List, Literal


class HeatingSolution(BaseModel):
    id: int = 0
    category: Literal["boiler", "radiator", "pump"]
    segment: Literal["basic", "industrial"] = "basic"
    brand: str
    model: str
    type: str
    power_kw: float
    price_rub: int
    url: str
    note: Optional[str] = None


EQUIPMENT_CATALOG_HEAT: List[HeatingSolution] = [
    # ================== БАЗОВЫЙ СЕГМЕНТ ==================
    # Котлы
    HeatingSolution(id=1, category="boiler", segment="basic", brand="Baxi", model="Eco Four 14 F", type="Газовый котёл",
                    power_kw=14.0, price_rub=85000, url="https://baxi.ru", note="Настенный, двухконтурный, 14 кВт"),
    HeatingSolution(id=2, category="boiler", segment="basic", brand="Bosch", model="Gaz 6000 W 24",
                    type="Газовый котёл", power_kw=24.0, price_rub=72000, url="https://bosch-climate.ru",
                    note="Настенный, одноконтурный, 24 кВт"),
    HeatingSolution(id=3, category="boiler", segment="basic", brand="Viessmann", model="Vitodens 100-W 32",
                    type="Газовый котёл", power_kw=32.0, price_rub=165000, url="https://viessmann.ru",
                    note="Конденсационный, 32 кВт"),
    HeatingSolution(id=4, category="boiler", segment="basic", brand="Navien", model="Deluxe Plus 40",
                    type="Газовый котёл", power_kw=40.0, price_rub=110000, url="https://navien.ru",
                    note="Настенный, 40 кВт"),

    # Радиаторы
    HeatingSolution(id=5, category="radiator", segment="basic", brand="Kermi", model="Therm-x2 FKO 22 500x1000",
                    type="Радиатор панельный", power_kw=1.8, price_rub=12500, url="https://kermi.ru",
                    note="Стальной панельный, 1.8 кВт"),
    HeatingSolution(id=6, category="radiator", segment="basic", brand="Purmo", model="Compact C22 500x1000",
                    type="Радиатор панельный", power_kw=1.9, price_rub=11800, url="https://purmo.ru",
                    note="Стальной панельный, 1.9 кВт"),
    HeatingSolution(id=7, category="radiator", segment="basic", brand="Rifar", model="Monolit 500 (10 секций)",
                    type="Радиатор секционный", power_kw=2.0, price_rub=9500, url="https://rifar.ru",
                    note="Алюминиевый, 2.0 кВт"),

    # Насосы
    HeatingSolution(id=8, category="pump", segment="basic", brand="Grundfos", model="ALPHA2 25-40 180",
                    type="Циркуляционный насос", power_kw=0.0, price_rub=28500, url="https://grundfos.ru",
                    note="Энергоэффективный, напор до 4 м, расход до 2.5 м³/ч"),
    HeatingSolution(id=9, category="pump", segment="basic", brand="Wilo", model="Yonos PICO 25/1-4",
                    type="Циркуляционный насос", power_kw=0.0, price_rub=24000, url="https://wilo.com",
                    note="Напор до 4 м, расход до 2.5 м³/ч"),
    HeatingSolution(id=10, category="pump", segment="basic", brand="Grundfos", model="ALPHA2 25-60 180",
                    type="Циркуляционный насос", power_kw=0.0, price_rub=36000, url="https://grundfos.ru",
                    note="Напор до 6 м, расход до 3.5 м³/ч"),

    # ================== ПРОМЫШЛЕННЫЙ СЕГМЕНТ ==================
    # Промышленные котлы
    HeatingSolution(id=101, category="boiler", segment="industrial", brand="Buderus", model="Logano G334 WS",
                    type="Котёл чугунный", power_kw=95.0, price_rub=420000, url="https://buderus.ru",
                    note="Напольный, атмосферный, 95 кВт"),
    HeatingSolution(id=102, category="boiler", segment="industrial", brand="De Dietrich", model="CBI 320",
                    type="Котёл чугунный", power_kw=320.0, price_rub=1250000, url="https://dedietrich.ru",
                    note="Напольный, 320 кВт"),
    HeatingSolution(id=103, category="boiler", segment="industrial", brand="Bosch", model="Unimat UT-L 1000",
                    type="Котёл стальной", power_kw=1000.0, price_rub=4500000, url="https://bosch-industrial.ru",
                    note="Промышленный, 1000 кВт"),

    # Промышленные радиаторы
    HeatingSolution(id=104, category="radiator", segment="industrial", brand="МС", model="МС-140 (7 секций)",
                    type="Радиатор чугунный", power_kw=1.1, price_rub=4500,
                    url="https://yandex.ru/search/?text=радиатор МС-140", note="Чугунный секционный, 1.1 кВт"),
    HeatingSolution(id=105, category="radiator", segment="industrial", brand="Пурмо", model="Ventil Compact C22",
                    type="Радиатор панельный", power_kw=4.5, price_rub=35000, url="https://purmo.ru",
                    note="Стальной панельный, 4.5 кВт"),

    # Промышленные насосы
    HeatingSolution(id=106, category="pump", segment="industrial", brand="Grundfos", model="TPE 40-240",
                    type="Насос промышленный", power_kw=0.0, price_rub=120000, url="https://grundfos.ru",
                    note="Расход до 25 м³/ч, напор до 12 м"),
    HeatingSolution(id=107, category="pump", segment="industrial", brand="Wilo", model="Stratos MAXO 50",
                    type="Насос промышленный", power_kw=0.0, price_rub=240000, url="https://wilo.com",
                    note="Расход до 40 м³/ч, напор до 16 м"),
]