const debouncedCalcCondensation = debounce(() => { if(typeof calcCondensation === 'function') calcCondensation(); }, 600);
const debouncedCalcHumidity = debounce(() => { if(typeof calcHumidity === 'function') calcHumidity(); }, 600);

// Функция автоматического заполнения
function updateVentExtAutoData() {
    // 1. Всегда тянем климатологию (даже если нет расчета вентиляции)
    const t_out = parseFloat(document.getElementById('v_t_out')?.value) || -20;
    const tw_in = parseFloat(document.getElementById('h_t_supply')?.value) || 90;
    const tw_out = parseFloat(document.getElementById('h_t_return')?.value) || 70;

    document.getElementById('wh_t_in').value = t_out;
    document.getElementById('wh_tw_in').value = tw_in;
    document.getElementById('wh_tw_out').value = tw_out;

    // 2. Если есть результаты расчета вентиляции, подтягиваем расход и диаметр
    if (typeof lastResp !== 'undefined' && lastResp.vent && lastResp.vent.air_exchange) {
        const L = lastResp.vent.air_exchange.L_max_m3h;

        document.getElementById('wh_l').value = L;
        document.getElementById('dp_l').value = L;

        if (lastResp.vent.pressure_loss && lastResp.vent.pressure_loss.primary_duct) {
            const duct = lastResp.vent.pressure_loss.primary_duct;
            let D = 200;
            if (duct.shape === 'round') D = duct.diameter_mm;
            else if (duct.width_mm && duct.height_mm) D = Math.round(Math.sqrt(duct.width_mm * duct.height_mm));
            document.getElementById('dp_d').value = D;
        }
    }

    // Запускаем пересчет
    if (typeof calcWaterHeater === 'function') calcWaterHeater();
    if (typeof calcDiaphragm === 'function') calcDiaphragm();
}

// Вешаем событие на переключение вкладки
document.addEventListener('DOMContentLoaded', () => {
    const tabBtn = document.getElementById('btn-vent-ext');
    if (tabBtn) {
        tabBtn.addEventListener('click', updateVentExtAutoData);
    }
});

// Если пользователь поменял город или температуры, обновляем калорифер
document.addEventListener('input', (e) => {
    if (e.target.id === 'v_t_out' || e.target.id === 'h_t_supply' || e.target.id === 'h_t_return') {
        if (document.getElementById('tab-vent-ext') && document.getElementById('tab-vent-ext').classList.contains('active')) {
            updateVentExtAutoData();
        }
    }
});

function syncCondensationData() {
    const t_in = parseFloat(document.getElementById('v_t_in')?.value) || 20;
    const roomType = document.getElementById('v_room_type')?.value || 'office';

    let hum = 50;
    if (roomType === 'bathroom') hum = 70;
    else if (roomType === 'kitchen') hum = 60;
    else if (roomType === 'sport') hum = 75;
    else if (roomType === 'industrial_light' || roomType === 'industrial_heavy') hum = 55;

    document.getElementById('ext_cond_t_air').value = t_in;
    document.getElementById('ext_cond_hum').value = hum;

    ['ext_cond_t_air', 'ext_cond_hum'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

async function calcCondensation() {
    // ... (без изменений)
    const t_air = parseFloat(document.getElementById('ext_cond_t_air').value) || 25;
    const hum = parseFloat(document.getElementById('ext_cond_hum').value) || 60;
    const t_out = parseFloat(document.getElementById('ext_cond_t_out').value) || -20;
    const insul = parseFloat(document.getElementById('ext_cond_insul').value) || 0;

    document.getElementById('ext-cond-results').style.display = 'block';
    document.getElementById('ext-cond-dashboard').innerHTML = '<p>Расчёт...</p>';

    const data = { t_exhaust: t_air, humidity: hum, t_out: t_out, insul_thick_mm: insul };

    try {
        const resp = await fetch('/api/vent_extra/condensation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!resp.ok) throw new Error('Ошибка сервера');
        const r = await resp.json();

        const isOk = !r.is_condensation;
        const bgColor = isOk ? '#f0fdf4' : '#fef2f2';
        const borderColor = isOk ? '#22c55e' : '#ef4444';
        const statusText = isOk ? 'Конденсата нет (ОК)' : 'Выпадает конденсат!';

        let solutionHtml = '';
        if (!isOk) {
            solutionHtml = `
                <div style="margin-top: 10px; font-size: 14px; color: #991b1b;">
                    Требуемая толщина утеплителя (минвата): <b>${r.req_insul_mm} мм</b>.
                </div>
            `;
        }

        document.getElementById('ext-cond-dashboard').innerHTML = `
            <div class="result-box">
                <h4>Точка росы (t_росы)</h4>
                <div class="value">${r.dew_point} <span class="unit">°C</span></div>
            </div>
            <div class="result-box">
                <h4>Температура на стенке</h4>
                <div class="value">${r.surface_temp} <span class="unit">°C</span></div>
            </div>
            <div class="result-box" style="background: ${bgColor}; border-color: ${borderColor}; grid-column: span 2;">
                <h4 style="color: ${isOk ? '#166534' : '#991b1b'};">${statusText}</h4>
                ${solutionHtml}
            </div>
        `;
    } catch (e) {
        document.getElementById('ext-cond-dashboard').innerHTML = `<div class="warn-box" style="grid-column: 1 / -1; margin: 0;"><b>Ошибка:</b> ${e.message}</div>`;
    }
}

async function calcHumidity() {
    // ... (без изменений)
    const w = parseFloat(document.getElementById('hum_w').value) || 0;
    const l = parseFloat(document.getElementById('hum_l').value) || 1000;
    const t = parseFloat(document.getElementById('hum_t_exh').value) || 22;

    document.getElementById('humidity-results').style.display = 'block';
    document.getElementById('humidity-dashboard').innerHTML = '<p>Расчёт...</p>';

    const data = { W_g_h: w, L_m3h: l, t_exhaust: t, d_supply_g_kg: 0.0 };

    try {
        const resp = await fetch('/api/vent_extra/humidity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!resp.ok) throw new Error('Ошибка сервера');
        const r = await resp.json();

        document.getElementById('humidity-dashboard').innerHTML = `
            <div class="result-box">
                <h4>Влагосодержание d</h4>
                <div class="value">${r.d_exhaust_g_kg} <span class="unit">г/кг</span></div>
            </div>
            <div class="result-box best">
                <h4>Относительная влажность φ</h4>
                <div class="value">${r.humidity_exhaust_pct} <span class="unit">%</span></div>
            </div>
        `;
    } catch (e) {
        document.getElementById('humidity-dashboard').innerHTML = `<div class="warn-box" style="grid-column: 1 / -1; margin: 0;"><b>Ошибка:</b> ${e.message}</div>`;
    }
}

async function calcWaterHeater() {
    const l = parseFloat(document.getElementById('wh_l').value) || 0;
    const t_in = parseFloat(document.getElementById('wh_t_in').value) || 0;
    const t_out = parseFloat(document.getElementById('wh_t_out').value) || 0;
    const tw_in = parseFloat(document.getElementById('wh_tw_in').value) || 0;
    const tw_out = parseFloat(document.getElementById('wh_tw_out').value) || 0;

    if (l === 0 || tw_in <= tw_out || t_out <= t_in) return;

    document.getElementById('water-heater-results').style.display = 'block';
    document.getElementById('water-heater-dashboard').innerHTML = '<p>Расчёт...</p>';

    const data = { L_m3h: l, t_air_in: t_in, t_air_out: t_out, t_w_in: tw_in, t_w_out: tw_out };

    try {
        const resp = await fetch('/api/vent_extra/water_heater', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!resp.ok) { const err = await resp.json(); throw new Error(err.detail); }
        const r = await resp.json();

        let warnHtml = r.warning ? `<div class="warn-box" style="grid-column: span 2; margin-top: 10px;">${r.warning}</div>` : '';

        document.getElementById('water-heater-dashboard').innerHTML = `
            <div class="result-box best" style="background: var(--success-bg); border-color: var(--success-border);">
                <h4 style="color: var(--success);">Требуемая мощность <span class="info-icon" data-tooltip="Q = L × ρ × c × Δt / 3600"></span></h4>
                <div class="value" style="color: var(--success);">${r.q_kw} <span class="unit">кВт</span></div>
            </div>
            <div class="result-box">
                <h4>Расход воды</h4>
                <div class="value">${r.g_w_m3h} <span class="unit">м³/ч</span></div>
            </div>
            <div class="result-box">
                <h4>Скорость воды</h4>
                <div class="value">${r.v_water} <span class="unit">м/с</span></div>
            </div>
            ${warnHtml}
        `;

        const methContainer = document.getElementById('wh-methodology');
        methContainer.innerHTML = `
            <div class="formula-block">
                <b>1. Тепловая мощность калорифера:</b><br>
                $$ Q = \\frac{L \\times \\rho \\times c \\times (t_{\\text{вых}} - t_{\\text{вх}})}{3600} $$
                $$ Q = \\frac{${l} \\times 1.2 \\times 1.005 \\times (${t_out} - (${t_in}))}{3600} = \\mathbf{${r.q_kw} \\text{ кВт}} $$
                <span class="norm-ref">СП 60.13330.2020</span>
            </div>
            <div class="formula-block">
                <b>2. Расход греющей воды:</b><br>
                $$ G = \\frac{3.6 \\times Q}{c_w \\times (t_{w\\text{вх}} - t_{w\\text{вых}})} $$
                $$ G = \\frac{3.6 \\times ${r.q_kw}}{4.18 \\times (${tw_in} - ${tw_out})} = \\mathbf{${r.g_w_m3h} \\text{ м}^3/\\text{ч}} $$
            </div>
        `;
        if (window.renderMathInElement) {
            renderMathInElement(methContainer, { delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}], throwOnError: false });
        }

    } catch (e) {
        document.getElementById('water-heater-dashboard').innerHTML = `<div class="warn-box" style="grid-column: 1 / -1; margin: 0;"><b>Ошибка:</b> ${e.message}</div>`;
    }
}

async function calcDiaphragm() {
    const dp = parseFloat(document.getElementById('dp_dp').value) || 0;
    const d = parseFloat(document.getElementById('dp_d').value) || 0;
    const l = parseFloat(document.getElementById('dp_l').value) || 0;

    if (l === 0 || d === 0 || dp <= 0) return;

    document.getElementById('diaphragm-results').style.display = 'block';
    document.getElementById('diaphragm-dashboard').innerHTML = '<p>Расчёт...</p>';

    const data = { dP_pa: dp, D_mm: d, L_m3h: l };

    try {
        const resp = await fetch('/api/vent_extra/diaphragm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!resp.ok) { const err = await resp.json(); throw new Error(err.detail); }
        const r = await resp.json();

        let warnHtml = r.warning ? `<div class="warn-box" style="grid-column: span 2; margin-top: 10px;">${r.warning}</div>` : '';

        document.getElementById('diaphragm-dashboard').innerHTML = `
            <div class="result-box best" style="background: #eff6ff; border-color: #bfdbfe;">
                <h4 style="color: #1e3a8a;">Диаметр отверстия</h4>
                <div class="value" style="color: #1e3a8a;">${r.d_hole_mm} <span class="unit">мм</span></div>
            </div>
            <div class="result-box">
                <h4>Коэффициент ζ</h4>
                <div class="value">${r.zeta}</div>
            </div>
            <div class="result-box">
                <h4>Скорость в воздуховоде</h4>
                <div class="value">${r.velocity} <span class="unit">м/с</span></div>
            </div>
            ${warnHtml}
        `;

        const methContainer = document.getElementById('dp-methodology');
        methContainer.innerHTML = `
            <div class="formula-block">
                <b>1. Скорость воздуха в сечении:</b><br>
                $$ v = \\frac{L}{3600 \\times F} = \\frac{${l}}{3600 \\times \\frac{\\pi \\times ${d}^2}{4 \\times 10^6}} = \\mathbf{${r.velocity} \\text{ м/с}} $$
            </div>
            <div class="formula-block">
                <b>2. Динамическое давление:</b><br>
                $$ P_d = \\frac{\\rho v^2}{2} = \\frac{1.2 \\times ${r.velocity}^2}{2} = \\mathbf{${r.Pd} \\text{ Па}} $$
            </div>
            <div class="formula-block" style="background: #eff6ff; border-left-color: #2563eb;">
                <b>3. Требуемый коэффициент сопротивления и диаметр шайбы:</b><br>
                $$ \\zeta = \\frac{\\Delta P}{P_d} = \\frac{${dp}}{${r.Pd}} = \\mathbf{${r.zeta}} $$
                $$ d_{\\text{отв}} = \\frac{D}{\\sqrt{\\sqrt{\\zeta} + 1}} = \\frac{${d}}{\\sqrt{\\sqrt{${r.zeta}} + 1}} = \\mathbf{${r.d_hole_mm} \\text{ мм}} $$
                <span class="norm-ref">Справочник проектировщика</span>
            </div>
        `;
        if (window.renderMathInElement) {
            renderMathInElement(methContainer, { delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}], throwOnError: false });
        }

    } catch (e) {
        document.getElementById('diaphragm-dashboard').innerHTML = `<div class="warn-box" style="grid-column: 1 / -1; margin: 0;"><b>Ошибка:</b> ${e.message}</div>`;
    }
}

document.addEventListener('input', (e) => {
    if (e.target.id && e.target.id.startsWith('ext_cond_')) debouncedCalcCondensation();
    if (e.target.id && e.target.id.startsWith('hum_')) debouncedCalcHumidity();
    if (e.target.id && e.target.id.startsWith('wh_')) {
        if (typeof calcWaterHeater === 'function') calcWaterHeater();
    }
    if (e.target.id && e.target.id.startsWith('dp_')) {
        if (typeof calcDiaphragm === 'function') calcDiaphragm();
    }
});