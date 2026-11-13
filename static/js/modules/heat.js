async function calcHeat(isAuto = false) {
    isAutoCalc = isAuto;

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

    if (wall_area === null || wall_thick === null || win_area === null || roof_area === null || roof_insul === null || floor_area === null || t_out === null || t_in === null || t_supply === null || t_return === null || velocity === null) {
        isAutoCalc = false;
        return;
    }

    document.getElementById('heat-results').style.display = 'block';
    document.getElementById('h-dashboard').innerHTML = '<p>Расчёт...</p>';

    const data = {
        t_outside: t_out, t_inside: t_in, wall_area,
        wall_mat: document.getElementById('h_wall_mat')?.value || 'brick_hollow',
        wall_thick, insul_mat: document.getElementById('h_insul_mat')?.value || 'minwool',
        insul_thick: parseFloat(insul_thick) || 0, window_area: win_area,
        window_type: document.getElementById('h_win_type')?.value || 'double_chamber',
        roof_area, roof_insul, floor_area, t_supply, t_return,
        connection_type: document.getElementById('h_connection_type')?.value || 'side',
        uf_area: parseFloat(uf_area) || 0,
        uf_spacing: parseFloat(document.getElementById('h_uf_spacing')?.value) || 150,
        pipe_velocity: velocity, gsop: gsop
    };
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
            const statusText = comp.is_compliant ? 'Соответствует' : 'Не соответствует';
            complianceHtml = `
                <div class="result-box" style="background: ${bgColor}; border-color: ${borderColor}; grid-column: 1 / -1;">
                    <h4 style="color: #1e293b;">Проверка энергоэффективности (СП 50.13330) <span class="info-icon" data-tooltip="R_треб = 0.00035 × ГСОП + 1.4"></span></h4>
                    <div style="font-size: 16px; font-weight: 600; color: #1e293b; margin-top: 5px;">${statusText}: ${comp.message}</div>
                    <div style="font-size: 13px; color: #475569; margin-top: 5px;">Требуемое сопротивление R_треб = ${comp.r_req} (м²·°С)/Вт. Фактическое R_факт = ${res.r_wall} (м²·°С)/Вт.</div>
                </div>
            `;
        }

        let hydrDash = '';
        let hydrMethodology = '';

        if (hydr.error) {
            hydrDash = `<div class="result-box" style="background: #fef2f2; border-color: #ef4444;"><h4 style="color: #dc2626;">Гидравлика</h4><div class="value" style="color: #dc2626; font-size: 14px;">Ошибка Δt</div></div>`;
            hydrMethodology = `<div class="formula-block" style="background: #fef2f2; border-left-color: #dc2626;"><b>10. Гидравлика системы отопления:</b><br><span style="color:red">Ошибка: ${hydr.error}. Проверьте температуры подачи и обратки.</span></div>`;
        } else {
            hydrDash = `
                <div class="result-box" style="background: #fdf4ff; border-color: #f0abfc;">
                    <h4 style="color: #86198f;">Гидравлика (Труба) <span class="info-icon" data-tooltip="D = √(4 × G / (3600 × π × v))"></span></h4>
                    <div class="value" style="color: #86198f;">Ду${hydr.selected_d_mm} <span class="unit">мм</span></div>
                </div>
                <div class="result-box" style="background: #fdf4ff; border-color: #f0abfc;">
                    <h4 style="color: #86198f;">Бак расширительный <span class="info-icon" data-tooltip="V_бака = V_системы × 0.1 × 1.5"></span></h4>
                    <div class="value" style="color: #86198f;">${hydr.tank_volume_l} <span class="unit">л</span></div>
                </div>
            `;
            hydrMethodology = `
                <div class="formula-block" style="background: #fdf4ff; border-left-color: #d946ef;">
                    <b>10. Гидравлика системы отопления:</b><br>
                    $$ G = \\frac{Q_{\\text{сум}}}{c \\times \\Delta t_{\\text{системы}}} = \\frac{${res.total_with_infiltration_w}}{4180 \\times (${data.t_supply} - ${data.t_return})} = \\mathbf{${hydr.flow_m3h} \\text{ м}^3/\\text{ч}} $$
                    $$ D = \\sqrt{\\frac{4 \\times G}{3600 \\times \\pi \\times v}} \\to \\text{принят стандартный } \\mathbf{\\text{Ду}${hydr.selected_d_mm} \\text{ мм}} $$
                    $$ V_{\\text{бака}} = V_{\\text{системы}} \\times 0.1 \\times 1.5 = \\mathbf{${hydr.tank_volume_l} \\text{ л}} $$
                    <span class="sp-badge">СП 60.13330.2020, СП 41-102-98</span>
                </div>
            `;
        }

        let ufHtml = '';
        let ufMethodology = '';

        if (uf) {
            if (uf.error) {
                ufHtml = `<div class="result-box" style="background: #fef2f2; border-color: #ef4444; grid-column: 1 / -1;"><h4 style="color: #dc2626;">Тёплый пол</h4><div class="value" style="color: #dc2626; font-size: 14px;">${uf.error}</div></div>`;
                ufMethodology = `<div class="formula-block" style="background: #fef2f2; border-left-color: #dc2626;"><b>11. Тёплый пол:</b><br><span style="color:red">Ошибка: ${uf.error}</span></div>`;
            } else {
                ufHtml = `
                    <div class="result-box" style="background: #eff6ff; border-color: #bfdbfe;">
                        <h4>Труба теплого пола <span class="info-icon" data-tooltip="L = (S / шаг) × 1.1"></span></h4>
                        <div class="value">${uf.total_pipe_length} <span class="unit">м</span></div>
                    </div>
                    <div class="result-box" style="background: #eff6ff; border-color: #bfdbfe;">
                        <h4>Контуров (петель) <span class="info-icon" data-tooltip="N = L / 80 м (макс. длина петли)"></span></h4>
                        <div class="value">${uf.num_loops} <span class="unit">шт</span></div>
                    </div>
                `;
                ufMethodology = `
                    <div class="formula-block" style="background: #f0fdf4; border-left-color: #22c55e;">
                        <b>11. Тёплый пол:</b><br>
                        $$ L = \\frac{S_{\\text{пола}}}{\\text{шаг}} \\times 1.1 = \\frac{${data.uf_area}}{${data.uf_spacing}} \\times 1.1 = \\mathbf{${uf.total_pipe_length} \\text{ м}} $$
                        $$ \\text{Количество петель} = \\frac{L}{80} = \\mathbf{${uf.num_loops} \\text{ шт}} $$
                    </div>
                `;
            }
        }

        document.getElementById('h-dashboard').innerHTML = `
            ${complianceHtml}
            <div class="result-box">
                <h4>Теплопотери стен <span class="info-icon" data-tooltip="Q_стен = S_стен × (t_вн - t_нар) / R_стены"></span></h4>
                <div class="value">${res.q_wall_w.toLocaleString('ru-RU')} <span class="unit">Вт</span></div>
            </div>
            <div class="result-box">
                <h4>Общие с инфильтрацией <span class="info-icon" data-tooltip="Q_инф = Q_транс × 1.10"></span></h4>
                <div class="value">${res.total_with_infiltration_w.toLocaleString('ru-RU')} <span class="unit">Вт</span></div>
            </div>
            <div class="result-box" style="background: var(--success-bg); border-color: var(--success-border);">
                <h4 style="color: var(--success);">Мощность котла <span class="info-icon" data-tooltip="Q_котла = Q_инф × 1.15 (запас)"></span></h4>
                <div class="value" style="color: var(--success);">${res.boiler_power_kw} <span class="unit">кВт</span></div>
            </div>
            ${hydrDash}
            ${ufHtml}
        `;

        let compMethodology = (gsop > 0 && comp) ? `
            <div class="formula-block" style="background: #eff6ff; border-left-color: #2563eb;">
                <b>Проверка энергоэффективности:</b><br>
                ГСОП = ${gsop}<br>
                $$ R_{\\text{треб}} = 0.00035 \\times \\text{ГСОП} + 1.4 = \\mathbf{${comp.r_req} \\text{ (м}^2\\cdot^\\circ\\text{C)/Вт}} $$
                $$ R_{\\text{факт}} = \\mathbf{${res.r_wall} \\text{ (м}^2\\cdot^\\circ\\text{C)/Вт}} $$
                <b>Вывод:</b> ${comp.message}
                <span class="sp-badge">СП 50.13330</span>
            </div>
        ` : '';

        const methodologyContainer = document.getElementById('h-methodology');
        methodologyContainer.innerHTML = `
            <div class="formula-block">
                <b>1. Сопротивление теплопередаче стены:</b><br>
                $$ R_{\\text{стены}} = \\frac{1}{\\alpha_{\\text{вн}}} + \\frac{\\delta_{\\text{кирпича}}}{\\lambda_{\\text{кирпича}}} + \\frac{\\delta_{\\text{утеплителя}}}{\\lambda_{\\text{утеплителя}}} + \\frac{1}{\\alpha_{\\text{нар}}} $$
                $$ R_{\\text{стены}} = \\frac{1}{8.7} + \\frac{${data.wall_thick}}{${data.wall_mat === 'brick_hollow' ? '0.35' : '0.56'}} + \\frac{${data.insul_thick}}{0.04} + \\frac{1}{23} = \\mathbf{${res.r_wall} \\text{ (м}^2\\cdot^\\circ\\text{C)/Вт}} $$
            </div>
            <div class="formula-block">
                <b>2. Теплопотери через стены:</b><br>
                $$ Q_{\\text{стен}} = \\frac{S_{\\text{стен}} \\times (t_{\\text{вн}} - t_{\\text{нар}})}{R_{\\text{стены}}} = \\frac{${data.wall_area} \\times (${data.t_inside} - (${data.t_outside}))}{${res.r_wall}} = \\mathbf{${res.q_wall_w} \\text{ Вт}} $$
            </div>
            <div class="formula-block">
                <b>3. Теплопотери через окна:</b><br>
                $$ R_{\\text{окон}} = ${data.window_type === 'double_chamber' ? '0.45' : (data.window_type === 'single_chamber' ? '0.32' : '0.55')} \\text{ (м}^2\\cdot^\\circ\\text{C)/Вт} $$
                $$ Q_{\\text{окон}} = \\frac{S_{\\text{окон}} \\times (t_{\\text{вн}} - t_{\\text{нар}})}{R_{\\text{окон}}} = \\frac{${data.window_area} \\times (${data.t_inside} - (${data.t_outside}))}{${data.window_type === 'double_chamber' ? '0.45' : (data.window_type === 'single_chamber' ? '0.32' : '0.55')}} = \\mathbf{${res.q_window_w} \\text{ Вт}} $$
            </div>
            <div class="formula-block">
                <b>4. Теплопотери через крышу и пол:</b><br>
                $$ Q_{\\text{крыши}} = ${res.q_roof_w} \\text{ Вт (R = ${(data.roof_insul > 0 ? (1/8.7 + data.roof_insul/0.04 + 1/23).toFixed(2) : '3.00')} (м}^2\\cdot^\\circ\\text{C)/Вт)} $$
                $$ Q_{\\text{пола}} = ${res.q_floor_w} \\text{ Вт (R = 3.0)} $$
            </div>
            <div class="formula-block" style="background: #eff6ff; border-left-color: #2563eb;">
                <b>5. Суммарные трансмиссионные потери:</b><br>
                $$ Q_{\\text{транс}} = Q_{\\text{стен}} + Q_{\\text{окон}} + Q_{\\text{крыши}} + Q_{\\text{пола}} = \\mathbf{${res.total_loss_w} \\text{ Вт}} $$
                <b>6. Потери с инфильтрацией (+10%):</b><br>
                $$ Q_{\\text{инф}} = Q_{\\text{транс}} \\times 1.10 = \\mathbf{${res.total_with_infiltration_w} \\text{ Вт}} $$
            </div>
            <div class="formula-block" style="background: #fffbeb; border-left-color: #f59e0b;">
                <b>7. Требуемая мощность котла (+15% запас):</b><br>
                $$ Q_{\\text{котла}} = Q_{\\text{инф}} \\times 1.15 = ${res.total_with_infiltration_w} \\times 1.15 = \\mathbf{${res.boiler_power_kw} \\text{ кВт}} $$
            </div>
            <div class="formula-block">
                <b>8. Поправка на радиаторы:</b><br>
                $$ \\Delta t_{\\text{ном}} = \\frac{90+70}{2} - 20 = 60^\\circ\\text{C} $$
                $$ \\Delta t_{\\text{факт}} = \\frac{${data.t_supply}+${data.t_return}}{2} - ${data.t_inside} = ${corr.dt_actual}^\\circ\\text{C} $$
                $$ \\text{Коэффициент} = \\left(\\frac{\\Delta t_{\\text{факт}}}{60}\\right)^{1.3} = \\mathbf{${corr.power_factor.toFixed(2)}} $$
            </div>
            <div class="formula-block">
                <b>9. Поправка на схему подключения:</b><br>
                Коэффициент подключения: ${data.connection_type === 'side' ? '1.0 (боковое)' : (data.connection_type === 'diagonal' ? '1.0 (диагональное)' : '0.85 (нижнее)')}
            </div>
            ${compMethodology}
            ${hydrMethodology}
            ${ufMethodology}
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

        document.getElementById('h-report').textContent = r.report;
        renderHeatCatalog();
    } catch (e) {
        if (!isAutoCalc) alert(e.message);
        else console.error(e.message);
    } finally {
        isAutoCalc = false;
    }
}

function renderHeatCatalog() {
    if (!currentHeatData) return;
    const catalog = document.getElementById('h-catalog');
    const sortEl = document.getElementById('h_sort');
    const sortType = sortEl ? sortEl.value : 'price_asc';

    catalog.innerHTML = '';

    if (currentHeatData.requires_professional) {
        let missingHtml = currentHeatData.missing.map(m => {
            if (m.category === "Котёл") return `• Котёл (Требуется: ${m.power} кВт)`;
            if (m.category === "Радиатор") return `• Радиатор (${m.power_factor})`;
            if (m.category === "Насос") return `• Насос (${m.power_factor})`;
            return `• ${m.category}`;
        }).join('<br>');

        catalog.innerHTML += `
            <div class="prof-warning">
                <h3>Требуется профессиональный подбор</h3>
                <p>В нашем каталоге не нашлось готового оборудования для заданных параметров. Обратитесь к проектировщику или напрямую к производителю (например, Buderus, De Dietrich) для индивидуального заказа.</p>
                <div class="prof-missing-list">
                    <b>Недостающие позиции:</b><br>${missingHtml}
                </div>
            </div>
        `;
    }

    let items = [...currentHeatData.solutions];
    if (sortType === 'price_asc') items.sort((a, b) => a.price_rub - b.price_rub);
    else if (sortType === 'price_desc') items.sort((a, b) => b.price_rub - a.price_rub);
    else if (sortType === 'brand') items.sort((a, b) => a.brand.localeCompare(b.brand));

    const grouped = { boiler: [], radiator: [], pump: [] };
    items.forEach(s => { if (grouped[s.category]) grouped[s.category].push(s); });
    const names = { boiler: "Газовые котлы", radiator: "Радиаторы отопления", pump: "Циркуляционные насосы" };

    ['boiler', 'radiator', 'pump'].forEach(cat => {
        if (!grouped[cat] || grouped[cat].length === 0) return;
        const minPrice = Math.min(...grouped[cat].map(i => i.price_rub));
        catalog.innerHTML += `<div class="category-header"><h3>${names[cat]}</h3></div><div class="solutions-grid" id="grid-heat-${cat}"></div>`;
        const grid = document.getElementById(`grid-heat-${cat}`);

        grouped[cat].forEach(s => {
            const isBest = s.price_rub === minPrice;
            const isIndustrial = s.segment === 'industrial';
            const industrialBadge = isIndustrial ? `<div class="industrial-badge">Промышленный</div>` : '';

            let specText = s.category === 'pump' ? `Расход: до 3.5 м³/ч` : `Мощность: ${s.power_kw} кВт`;
            if (s.category === 'radiator') specText = `Мощность: ${s.power_kw} кВт (паспорт) / ${(s.power_kw * currentHeatData.radiator_correction.power_factor).toFixed(1)} кВт (реал)`;

            grid.innerHTML += `
                <div class="sol-card ${isBest ? 'best-choice' : ''}">
                    ${isBest ? '<div class="best-badge">Выгодный выбор</div>' : ''}
                    ${industrialBadge}
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