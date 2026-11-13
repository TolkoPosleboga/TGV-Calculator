function fillRandomExample() {
    const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const examples = {
        'v_length': [3, 4, 5, 6, 8, 10, 12],
        'v_width': [2, 3, 4, 5, 6, 8],
        'v_height': [2.5, 2.7, 3, 3.2, 3.5, 4],
        'v_people': [0, 2, 5, 10, 15, 20, 30, 50],
        'v_heat': [0.1, 0.5, 1, 2, 3, 5, 10],
        'v_moisture': [500, 1000, 1500, 2000, 3000, 5000],
        'v_hazard': [0.5, 1, 2.5, 5, 10, 20],
        'v_mpc': [10, 20, 50, 100],
        'v_t_in': [16, 18, 20, 21, 22, 23, 24],
        'v_recup_eff': [0, 30, 50, 60, 75, 80],
        'v_tariff': [4.5, 5.0, 5.5, 6.0, 6.5],
        'v_season_days': [150, 180, 210, 240],
        'v_distance': [1, 1.5, 2, 3, 5],

        'h_length': [3, 4, 5, 6, 8, 10, 12],
        'h_width': [2, 3, 4, 5, 6, 8],
        'h_height': [2.5, 2.7, 3, 3.2, 3.5, 4],
        'h_wall_area': [20, 30, 40, 50, 60, 100, 150],
        'h_wall_thick': [0.25, 0.38, 0.51, 0.64],
        'h_insul_thick': [0, 0.05, 0.1, 0.15, 0.2],
        'h_win_area': [2, 4, 6, 8, 12],
        'h_roof_area': [20, 30, 50, 100],
        'h_roof_insul': [0, 0.1, 0.2, 0.3, 0.4],
        'h_floor_area': [20, 30, 50, 100],
        'h_t_supply': [70, 80, 90, 95],
        'h_t_return': [50, 60, 70],
        'h_pipe_velocity': [0.4, 0.5, 0.6, 0.7, 0.8, 1.0],
        'h_uf_area': [0, 10, 20, 30],

        'ac_area': [15, 20, 30, 50, 100, 200],
        'ac_height': [2.5, 3, 3.5, 4, 6],
        'ac_people': [0, 1, 2, 5, 10, 20, 50],
        'ac_window_area': [0, 2, 4, 6, 10, 20, 50],
        'ac_lux': [200, 300, 500],
        'ac_w_m2': [0.05, 0.07, 0.1],
        'ac_t_in': [16, 18, 20, 22, 24, 25],
        'ac_equipment': [0, 0.5, 1, 2, 5, 10, 20, 50],

        'g_boiler_power': [10, 14, 24, 32, 40, 50, 100],
        'g_length': [3, 4, 5, 6, 8, 10],
        'g_width': [2, 3, 4, 5, 6, 8],
        'g_room_height': [2.5, 2.7, 3, 3.2, 3.5],
        'g_chimney_height': [4, 5, 6, 8, 10],
        'g_window_area': [0.5, 1.0, 1.5, 2.0],
        'g_pipe_length': [5, 10, 15, 20, 30],
        'g_local_zeta': [1.0, 3.0, 5.0, 8.0, 10.0],

        'nv_height': [3.0, 3.3, 5.0, 7.5, 10.0, 15.0],
        'nv_area': [0.02, 0.04, 0.06, 0.1, 0.25],
        'nv_zeta': [1.5, 2.0, 2.5, 3.0, 4.0],
        'se_door_width': [0.8, 0.9, 1.0, 1.2],
        'se_door_height': [2.0, 2.1, 2.2],
        'se_num_doors': [1, 2, 3, 4],
        'pr_door_width': [0.9, 1.0, 1.2, 1.5],
        'pr_door_height': [2.0, 2.1, 2.2],
        'pr_num_floors': [1, 2, 3, 5, 9, 12, 16, 25],

        'ext_cond_t_air': [18, 20, 22, 24, 26],
        'ext_cond_hum': [40, 50, 60, 70, 80],
        'ext_cond_insul': [0, 10, 20, 30, 50]
    };

    const selects = {
        'v_system_type': ['supply', 'exhaust', 'both'],
        'v_room_type': ['living', 'office', 'kitchen', 'bathroom', 'corridor', 'stairwell', 'server_room', 'smoking', 'industrial_light', 'industrial_heavy', 'sport'],
        'v_duct_shape': ['round', 'rect', 'oval'],
        'v_duct_material': ['steel_galv', 'steel_black', 'plastic', 'aluminum_flex', 'concrete', 'brick'],

        'h_room_type': ['living', 'office', 'kitchen', 'bathroom', 'corridor', 'stairwell', 'server_room', 'smoking', 'industrial_light', 'industrial_heavy', 'sport'],
        'h_wall_mat': ['brick_hollow', 'brick_solid', 'aerated_d400', 'aerated_d600', 'wood'],
        'h_insul_mat': ['minwool', 'penoplex', 'none'],
        'h_win_type': ['double_chamber', 'single_chamber', 'triple_chamber'],
        'h_connection_type': ['side', 'diagonal', 'bottom'],
        'h_uf_spacing': ['100', '150', '200', '250', '300'],

        'ac_room_type': ['living', 'office', 'kitchen', 'corridor', 'server_room', 'smoking', 'industrial_light', 'industrial_heavy', 'sport'],
        'ac_win_type': ['double_chamber', 'single_chamber', 'triple_chamber'],

        'g_chamber': ['closed', 'open']
    };

    for (let id in examples) {
        const el = document.getElementById(id);
        if (el) {
            el.value = randomPick(examples[id]);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    for (let id in selects) {
        const el = document.getElementById(id);
        if (el) {
            el.value = randomPick(selects[id]);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    ['v_is_corner', 'h_is_corner', 'ac_is_corner', 'g_has_stove', 'g_has_heater'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.checked = Math.random() > 0.5;
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    const citySelects = ['v_city', 'h_city', 'g_city', 'ac_city', 'bim_city'];
    citySelects.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.options.length > 1) {
            const randomIndex = Math.floor(Math.random() * (el.options.length - 1)) + 1;
            el.selectedIndex = randomIndex;
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
}