let citiesData = [];

async function loadCities() {
    try {
        const resp = await fetch('/static/cities_climate.json');
        citiesData = await resp.json();

        populateSelect('v_city');
        populateSelect('h_city');
        populateSelect('g_city');
        populateSelect('bim_city');

        setupCitySelect('v_city', 'v_t_out', 'v_gsop');
        setupCitySelect('h_city', 'h_t_out', 'h_gsop');
        setupCitySelect('g_city', 'g_t_out', 'g_gsop');
        setupCitySelect('bim_city', 'bim_t_out', 'bim_gsop');

        const saved = JSON.parse(localStorage.getItem('calc_saved_data') || '{}');
        ['v_city', 'h_city', 'g_city', 'bim_city'].forEach(id => {
            if (saved[id]) {
                const el = document.getElementById(id);
                if (el) {
                    el.value = saved[id];
                    // Принудительно вызываем обновление температуры и ГСОП
                    const changeEvent = new Event('change');
                    el.dispatchEvent(changeEvent);
                }
            }
        });

    } catch (e) {
        console.error('Не удалось загрузить справочник городов', e);
    }
}

function populateSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Выберите город...</option>';

    citiesData.forEach(city => {
        const option = document.createElement('option');
        option.value = city.name;
        option.textContent = `${city.name} (${city.region}) — ${city.temp_5d_092}°C`;
        option.dataset.temp = city.temp_5d_092;
        option.dataset.gsop = city.gsop || 0;
        select.appendChild(option);
    });
}

function setupCitySelect(selectId, tempFieldId, gsopFieldId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.addEventListener('change', (e) => {
        const selectedOption = select.options[select.selectedIndex];
        const temp = selectedOption ? selectedOption.dataset.temp || '' : '';
        const gsop = selectedOption ? selectedOption.dataset.gsop || '' : '';

        const tempField = document.getElementById(tempFieldId);
        if (tempField) tempField.value = temp;

        const gsopField = document.getElementById(gsopFieldId);
        if (gsopField) gsopField.value = gsop;

        const saved = JSON.parse(localStorage.getItem('calc_saved_data') || '{}');
        saved[selectId] = select.value;
        if (tempFieldId) saved[tempFieldId] = temp;
        if (gsopFieldId) saved[gsopFieldId] = gsop;
        localStorage.setItem('calc_saved_data', JSON.stringify(saved));

        syncOtherCities(selectId, select.value, temp, gsop);
    });
}

function syncOtherCities(sourceSelectId, cityName, temp, gsop) {
    const syncToggle = document.getElementById('syncToggle');
    if (!syncToggle || !syncToggle.checked) return;

    const configs = [
        { selectId: 'v_city', tempId: 'v_t_out', gsopId: 'v_gsop' },
        { selectId: 'h_city', tempId: 'h_t_out', gsopId: 'h_gsop' },
        { selectId: 'g_city', tempId: 'g_t_out', gsopId: 'g_gsop' },
        { selectId: 'bim_city', tempId: 'bim_t_out', gsopId: 'bim_gsop' }
    ];

    const saved = JSON.parse(localStorage.getItem('calc_saved_data') || '{}');

    configs.forEach(cfg => {
        if (cfg.selectId !== sourceSelectId) {
            const sel = document.getElementById(cfg.selectId);
            if (sel) {
                sel.value = cityName;
                saved[cfg.selectId] = cityName;
            }
            const tmp = document.getElementById(cfg.tempId);
            if (tmp) {
                tmp.value = temp;
                saved[cfg.tempId] = temp;
            }
            const gs = document.getElementById(cfg.gsopId);
            if (gs) {
                gs.value = gsop;
                saved[cfg.gsopId] = gsop;
            }
        }
    });
    localStorage.setItem('calc_saved_data', JSON.stringify(saved));
}

window.addEventListener('load', loadCities);