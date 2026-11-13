let sectionCounter = 0;

function collectSectionsData() {
    const sectionBoxes = document.querySelectorAll('.vent-section-box');
    const sections = [];
    sectionBoxes.forEach(box => {
        const name = box.querySelector('.sec-name').value || 'Участок';
        const length = parseFloat(box.querySelector('.sec-length').value) || 0;
        const shape = box.querySelector('.sec-shape').value || 'round';
        const material = box.querySelector('.sec-material').value || 'steel_galv';
        const resRows = box.querySelectorAll('.resistance-row');
        const resistances = [];
        resRows.forEach(r => {
            const type = r.querySelector('.res-type').value;
            const qty = parseInt(r.querySelector('.res-qty').value) || 1;
            const zeta = parseFloat(r.querySelector('.res-zeta').value) || 0;
            resistances.push({ type, qty, zeta });
        });
        sections.push({ name, length, shape, material, resistances });
    });
    return sections;
}

function saveVentSections() {
    const sections = collectSectionsData();
    const savedData = JSON.parse(localStorage.getItem('calc_saved_data') || '{}');
    savedData['vent_sections'] = sections;
    localStorage.setItem('calc_saved_data', JSON.stringify(savedData));
}

function restoreVentSections() {
    const savedData = JSON.parse(localStorage.getItem('calc_saved_data') || '{}');
    const sections = savedData['vent_sections'];
    const container = document.getElementById('vent-sections-container');

    if (!container) return;
    container.innerHTML = '';

    if (sections && sections.length > 0) {
        sections.forEach(sec => {
            addVentSection(sec.name, sec.length, sec.shape, sec.material, sec.resistances);
        });
    } else {
        addVentSection();
    }
}

function addVentSection(name = "", length = 10, shape = "round", material = "steel_galv", resistances = null) {
    sectionCounter++;
    const container = document.getElementById('vent-sections-container');
    const div = document.createElement('div');
    div.className = 'vent-section-box';
    div.id = `section-${sectionCounter}`;

    const secName = name || "Участок";

    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="margin: 0; color: #0f172a;">${secName}</h4>
            <button class="btn" style="width: auto; padding: 5px 10px; background: #ef4444; margin: 0; font-size: 12px;" onclick="this.closest('.vent-section-box').remove(); saveVentSections(); if(typeof debouncedCalcVent === 'function') debouncedCalcVent();">Удалить участок</button>
        </div>
        <div class="form-grid" style="margin-bottom: 15px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
            <div class="form-group">
                <label>Название участка</label>
                <input type="text" class="sec-name" value="${secName}" oninput="this.closest('.vent-section-box').querySelector('h4').textContent = this.value || 'Участок'; saveVentSections();">
            </div>
            <div class="form-group">
                <label>Длина участка (м)</label>
                <input type="number" step="0.1" class="sec-length" value="${length}" oninput="saveVentSections()">
            </div>
            <div class="form-group">
                <label>Форма сечения</label>
                <select class="sec-shape" onchange="saveVentSections()">
                    <option value="round" ${shape === 'round' ? 'selected' : ''}>Круглая</option>
                    <option value="rect" ${shape === 'rect' ? 'selected' : ''}>Прямоугольная</option>
                    <option value="oval" ${shape === 'oval' ? 'selected' : ''}>Овальная</option>
                </select>
            </div>
            <div class="form-group">
                <label>Материал</label>
                <select class="sec-material" onchange="saveVentSections()">
                    <option value="steel_galv" ${material === 'steel_galv' ? 'selected' : ''}>Оцинковка</option>
                    <option value="steel_black" ${material === 'steel_black' ? 'selected' : ''}>Черная сталь</option>
                    <option value="plastic" ${material === 'plastic' ? 'selected' : ''}>Пластик</option>
                    <option value="aluminum_flex" ${material === 'aluminum_flex' ? 'selected' : ''}>Гибкий алюминий</option>
                    <option value="concrete" ${material === 'concrete' ? 'selected' : ''}>Бетон</option>
                    <option value="brick" ${material === 'brick' ? 'selected' : ''}>Кирпич</option>
                </select>
            </div>
        </div>

        <div style="background: #f8fafc; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-weight: 600; font-size: 12px; color: #475569; text-transform: uppercase;">Местные сопротивления (КМС)</span>
                <button class="btn" style="width: auto; padding: 5px 10px; background: var(--primary); margin: 0; font-size: 12px;" onclick="addResistanceRow('${div.id}'); saveVentSections();">+ Добавить элемент</button>
            </div>
            <div class="resistances-container" id="res-container-${sectionCounter}"></div>
        </div>
    `;
    container.appendChild(div);

    if (resistances && resistances.length > 0) {
        resistances.forEach(res => {
            addResistanceRow(div.id, res.type, res.qty, res.zeta);
        });
    } else {
        addResistanceRow(div.id);
    }
}

function addResistanceRow(sectionId, type = "bend_90_round", qty = 1, zeta = null) {
    const sectionNum = sectionId.split('-')[1];
    const container = document.getElementById(`res-container-${sectionNum}`);

    let optionsHtml = '';
    for (let key in ZETA_LIBRARY) {
        const selected = (key === type) ? 'selected' : '';
        optionsHtml += `<option value="${key}" ${selected}>${ZETA_LIBRARY[key].name}</option>`;
    }

    const zetaVal = (zeta !== null) ? zeta : (ZETA_LIBRARY[type] ? ZETA_LIBRARY[type].zeta : 0);

    const row = document.createElement('div');
    row.className = 'resistance-row';
    row.style = "display: flex; gap: 10px; align-items: center; margin-bottom: 8px;";

    row.innerHTML = `
        <select class="res-type" style="flex: 3; padding: 8px; font-size: 13px;" onchange="updateZetaInput(this); saveVentSections();">
            ${optionsHtml}
        </select>
        <input type="number" class="res-qty" value="${qty}" min="1" style="flex: 1; padding: 8px; font-size: 13px;" placeholder="Кол-во" oninput="saveVentSections()">
        <input type="number" step="0.01" class="res-zeta" value="${zetaVal}" style="flex: 1; padding: 8px; font-size: 13px;" placeholder="ζ" oninput="saveVentSections()">
        <button class="btn" style="width: auto; padding: 8px 12px; background: #cbd5e1; color: #b91c1c; margin: 0;" onclick="this.parentElement.remove(); saveVentSections(); if(typeof debouncedCalcVent === 'function') debouncedCalcVent();">✖</button>
    `;
    container.appendChild(row);
}

function updateZetaInput(selectElement) {
    const val = selectElement.value;
    const zetaInput = selectElement.parentElement.querySelector('.res-zeta');
    if (ZETA_LIBRARY[val]) {
        zetaInput.value = ZETA_LIBRARY[val].zeta;
    }
}

async function calcVent(isAuto = false) {
    isAutoCalc = isAuto;

    const length = getVal('v_length', 'Длина помещения (м)');
    const width = getVal('v_width', 'Ширина помещения (м)');
    const height = getVal('v_height', 'Высота помещения (м)');
    const people = getVal('v_people', 'Количество людей (чел)');
    const heat_gain = getVal('v_heat', 'Теплоизбытки (кВт)');
    const moisture = getVal('v_moisture', 'Влаговыделения (г/ч)');
    const hazard = getVal('v_hazard', 'Вредные в-ва (г/ч)');
    const mpc = getVal('v_mpc', 'ПДК (мг/м³)');
    const t_in = getVal('v_t_in', 'Температура внутри (°C)');
    const t_out = getVal('v_t_out', 'Температура снаружи (°C)');
    const distance = parseFloat(document.getElementById('v_distance')?.value) || 2.0;

    const recup_eff = document.getElementById('v_recup_eff').value;
    const tariff = document.getElementById('v_tariff').value;
    const season = document.getElementById('v_season_days').value;

    if (length === null || width === null || height === null || people === null || heat_gain === null || moisture === null || hazard === null || mpc === null || t_in === null || t_out === null) {
        isAutoCalc = false;
        return;
    }

    const sectionsData = collectSectionsData();

    const sectionsForBackend = sectionsData.map(sec => {
        return {
            name: sec.name,
            length: sec.length,
            shape: sec.shape,
            material: sec.material,
            resistances: sec.resistances.map(r => ({
                name: ZETA_LIBRARY[r.type] ? ZETA_LIBRARY[r.type].name : 'Элемент',
                qty: r.qty,
                zeta: r.zeta
            }))
        };
    });

    if (sectionsForBackend.length === 0) {
        const warning = document.getElementById('vent-warning-no-sections');
        if (warning) {
            warning.style.display = 'block';
            setTimeout(() => { warning.style.display = 'none'; }, 5000);
        }
        addVentSection("Магистраль (авто)", 10);
        isAutoCalc = false;
        return;
    }

    document.getElementById('vent-results').style.display = 'block';
    document.getElementById('v-dashboard').innerHTML = '<p>Расчёт...</p>';

    const data = {
        length, width, height, people,
        heat_gain_kw: heat_gain, moisture_gain_g_h: moisture, hazard_g_h: hazard, mpc_mg_m3: mpc,
        t_inside: t_in, t_outside: t_out,
        room_type: document.getElementById('v_room_type')?.value || 'office',
        duct_material: document.getElementById('v_duct_material')?.value || 'steel_galv',
        recup_efficiency: parseFloat(recup_eff) || 0,
        electricity_tariff: parseFloat(tariff) || 5.5,
        season_days: parseInt(season) || 210,
        sections: sectionsForBackend,
        distance_m: distance
    };
    lastData.vent = data;

    try {
        const resp = await fetch('/api/ventilation/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!resp.ok) {
            const errData = await resp.json();
            throw new Error(errData.detail || 'Ошибка сервера');
        }
        const r = await resp.json(); lastResp.vent = r;

        const systemType = document.getElementById('v_system_type')?.value || 'supply';
        if (typeof updateRoomBalance === 'function') {
            updateRoomBalance(r.air_exchange.L_max_m3h, systemType);
        }

        let recupHtml = '';
        if (r.recuperation && r.recuperation.q_saved_kw > 0) {
            recupHtml = `<div class="result-box" style="background: #f0fdf4; border-color: #22c55e;"><h4 style="color: #047857;">Экономия на отоплении <span class="info-icon" data-tooltip="Q_экон = L × ρ × c × Δt_нар × КПД / 3600"></span></h4><div class="value" style="color: #047857;">${r.recuperation.money_saved_rub.toLocaleString('ru-RU')} <span class="unit">руб/сезон</span></div></div>`;
        }

        let acousticsHtml = '';
        if (r.acoustics) {
            const ac = r.acoustics;
            const bgColor = ac.is_compliant ? '#f0fdf4' : '#fef2f2';
            const borderColor = ac.is_compliant ? '#22c55e' : '#ef4444';
            const statusText = ac.is_compliant ? 'Соответствует' : 'Превышение';
            const totalAttenuation = (ac.attenuation_duct + ac.attenuation_bends + ac.spatial_attenuation + 5).toFixed(1);

            acousticsHtml = `
                <div class="result-box" style="background: ${bgColor}; border-color: ${borderColor}; grid-column: span 2;">
                    <h4>Акустика <span class="info-icon" data-tooltip="L_шум = Шум_вент - Затухание_в_канале - Затухание_на_отводах - Пространственное_затухание - Затухание_на_решетке"></span></h4>
                    <div style="font-size: 14px; font-weight: 600; color: #1e293b; margin-top: 5px;">${statusText} ${ac.message}</div>
                    <div style="font-size: 11px; color: #475569; margin-top: 5px; line-height: 1.2;">
                        Шум вент: ${ac.fan_noise} дБА | Затухание: -${totalAttenuation} дБА
                    </div>
                    <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 5px;">
                        Итог: ${ac.final_noise} дБА <span style="font-size: 11px; color: #475569;">(Норма: ${ac.allowed_noise} дБА)</span>
                    </div>
                </div>
            `;
        }

        const isPeople = r.air_exchange.decisive_factor === 'По людям';
        const isRate = r.air_exchange.decisive_factor === 'По кратности';
        const isHeat = r.air_exchange.decisive_factor === 'По теплоизбыткам';
        const isMoisture = r.air_exchange.decisive_factor === 'По влаге';
        const isHazard = r.air_exchange.decisive_factor === 'По ПДК';

        const airExchangeTable = `
            <div class="card" style="margin-top: 15px; padding: 15px; grid-column: 1 / -1; background: #f8fafc; border: 1px solid #cbd5e1;">
                <h4 style="margin-bottom: 10px; color: #0f172a;">Сравнение воздухообменов (м³/ч):</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr style="background: #e2e8f0; text-align: left;">
                        <th style="padding: 8px;">Параметр</th>
                        <th style="padding: 8px;">Значение</th>
                        <th style="padding: 8px;">Статус</th>
                    </tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #cbd5e1;">По людям (${data.people} чел)</td><td style="padding: 8px; border-bottom: 1px solid #cbd5e1; font-weight: 600;">${r.air_exchange.L_people_m3h}</td><td style="padding: 8px; border-bottom: 1px solid #cbd5e1;">${isPeople ? 'Наибольшее' : '—'}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #cbd5e1;">По кратности (V=${r.air_exchange.volume_m3} м³)</td><td style="padding: 8px; border-bottom: 1px solid #cbd5e1; font-weight: 600;">${r.air_exchange.L_rate_m3h}</td><td style="padding: 8px; border-bottom: 1px solid #cbd5e1;">${isRate ? 'Наибольшее' : '—'}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #cbd5e1;">По теплоизбыткам (${data.heat_gain_kw} кВт)</td><td style="padding: 8px; border-bottom: 1px solid #cbd5e1; font-weight: 600;">${r.air_exchange.L_heat_m3h}</td><td style="padding: 8px; border-bottom: 1px solid #cbd5e1;">${isHeat ? 'Наибольшее' : '—'}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #cbd5e1;">По влаге (${data.moisture_gain_g_h} г/ч)</td><td style="padding: 8px; border-bottom: 1px solid #cbd5e1; font-weight: 600;">${r.air_exchange.L_moisture_m3h}</td><td style="padding: 8px; border-bottom: 1px solid #cbd5e1;">${isMoisture ? 'Наибольшее' : '—'}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #cbd5e1;">По вредностям (${data.hazard_g_h} г/ч)</td><td style="padding: 8px; border-bottom: 1px solid #cbd5e1; font-weight: 600;">${r.air_exchange.L_hazard_m3h}</td><td style="padding: 8px; border-bottom: 1px solid #cbd5e1;">${isHazard ? 'Наибольшее' : '—'}</td></tr>
                    <tr style="background: #eff6ff;">
                        <td style="padding: 10px; font-weight: bold; color: #1e3a8a;">ИТОГОВЫЙ РАСХОД (максимум):</td>
                        <td style="padding: 10px; font-weight: bold; color: #1e3a8a; font-size: 16px;">${r.air_exchange.L_max_m3h}</td>
                        <td style="padding: 10px; font-weight: bold; color: #1e3a8a;">Принят в расчет</td>
                    </tr>
                </table>
            </div>
        `;

        const duct = r.pressure_loss.primary_duct;
        const ductTitle = duct.shape === 'round' ? 'Диаметр (1 уч.)' : 'Сечение (1 уч.)';
        let ductDisplay = '';
        if (duct.shape === 'round') ductDisplay = duct.diameter_mm;
        else if (duct.shape === 'oval') ductDisplay = `Овал ${duct.width_mm}×${duct.height_mm}`;
        else ductDisplay = `${duct.width_mm}×${duct.height_mm}`;

        document.getElementById('v-dashboard').innerHTML = `
            <div class="result-box">
                <h4>Расход воздуха <span class="info-icon" data-tooltip="L = max(L_люди, L_кратность, L_тепло, L_влага, L_ПДК)"></span></h4>
                <div class="value">${r.air_exchange.L_max_m3h} <span class="unit">м³/ч</span></div>
            </div>
            <div class="result-box">
                <h4>${ductTitle} <span class="info-icon" data-tooltip="F = L / (3600 × 5 м/с). Подбирается ближайший стандартный диаметр/сечение."></span></h4>
                <div class="value">${ductDisplay} <span class="unit">мм</span></div>
            </div>
            <div class="result-box">
                <h4>Потери <span class="info-icon" data-tooltip="ΔP_общ = (ΔP_трение + ΔP_местные + ΔP_оборуд) × 1.15"></span></h4>
                <div class="value">${r.pressure_loss.total_loss_pa} <span class="unit">Па</span></div>
            </div>
            <div class="result-box">
                <h4>Нагрев <span class="info-icon" data-tooltip="Q = L × ρ × c × (t_вн - t_нар) / 3600"></span></h4>
                <div class="value">${r.equipment.heater_power_kw} <span class="unit">кВт</span></div>
            </div>
            ${recupHtml}
            ${acousticsHtml}
            ${airExchangeTable}
        `;

        let recupMethodology = '';
        if (r.recuperation && r.recuperation.q_saved_kw > 0) {
            let frostWarn = r.recuperation.frost_warning ? `<div class="warn-box" style="margin-top:10px;">${r.recuperation.frost_warning}</div>` : '';
            recupMethodology = `
                <div class="formula-block" style="background: #f0fdf4; border-left-color: #22c55e;">
                    <b>7. Рекуперация:</b><br>
                    $$ Q_{\\text{экон}} = \\frac{L \\times \\rho \\times c \\times \\Delta t_{\\text{нар}} \\times \\text{КПД}}{3600} $$
                    $$ Q_{\\text{экон}} = \\frac{${r.air_exchange.L_max_m3h} \\times 1.2 \\times 1.005 \\times ${r.air_exchange.delta_t} \\times ${(data.recup_efficiency/100).toFixed(2)}}{3600} = \\mathbf{${r.recuperation.q_saved_kw} \\text{ кВт}} $$
                    Энергия за сезон = <b>${r.recuperation.energy_saved_kwh} кВт*ч</b><br>
                    Экономия = <b>${r.recuperation.money_saved_rub} руб.</b>${frostWarn}
                </div>`;
        }

        let sectionsTable = '';
        const matNames = {steel_galv: 'Оцинк.', steel_black: 'Черн.', plastic: 'Пласт.', aluminum_flex: 'Гибк.', concrete: 'Бетон', brick: 'Кирпич'};

        r.pressure_loss.sections_breakdown.forEach(s => {
            let shapeStr = s.shape === 'round' ? `Ø${s.diameter_mm}` : `${s.width_mm}×${s.height_mm}`;
            sectionsTable += `<tr>
                <td>${s.name}</td>
                <td>${shapeStr} мм</td>
                <td>${matNames[s.material] || s.material} (Δ${s.roughness_mm})</td>
                <td>${s.length} м</td>
                <td>${s.velocity_ms} м/с</td>
                <td>${s.total_zeta}</td>
                <td>${s.friction_pa} Па</td>
                <td>${s.local_pa} Па</td>
            </tr>`;
        });

        let acousticsMethodology = '';
        if (r.acoustics) {
            const ac = r.acoustics;
            let totalLength = 0;
            let bendsCount = 0;
            sectionsData.forEach(sec => {
                totalLength += sec.length;
                sec.resistances.forEach(res => {
                    if (res.type.includes('bend') || res.type.includes('tee')) bendsCount += res.qty;
                });
            });

            acousticsMethodology = `
                <div class="formula-block" style="background: #f8fafc; border-left-color: #64748b;">
                    <b>8. Акустический расчет (СП 51.13330.2011):</b><br>
                    1. Шум вентилятора: <b>${ac.fan_noise} дБА</b><br>
                    2. Затухание в прямых участках (L = ${totalLength.toFixed(1)} м): <b>${ac.attenuation_duct} дБА</b><br>
                    3. Затухание на отводах (${bendsCount} шт): <b>${ac.attenuation_bends} дБА</b><br>
                    4. Пространственное затухание (r = ${data.distance_m} м): <b>${ac.spatial_attenuation} дБА</b><br>
                    5. Затухание на решетке: 5.0 дБА<br>
                    6. Итоговый уровень шума: ${ac.fan_noise} - ${ac.attenuation_duct} - ${ac.attenuation_bends} - ${ac.spatial_attenuation} - 5 = <b>${ac.final_noise} дБА</b><br>
                    7. Норматив для ${data.room_type === 'office' ? 'офиса' : 'производства'}: <b>${ac.allowed_noise} дБА</b><br>
                    <b>Вывод:</b> ${ac.message}
                </div>
            `;
        }

        const methodologyContainer = document.getElementById('v-methodology');
        methodologyContainer.innerHTML = `
            <div class="formula-block">
                <b>1. Расчет расхода (максимум из 5 параметров):</b><br>
                По людям: ${r.air_exchange.L_people_m3h} м³/ч<br>
                По кратности: ${r.air_exchange.L_rate_m3h} м³/ч<br>
                По теплоизбыткам: ${r.air_exchange.L_heat_m3h} м³/ч<br>
                По влаге: ${r.air_exchange.L_moisture_m3h} м³/ч<br>
                По вредностям: ${r.air_exchange.L_hazard_m3h} м³/ч<br>
                <b>Итоговый расход: ${r.air_exchange.L_max_m3h} м³/ч</b> (Определяющий фактор: ${r.air_exchange.decisive_factor})
            </div>
            <div class="formula-block" style="background: #eff6ff; border-left-color: #2563eb;">
                <b>2. Потери давления по участкам:</b><br>
                <table style="width: 100%; font-size: 12px; margin-bottom: 10px; margin-top: 10px;">
                    <tr style="background: #e2e8f0;">
                        <th>Участок</th><th>Размер</th><th>Материал (Δ)</th><th>Длина</th><th>Скорость</th><th>Σζ</th><th>Трение</th><th>Местные</th>
                    </tr>
                    ${sectionsTable}
                </table>
                $$ \\Delta P_{\\text{трение}} = \\sum \\left( \\lambda \\times \\frac{L}{d} \\times \\frac{\\rho v^2}{2} \\right) = \\mathbf{${r.pressure_loss.friction_loss_pa} \\text{ Па}} $$
                $$ \\Delta P_{\\text{мест}} = \\sum \\left( \\zeta \\times \\frac{\\rho v^2}{2} \\right) = \\mathbf{${r.pressure_loss.local_loss_pa} \\text{ Па}} $$
                ΔP_оборуд = 230 Па (фильтр + калорифер)<br>
                $$ \\Delta P_{\\text{общ}} = (\\Delta P_{\\text{тр}} + \\Delta P_{\\text{мест}} + 230) \\times 1.15 = \\mathbf{${r.pressure_loss.total_loss_pa} \\text{ Па}} $$
            </div>
            ${recupMethodology}
            ${acousticsMethodology}
        `;

        if (window.renderMathInElement) {
            renderMathInElement(methodologyContainer, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
        }

        document.getElementById('v-report').textContent = r.report;

        const cat = document.getElementById('v-catalog');
        cat.innerHTML = '';

        if (r.requires_professional) {
            let missingHtml = r.missing.map(m => {
                if (m.category === "Вентилятор/Установка") return `• Вентилятор / Установка (Требуется: ${m.flow} м³/ч, ${m.pressure} Па)`;
                if (m.category === "Калорифер") return `• Калорифер (Требуется: ${m.power} кВт)`;
                return `• ${m.category}`;
            }).join('<br>');

            cat.innerHTML += `
                <div class="prof-warning">
                    <h3>Требуется профессиональный подбор</h3>
                    <p>В нашем каталоге не нашлось готового оборудования для заданных параметров. Обратитесь к проектировщику или напрямую к производителю (например, ВЕЗА, Systemair) для индивидуального заказа.</p>
                    <div class="prof-missing-list">
                        <b>Недостающие позиции:</b><br>${missingHtml}
                    </div>
                </div>
            `;
        }

        const grouped = {};
        r.solutions.forEach(s => {
            if(!grouped[s.category]) grouped[s.category]=[];
            grouped[s.category].push(s);
        });

        const names = { unit: "Приточные установки", fan: "Вентиляторы", duct: "Воздуховоды", heater: "Калориферы", filter: "Фильтры", recuperator: "Рекуператоры", silencer: "Шумоглушители", valve: "Клапаны", cyclone: "Циклоны" };

        ["unit", "fan", "duct", "heater", "filter", "recuperator", "silencer", "valve", "cyclone"].forEach(c => {
            if (!grouped[c]) return;
            grouped[c].sort((a, b) => a.price_rub - b.price_rub);
            const min = grouped[c][0].price_rub;
            cat.innerHTML += `<div class="category-header"><h3>${names[c] || c}</h3></div><div class="solutions-grid" id="grid-${c}"></div>`;
            const grid = document.getElementById(`grid-${c}`);

            grouped[c].forEach(s => {
                const best = s.price_rub === min;
                const isIndustrial = s.segment === 'industrial';
                const industrialBadge = isIndustrial ? `<div class="industrial-badge">Промышленный</div>` : '';

                grid.innerHTML += `
                    <div class="sol-card ${best ? 'best-choice' : ''}">
                        ${best ? '<div class="best-badge">Выгодный выбор</div>' : ''}
                        ${industrialBadge}
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
    } catch (e) {
        if (!isAutoCalc) alert(e.message);
        else console.error(e.message);
    } finally {
        isAutoCalc = false;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    restoreVentSections();
});