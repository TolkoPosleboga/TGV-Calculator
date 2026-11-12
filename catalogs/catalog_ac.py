from pydantic import BaseModel
from typing import Optional, List, Literal


class AcEquipment(BaseModel):
    id: int
    category: Literal["split", "cassette", "vrf", "chiller"]
    segment: Literal["basic", "industrial"] = "basic"
    brand: str
    model: str
    type: str
    power_kw: float
    price_rub: int
    url: str
    note: Optional[str] = None


AC_CATALOG: List[AcEquipment] = [
    # ================== БАЗОВЫЙ СЕГМЕНТ: СПЛИТ-СИСТЕМЫ ==================
    AcEquipment(id=1, category="split", segment="basic", brand="Daikin", model="FTXB25C", type="Настенный сплит", power_kw=2.5, price_rub=55000, url="https://daikin.ru", note="До 25 м²"),
    AcEquipment(id=2, category="split", segment="basic", brand="Mitsubishi", model="MSZ-LN35", type="Настенный сплит", power_kw=3.5, price_rub=72000, url="https://mitsubishi-electric.ru", note="До 35 м²"),
    AcEquipment(id=3, category="split", segment="basic", brand="Ballu", model="BSAG-18H", type="Настенный сплит", power_kw=5.3, price_rub=38000, url="https://ballu.ru", note="До 50 м²"),
    AcEquipment(id=4, category="split", segment="basic", brand="Electrolux", model="ECA-24", type="Настенный сплит", power_kw=7.0, price_rub=52000, url="https://electrolux.ru", note="До 70 м²"),

    # ================== БАЗОВЫЙ СЕГМЕНТ: КАССЕТНЫЕ ==================
    AcEquipment(id=5, category="cassette", segment="basic", brand="Daikin", model="FCAG50", type="Кассетный", power_kw=5.0, price_rub=95000, url="https://daikin.ru", note="4-поточный, до 50 м²"),
    AcEquipment(id=6, category="cassette", segment="basic", brand="Mitsubishi", model="PLY-P50", type="Кассетный", power_kw=5.0, price_rub=88000, url="https://mitsubishi-electric.ru", note="4-поточный, до 50 м²"),

    # ================== ПРОМЫШЛЕННЫЙ СЕГМЕНТ: VRF-СИСТЕМЫ ==================
    AcEquipment(id=101, category="vrf", segment="industrial", brand="Daikin", model="VRV IV S", type="VRF-система", power_kw=15.5, price_rub=450000, url="https://daikin.ru", note="Мультизональная, 5 внутренних блоков"),
    AcEquipment(id=102, category="vrf", segment="industrial", brand="Mitsubishi", model="City Multi", type="VRF-система", power_kw=22.4, price_rub=680000, url="https://mitsubishi-electric.ru", note="Мультизональная, 8 внутренних блоков"),
    AcEquipment(id=103, category="vrf", segment="industrial", brand="Haier", model="VRF MRV", type="VRF-система", power_kw=45.0, price_rub=1200000, url="https://haier.ru", note="Мультизональная для больших зданий"),

    # ================== ПРОМЫШЛЕННЫЙ СЕГМЕНТ: ЧИЛЛЕРЫ ==================
    AcEquipment(id=104, category="chiller", segment="industrial", brand="Carrier", model="30RB-160", type="Чиллер", power_kw=160.0, price_rub=4500000, url="https://carrier.ru", note="Воздушное охлаждение"),
    AcEquipment(id=105, category="chiller", segment="industrial", brand="Trane", model="CGAM 200", type="Чиллер", power_kw=200.0, price_rub=5800000, url="https://trane.ru", note="Воздушное охлаждение, для ЦОД и производств"),
    AcEquipment(id=106, category="chiller", segment="industrial", brand="Daikin", model="EWAQ 500", type="Чиллер", power_kw=500.0, price_rub=12000000, url="https://daikin.ru", note="Промышленный чиллер, 500 кВт"),
]