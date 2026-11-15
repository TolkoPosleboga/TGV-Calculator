from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from core import vent_math, heat_math, ac_math
import traceback

router = APIRouter(prefix="/api/bom", tags=["Спецификация"])


class RoomBOMRequest(BaseModel):
    id: int
    name: str
    data: Dict[str, Any]


class BOMSyncRequest(BaseModel):
    rooms: List[RoomBOMRequest]


@router.post("/sync")
def sync_bom(data: BOMSyncRequest):
    try:
        bom = []
        for room in data.rooms:
            d = room.data

            # --- ВЕНТИЛЯЦИЯ ---
            try:
                l_max = vent_math.calculate_air_exchange(
                    length=float(d.get('v_length', 4)),
                    width=float(d.get('v_width', 4)),
                    height=float(d.get('v_height', 3)),
                    people=int(d.get('v_people', 0)),
                    heat_gain_kw=float(d.get('v_heat', 0)),
                    moisture_gain_g_h=float(d.get('v_moisture', 0)),
                    hazard_g_h=float(d.get('v_hazard', 0)),
                    mpc_mg_m3=float(d.get('v_mpc', 20)),
                    t_inside=float(d.get('v_t_in', 20)),
                    t_outside=float(d.get('v_t_out', -20)),
                    room_type=str(d.get('v_room_type', 'office'))
                )["L_max_m3h"]

                vent_sol = vent_math.find_solutions(l_max, 500, 0)  # P=500 Па, Q=0 кВт
                if vent_sol["solutions"]:
                    fans = [s for s in vent_sol["solutions"] if s.category in ['fan', 'unit']]
                    if fans:
                        best = min(fans, key=lambda x: x.price_rub)
                        bom.append({"name": f"{best.brand} {best.model} (Вент. - {room.name})", "price": best.price_rub,
                                    "qty": 1})
            except Exception as e:
                print(f"Vent error for {room.name}: {e}")

            # --- ОТОПЛЕНИЕ ---
            try:
                heat_res = heat_math.calculate_heat_loss(
                    city_temp=float(d.get('h_t_out', -20)),
                    t_inside=float(d.get('h_t_in', 20)),
                    wall_area=float(d.get('h_wall_area', 40)),
                    wall_mat=str(d.get('h_wall_mat', 'brick_hollow')),
                    wall_thick=float(d.get('h_wall_thick', 0.38)),
                    insul_mat=str(d.get('h_insul_mat', 'minwool')),
                    insul_thick=float(d.get('h_insul_thick', 0.1)),
                    window_area=float(d.get('h_win_area', 6)),
                    window_type=str(d.get('h_win_type', 'double_chamber')),
                    roof_area=float(d.get('h_roof_area', 24)),
                    roof_insul=float(d.get('h_roof_insul', 0.2)),
                    floor_area=float(d.get('h_floor_area', 24))
                )
                if "error" not in heat_res:
                    b_kw = heat_res["boiler_power_kw"]
                    heat_sol = heat_math.find_heat_equipment(b_kw, 1.0)
                    if heat_sol["solutions"]:
                        rads = [s for s in heat_sol["solutions"] if s.category == 'radiator']
                        if rads:
                            best = min(rads, key=lambda x: x.price_rub)
                            bom.append(
                                {"name": f"{best.brand} {best.model} (Отоп. - {room.name})", "price": best.price_rub,
                                 "qty": 1})
            except Exception as e:
                print(f"Heat error for {room.name}: {e}")

            # --- КОНДИЦИОНИРОВАНИЕ ---
            try:
                ac_data = ac_math.calculate_full_climate(
                    area=float(d.get('ac_area', 20)), height=float(d.get('ac_height', 3)),
                    people=int(d.get('ac_people', 2)),
                    t_out_x=-20, t_out_p=10, t_out_t=25, t_in_x=20, t_in_p=20, t_in_t=20,
                    t_supply_x=15, t_supply_p=15, t_supply_t=15, t_exhaust_x=25, t_exhaust_p=25, t_exhaust_t=25,
                    enthalpy_out_x=0, enthalpy_out_p=40, enthalpy_out_t=50, enthalpy_ex_x=0, enthalpy_ex_p=40,
                    enthalpy_ex_t=50,
                    lighting_lux=300, lighting_w_m2=0.07, window_area=float(d.get('ac_window_area', 3)),
                    room_type=str(d.get('ac_room_type', 'office')), window_type='double_chamber'
                )
                q_kw = ac_data["max_q_cond"] / 1000.0
                ac_sol = ac_math.find_ac_equipment(q_kw)
                if ac_sol["solutions"]:
                    best = min(ac_sol["solutions"], key=lambda x: x.price_rub)
                    bom.append(
                        {"name": f"{best.brand} {best.model} (Конд. - {room.name})", "price": best.price_rub, "qty": 1})
            except Exception as e:
                print(f"AC error for {room.name}: {e}")

        # Группируем одинаковое оборудование (убираем дубли, если в разных комнатах одинаковые модели)
        agg = {}
        for item in bom:
            key = item["name"] + "|" + str(item["price"])
            if key not in agg:
                agg[key] = {"name": item["name"], "price": item["price"], "qty": 0}
            agg[key]["qty"] += item["qty"]

        return {"items": list(agg.values())}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))