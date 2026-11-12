function syncAcFromVent() {
    const v_length = parseFloat(document.getElementById('v_length')?.value) || 0;
    const v_width = parseFloat(document.getElementById('v_width')?.value) || 0;
    const v_height = parseFloat(document.getElementById('v_height')?.value) || 0;
    const v_people = parseInt(document.getElementById('v_people')?.value) || 0;
    const v_heat = parseFloat(document.getElementById('v_heat')?.value) || 0;

    if (v_length > 0 && v_width > 0) {
        document.getElementById('ac_area').value = (v_length * v_width).toFixed(1);
    }
    if (v_height > 0) {
        document.getElementById('ac_height').value = v_height;
    }
    if (v_people > 0) {
        document.getElementById('ac_people').value = v_people;
    }

    // В кондиционировании явное тепло считается от людей, окон и света,
    // но если есть доп. техника, можно перекинуть разницу.
    // Оставим пока просто площадь, высоту и людей (это самое главное).

    // Триггерим сохранение
    ['ac_area', 'ac_height', 'ac_people'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    alert("Данные о площади, высоте и людях перенесены из Вентиляции!");
}

async function calcAc() {
    const getValLocal = (id, name) => {
        const el = document.getElementById(id);
        if (!el || el.value.trim() === '') { alert(`Заполните поле: ${name}`); return null; }
        const val = parseFloat(el.value);
        if (isNaN(val)) { alert(`Поле "${name}" должно быть числом.`); return null; }
        return val;
    };

    const area = getValLocal('ac_area', 'Площадь');
    const height = getValLocal('ac_height', 'Высота');
    const people = getValLocal('ac_people', 'Люди');
    const window_area = getValLocal('ac_window_area', 'Площадь окон');
    const lighting_lux = getValLocal('ac_lux', 'Освещенность');
    const lighting_w_m2 = getValLocal('ac_w_m2', 'Удельное тепло');
    const t_in_base = getValLocal('ac_t_in', 't внутри');

    const t_out_x = getValLocal('ac_t_out_x', 't нар ХПГ');
    const t_out_p = getValLocal('ac_t_out_p', 't нар ППГ');
    const t_out_t = getValLocal('ac_t_out_t', 't нар ТПГ');

    const I_out_x = getValLocal('ac_I_out_x', 'Энтальпия нар ХПГ');
    const I_out_p = getValLocal('ac_I_out_p', 'Энтальпия нар ППГ');
    const I_out_t = getValLocal('ac_I_out_t', 'Энтальпия нар ТПГ');

    const t_sup_x = getValLocal('ac_t_sup_x', 't прит ХПГ');
    const t_sup_p = getValLocal('ac_t_sup_p', 't прит ППГ');
    const t_sup_t = getValLocal('ac_t_sup_t', 't прит ТПГ');

    const t_exh_x = getValLocal('ac_t_exh_x', 't удал ХПГ');
    const t_exh_p = getValLocal('ac_t_exh_p', 't удал ППГ');
    const t_exh_t = getValLocal('ac_t_exh_t', 't удал ТПГ');

    const I_exh_x = getValLocal('ac_I_exh_x', 'Энтальпия удал ХПГ');
    const I_exh_p = getValLocal('ac_I_exh_p', 'Энтальпия удал ППГ');
    const I_exh_t = getValLocal('ac_I_exh_t', 'Энтальпия удал ТПГ');

    if ([area, height, people, window_area, lighting_lux, lighting_w_m2, t_in_base, t_out_x, t_out_p, t_out_t, I_out_x, I_out_p, I_out_t, t_sup_x, t_sup_p, t_sup_t, t_exh_x, t_exh_p, t_exh_t, I_exh_x, I_exh_p, I_exh_t].includes(null)) return;

    document.getElementById('ac-results').style.display = 'block';
    document.getElementById('ac-dashboard').innerHTML = '<p>Расчёт...</p>';

    const data = {
        area, height, people, window_area, lighting_lux, lighting_w_m2,
        room_type: document.getElementById('ac_room_type')?.value || 'office',
        window_type: document.getElementById('ac_win_type')?.value || 'double_chamber',
        t_out_x, t_out_p, t_out_t,
        t_in_x: t_in_base, t_in_p: t_in_base, t_in_t: t_in_base,
        t_supply_x: t_sup_x, t_supply_p: t_sup_p, t_supply_t: t_sup_t,
        t_exhaust_x: t_exh_x, t_exhaust_p: t_exh_p, t_exhaust_t: t_exh_t,
        enthalpy_out_x: I_out_x, enthalpy_out_p: I_out_p, enthalpy_out_t: I_out_t,
        enthalpy_ex_x: I_exh_x, enthalpy_ex_p: I_exh_p, enthalpy_ex_t: I_exh_t
    };

    try {
        const resp = await fetch('/api/ac/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!resp.ok) throw new Error('Ошибка сервера при расчете');
        const r = await resp.json(); lastResp.ac = r;

        const res = r.results;

        document.getElementById('ac-dashboard').innerHTML = `
            <div class="result-box" style="background: #eff6ff; border-color: #bfdbfe;"><h4>Расчетный воздухообмен</h4><div class="value">${res.max_air_exchange} <span class="unit">м³/ч</span></div></div>
            <div class="result-box" style="background: var(--success-bg); border-color: var(--success-border);"><h4 style="color: var(--success);">Мощность на кондиционирование</h4><div class="value" style="color: var(--success);">${(res.max_q_cond / 1000).toFixed(2)} <span class="unit">кВт</span></div></div>
        `;

        const tbody = document.getElementById('ac-table-body');
        tbody.innerHTML = '';
        res.table.forEach(row => {
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px; text-align: left; font-weight: 600; color: #334155;">${row.period}</td>
                    <td>${row.q_sens}</td>
                    <td>${row.q_total}</td>
                    <td>${row.w}</td>
                    <td>${row.l_sens}</td>
                    <td>${row.l_total}</td>
                    <td>${row.l_w}</td>
                    <td>${row.l_co2}</td>
                    <td>${row.l_norm}</td>
                    <td style="font-weight: bold; color: #1e3a8a; background: #eff6ff;">${row.l_calc}</td>
                </tr>
            `;
        });

        let methodologyHtml = '';

        res.table.forEach((row, index) => {
            const periodName = row.period;
            const t_sup = index === 0 ? data.t_supply_x : (index === 1 ? data.t_supply_p : data.t_supply_t);
            const t_exh = index === 0 ? data.t_exhaust_x : (index === 1 ? data.t_exhaust_p : data.t_exhaust_t);
            const I_out = index === 0 ? data.enthalpy_out_x : (index === 1 ? data.enthalpy_out_p : data.enthalpy_out_t);
            const I_exh = index === 0 ? data.enthalpy_ex_x : (index === 1 ? data.enthalpy_ex_p : data.enthalpy_ex_t);

            methodologyHtml += `
                <div class="formula-block" style="background: ${index === 0 ? '#f8fafc' : (index === 1 ? '#f0fdf4' : '#fff7ed')}; border-left-color: ${index === 0 ? '#64748b' : (index === 1 ? '#22c55e' : '#f97316')}; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px; color: #0f172a;">${periodName}</h4>

                    <b>1. Теплопоступления:</b><br>
                    $$ Q_{\\text{явн}} = ${row.q_sens} \\text{ Вт}; \\quad Q_{\\text{полн}} = ${row.q_total} \\text{ Вт}; \\quad W = ${row.w} \\text{ г/ч} $$<br>

                    <b>2. Воздухообмен по явному теплу:</b><br>
                    $$ L_{\\text{явн}} = \\frac{3600 \\times Q_{\\text{явн}}}{c \\times \\rho \\times (t_{\\text{удал}} - t_{\\text{прит}})} $$
                    $$ L_{\\text{явн}} = \\frac{3600 \\times ${row.q_sens}}{1000 \\times 1.2 \\times (${t_exh} - ${t_sup})} = \\mathbf{${row.l_sens} \\text{ м}^3/\\text{ч}} $$<br>

                    <b>3. Воздухообмен по полному теплу:</b><br>
                    $$ L_{\\text{полн}} = \\frac{3600 \\times Q_{\\text{полн}}}{\\rho \\times |I_{\\text{удал}} - I_{\\text{прит}}|} $$
                    $$ L_{\\text{полн}} = \\frac{3600 \\times ${row.q_total}}{1.2 \\times |${I_exh} - ${I_out}|} = \\mathbf{${row.l_total} \\text{ м}^3/\\text{ч}} $$<br>

                    <b>4. Воздухообмен по влаге:</b><br>
                    $$ L_{\\text{влага}} = \\frac{W}{\\rho \\times \\Delta d} = \\frac{${row.w}}{1.2 \\times 3} = \\mathbf{${row.l_w} \\text{ м}^3/\\text{ч}} $$<br>

                    <b>5. Воздухообмен по CO₂:</b><br>
                    $$ L_{CO_2} = \\frac{G_{CO_2}}{\\text{ПДК}_{\\text{вн}} - \\text{ПДК}_{\\text{нар}}} = \\frac{1000}{3.2 - 0.8} = \\mathbf{${row.l_co2} \\text{ м}^3/\\text{ч}} $$<br>

                    <b>6. Санитарная норма:</b><br>
                    $$ L_{\\text{норм}} = N \\times \\text{норматив} = ${people} \\times 60 = \\mathbf{${row.l_norm} \\text{ м}^3/\\text{ч}} $$<br>

                    <b>7. Расчетный (максимальный) воздухообмен:</b><br>
                    $$ L_{\\text{расч}} = \\max(L_{\\text{явн}}, L_{\\text{полн}}, L_{\\text{влага}}, L_{CO_2}, L_{\\text{норм}}) = \\mathbf{${row.l_calc} \\text{ м}^3/\\text{ч}} $$
                </div>
            `;
        });

        methodologyHtml += `
            <div class="formula-block" style="background: #eff6ff; border-left-color: #2563eb;">
                <b>8. Остаточная мощность на кондиционирование (по ТПГ):</b><br>
                $$ Q_{\\text{вент}} = \\frac{c \\times \\rho \\times L_{\\text{итог}} \\times (t_{\\text{удал}} - t_{\\text{прит}})}{3600} $$
                $$ Q_{\\text{конд}} = Q_{\\text{полн}} - Q_{\\text{вент}} = ${res.table[2].q_total} - ${res.table[2].q_vent} = \\mathbf{${res.table[2].q_cond} \\text{ Вт}} $$
                (В киловаттах: <b>${(res.table[2].q_cond / 1000).toFixed(2)} кВт</b>)
            </div>
        `;

        const methodologyContainer = document.getElementById('ac-methodology');
        methodologyContainer.innerHTML = methodologyHtml;

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

        document.getElementById('ac-report').textContent = r.report;

        const cat = document.getElementById('ac-catalog');
        cat.innerHTML = '';

        if (r.requires_professional) {
            let missingHtml = r.missing.map(m => `• ${m.category} (Требуется: ${m.power} кВт)`).join('<br>');
            cat.innerHTML += `
                <div class="prof-warning">
                    <h3>⚠️ Требуется профессиональный подбор</h3>
                    <p>В нашем каталоге не нашлось готового оборудования для заданных параметров.</p>
                    <div class="prof-missing-list"><b>Недостающие позиции:</b><br>${missingHtml}</div>
                </div>
            `;
        }

        const grouped = {};
        r.solutions.forEach(s => { if(!grouped[s.category]) grouped[s.category]=[]; grouped[s.category].push(s); });
        const names = { split: "Настенные сплит-системы", cassette: "Кассетные кондиционеры", vrf: "VRF-системы", chiller: "Промышленные чиллеры" };

        ["split", "cassette", "vrf", "chiller"].forEach(c => {
            if (!grouped[c]) return;
            cat.innerHTML += `<div class="category-header"><h3>${names[c]}</h3></div><div class="solutions-grid" id="grid-ac-${c}"></div>`;
            const grid = document.getElementById(`grid-ac-${c}`);

            grouped[c].forEach(s => {
                const isIndustrial = s.segment === 'industrial';
                const industrialBadge = isIndustrial ? `<div class="industrial-badge">Промышленный</div>` : '';
                grid.innerHTML += `
                    <div class="sol-card">
                        ${industrialBadge}
                        <div class="sol-title">${s.model}</div>
                        <div class="sol-brand">${s.brand} | ${s.type}</div>
                        <div class="sol-specs"><span class="sol-spec">${s.power_kw} кВт</span></div>
                        <div class="sol-price">${s.price_rub.toLocaleString('ru-RU')} ₽</div>
                        <a href="${s.url}" target="_blank" class="sol-link">Найти на сайте</a>
                    </div>
                `;
            });
        });
    } catch (e) { alert(e.message); }
}