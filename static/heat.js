async function calcHeat() {
    const wall_area = getVal('h_wall_area', 'Площадь стен (м²)');
    const wall_thick = getVal('h_wall_thick', 'Толщина стен (м)');
    const insul_thick = document.getElementById('h_insul_thick').value;
    const win_area = getVal('h_win_area', 'Площадь окон (м²)');
    const roof_area = getVal('h_roof_area', 'Площадь крыши (м²)');
    const roof_insul = getVal('h_roof_insul', 'Утеплитель крыши (м)');
    const floor_area = getVal('h_floor_area', 'Площадь пола (м²)');
    const t_out = getVal('h_t_out', 'Температура снаружи (°C)');
    const t_in = getVal('h_t_in', 'Температура внутри (°C)');
    const t_supply = getVal('h_t_supply', 'Подача (°C)');
    const t_return = getVal('h_t_return', 'Обратка (°C)');
    const velocity = getVal('h_pipe_velocity', 'Скорость воды (м/с)');
    const uf_area = document.getElementById('h_uf_area').value;
    const gsop = parseFloat(document.getElementById('h_gsop')?.value) || 0;

    if (wall_area === null || wall_thick === null || win_area === null || roof_area === null || roof_insul === null || floor_area === null || t_out === null || t_in === null || t_supply === null || t_return === null || velocity === null) return;

    document.getElementById('heat-results').style.display = 'block';
    document.getElementById('h-dashboard').innerHTML = '<p>Расчёт...</p>';

    const data = { t_outside: t_out, t_inside: t_in, wall_area, wall_mat: document.getElementById('h_wall_mat')?.value || 'brick_hollow', wall_thick, insul_mat: document.getElementById('h_insul_mat')?.value || 'minwool', insul_thick: parseFloat(insul_thick) || 0, window_area: win_area, window_type: document.getElementById('h_win_type')?.value || 'double_chamber', roof_area, roof_insul, floor_area, t_supply, t_return, connection_type: document.getElementById('h_connection_type')?.value || 'side', uf_area: parseFloat(uf_area) || 0, uf_spacing: parseFloat(document.getElementById('h_uf_spacing')?.value) || 150, pipe_velocity: velocity, gsop: gsop };
    lastData.heat = data;

    try {
        const resp = await fetch('/api/heating/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!resp.ok) { const errData = await resp.json(); throw new Error(errData.detail || 'Ошибка сервера'); }
        const r = await resp.json(); currentHeatData = r; lastResp.heat = r;

        const res = r.results; const corr = r.radiator_correction; const uf = r.underfloor_results; const hydr = r.hydraulics; const comp = res.compliance;

        let complianceHtml = '';
        if (gsop > 0 && comp) {
            const bgColor = comp.is_compliant ? '#f0fdf4' : '#fef2f2';
            const borderColor = comp.is_compliant ? '#22c55e' : '#ef4444';
            const icon = comp.is_compliant ? '✅' : '⚠️';
            complianceHtml = `<div class="result-box" style="background: ${bgColor}; border-color: ${borderColor}; grid-column: 1 / -1;"><h4 style="color: #1e293b;">Проверка энергоэффективности (СП 50.13330)</h4><div style="font-size: 16px; font-weight: 600; color: #1e293b; margin-top: 5px;">${icon} ${comp.message}</div><div style="font-size: 13px; color: #475569; margin-top: 5px;">Требуемое сопротивление R_треб = ${comp.r_req} (м²·°С)/Вт. Фактическое R_факт = ${res.r_wall} (м²·°С)/Вт.</div></div>`;
        }

        let ufHtml = '';
        if (uf) ufHtml = `<div class="result-box" style="background: #eff6ff; border-color: #bfdbfe;"><h4>Труба теплого пола</h4><div class="value">${uf.total_pipe_length} <span class="unit">м</span></div></div><div class="result-box" style="background: #eff6ff; border-color: #bfdbfe;"><h4>Контуров (петель)</h4><div class="value">${uf.num_loops} <span class="unit">шт</span></div></div>`;

        document.getElementById('h-dashboard').innerHTML = `
            ${complianceHtml}
            <div class="result-box"><h4>Теплопотери стен</h4><div class="value">${res.q_wall_w.toLocaleString('ru-RU')} <span class="unit">Вт</span></div></div>
            <div class="result-box"><h4>Общие с инфильтрацией</h4><div class="value">${res.total_with_infiltration_w.toLocaleString('ru-RU')} <span class="unit">Вт</span></div></div>
            <div class="result-box" style="background: var(--success-bg); border-color: var(--success-border);"><h4 style="color: var(--success);">Мощность котла</h4><div class="value" style="color: var(--success);">${res.boiler_power_kw} <span class="unit">кВт</span></div></div>
            <div class="result-box" style="background: #fdf4ff; border-color: #f0abfc;"><h4 style="color: #86198f;">Гидравлика (Труба)</h4><div class="value" style="color: #86198f;">Ду${hydr.selected_d_mm} <span class="unit">мм</span></div></div>
            <div class="result-box" style="background: #fdf4ff; border-color: #f0abfc;"><h4 style="color: #86198f;">Бак расширительный</h4><div class="value" style="color: #86198f;">${hydr.tank_volume_l} <span class="unit">л</span></div></div>
            ${ufHtml}
        `;

        // --- РАСШИРЕННАЯ МЕТОДИКА ОТОПЛЕНИЯ ---
        let hydrMethodology = `
            <div class="formula-block" style="background: #fdf4ff; border-left-color: #d946ef;">
                <b>10. Гидравлика системы отопления:</b><br>
                1. Расход теплоносителя: G = Q_сум / (c × Δt_системы)<br>
                G = ${res.total_with_infiltration_w} Вт / (4180 Дж/кг·°C × (${data.t_supply} - ${data.t_return})) = <b>${hydr.flow_m3h} м³/ч</b><br>
                2. Требуемый диаметр трубы: D = √(4 × G / (3600 × π × v))<br>
                D = √(4 × ${hydr.flow_m3h} / (3600 × 3.14 × ${data.pipe_velocity})) → принят стандартный <b>Ду${hydr.selected_d_mm} мм</b><br>
                3. Объем расширительного бака: V_бака = V_системы × 0.1 × 1.5<br>
                V_бака = ${hydr.tank_volume_l} литров (принят стандартный ближайший объем)<br>
                <span class="norm-ref">СП 60.13330.2020, СП 41-102-98</span>
            </div>
        `;

        let ufMethodology = uf ? `
            <div class="formula-block" style="background: #f0fdf4; border-left-color: #22c55e;">
                <b>11. Тёплый пол:</b><br>
                Длина трубы = (Площадь / Шаг укладки) × 1.1 (запас на повороты)<br>
                L = (${data.uf_area} / ${data.uf_spacing}) × 1.1 = <b>${uf.total_pipe_length} м</b><br>
                Количество петель = L / 80 м (макс. длина одной петли) = <b>${uf.num_loops} шт</b>
            </div>
        ` : '';

        let compMethodology = (gsop > 0 && comp) ? `
            <div class="formula-block" style="background: #eff6ff; border-left-color: #2563eb;">
                <b>Проверка энергоэффективности (СП 50.13330):</b><br>
                ГСОП (Градусо-сутки) = ${gsop}<br>
                Требуемое сопротивление: R_треб = 0.00035 × ГСОП + 1.4 = <b>${comp.r_req} (м²·°С)/Вт</b><br>
                Фактическое сопротивление стены: R_факт = <b>${res.r_wall} (м²·°С)/Вт</b><br>
                <b>Вывод:</b> ${comp.message}
            </div>
        ` : '';

        document.getElementById('h-methodology').innerHTML = `
            <div class="formula-block">
                <b>1. Сопротивление теплопередаче стены:</b><br>
                R_стены = 1/α_вн + δ_кирпича/λ_кирпича + δ_утеплителя/λ_утеплителя + 1/α_нар<br>
                R_стены = 1/8.7 + ${data.wall_thick}/${data.wall_mat === 'brick_hollow' ? '0.35' : '0.56'} + ${data.insul_thick}/0.04 + 1/23 = <b>${res.r_wall} (м²·°С)/Вт</b>
            </div>
            <div class="formula-block">
                <b>2. Теплопотери через стены:</b><br>
                Q_стен = S_стен × (t_вн - t_нар) / R_стены<br>
                Q_стен = ${data.wall_area} × (${data.t_inside} - (${data.t_outside})) / ${res.r_wall} = <b>${res.q_wall_w} Вт</b>
            </div>
            <div class="formula-block">
                <b>3. Теплопотери через окна:</b><br>
                R_окон = ${data.window_type === 'double_chamber' ? '0.45' : (data.window_type === 'single_chamber' ? '0.32' : '0.55')} (м²·°С)/Вт<br>
                Q_окон = ${data.win_area} × (${data.t_inside} - (${data.t_outside})) / ${data.window_type === 'double_chamber' ? '0.45' : (data.window_type === 'single_chamber' ? '0.32' : '0.55')} = <b>${res.q_window_w} Вт</b>
            </div>
            <div class="formula-block">
                <b>4. Теплопотери через крышу и пол:</b><br>
                Q_крыши = ${res.q_roof_w} Вт (R = ${(data.roof_insul > 0 ? (1/8.7 + data.roof_insul/0.04 + 1/23).toFixed(2) : '3.00')} (м²·°С)/Вт)<br>
                Q_пола = ${res.q_floor_w} Вт (R = 3.0 (м²·°С)/Вт)
            </div>
            <div class="formula-block" style="background: #eff6ff; border-left-color: #2563eb;">
                <b>5. Суммарные трансмиссионные потери:</b><br>
                Q_транс = Q_стен + Q_окон + Q_крыши + Q_пола = <b>${res.total_loss_w} Вт</b><br>
                <b>6. Потери с инфильтрацией (+10%):</b><br>
                Q_инф = Q_транс × 1.10 = <b>${res.total_with_infiltration_w} Вт</b>
            </div>
            <div class="formula-block" style="background: #fffbeb; border-left-color: #f59e0b;">
                <b>7. Требуемая мощность котла (+15% запас):</b><br>
                Q_котла = Q_инф × 1.15 = ${res.total_with_infiltration_w} × 1.15 = <b>${res.boiler_power_kw} кВт</b>
            </div>
            <div class="formula-block">
                <b>8. Поправка на радиаторы (пересчет с 90/70 на фактические температуры):</b><br>
                Δt_ном = (90+70)/2 - 20 = 60°C<br>
                Δt_факт = (${data.t_supply}+${data.t_return})/2 - ${data.t_inside} = ${corr.dt_actual}°C<br>
                Коэффициент = (${corr.dt_actual} / 60)^1.3 = <b>${corr.power_factor.toFixed(2)}</b><br>
                (Это значит, что радиатор нужно брать мощнее в ${(1/corr.power_factor).toFixed(2)} раза)
            </div>
            <div class="formula-block">
                <b>9. Поправка на схему подключения:</b><br>
                Коэффициент подключения: ${data.connection_type === 'side' ? '1.0 (боковое)' : (data.connection_type === 'diagonal' ? '1.0 (диагональное)' : '0.85 (нижнее)')}
            </div>
            ${compMethodology}
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
    if (!grouped['boiler'] && !grouped['radiator'] && !grouped['pump']) catalog.innerHTML += `<div class="warn-box">⚠️ Оборудование для заданных параметров не найдено в каталоге.</div>`;

    ['boiler', 'radiator', 'pump'].forEach(cat => {
        if (!grouped[cat] || grouped[cat].length === 0) return;
        const minPrice = Math.min(...grouped[cat].map(i => i.price_rub));
        catalog.innerHTML += `<div class="category-header"><h3>${names[cat]}</h3></div><div class="solutions-grid" id="grid-heat-${cat}"></div>`;
        const grid = document.getElementById(`grid-heat-${cat}`);
        grouped[cat].forEach(s => {
            const isBest = s.price_rub === minPrice;
            let specText = s.category === 'pump' ? `Расход: до 3.5 м³/ч` : `Мощность: ${s.power_kw} кВт`;
            if (s.category === 'radiator') specText = `Мощность: ${s.power_kw} кВт (паспорт) / ${(s.power_kw * currentHeatData.radiator_correction.power_factor).toFixed(1)} кВт (реал)`;
            grid.innerHTML += `<div class="sol-card ${isBest ? 'best-choice' : ''}">${isBest ? '<div class="best-badge">Выгодный выбор</div>' : ''}<div class="sol-title">${s.model}</div><div class="sol-brand">${s.brand} | ${s.type}</div><div class="sol-specs"><span class="sol-spec">${specText}</span></div><div class="sol-price">${s.price_rub.toLocaleString('ru-RU')} ₽</div><a href="${s.url}" target="_blank" class="sol-link">Найти на сайте</a></div>`;
        });
    });
}