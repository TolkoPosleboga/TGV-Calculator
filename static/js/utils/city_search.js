let citiesData = [];
let enthalpyData = [];
let pressureData = [];
let humidityData = [];

async function loadCities() {
    try {
        // 1. Загружаем ГОРОДА (критически важный файл)
        const citiesResp = await fetch('/static/data/cities_climate.json');
        if (citiesResp.ok) {
            let rawCities = await citiesResp.json();
            citiesData = rawCities.filter((city, index, self) => index === self.findIndex((c) => c.name === city.name));
            citiesData.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            console.error("Файл cities_climate.json не найден!");
        }

        // 2. Загружаем остальные справочники (необязательные)
        try { const r = await fetch('/static/data/enthalpy_climate.json'); if(r.ok) enthalpyData = await r.json(); } catch(e){ console.warn("Нет энтальпии"); }
        try { const r = await fetch('/static/data/pressure_climate.json'); if(r.ok) pressureData = await r.json(); } catch(e){ console.warn("Нет давления"); }
        try { const r = await fetch('/static/data/humidity_climate.json'); if(r.ok) humidityData = await r.json(); } catch(e){ console.warn("Нет влажности"); }

        // 3. Заполняем выпадающий список
        populateGlobalCity();

        // 4. Восстанавливаем сохраненный город
        const savedData = JSON.parse(localStorage.getItem('calc_saved_data') || '{}');
        const globalCitySelect = document.getElementById('global_city');
        if (globalCitySelect) {
            const savedCity = savedData['global_city'] || savedData['v_city'];
            if (savedCity) {
                globalCitySelect.value = savedCity;
                onGlobalCityChange(savedCity, true); // true = не сохранять в localStorage (чтобы не было рекурсии)
            }
        }

    } catch (e) {
        console.error('Критическая ошибка загрузки справочников', e);
    }
}

function populateGlobalCity() {
    const select = document.getElementById('global_city');
    if (!select) return;

    select.innerHTML = '<option value="">Выберите город...</option>';

    if (!citiesData || !Array.isArray(citiesData) || citiesData.length === 0) {
        console.error("Список городов пуст!");
        return;
    }

    citiesData.forEach(city => {
        const option = document.createElement('option');
        option.value = city.name;
        option.textContent = `${city.name} (${city.region})`;
        select.appendChild(option);
    });
}

function onGlobalCityChange(cityName, isSilent = false) {
    if (!cityName) return;
    const city = citiesData.find(c => c.name === cityName);
    if (!city) return;

    const pressInfo = pressureData.find(p => p.name === cityName);
    const pressure = pressInfo ? pressInfo.pressure : 101325.0;
    const humInfo = humidityData.find(h => h.name === cityName);

    // 1. Вентиляция и Отопление
    ['v', 'h'].forEach(prefix => {
        const tField = document.getElementById(`${prefix}_t_out`);
        const gsopField = document.getElementById(`${prefix}_gsop`);
        if (tField) tField.value = city.temp_5d_092;
        if (gsopField) gsopField.value = city.gsop || 0;
    });

    // 2. Газ
    const gTField = document.getElementById('g_t_out');
    const gGsopField = document.getElementById('g_gsop');
    if (gTField) gTField.value = city.temp_5d_092;
    if (gGsopField) gGsopField.value = city.gsop || 0;

    // 3. Кондиционирование
    const acFields = {
        'ac_t_out_x': city.temp_5d_092,
        'ac_t_out_p': 10,
        'ac_t_out_t': city.temp_warm_095 || 24,
        'ac_hum_out_x': city.humidity || 77,
        'ac_hum_out_p': humInfo ? humInfo.humidity_transition : 70,
        'ac_hum_out_t': humInfo ? humInfo.humidity_warm : 55,
        'ac_t_sup_x': Math.max(city.temp_5d_092, 19 - 4),
        'ac_t_sup_p': Math.max(10, 19 - 5),
        'ac_t_sup_t': city.temp_warm_095 || 24,
        'ac_t_exh_x': 19,
        'ac_t_exh_p': 19,
        'ac_t_exh_t': (city.temp_warm_095 || 24) + 3
    };

    for (const [id, val] of Object.entries(acFields)) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }

    if (typeof recalculateEnthalpy === 'function') {
        recalculateEnthalpy('x'); recalculateEnthalpy('p'); recalculateEnthalpy('t');
    }

    // 4. BIM
    const bimT = document.getElementById('bim_t_out');
    const bimG = document.getElementById('bim_gsop');
    if (bimT) bimT.value = city.temp_5d_092;
    if (bimG) bimG.value = city.gsop || 0;

    // 5. Сохраняем
    if (!isSilent) {
        const savedData = JSON.parse(localStorage.getItem('calc_saved_data') || '{}');
        savedData['global_city'] = cityName;

        // Удаляем старые ключи, чтобы не было конфликтов
        delete savedData['v_city']; delete savedData['h_city'];
        delete savedData['g_city']; delete savedData['ac_city']; delete savedData['bim_city'];

        savedData['v_t_out'] = city.temp_5d_092;
        savedData['v_gsop'] = city.gsop || 0;
        savedData['h_t_out'] = city.temp_5d_092;
        savedData['h_gsop'] = city.gsop || 0;
        savedData['g_t_out'] = city.temp_5d_092;
        savedData['g_gsop'] = city.gsop || 0;

        localStorage.setItem('calc_saved_data', JSON.stringify(savedData));

        if (typeof saveActiveRoomData === 'function') {
            saveActiveRoomData();
            saveRoomsToStorage();
        }
    }
}

window.addEventListener('load', loadCities);