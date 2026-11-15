from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from core import vent_math, heat_math, ac_math, gas_math
import traceback

router = APIRouter(prefix="/api/analytics", tags=["Аналитика"])


class RoomAnalyticsRequest(BaseModel):
    id: int
    name: str
    data: Dict[str, Any]


class AnalyticsSyncRequest(BaseModel):
    rooms: List[RoomAnalyticsRequest]


@router.post("/calculate")
def calculate_analytics(data: AnalyticsSyncRequest):
    try:
        res = {
            "vent": {"people": 0, "rate": 0, "heat": 0, "moist": 0, "hazard": 0, "max": 0},
            "heat": {"wall": 0, "window": 0, "roof": 0, "floor": 0, "total_loss": 0, "boiler": 0},
            "ac": {"xpg": 0, "ppg": 0, "tpg": 0, "max_q": 0, "max_l": 0},
            "gas": {"boiler": 0, "total": 0}
        }

        if not data.rooms:
            return res

        for room in data.rooms:
            d = room.data

            # ВЕНТИЛЯЦИЯ
            try:
                v = vent_math.calculate_air_exchange(
                    length=float(d.get('v_length', 4)), width=float(d.get('v_width', 4)),
                    height=float(d.get('v_height', 3)),
                    people=int(d.get('v_people', 0)), heat_gain_kw=float(d.get('v_heat', 0)),
                    moisture_gain_g_h=float(d.get('v_moisture', 0)),
                    hazard_g_h=float(d.get('v_hazard', 0)), mpc_mg_m3=float(d.get('v_mpc', 20)),
                    t_inside=float(d.get('v_t_in', 20)),
                    t_outside=float(d.get('v_t_out', -20)), room_type=str(d.get('v_room_type', 'office'))
                )
                res["vent"]["people"] += v["L_people_m3h"]
                res["vent"]["rate"] += v["L_rate_m3h"]
                res["vent"]["heat"] += v["L_heat_m3h"]
                res["vent"]["moist"] += v["L_moisture_m3h"]
                res["vent"]["hazard"] += v["L_hazard_m3h"]
                res["vent"]["max"] += v["L_max_m3h"]
            except:
                pass

            # ОТОПЛЕНИЕ
            try:
                h = heat_math.calculate_heat_loss(
                    city_temp=float(d.get('h_t_out', -20)), t_inside=float(d.get('h_t_in', 20)),
                    wall_area=float(d.get('h_wall_area', 40)), wall_mat=str(d.get('h_wall_mat', 'brick_hollow')),
                    wall_thick=float(d.get('h_wall_thick', 0.38)),
                    insul_mat=str(d.get('h_insul_mat', 'minwool')), insul_thick=float(d.get('h_insul_thick', 0.1)),
                    window_area=float(d.get('h_win_area', 6)), window_type=str(d.get('h_win_type', 'double_chamber')),
                    roof_area=float(d.get('h_roof_area', 24)), roof_insul=float(d.get('h_roof_insul', 0.2)),
                    floor_area=float(d.get('h_floor_area', 24))
                )
                if "error" not in h:
                    res["heat"]["wall"] += h["q_wall_w"]
                    res["heat"]["window"] += h["q_window_w"]
                    res["heat"]["roof"] += h["q_roof_w"]
                    res["heat"]["floor"] += h["q_floor_w"]
                    res["heat"]["total_loss"] += h["total_with_infiltration_w"]
                    res["heat"]["boiler"] += h["boiler_power_kw"]
            except:
                pass

            # КОНДИЦИОНИРОВАНИЕ
            try:
                a = ac_math.calculate_full_climate(
                    area=float(d.get('ac_area', 20)), height=float(d.get('ac_height', 3)),
                    people=int(d.get('ac_people', 2)),
                    t_out_x=-20, t_out_p=10, t_out_t=25, t_in_x=20, t_in_p=20, t_in_t=20,
                    t_supply_x=15, t_supply_p=15, t_supply_t=15, t_exhaust_x=25, t_exhaust_p=25, t_exhaust_t=25,
                    enthalpy_out_x=0, enthalpy_out_p=40, enthalpy_out_t=50, enthalpy_ex_x=0, enthalpy_ex_p=40,
                    enthalpy_ex_t=50,
                    lighting_lux=300, lighting_w_m2=0.07, window_area=float(d.get('ac_window_area', 3)),
                    room_type=str(d.get('ac_room_type', 'office')), window_type='double_chamber'
                )
                res["ac"]["xpg"] += a["table"][0]["q_total"]
                res["ac"]["ppg"] += a["table"][1]["q_total"]
                res["ac"]["tpg"] += a["table"][2]["q_total"]
                res["ac"]["max_q"] += a["max_q_cond"]
                res["ac"]["max_l"] += a["max_air_exchange"]
            except:
                pass

            # ГАЗ
            try:
                g = gas_math.calculate_gas_system(
                    boiler_power_kw=float(d.get('g_boiler_power', 0)),  # Дефолт 0!
                    has_stove=bool(d.get('g_has_stove', False)),
                    has_water_heater=bool(d.get('g_has_heater', False)),
                    room_volume=float(d.get('g_length', 6)) * float(d.get('g_width', 4)) * float(
                        d.get('g_room_height', 3)),
                    room_height=3,
                    combustion_chamber='closed', chimney_height=6, pipe_length=15, local_zeta=5.0, window_area=1.5
                )
                res["gas"]["boiler"] += g["v_boiler"]
                res["gas"]["total"] += g["v_total"]
            except:
                pass

        return res
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))