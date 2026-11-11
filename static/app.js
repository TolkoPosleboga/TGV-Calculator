let currentHeatData = null;
let lastData = { vent: null, heat: null, gas: null };
let lastResp = { vent: null, heat: null, gas: null };
let citiesData = [];

// ==========================================
// 0. СПРАВОЧНИК ГОРОДОВ И СИСТЕМА ВЬЮХОВ
// ==========================================
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(viewId + '-view');
    if (target) target.classList.add('active');

    // Если переходим в BIM, подгружаем проекты
    if (viewId === 'bim' && typeof loadProjects === 'function') {
        loadProjects();
    }
}

async function loadCities() {
    try {
        const resp = await fetch('/static/cities_climate.json');
        citiesData = await resp.json();

        initCitySearch('v_city_search', 'v_city_value', 'v_t_out');
        initCitySearch('h_city_search', 'h_city_value', 'h_t_out');
        initCitySearch('g_city_search', 'g_city_value', 'g_t_out');
        initCitySearch('bim_city_search', 'bim_city_value', 'bim_t_out');
    } catch (e) {
        console.error('Не удалось загрузить справочник городов', e);
    }
}

function initCitySearch(inputId, hiddenId, tempFieldId) {
    const input = document.getElementById(inputId);
    const hidden = document.getElementById(hiddenId);
    if (!input || !hidden) return;

    input.parentNode.style.position = 'relative';

    let dropdown = document.createElement('div');
    dropdown.className = 'city-dropdown';
    input.parentNode.appendChild(dropdown);

    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        dropdown.innerHTML = '';

        if (query.length === 0) {
            dropdown.style.display = 'none';
            hidden.value = '';
            return;
        }

        const filtered = citiesData.filter(c => c.name.toLowerCase().startsWith(query)).slice(0, 10);

        if (filtered.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        filtered.forEach(city => {
            const item = document.createElement('div');
            item.className = 'city-dropdown-item';
            item.textContent = `${city.name} (${city.temp}°C)`;
            item.onclick = () => {
                input.value = city.name;
                hidden.value = city.temp;

                if (tempFieldId) {
                    const tempField = document.getElementById(tempFieldId);
                    if (tempField) tempField.value = city.temp;
                }

                dropdown.style.display = 'none';
                syncCityAcrossTabs(city.name, city.temp, input);
            };
            dropdown.appendChild(item);
        });

        dropdown.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

function syncCityAcrossTabs(name, temp, sourceInput) {
    const syncToggle = document.getElementById('syncToggle');
    if (!syncToggle || !syncToggle.checked) return;

    const cityConfigs = [
        { search: 'v_city_search', hidden: 'v_city_value', temp: 'v_t_out' },
        { search: 'h_city_search', hidden: 'h_city_value', temp: 'h_t_out' },
        { search: 'g_city_search', hidden: 'g_city_value', temp: 'g_t_out' },
        { search: 'bim_city_search', hidden: 'bim_city_value', temp: 'bim_t_out' }
    ];

    cityConfigs.forEach(cfg => {
        const searchEl = document.getElementById(cfg.search);
        const hiddenEl = document.getElementById(cfg.hidden);
        const tempEl = document.getElementById(cfg.temp);

        if (searchEl && searchEl !== sourceInput) {
            searchEl.value = name;
            searchEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (hiddenEl && searchEl !== sourceInput) hiddenEl.value = temp;
        if (tempEl && searchEl !== sourceInput) tempEl.value = temp;
    });
}

// ==========================================
// 1. АВТОСОХРАНЕНИЕ И ШАРИНГ
// ==========================================
window.addEventListener('load', () => {
    loadCities();

    const savedData = localStorage.getItem('calc_saved_data');
    if (savedData) {
        const data = JSON.parse(savedData);
        for (let id in data) {
            const el = document.getElementById(id);
            if (el) el.value = data[id];
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');
    if (sharedData) {
        try {
            const data = JSON.parse(decodeURIComponent(atob(sharedData)));
            for (let id in data) {
                const el = document.getElementById(id);
                if (el) el.value = data[id];
            }
        } catch (e) { console.error("Ошибка парсинга ссылки"); }
    }
});

document.addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        if (e.target.readOnly) return;
        const savedData = JSON.parse(localStorage.getItem('calc_saved_data') || '{}');
        savedData[e.target.id] = e.target.value;
        localStorage.setItem('calc_saved_data', JSON.stringify(savedData));
    }
});

function clearAll() {
    if (confirm("Вы уверены, что хотите очистить все поля?")) {
        localStorage.removeItem('calc_saved_data');
        window.history.replaceState({}, document.title, window.location.pathname);

        document.querySelectorAll('input, select').forEach(el => {
            if (el.type === 'checkbox') el.checked = false;
            else if (el.tagName === 'SELECT') el.selectedIndex = 0;
            else if (!el.readOnly) el.value = '';
        });

        ['vent-results', 'heat-results', 'gas-results'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.style.display = 'none';
        });

        ['v-dashboard', 'h-dashboard', 'g-dashboard', 'v-catalog', 'h-catalog', 'g-alerts', 'g-city-info'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.innerHTML = '';
        });

        const gSafetyCard = document.getElementById('g-safety-card');
        if (gSafetyCard) gSafetyCard.style.display = 'none';

        ['v_city_value', 'h_city_value', 'g_city_value', 'bim_city_value'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }
}

function shareLink() {
    const savedData = localStorage.getItem('calc_saved_data') || '{}';
    const encoded = btoa(encodeURIComponent(savedData));
    const url = `${window.location.origin}/?data=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
        alert("Ссылка с вашими параметрами скопирована в буфер обмена!");
    });
}

// ==========================================
// 2. UI ЛОГИКА (ВКЛАДКИ)
// ==========================================
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    const content = document.getElementById('tab-' + tabId);
    const btn = document.getElementById('btn-' + tabId);

    if (content) content.classList.add('active');
    if (btn) btn.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    const syncToggle = document.getElementById('syncToggle');
    if (!syncToggle) return;

    ['sync-length', 'sync-width', 'sync-height', 'sync-city'].forEach(cls => {
        const els = document.querySelectorAll('.' + cls);
        els.forEach(el => {
            el.addEventListener('input', (e) => {
                if (!syncToggle.checked) return;
                els.forEach(other => { if (other !== e.target) other.value = e.target.value; });
            });
        });
    });
});

// ==========================================
// 3. СКАЧИВАНИЕ ФАЙЛОВ
// ==========================================
async function downloadFile(category, format) {
    const reqData = lastData[category];
    const resData = lastResp[category];

    if (!reqData || !resData) {
        alert("Сначала выполните расчёт!");
        return;
    }

    const reqLabels = {
        length: "Длина (м)", width: "Ширина (м)", height: "Высота (м)",
        people: "Количество людей", heat_gain_kw: "Теплоизбытки (кВт)",
        t_inside: "Температура внутри (°C)", t_outside: "Температура снаружи (°C)",
        room_type: "Тип помещения", duct_length: "Длина трассы (м)", duct_shape: "Форма воздуховода",
        wall_area: "Площадь стен (м²)", wall_mat: "Материал стен", wall_thick: "Толщина стен (м)",
        insul_mat: "Утеплитель", insul_thick: "Толщина утеплителя (м)",
        window_area: "Площадь окон (м²)", window_type: "Тип окон",
        roof_area: "Площадь крыши (м²)", roof_insul: "Утеплитель крыши (м)", floor_area: "Площадь пола (м²)",
        city_id: "Город", boiler_power_kw: "Мощность котла (кВт)",
        has_stove: "Газовая плита", has_water_heater: "Газовая колонка",
        room_volume: "Объем помещения (м³)", room_height: "Высота потолков (м)",
        combustion_chamber: "Камера сгорания", chimney_height: "Высота дымохода (м)",
        t_supply: "Подача (°C)", t_return: "Обратка (°C)", connection_type: "Схема подключения",
        pipe_length: "Длина трубы (м)", local_zeta: "Сумма местных сопр.",
        uf_area: "Площадь теплого пола (м²)", uf_spacing: "Шаг укладки (мм)",
        recup_efficiency: "КПД рекуператора (%)", electricity_tariff: "Тариф (руб/кВт*ч)", season_days: "Длит. сезона (дней)",
        pipe_velocity: "Скорость воды (м/с)"
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
        cleanResData = {
            "Расход воздуха (м³/ч)": resData.air_exchange.L_max_m3h,
            "Сечение": resData.duct.shape === 'round' ? resData.duct.diameter_mm + " мм" : resData.duct.width_mm + "×" + resData.duct.height_mm + " мм",
            "Скорость (м/с)": resData.duct.velocity_ms,
            "Потери (Па)": resData.pressure_loss.total_loss_pa,
            "Нагрев (кВт)": resData.equipment.heater_power_kw
        };
        if (resData.recuperation && resData.recuperation.q_saved_kw > 0) {
            cleanResData["Экономия энергии (кВт*ч)"] = resData.recuperation.energy_saved_kwh;
            cleanResData["Экономия денег (руб)"] = resData.recuperation.money_saved_rub;
        }
    } else if (category === 'heat') {
        categoryName = "Отопление";
        cleanResData = {
            "Потери стен (Вт)": resData.results.q_wall_w,
            "Потери окон (Вт)": resData.results.q_window_w,
            "Общие потери (Вт)": resData.results.total_with_infiltration_w,
            "Мощность котла (кВт)": resData.results.boiler_power_kw,
            "Поправка радиаторов": resData.radiator_correction.power_factor
        };
        if (resData.underfloor_results) {
            cleanResData["Труба теплого пола (м)"] = resData.underfloor_results.total_pipe_length;
            cleanResData["Кол-во контуров (шт)"] = resData.underfloor_results.num_loops;
        }
        if (resData.hydraulics) {
            cleanResData["Диаметр труб (Ду)"] = "Ду" + resData.hydraulics.selected_d_mm + " мм";
            cleanResData["Объем бака (л)"] = resData.hydraulics.tank_volume_l;
        }
    } else if (category === 'gas') {
        categoryName = "Газоснабжение";
        cleanResData = {
            "Расход газа (м³/ч)": resData.results.v_total,
            "Счётчик": resData.results.meter,
            "Труба": resData.results.pipe,
            "Скорость газа (м/с)": resData.results.velocity,
            "Потери (Па)": resData.results.p_total
        };
    }

    try {
        const resp = await fetch(`/api/export/${format}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

// ==========================================
// 4. РАСЧЕТ ВЕНТИЛЯЦИИ
// ==========================================
async function calcVent() {
    const resContainer = document.getElementById('vent-results');
    resContainer.style.display = 'block';
    document.getElementById('v-dashboard').innerHTML = '<p>Расчёт...</p>';

    const data = {
        length: parseFloat(document.getElementById('v_length')?.value) || 10,
        width: parseFloat(document.getElementById('v_width')?.value) || 6,
        height: parseFloat(document.getElementById('v_height')?.value) || 3,
        people: parseInt(document.getElementById('v_people')?.value) || 0,
        heat_gain_kw: parseFloat(document.getElementById('v_heat')?.value) || 0,
        t_inside: parseFloat(document.getElementById('v_t_in')?.value) || 22,
        t_outside: parseFloat(document.getElementById('v_t_out')?.value) || -32,
        room_type: document.getElementById('v_room_type')?.value || 'office',
        duct_length: parseFloat(document.getElementById('v_duct_len')?.value) || 20,
        duct_shape: document.getElementById('v_duct_shape')?.value || 'round',
        recup_efficiency: parseFloat(document.getElementById('v_recup_eff')?.value) || 0,
        electricity_tariff: parseFloat(document.getElementById('v_tariff')?.value) || 5.5,
        season_days: parseInt(document.getElementById('v_season_days')?.value) || 210
    };
    lastData.vent = data;

    try {
        const resp = await fetch('/api/ventilation/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!resp.ok) throw new Error('Ошибка сервера');
        const r = await resp.json(); lastResp.vent = r;

        let dt_heat = r.air_exchange.delta_t_heat || 5.0;

        let recupHtml = '';
        if (r.recuperation && r.recuperation.q_saved_kw > 0) {
            recupHtml = `
                <div class="result-box" style="background: #f0fdf4; border-color: #22c55e;">
                    <h4 style="color: #166534;">Экономия на отоплении</h4>
                    <div class="value" style="color: #166534;">${r.recuperation.money_saved_rub.toLocaleString('ru-RU')} <span class="unit">руб/сезон</span></div>
                </div>
            `;
        }

        document.getElementById('v-dashboard').innerHTML = `
            <div class="result-box"><h4>Расход воздуха</h4><div class="value">${r.air_exchange.L_max_m3h} <span class="unit">м³/ч</span></div></div>
            <div class="result-box"><h4>Сечение</h4><div class="value">${r.duct.shape === 'round' ? r.duct.diameter_mm : r.duct.width_mm+'×'+r.duct.height_mm} <span class="unit">мм</span></div></div>
            <div class="result-box"><h4>Потери</h4><div class="value">${r.pressure_loss.total_loss_pa} <span class="unit">Па</span></div></div>
            <div class="result-box"><h4>Нагрев</h4><div class="value">${r.equipment.heater_power_kw} <span class="unit">кВт</span></div></div>
            ${recupHtml}
        `;

        let recupMethodology = '';
        if (r.recuperation && r.recuperation.q_saved_kw > 0) {
            let frostWarn = r.recuperation.frost_warning ? `<div class="warn-box" style="margin-top:10px;">⚠️ ${r.recuperation.frost_warning}</div>` : '';
            recupMethodology = `
                <div class="formula-block" style="background: #f0fdf4; border-left-color: #22c55e;">
                    <b>7. Рекуперация:</b> Q_экон = L × ρ × c × Δt_нар × КПД / 3600 = ${r.air_exchange.L_max_m3h} × 1.2 × 1.005 × ${r.air_exchange.delta_t} × ${(data.recup_efficiency/100).toFixed(2)} / 3600 = <b>${r.recuperation.q_saved_kw} кВт</b><br>
                    Энергия за сезон = ${r.recuperation.q_saved_kw} кВт × ${data.season_days} дней × 24 ч = <b>${r.recuperation.energy_saved_kwh} кВт*ч</b><br>
                    Экономия денег = ${r.recuperation.energy_saved_kwh} кВт*ч × ${data.electricity_tariff} руб = <b>${r.recuperation.money_saved_rub} руб.</b>
                    ${frostWarn}
                </div>
            `;
        }

        document.getElementById('v-methodology').innerHTML = `
            <div class="formula-block"><b>1. Расход по людям:</b> L_люди = N × L_норм = ${data.people} × ${(r.air_exchange.L_people_m3h / (data.people || 1)).toFixed(1)} = <b>${r.air_exchange.L_people_m3h} м³/ч</b><span class="norm-ref">СП 60.13330.2020, табл. В.1</span></div>
            <div class="formula-block"><b>2. Расход по кратности:</b> L_крат = V × n = ${r.air_exchange.volume_m3} × ${(r.air_exchange.L_rate_m3h / (r.air_exchange.volume_m3 || 1)).toFixed(1)} = <b>${r.air_exchange.L_rate_m3h} м³/ч</b><span class="norm-ref">СП 60.13330.2020, прил. В</span></div>

            <div class="formula-block">
                <b>3. Расход по теплоизбыткам:</b> L_тепло = 3600 × Q / (ρ × c × Δt_ассим) = 3600 × ${data.heat_gain_kw} / (1.2 × 1.005 × ${dt_heat}) = <b>${r.air_exchange.L_heat_m3h} м³/ч</b>
                <span class="norm-ref">Δt_ассим = ${dt_heat}°C (градиент между удаляемым и приточным воздухом)</span>
            </div>

            <div class="formula-block" style="background: #eff6ff; border-left-color: #2563eb;"><b>4. Итоговый расход:</b> L_итог = max(L_люди, L_крат, L_тепло) = <b>${r.air_exchange.L_max_m3h} м³/ч</b></div>
            <div class="formula-block"><b>5. Диаметр:</b> D = √(4 × L / (3600 × π × v)) → принят <b>${r.duct.shape === 'round' ? r.duct.diameter_mm + ' мм' : r.duct.width_mm + '×' + r.duct.height_mm + ' мм'}</b><span class="norm-ref">СП 60.13330.2020 (v=5 м/с)</span></div>
            <div class="formula-block"><b>6. Потери:</b> ΔP = ΔP_трение (${r.pressure_loss.friction_loss_pa}) + ΔP_мест (${r.pressure_loss.local_loss_pa}) + ΔP_оборудования (230 Па) = <b>${r.pressure_loss.total_loss_pa} Па</b></div>
            ${recupMethodology}
        `;

        document.getElementById('v-report').textContent = r.report;
        const cat = document.getElementById('v-catalog');
        cat.innerHTML = '';
        const grouped = {};
        r.solutions.forEach(s => { if(!grouped[s.category]) grouped[s.category]=[]; grouped[s.category].push(s); });

        const names = { unit: "Приточные установки", fan: "Вентиляторы", duct: "Воздуховоды", heater: "Калориферы", filter: "Фильтры", recuperator: "Рекуператоры" };

        if (!grouped['unit'] && !grouped['fan']) {
            cat.innerHTML += `<div class="warn-box">⚠️ В каталоге не найдено вентиляторов или установок с расходом более ${r.equipment.fan_flow_m3h} м³/ч. Требуется подбор промышленного оборудования.</div>`;
        }
        if (!grouped['heater'] && r.equipment.heater_power_kw > 0) {
            cat.innerHTML += `<div class="warn-box">⚠️ В каталоге не найдено калориферов мощностью более ${r.equipment.heater_power_kw} кВт.</div>`;
        }

        ["unit", "fan", "duct", "heater", "filter", "recuperator"].forEach(c => {
            if (!grouped[c]) return;
            grouped[c].sort((a, b) => a.price_rub - b.price_rub);
            const min = grouped[c][0].price_rub;
            cat.innerHTML += `<div class="category-header"><h3>${names[c]}</h3></div><div class="solutions-grid" id="grid-${c}"></div>`;
            const grid = document.getElementById(`grid-${c}`);
            grouped[c].forEach(s => {
                const best = s.price_rub === min;
                grid.innerHTML += `
                    <div class="sol-card ${best ? 'best-choice' : ''}">
                        ${best ? '<div class="best-badge">Выгодный выбор</div>' : ''}
                        <div class="sol-title">${s.model}</div>
                        <div class="sol-brand">${s.brand}</div>
                        <div class="sol-specs">
                            ${s.category !== 'duct' ? `<span class="sol-spec">${s.max_flow.toLocaleString('ru-RU')} м³/ч</span>` : ''}
                            ${s.heater_power > 0 ? `<span class="sol-spec">${s.heater_power} кВт</span>` : ''}
                        </div>
                        <div class="sol-price">${s.price_rub.toLocaleString('ru-RU')} ₽</div>
                        <a href="${s.url}" target="_blank" class="sol-link">Найти на сайте</a>
                    </div>
                `;
            });
        });
    } catch (e) { alert(e.message); }
}

// ==========================================
// 5. РАСЧЕТ ОТОПЛЕНИЯ
// ==========================================
async function calcHeat() {
    const resContainer = document.getElementById('heat-results');
    resContainer.style.display = 'block';
    document.getElementById('h-dashboard').innerHTML = '<p>Расчёт...</p>';

    let velRaw = document.getElementById('h_pipe_velocity')?.value || '0.6';
    let velocity = parseFloat(velRaw.replace(',', '.'));
    if (isNaN(velocity) || velocity <= 0) velocity = 0.6;

    const data = {
        t_outside: parseFloat(document.getElementById('h_t_out')?.value) || -32,
        t_inside: parseFloat(document.getElementById('h_t_in')?.value) || 22,
        wall_area: parseFloat(document.getElementById('h_wall_area')?.value) || 0,
        wall_mat: document.getElementById('h_wall_mat')?.value || 'brick_hollow',
        wall_thick: parseFloat(document.getElementById('h_wall_thick')?.value) || 0.38,
        insul_mat: document.getElementById('h_insul_mat')?.value || 'minwool',
        insul_thick: parseFloat(document.getElementById('h_insul_thick')?.value) || 0.1,
        window_area: parseFloat(document.getElementById('h_win_area')?.value) || 0,
        window_type: document.getElementById('h_win_type')?.value || 'double_chamber',
        roof_area: parseFloat(document.getElementById('h_roof_area')?.value) || 0,
        roof_insul: parseFloat(document.getElementById('h_roof_insul')?.value) || 0.2,
        floor_area: parseFloat(document.getElementById('h_floor_area')?.value) || 0,
        t_supply: parseFloat(document.getElementById('h_t_supply')?.value) || 90,
        t_return: parseFloat(document.getElementById('h_t_return')?.value) || 70,
        connection_type: document.getElementById('h_connection_type')?.value || 'side',
        uf_area: parseFloat(document.getElementById('h_uf_area')?.value) || 0,
        uf_spacing: parseFloat(document.getElementById('h_uf_spacing')?.value) || 150,
        pipe_velocity: velocity
    };
    lastData.heat = data;

    try {
        const resp = await fetch('/api/heating/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

        if (!resp.ok) {
            const errData = await resp.json();
            throw new Error(errData.detail || 'Ошибка сервера');
        }

        const r = await resp.json(); currentHeatData = r; lastResp.heat = r;

        const res = r.results;
        const corr = r.radiator_correction;
        const uf = r.underfloor_results;
        const hydr = r.hydraulics;

        let ufHtml = '';
        if (uf) {
            ufHtml = `
                <div class="result-box" style="background: #eff6ff; border-color: #bfdbfe;"><h4>Труба теплого пола</h4><div class="value">${uf.total_pipe_length} <span class="unit">м</span></div></div>
                <div class="result-box" style="background: #eff6ff; border-color: #bfdbfe;"><h4>Контуров (петель)</h4><div class="value">${uf.num_loops} <span class="unit">шт</span></div></div>
            `;
        }

        document.getElementById('h-dashboard').innerHTML = `
            <div class="result-box"><h4>Теплопотери стен</h4><div class="value">${res.q_wall_w.toLocaleString('ru-RU')} <span class="unit">Вт</span></div></div>
            <div class="result-box"><h4>Общие с инфильтрацией</h4><div class="value">${res.total_with_infiltration_w.toLocaleString('ru-RU')} <span class="unit">Вт</span></div></div>
            <div class="result-box" style="background: var(--success-bg); border-color: var(--success-border);">
                <h4 style="color: var(--success);">Мощность котла</h4>
                <div class="value" style="color: var(--success);">${res.boiler_power_kw} <span class="unit">кВт</span></div>
            </div>
            <div class="result-box" style="background: #fdf4ff; border-color: #f0abfc;">
                <h4 style="color: #86198f;">Гидравлика (Труба)</h4>
                <div class="value" style="color: #86198f;">Ду${hydr.selected_d_mm} <span class="unit">мм</span></div>
            </div>
            <div class="result-box" style="background: #fdf4ff; border-color: #f0abfc;">
                <h4 style="color: #86198f;">Бак расширительный</h4>
                <div class="value" style="color: #86198f;">${hydr.tank_volume_l} <span class="unit">л</span></div>
            </div>
            ${ufHtml}
        `;

        let hydrMethodology = `
            <div class="formula-block" style="background: #fdf4ff; border-left-color: #d946ef;">
                <b>10. Гидравлика отопления:</b><br>
                Расход: G = Q / (c × Δt) = ${res.total_with_infiltration_w} / (4180 × ${data.t_supply - data.t_return}) = <b>${hydr.flow_m3h} м³/ч</b><br>
                Диаметр трубы: D = √(4 × F / π) при скорости ${data.pipe_velocity} м/с → принят <b>Ду${hydr.selected_d_mm} мм</b><br>
                Объем расширительного бака: <b>${hydr.tank_volume_l} л</b>
                <span class="norm-ref">СП 60.13330.2020, СП 41-102-98</span>
            </div>
        `;

        let ufMethodology = '';
        if (uf) {
            ufMethodology = `
                <div class="formula-block" style="background: #f0fdf4; border-left-color: #22c55e;">
                    <b>11. Тёплый пол:</b> Длина трубы = <b>${uf.total_pipe_length} м</b>, Контуров = <b>${uf.num_loops} шт</b>.
                </div>
            `;
        }

        document.getElementById('h-methodology').innerHTML = `
            <div class="formula-block"><b>1. Сопротивление стены:</b> R = <b>${res.r_wall} (м²·°С)/Вт</b></div>
            <div class="formula-block"><b>2. Теплопотери стен:</b> Q_стен = <b>${res.q_wall_w} Вт</b></div>
            <div class="formula-block"><b>3. Теплопотери окон:</b> Q_окон = <b>${res.q_window_w} Вт</b></div>
            <div class="formula-block" style="background: #eff6ff; border-left-color: #2563eb;">
                <b>4. Суммарные потери:</b> Q_сум = <b>${res.total_loss_w} Вт</b><br>
                <b>5. Мощность котла (+15%):</b> Q_котла = <b>${res.boiler_power_kw} кВт</b>
            </div>
            <div class="formula-block" style="background: #fffbeb; border-left-color: #f59e0b;">
                <b>6. Поправка на радиаторы:</b> Δt = ${corr.dt_actual} °C. Коэф. = <b>${corr.power_factor.toFixed(2)}</b>.
            </div>
            ${hydrMethodology}
            ${ufMethodology}
        `;

        document.getElementById('h-report').textContent = r.report;
        renderHeatCatalog();
    } catch (e) { alert(e.message); }
}

function renderHeatCatalog() {
    if (!currentHeatData) return;
    const catalog = document.getElementById('h-catalog');
    const sortEl = document.getElementById('h_sort');
    const sortType = sortEl ? sortEl.value : 'price_asc';

    let items = [...currentHeatData.solutions];
    if (sortType === 'price_asc') items.sort((a, b) => a.price_rub - b.price_rub);
    else if (sortType === 'price_desc') items.sort((a, b) => b.price_rub - a.price_rub);
    else if (sortType === 'brand') items.sort((a, b) => a.brand.localeCompare(b.brand));

    const grouped = { boiler: [], radiator: [], pump: [] };
    items.forEach(s => { if (grouped[s.category]) grouped[s.category].push(s); });

    const names = { boiler: "Газовые котлы", radiator: "Радиаторы отопления", pump: "Циркуляционные насосы" };

    catalog.innerHTML = '';

    if (!grouped['boiler'] && !grouped['radiator'] && !grouped['pump']) {
         catalog.innerHTML += `<div class="warn-box">⚠️ Оборудование для заданных параметров не найдено в каталоге.</div>`;
    }

    ['boiler', 'radiator', 'pump'].forEach(cat => {
        if (!grouped[cat] || grouped[cat].length === 0) return;
        const minPrice = Math.min(...grouped[cat].map(i => i.price_rub));
        catalog.innerHTML += `<div class="category-header"><h3>${names[cat]}</h3></div><div class="solutions-grid" id="grid-heat-${cat}"></div>`;
        const grid = document.getElementById(`grid-heat-${cat}`);
        grouped[cat].forEach(s => {
            const isBest = s.price_rub === minPrice;
            let specText = s.category === 'pump' ? `Расход: до 3.5 м³/ч` : `Мощность: ${s.power_kw} кВт`;
            if (s.category === 'radiator') specText = `Мощность: ${s.power_kw} кВт (паспорт) / ${(s.power_kw * currentHeatData.radiator_correction.power_factor).toFixed(1)} кВт (реал)`;

            grid.innerHTML += `
                <div class="sol-card ${isBest ? 'best-choice' : ''}">
                    ${isBest ? '<div class="best-badge">Выгодный выбор</div>' : ''}
                    <div class="sol-title">${s.model}</div>
                    <div class="sol-brand">${s.brand} | ${s.type}</div>
                    <div class="sol-specs"><span class="sol-spec">${specText}</span></div>
                    <div class="sol-price">${s.price_rub.toLocaleString('ru-RU')} ₽</div>
                    <a href="${s.url}" target="_blank" class="sol-link">Найти на сайте</a>
                </div>
            `;
        });
    });
}

// ==========================================
// 6. РАСЧЕТ ГАЗА
// ==========================================
async function calcGas() {
    const resContainer = document.getElementById('gas-results');
    resContainer.style.display = 'block';
    document.getElementById('g-dashboard').innerHTML = '<p>Расчёт...</p>';

    const volume = parseFloat(document.getElementById('g_room_volume')?.value) || 60;
    const height = parseFloat(document.getElementById('g_room_height')?.value) || 3;

    const data = {
        city_id: document.getElementById('g_city_search')?.value || 'Москва',
        boiler_power_kw: parseFloat(document.getElementById('g_boiler_power')?.value) || 24,
        has_stove: document.getElementById('g_has_stove')?.checked || false,
        has_water_heater: document.getElementById('g_has_heater')?.checked || false,
        room_volume: volume,
        room_height: height,
        combustion_chamber: document.getElementById('g_chamber')?.value || 'closed',
        chimney_height: parseFloat(document.getElementById('g_chimney_height')?.value) || 6,
        pipe_length: parseFloat(document.getElementById('g_pipe_length')?.value) || 15,
        local_zeta: parseFloat(document.getElementById('g_local_zeta')?.value) || 5.0,
        window_area: parseFloat(document.getElementById('g_window_area')?.value) || 1.5
    };
    lastData.gas = data;

    try {
        const resp = await fetch('/api/gas/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!resp.ok) throw new Error('Ошибка сервера');
        const r = await resp.json(); lastResp.gas = r;

        const res = r.results; const city = r.city_info;

        const alerts = document.getElementById('g-alerts'); alerts.innerHTML = '';
        if (res.chimney_warning) alerts.innerHTML += `<div class="warn-box">⚠️ <b>Дымоход:</b> ${res.chimney_warning}</div>`;
        if (res.velocity_warning) alerts.innerHTML += `<div class="warn-box">⚠️ <b>Гидравлика:</b> ${res.velocity_warning}</div>`;

        if (res.boiler_room_warnings.length > 0) {
            alerts.innerHTML += `<div class="warn-box">⚠️ <b>Котельная:</b><br>${res.boiler_room_warnings.join('<br>')}</div>`;
        }

        document.getElementById('g-city-info').innerHTML = `
            <p><b>Оператор:</b> ${city.gas_operator}</p><p><b>Телефон:</b> ${city.gas_phone} | <b>Email:</b> ${city.gas_email}</p>
            <p><b>Сайт:</b> <a href="${city.gas_site}" target="_blank">${city.gas_site}</a></p>
            <p><b>Стоимость подключения:</b> <span style="color:var(--success); font-weight:bold;">${city.connection_cost}</span></p>
            <p style="font-size: 13px; color: var(--muted); margin-top: 10px;">${city.note}</p>
        `;

        document.getElementById('g-dashboard').innerHTML = `
            <div class="result-box"><h4>Расход газа</h4><div class="value">${res.v_total} <span class="unit">м³/ч</span></div></div>
            <div class="result-box best"><h4>Счётчик</h4><div class="value">${res.meter}</div></div>
            <div class="result-box"><h4>Диаметр трубы</h4><div class="value">${res.pipe}</div></div>
            <div class="result-box"><h4>Скорость газа</h4><div class="value">${res.velocity} <span class="unit">м/с</span></div></div>
            <div class="result-box"><h4>Потери давления</h4><div class="value">${res.p_total} <span class="unit">Па</span></div></div>
            <div class="result-box"><h4>Дымоход</h4><div class="value">${res.d_chimney_mm > 0 ? res.d_chimney_mm : 'Коаксиальный'} <span class="unit">${res.d_chimney_mm > 0 ? 'мм' : ''}</span></div></div>
        `;

        const safetyCard = document.getElementById('g-safety-card');
        const safetyGrid = document.getElementById('g-safety-grid');
        if (res.safety_items && res.safety_items.length > 0) {
            safetyCard.style.display = 'block';
            safetyGrid.innerHTML = res.safety_items.map(s => `
                <div class="sol-card">
                    <div class="sol-title">${s.model}</div>
                    <div class="sol-brand">${s.brand} | ${s.type}</div>
                    <div class="sol-price">${s.price_rub.toLocaleString('ru-RU')} ₽</div>
                    <a href="${s.url}" target="_blank" class="sol-link">Купить</a>
                </div>
            `).join('');
        } else {
            safetyCard.style.display = 'none';
        }

        document.getElementById('g-methodology').innerHTML = `
            <div class="formula-block"><b>1. Расход газа на котёл:</b> V_котла = Q_котла / (Q_тепл.сгор × η) = ${data.boiler_power_kw} / (9.45 × 0.92) = <b>${res.v_boiler} м³/ч</b><span class="norm-ref">СП 62.13330.2011</span></div>
            <div class="formula-block"><b>2. Общий расход:</b> V_итог = <b>${res.v_total} м³/ч</b></div>
            <div class="formula-block"><b>3. Подбор счётчика:</b> Требуемый расход ${res.v_total} м³/ч → принят <b>${res.meter}</b></div>
            <div class="formula-block"><b>4. Гидравлика (Диаметр):</b> По скорости 2 м/с → принят <b>${res.pipe}</b></div>
            <div class="formula-block" style="background: #eff6ff; border-left-color: #2563eb;">
                <b>5. Гидравлика (Скорость):</b> v = V / (3600 × F) = <b>${res.velocity} м/с</b><br>
                <b>6. Потери на трение:</b> ΔP_тр = λ × (L/d) × (ρv²/2) = <b>${res.p_friction} Па</b><br>
                <b>7. Местные потери:</b> ΔP_мест = Σζ × (ρv²/2) = <b>${res.p_local} Па</b><br>
                <b>8. ИТОГО потери давления:</b> ΔP = <b>${res.p_total} Па</b>
            </div>
            <div class="formula-block" style="background: #fef2f2; border-left-color: #dc2626;">
                <b>9. Требования к котельной:</b> Объём ${volume} м³ (норма > 15 м³). Остекление: 0.03 м² на 1 м³ = ${(volume * 0.03).toFixed(2)} м² (по факту ${data.window_area} м²).
                <span class="norm-ref">СП 62.13330.2011, п. 6.1.18</span>
            </div>
        `;

        document.getElementById('g-report').textContent = `
============================================================
ОТЧЁТ ПО ГАЗОСНАБЖЕНИЮ
============================================================
Город: ${city.name}
Оператор: ${city.gas_operator}
Телефон: ${city.gas_phone}

РАСХОД ГАЗА:
Котёл: ${res.v_boiler} м³/ч
Общий расход (с плитой/колонкой): ${res.v_total} м³/ч

ГИДРАВЛИКА:
Труба: ${res.pipe}
Скорость газа: ${res.velocity} м/с
Потери давления: ${res.p_total} Па

ВЕНТИЛЯЦИЯ И ДЫМОХОД:
Тип камеры: ${data.combustion_chamber === 'open' ? 'Открытая' : 'Закрытая'}
Диаметр дымохода: ${res.d_chimney_mm > 0 ? res.d_chimney_mm + ' мм' : 'Коаксиальный'}
Вытяжка: ${res.v_exhaust} м³/ч
Приток: ${res.v_supply} м³/ч
        `.trim();

        resContainer.scrollIntoView({ behavior: 'smooth' });
    } catch (e) { alert(e.message); }
}