# catalogs/catalog_heat.py
from pydantic import BaseModel
from typing import Optional, List, Literal


class HeatingSolution(BaseModel):
    category: Literal["boiler", "radiator"]
    brand: str
    model: str
    type: str
    power_kw: float
    price_rub: int
    url: str
    note: Optional[str] = None


EQUIPMENT_CATALOG_HEAT: List[HeatingSolution] = [
    HeatingSolution(category="boiler", brand="Baxi", model="Eco Four 14 F", type="Газовый котёл", power_kw=14.0,
                    price_rub=85000, url="https://baxi.ru", note="Настенный, двухконтурный, 14 кВт"),
    HeatingSolution(category="boiler", brand="Bosch", model="Gaz 6000 W 24", type="Газовый котёл", power_kw=24.0,
                    price_rub=72000, url="https://bosch-climate.ru", note="Настенный, одноконтурный, 24 кВт"),
    HeatingSolution(category="boiler", brand="Viessmann", model="Vitodens 100-W 32", type="Газовый котёл",
                    power_kw=32.0, price_rub=165000, url="https://viessmann.ru", note="Конденсационный, 32 кВт"),
    HeatingSolution(category="boiler", brand="Navien", model="Deluxe Plus 40", type="Газовый котёл", power_kw=40.0,
                    price_rub=110000, url="https://navien.ru", note="Настенный, 40 кВт"),

    HeatingSolution(category="radiator", brand="Kermi", model="Therm-x2 FKO 22 500x1000", type="Радиатор панельный",
                    power_kw=1.8, price_rub=12500, url="https://kermi.ru", note="Стальной панельный, 1.8 кВт"),
    HeatingSolution(category="radiator", brand="Purmo", model="Compact C22 500x1000", type="Радиатор панельный",
                    power_kw=1.9, price_rub=11800, url="https://purmo.ru", note="Стальной панельный, 1.9 кВт"),
    HeatingSolution(category="radiator", brand="Rifar", model="Monolit 500 (10 секций)", type="Радиатор секционный",
                    power_kw=2.0, price_rub=9500, url="https://rifar.ru", note="Алюминиевый, 2.0 кВт"),
]