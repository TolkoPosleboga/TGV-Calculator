const debouncedCalcCondensation = debounce(() => { if(typeof calcCondensation === 'function') calcCondensation(); }, 600);
const debouncedCalcHumidity = debounce(() => { if(typeof calcHumidity === 'function') calcHumidity(); }, 600);

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

function syncHumidityData() {
    const w = parseFloat(document.getElementById('v_moisture')?.value) || 0;
    const l = parseFloat(document.getElementById('v_max_air')?.value) || 1000;
    const t = parseFloat(document.getElementById('v_t_in')?.value) || 20;

    document.getElementById('hum_w').value = w;
    document.getElementById('hum_l').value = l;
    document.getElementById('hum_t_exh').value = t;

    ['hum_w', 'hum_l', 'hum_t_exh'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

async function calcCondensation() {
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
                <h4>Точка росы (t_росы) <span class="info-icon" data-tooltip="Температура, при которой пар начинает конденсироваться"></span></h4>
                <div class="value">${r.dew_point} <span class="unit">°C</span></div>
            </div>
            <div class="result-box">
                <h4>Температура на стенке <span class="info-icon" data-tooltip="Температура внутренней поверхности воздуховода с учетом текущего утеплителя"></span></h4>
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
                <h4>Влагосодержание d <span class="info-icon" data-tooltip="d = d_прит + W / (ρ × L)"></span></h4>
                <div class="value">${r.d_exhaust_g_kg} <span class="unit">г/кг</span></div>
            </div>
            <div class="result-box best">
                <h4>Относительная влажность φ <span class="info-icon" data-tooltip="Расчёт по давлению насыщения при температуре t"></span></h4>
                <div class="value">${r.humidity_exhaust_pct} <span class="unit">%</span></div>
            </div>
        `;
    } catch (e) {
        document.getElementById('humidity-dashboard').innerHTML = `<div class="warn-box" style="grid-column: 1 / -1; margin: 0;"><b>Ошибка:</b> ${e.message}</div>`;
    }
}

document.addEventListener('input', (e) => {
    if (e.target.id && e.target.id.startsWith('ext_cond_')) {
        debouncedCalcCondensation();
    }
    if (e.target.id && (e.target.id.startsWith('hum_') || e.target.id === 'v_moisture' || e.target.id === 'v_max_air')) {
        debouncedCalcHumidity();
    }
});