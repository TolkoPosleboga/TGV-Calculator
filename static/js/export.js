async function downloadFile(category, format) {
    const reqData = lastData[category];
    const resData = lastResp[category];
    if (!reqData || !resData) { alert("Сначала выполните расчёт!"); return; }

    const reqLabels = {
        length: "Длина (м)", width: "Ширина (м)", height: "Высота (м)", people: "Количество людей", heat_gain_kw: "Теплоизбытки (кВт)",
        t_inside: "Температура внутри (°C)", t_outside: "Температура снаружи (°C)", room_type: "Тип помещения", duct_length: "Длина трассы (м)", duct_shape: "Форма воздуховода",
        wall_area: "Площадь стен (м²)", wall_mat: "Материал стен", wall_thick: "Толщина стен (м)", insul_mat: "Утеплитель", insul_thick: "Толщина утеплителя (м)",
        window_area: "Площадь окон (м²)", window_type: "Тип окон", roof_area: "Площадь крыши (м²)", roof_insul: "Утеплитель крыши (м)", floor_area: "Площадь пола (м²)",
        city_id: "Город", boiler_power_kw: "Мощность котла (кВт)", has_stove: "Газовая плита", has_water_heater: "Газовая колонка",
        room_volume: "Объем помещения (м³)", room_height: "Высота потолков (м)", combustion_chamber: "Камера сгорания", chimney_height: "Высота дымохода (м)",
        t_supply: "Подача (°C)", t_return: "Обратка (°C)", connection_type: "Схема подключения", pipe_length: "Длина трубы (м)", local_zeta: "Сумма местных сопр.",
        uf_area: "Площадь теплого пола (м²)", uf_spacing: "Шаг укладки (мм)", recup_efficiency: "КПД рекуператора (%)", electricity_tariff: "Тариф (руб/кВт*ч)", season_days: "Длит. сезона (дней)", pipe_velocity: "Скорость воды (м/с)"
    };

    let translatedReq = {};
    for (let k in reqData) {
        let val = reqData[k];
        if (typeof val === 'boolean') val = val ? 'Да' : 'Нет';
        if (k === 'duct_shape') val = val === 'round' ? 'Круглая' : 'Прямоугольная';
        if (k === 'room_type') val = val === 'office' ? 'Офис' : 'Производство';
        if (k === 'wall_mat') val = {brick_solid:'Кирпич полнотелый', brick_hollow:'Кирпич пустотелый', aerated_d400:'Газобетон D400', aerated_d600:'Газобетон D600', wood:'Брус'}[val] || val;
        if (k === 'insul_mat') val = {minwool:'Минвата', penoplex:'Пеноплекс', none:'Без утеплителя'}[val] || val;
        if (k === 'window_type') val = {single_chamber:'Однокамерный', double_chamber:'Двухкамерный', triple_chamber:'Трехкамерный'}[val] || val;
        if (k === 'combustion_chamber') val = val === 'open' ? 'Открытая' : 'Закрытая';
        if (k === 'connection_type') val = {side:'Боковое', diagonal:'Диагональное', bottom:'Нижнее'}[val] || val;
        translatedReq[reqLabels[k] || k] = val;
    }

    let cleanResData = {};
    let categoryName = "";

    if (category === 'vent') {
        categoryName = "Вентиляция";
        cleanResData = { "Расход воздуха (м³/ч)": resData.air_exchange.L_max_m3h, "Сечение": resData.duct.shape === 'round' ? resData.duct.diameter_mm + " мм" : resData.duct.width_mm + "×" + resData.duct.height_mm + " мм", "Скорость (м/с)": resData.duct.velocity_ms, "Потери (Па)": resData.pressure_loss.total_loss_pa, "Нагрев (кВт)": resData.equipment.heater_power_kw };
        if (resData.recuperation && resData.recuperation.q_saved_kw > 0) { cleanResData["Экономия энергии (кВт*ч)"] = resData.recuperation.energy_saved_kwh; cleanResData["Экономия денег (руб)"] = resData.recuperation.money_saved_rub; }
    } else if (category === 'heat') {
        categoryName = "Отопление";
        cleanResData = { "Потери стен (Вт)": resData.results.q_wall_w, "Потери окон (Вт)": resData.results.q_window_w, "Общие потери (Вт)": resData.results.total_with_infiltration_w, "Мощность котла (кВт)": resData.results.boiler_power_kw, "Поправка радиаторов": resData.radiator_correction.power_factor };
        if (resData.underfloor_results) { cleanResData["Труба теплого пола (м)"] = resData.underfloor_results.total_pipe_length; cleanResData["Кол-во контуров (шт)"] = resData.underfloor_results.num_loops; }
        if (resData.hydraulics) { cleanResData["Диаметр труб (Ду)"] = "Ду" + resData.hydraulics.selected_d_mm + " мм"; cleanResData["Объем бака (л)"] = resData.hydraulics.tank_volume_l; }
    } else if (category === 'gas') {
        categoryName = "Газоснабжение";
        cleanResData = { "Расход газа (м³/ч)": resData.results.v_total, "Счётчик": resData.results.meter, "Труба": resData.results.pipe, "Скорость газа (м/с)": resData.results.velocity, "Потери (Па)": resData.results.p_total };
    }

    try {
        const resp = await fetch(`/api/export/${format}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: categoryName, request_data: translatedReq, response_data: cleanResData })
        });
        if (!resp.ok) throw new Error((await resp.json()).detail || "Ошибка");
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `Отчет_${categoryName}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a); a.click(); a.remove();
        window.URL.revokeObjectURL(url);
    } catch (e) { alert("Ошибка: " + e.message); }
}