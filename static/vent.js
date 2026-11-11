let sectionCounter = 0;

function collectSectionsData() {
    const sectionBoxes = document.querySelectorAll('.vent-section-box');
    const sections = [];
    sectionBoxes.forEach(box => {
        const name = box.querySelector('.sec-name').value || 'Участок';
        const len = parseFloat(box.querySelector('.sec-length').value) || 0;
        const resRows = box.querySelectorAll('.resistance-row');
        const resistances = [];
        resRows.forEach(r => {
            const type = r.querySelector('.res-type').value;
            const qty = parseInt(r.querySelector('.res-qty').value) || 1;
            const zeta = parseFloat(r.querySelector('.res-zeta').value) || 0;
            resistances.push({ type, qty, zeta });
        });
        sections.push({ name, length: len, resistances });
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
            addVentSection(sec.name, sec.length, sec.resistances);
        });
    } else {
        addVentSection();
    }
}

function addVentSection(name = "", length = 10, resistances = null) {
    sectionCounter++;
    const container = document.getElementById('vent-sections-container');
    const div = document.createElement('div');
    div.className = 'vent-section-box';
    div.id = `section-${sectionCounter}`;

    const secName = name || `Участок ${sectionCounter}`;

    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="margin: 0; color: #0f172a;">${secName}</h4>
            <button class="btn" style="width: auto; padding: 5px 10px; background: #ef4444; margin: 0;" onclick="this.closest('.vent-section-box').remove(); saveVentSections();">Удалить участок</button>
        </div>
        <div class="form-grid" style="margin-bottom: 15px;">
            <div class="form-group">
                <label>Название участка</label>
                <input type="text" class="sec-name" value="${secName}" oninput="saveVentSections()">
            </div>
            <div class="form-group">
                <label>Длина участка (м)</label>
                <input type="number" step="0.1" class="sec-length" value="${length}" oninput="saveVentSections()">
            </div>
        </div>

        <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-weight: 600; font-size: 13px; color: #475569;">Местные сопротивления (КМС)</span>
                <button class="btn" style="width: auto; padding: 5px 10px; background: #3b82f6; margin: 0; font-size: 12px;" onclick="addResistanceRow('${div.id}'); saveVentSections();">+ Добавить элемент</button>
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
        <button class="btn" style="width: auto; padding: 8px 12px; background: #cbd5e1; color: #dc2626; margin: 0;" onclick="this.parentElement.remove(); saveVentSections();">✖</button>
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

async function calcVent() {
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

    if (length === null || width === null || height === null || people === null || heat_gain === null || moisture === null || hazard === null || mpc === null || t_in === null || t_out === null) return;

    const sectionsData = collectSectionsData();

    const sectionsForBackend = sectionsData.map(sec => {
        return {
            name: sec.name,
            length: sec.length,
            resistances: sec.resistances.map(r => ({
                name: ZETA_LIBRARY[r.type] ? ZETA_LIBRARY[r.type].name : 'Элемент',
                qty: r.qty,
                zeta: r.zeta
            }))
        };
    });

    if (sectionsForBackend.length === 0) { alert("Добавьте хотя бы один участок воздуховода!"); return; }

    document.getElementById('vent-results').style.display = 'block';
    document.getElementById('v-dashboard').innerHTML = '<p>Расчёт...</p>';

    const data = {
        length, width, height, people,
        heat_gain_kw: heat_gain, moisture_gain_g_h: moisture, hazard_g_h: hazard, mpc_mg_m3: mpc,
        t_inside: t_in, t_outside: t_out,
        room_type: document.getElementById('v_room_type')?.value || 'office',
        duct_shape: document.getElementById('v_duct_shape')?.value || 'round',
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
        if (!resp.ok) throw new Error('Ошибка сервера');
        const r = await resp.json(); lastResp.vent = r;

        let dt_heat = r.air_exchange.delta_t_heat || 5.0;
        let recupHtml = '';
        if (r.recuperation && r.recuperation.q_saved_kw > 0) {
            recupHtml = `<div class="result-box" style="background: #f0fdf4; border-color: #22c55e;"><h4 style="color: #166534;">Экономия на отоплении</h4><div class="value" style="color: #166534;">${r.recuperation.money_saved_rub.toLocaleString('ru-RU')} <span class="unit">руб/сезон</span></div></div>`;
        }

        let acousticsHtml = '';
        if (r.acoustics) {
            const ac = r.acoustics;
            const bgColor = ac.is_compliant ? '#f0fdf4' : '#fef2f2';
            const borderColor = ac.is_compliant ? '#22c55e' : '#ef4444';
            const icon = ac.is_compliant ? '✅' : '⚠️';

            const totalAttenuation = (ac.attenuation_duct + ac.attenuation_bends + ac.spatial_attenuation + 5).toFixed(1);

            acousticsHtml = `
                <div class="result-box" style="background: ${bgColor}; border-color: ${borderColor}; grid-column: span 2;">
                    <h4>Акустика</h4>
                    <div style="font-size: 14px; font-weight: 600; color: #1e293b; margin-top: 5px;">${icon} ${ac.message}</div>
                    <div style="font-size: 11px; color: #475569; margin-top: 5px; line-height: 1.2;">
                        Шум вент: ${ac.fan_noise} дБА | Затухание: -${totalAttenuation} дБА
                    </div>
                    <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 5px;">
                        Итог: ${ac.final_noise} дБА <span style="font-size: 11px; color: #475569;">(Норма: ${ac.allowed_noise} дБА)</span>
                    </div>
                </div>
            `;
        }

        // --- НОВАЯ ТАБЛИЦА ВОЗДУХООБМЕНА ---
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

        const ductTitle = r.duct.shape === 'round' ? 'Диаметр' : 'Сечение';
        document.getElementById('v-dashboard').innerHTML = `
            <div class="result-box"><h4>Расход воздуха</h4><div class="value">${r.air_exchange.L_max_m3h} <span class="unit">м³/ч</span></div></div>
            <div class="result-box"><h4>${ductTitle}</h4><div class="value">${r.duct.shape === 'round' ? r.duct.diameter_mm : r.duct.width_mm+'×'+r.duct.height_mm} <span class="unit">мм</span></div></div>
            <div class="result-box"><h4>Потери</h4><div class="value">${r.pressure_loss.total_loss_pa} <span class="unit">Па</span></div></div>
            <div class="result-box"><h4>Нагрев</h4><div class="value">${r.equipment.heater_power_kw} <span class="unit">кВт</span></div></div>
            ${recupHtml}
            ${acousticsHtml}
            ${airExchangeTable}
        `;

        let recupMethodology = '';
        if (r.recuperation && r.recuperation.q_saved_kw > 0) {
            let frostWarn = r.recuperation.frost_warning ? `<div class="warn-box" style="margin-top:10px;">⚠️ ${r.recuperation.frost_warning}</div>` : '';
            recupMethodology = `<div class="formula-block" style="background: #f0fdf4; border-left-color: #22c55e;"><b>7. Рекуперация:</b> Q_экон = L × ρ × c × Δt_нар × КПД / 3600 = ${r.air_exchange.L_max_m3h} × 1.2 × 1.005 × ${r.air_exchange.delta_t} × ${(data.recup_efficiency/100).toFixed(2)} / 3600 = <b>${r.recuperation.q_saved_kw} кВт</b><br>Энергия за сезон = <b>${r.recuperation.energy_saved_kwh} кВт*ч</b><br>Экономия = <b>${r.recuperation.money_saved_rub} руб.</b>${frostWarn}</div>`;
        }

        let sectionsTable = '';
        r.pressure_loss.sections_breakdown.forEach(s => {
            sectionsTable += `<tr><td>${s.name}</td><td>${s.length} м</td><td>${s.total_zeta}</td><td>${s.friction_pa} Па</td><td>${s.local_pa} Па</td></tr>`;
        });

        const matNames = {steel_galv: 'Сталь оцинкованная', steel_black: 'Сталь черная', plastic: 'Пластик', aluminum_flex: 'Гибкий алюминий', concrete: 'Бетон', brick: 'Кирпич'};

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
                <div class="formula-block" style="background: #fdf4ff; border-left-color: #d946ef;">
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

        document.getElementById('v-methodology').innerHTML = `
            <div class="formula-block">
                <b>1. Расчет расхода (максимум из 5 параметров):</b><br>
                По людям: ${r.air_exchange.L_people_m3h} м³/ч<br>
                По кратности: ${r.air_exchange.L_rate_m3h} м³/ч<br>
                По теплоизбыткам: ${r.air_exchange.L_heat_m3h} м³/ч<br>
                По влаге: ${r.air_exchange.L_moisture_m3h} м³/ч<br>
                По вредностям: ${r.air_exchange.L_hazard_m3h} м³/ч<br>
                <b>Итоговый расход: ${r.air_exchange.L_max_m3h} м³/ч</b> (Определяющий фактор: ${r.air_exchange.decisive_factor})
            </div>
            <div class="formula-block">
                <b>2. Аэродинамика:</b><br>
                Площадь сечения: F = L / (3600 × 5 м/с) = ${r.air_exchange.L_max_m3h} / 18000 = ${(r.air_exchange.L_max_m3h / 18000).toFixed(4)} м²<br>
                Принят: <b>${r.duct.shape === 'round' ? 'Ø' + r.duct.diameter_mm + ' мм' : r.duct.width_mm + '×' + r.duct.height_mm + ' мм'}</b><br>
                Скорость в канале: <b>${r.duct.velocity_ms} м/с</b>
            </div>
            <div class="formula-block" style="background: #eff6ff; border-left-color: #2563eb;">
                <b>3. Потери давления по участкам:</b><br>
                Материал: <b>${matNames[data.duct_material] || 'Сталь'}</b> (шероховатость Δ = ${r.pressure_loss.roughness_mm} мм, λ = ${r.pressure_loss.lambda})<br>
                <table style="width: 100%; font-size: 12px; margin-bottom: 10px;">
                    <tr style="background: #e2e8f0;"><th>Участок</th><th>Длина</th><th>Σζ</th><th>Трение</th><th>Местные</th></tr>
                    ${sectionsTable}
                </table>
                ΔP_трение = ${r.pressure_loss.friction_loss_pa} Па<br>
                ΔP_мест = ${r.pressure_loss.local_loss_pa} Па<br>
                ΔP_оборуд = 230 Па (фильтр + калорифер)<br>
                Запас 15%: (${r.pressure_loss.friction_loss_pa} + ${r.pressure_loss.local_loss_pa} + 230) × 1.15 = <b>${r.pressure_loss.total_loss_pa} Па</b>
            </div>
            ${recupMethodology}
            ${acousticsMethodology}
        `;

        document.getElementById('v-report').textContent = r.report;
        const cat = document.getElementById('v-catalog'); cat.innerHTML = '';
        const grouped = {}; r.solutions.forEach(s => { if(!grouped[s.category]) grouped[s.category]=[]; grouped[s.category].push(s); });
        const names = { unit: "Приточные установки", fan: "Вентиляторы", duct: "Воздуховоды", heater: "Калориферы", filter: "Фильтры", recuperator: "Рекуператоры" };

        if (!grouped['unit'] && !grouped['fan']) cat.innerHTML += `<div class="warn-box">⚠️ В каталоге не найдено вентиляторов или установок с расходом более ${r.equipment.fan_flow_m3h} м³/ч.</div>`;
        if (!grouped['heater'] && r.equipment.heater_power_kw > 0) cat.innerHTML += `<div class="warn-box">⚠️ В каталоге не найдено калориферов мощностью более ${r.equipment.heater_power_kw} кВт.</div>`;

        ["unit", "fan", "duct", "heater", "filter", "recuperator"].forEach(c => {
            if (!grouped[c]) return;
            grouped[c].sort((a, b) => a.price_rub - b.price_rub);
            const min = grouped[c][0].price_rub;
            cat.innerHTML += `<div class="category-header"><h3>${names[c]}</h3></div><div class="solutions-grid" id="grid-${c}"></div>`;
            const grid = document.getElementById(`grid-${c}`);
            grouped[c].forEach(s => {
                const best = s.price_rub === min;
                grid.innerHTML += `<div class="sol-card ${best ? 'best-choice' : ''}">${best ? '<div class="best-badge">Выгодный выбор</div>' : ''}<div class="sol-title">${s.model}</div><div class="sol-brand">${s.brand}</div><div class="sol-specs">${s.category !== 'duct' ? `<span class="sol-spec">${s.max_flow.toLocaleString('ru-RU')} м³/ч</span>` : ''}${s.heater_power > 0 ? `<span class="sol-spec">${s.heater_power} кВт</span>` : ''}</div><div class="sol-price">${s.price_rub.toLocaleString('ru-RU')} ₽</div><a href="${s.url}" target="_blank" class="sol-link">Найти на сайте</a></div>`;
            });
        });
    } catch (e) { alert(e.message); }
}

window.addEventListener('DOMContentLoaded', () => {
    restoreVentSections();
});