function fillRandomExample() {
    let hasRooms = false;
    appFloors.forEach(floor => { if (floor.rooms && floor.rooms.length > 0) hasRooms = true; });
    if (!hasRooms && typeof addNewRoom === 'function') addNewRoom();

    const randomBetween = (min, max) => Math.random() * (max - min) + min;
    const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const globalPayload = {
        'h_wall_thick': randomPick([0.38, 0.51, 0.64]),
        'h_insul_thick': randomPick([0.05, 0.1, 0.15]),
        'h_t_supply': randomPick([80, 90, 95]),
        'h_t_return': randomPick([50, 60, 70]),
        'h_pipe_velocity': randomPick([0.5, 0.6, 0.7]),
        'v_recup_eff': randomPick([0, 50, 65, 80]),
        'v_tariff': randomPick([5.0, 5.5, 6.0]),
        'v_season_days': randomPick([180, 210, 240]),
        // Убрали g_boiler_power отсюда!
        'g_chimney_height': randomPick([5, 6, 8]),
        'ext_cond_insul': randomPick([20, 30, 50]),
        'g_local_zeta': parseFloat(randomBetween(2.0, 8.0).toFixed(1)),
        'h_wall_mat': randomPick(['brick_hollow', 'brick_solid', 'aerated_d400', 'aerated_d600']),
        'h_insul_mat': randomPick(['minwool', 'penoplex']),
        'h_roof_insul': randomPick([0.1, 0.15, 0.2, 0.25]),
        'h_win_type': randomPick(['double_chamber', 'triple_chamber']),
        'h_connection_type': randomPick(['side', 'diagonal', 'bottom']),
        'h_uf_spacing': randomPick(['100', '150', '200']),
        'g_chamber': randomPick(['closed', 'open'])
    };

    let isBoilerAssigned = false; // Флаг, чтобы дать котел только одной комнате

    appFloors.forEach(floor => {
        if (floor.rooms) {
            floor.rooms.forEach((room, index) => {
                if (!room.data) room.data = {};
                Object.assign(room.data, globalPayload);

                let type = room.data.v_room_type;
                if (!type) {
                    type = randomPick(['living', 'office']);
                    room.data.v_room_type = type;
                    room.data.h_room_type = type;
                    room.data.ac_room_type = type;
                }

                let w = parseFloat(room.data.v_width) || parseFloat(room.width) || 4;
                let l = parseFloat(room.data.v_length) || parseFloat(room.length) || 6;
                let h = parseFloat(room.data.v_height) || 3.0;

                let ppl, heat, moist, hazard, mpc;
                if (type === 'living') { ppl = Math.floor(randomBetween(1, 4)); heat = randomBetween(0.1, 0.5); moist = randomBetween(200, 600); hazard = 0; mpc = 20; }
                else if (type === 'kitchen') { ppl = Math.floor(randomBetween(1, 3)); heat = randomBetween(0.5, 1.5); moist = randomBetween(1000, 2000); hazard = 0; mpc = 20; }
                else if (type === 'bathroom') { ppl = 0; heat = randomBetween(0.0, 0.2); moist = randomBetween(1000, 1500); hazard = 0; mpc = 20; }
                else if (type === 'corridor' || type === 'stairwell') { ppl = 0; heat = 0.0; moist = 0; hazard = 0; mpc = 20; }
                else if (type === 'office' || type === 'server_room' || type === 'smoking') { ppl = Math.floor(randomBetween(2, 15)); heat = randomBetween(0.5, 3.0); moist = randomBetween(0, 500); hazard = parseFloat(randomBetween(0.1, 2.0).toFixed(1)); mpc = randomPick([10, 20, 50]); }
                else if (type === 'industrial_light') { ppl = Math.floor(randomBetween(5, 20)); heat = randomBetween(2.0, 10.0); moist = randomBetween(500, 2000); hazard = parseFloat(randomBetween(2.0, 10.0).toFixed(1)); mpc = randomPick([5, 10, 20]); }
                else { ppl = Math.floor(randomBetween(10, 40)); heat = randomBetween(5.0, 30.0); moist = randomBetween(1000, 5000); hazard = parseFloat(randomBetween(10.0, 50.0).toFixed(1)); mpc = randomPick([1, 5, 10]); }

                room.data.v_people = ppl; room.data.v_heat = parseFloat(heat.toFixed(1)); room.data.v_moisture = Math.round(moist);
                room.data.v_hazard = hazard; room.data.v_mpc = mpc;
                room.data.v_t_in = type === 'bathroom' ? 24 : 20;
                room.data.v_distance = parseFloat(randomBetween(1.0, 3.0).toFixed(1));
                room.data.v_system_type = ['living', 'kitchen', 'bathroom', 'corridor', 'stairwell'].includes(type) ? 'exhaust' : randomPick(['supply', 'exhaust', 'both']);

                const wallArea = 2 * (w + l) * h;
                const winArea = parseFloat((w * l * 0.15).toFixed(2));
                room.data.h_width = w; room.data.h_length = l;
                room.data.h_wall_area = parseFloat((wallArea - winArea).toFixed(2));
                room.data.h_win_area = winArea;
                room.data.h_floor_area = parseFloat((w * l).toFixed(2));
                room.data.h_roof_area = parseFloat((w * l).toFixed(2));

                room.data.ac_area = parseFloat((w * l).toFixed(2));
                room.data.ac_people = ppl;
                room.data.ac_window_area = winArea;

                room.data.g_width = w; room.data.g_length = l;
                room.data.g_has_stove = type === 'kitchen' ? true : false;
                room.data.g_has_heater = type === 'bathroom' ? true : false;

                // Логика назначения котла (только для одной комнаты)
                if (type === 'kitchen' && !isBoilerAssigned) {
                    room.data.g_boiler_power = randomPick([14, 24, 32, 40]);
                    isBoilerAssigned = true;
                } else {
                    room.data.g_boiler_power = 0;
                }
            });
        }
    });

    if (typeof saveRoomsToStorage === 'function') saveRoomsToStorage();
    if (typeof loadActiveRoomData === 'function') loadActiveRoomData();

    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        if (activeTab.id === 'tab-vent' && typeof debouncedCalcVent === 'function') debouncedCalcVent();
        if (activeTab.id === 'tab-heat' && typeof debouncedCalcHeat === 'function') debouncedCalcHeat();
        if (activeTab.id === 'tab-ac' && typeof debouncedCalcAc === 'function') debouncedCalcAc();
        if (activeTab.id === 'tab-gas' && typeof debouncedCalcGas === 'function') debouncedCalcGas();
        if (activeTab.id === 'tab-vent-ext') {
            if (typeof debouncedCalcCondensation === 'function') debouncedCalcCondensation();
            if (typeof debouncedCalcHumidity === 'function') debouncedCalcHumidity();
        }
    }
    if (typeof renderPlan === 'function' && document.getElementById('plan-view').classList.contains('active')) {
        renderPlan();
    }
}