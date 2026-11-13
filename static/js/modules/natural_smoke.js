function syncSmokeData() {
    const t_in = parseFloat(document.getElementById('v_t_in')?.value) || 20;
    const t_out = parseFloat(document.getElementById('v_t_out')?.value) || -20;
    const h_floor = parseFloat(document.getElementById('v_height')?.value) || 3.0;
    const h_shaft = (h_floor + 0.3).toFixed(1);

    const ductArea = 0.04;

    let zetaVal = 2.5;
    const firstResZeta = document.querySelector('.vent-section-box .res-zeta');
    if (firstResZeta) {
        const parsedZeta = parseFloat(firstResZeta.value);
        if (!isNaN(parsedZeta) && parsedZeta > 0.5) {
            zetaVal = parsedZeta;
        }
    }

    document.getElementById('nv_t_in').value = t_in;
    document.getElementById('nv_t_out').value = t_out;
    document.getElementById('nv_height').value = h_shaft;
    document.getElementById('nv_area').value = ductArea;
    document.getElementById('nv_zeta').value = zetaVal;

    ['nv_t_in', 'nv_t_out', 'nv_height', 'nv_area', 'nv_zeta'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    if (typeof debouncedCalcNaturalVent === 'function') debouncedCalcNaturalVent();
}

async function calcNaturalVent(isAuto = false) {
    isAutoCalc = isAuto;

    const height = getVal('nv_height', 'Высота шахты');
    const t_in = getVal('nv_t_in', 't внутри');
    const t_out = getVal('nv_t_out', 't снаружи');
    const area = getVal('nv_area', 'Площадь');
    const zeta = getVal('nv_zeta', 'Σζ');

    if ([height, t_in, t_out, area, zeta].includes(null)) {
        isAutoCalc = false;
        return;
    }

    document.getElementById('nv-results').style.display = 'block';
    document.getElementById('nv-dashboard').innerHTML = '<p>Расчёт...</p>';

    const alertsEl = document.getElementById('nv-alerts');
    if (alertsEl) alertsEl.innerHTML = '';

    const data = { height_m: height, t_in, t_out, duct_area_m2: area, local_zeta: zeta };

    try {
        const resp = await fetch('/api/smoke/natural', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!resp.ok) throw new Error('Ошибка сервера');
        const r = await resp.json();

        if (r.error) {
            document.getElementById('nv-dashboard').innerHTML = `<div class="warn-box" style="grid-column: 1 / -1; margin: 0;"><b>Ошибка:</b> ${r.error}</div>`;
            isAutoCalc = false;
            return;
        }

        if (r.warning && alertsEl) {
            alertsEl.innerHTML = `<div class="warn-box"><b>Внимание:</b> ${r.warning}</div>`;
        }

        let statusHtml = r.is_working
            ? '<span style="color: var(--success); font-weight: 600;">Система работает (тяга есть)</span>'
            : '<span style="color: var(--danger); font-weight: 600;">Опрокидывание тяги (нет тяги)</span>';

        const isFast = r.velocity_ms > 2.0;
        const velBg = isFast ? '#fef2f2' : '#f8fafc';
        const velBorder = isFast ? '#ef4444' : '#cbd5e1';
        const velColor = isFast ? '#dc2626' : '#0f172a';

        document.getElementById('nv-dashboard').innerHTML = `
            <div class="result-box">
                <h4>Гравитационное давление <span class="info-icon" data-tooltip="ΔP = h × (ρ_нар - ρ_вн) × g"></span></h4>
                <div class="value">${r.gravity_pressure_pa} <span class="unit">Па</span></div>
            </div>
            <div class="result-box" style="background: ${velBg}; border-color: ${velBorder};">
                <h4 style="color: ${velColor};">Скорость в шахте ${isFast ? '(Высокая)' : ''} <span class="info-icon" data-tooltip="v = √(2 × ΔP / (Σζ × ρ))"></span></h4>
                <div class="value" style="color: ${velColor};">${r.velocity_ms} <span class="unit">м/с</span></div>
            </div>
            <div class="result-box" style="background: #eff6ff; border-color: #bfdbfe;">
                <h4>Расход воздуха <span class="info-icon" data-tooltip="L = v × F × 3600"></span></h4>
                <div class="value">${r.flow_m3h} <span class="unit">м³/ч</span></div>
            </div>
            <div class="result-box" style="grid-column: span 2; display: flex; align-items: center;">${statusHtml}</div>
        `;
    } catch (e) {
        if (!isAutoCalc) document.getElementById('nv-dashboard').innerHTML = `<div class="warn-box" style="grid-column: 1 / -1; margin: 0;"><b>Ошибка:</b> ${e.message}</div>`;
        else console.error(e.message);
    } finally {
        isAutoCalc = false;
    }
}

async function calcSmokeExhaust(isAuto = false) {
    isAutoCalc = isAuto;

    const width = getVal('se_door_width', 'Ширина двери');
    const height = getVal('se_door_height', 'Высота двери');
    const doors = getVal('se_num_doors', 'Количество дверей');

    if ([width, height, doors].includes(null)) {
        isAutoCalc = false;
        return;
    }

    document.getElementById('se-results').style.display = 'block';
    document.getElementById('se-dashboard').innerHTML = '<p>Расчёт...</p>';

    const data = { door_width: width, door_height: height, num_doors: doors };

    try {
        const resp = await fetch('/api/smoke/smoke-exhaust', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!resp.ok) throw new Error('Ошибка сервера');
        const r = await resp.json();

        document.getElementById('se-dashboard').innerHTML = `
            <div class="result-box">
                <h4>Массовый расход <span class="info-icon" data-tooltip="G = 3420 × b × H^1.5 × n_дверей (СП 7.13130.2013)"></span></h4>
                <div class="value">${r.mass_flow_kg_h.toLocaleString('ru-RU')} <span class="unit">кг/ч</span></div>
            </div>
            <div class="result-box">
                <h4>На 1 дверь <span class="info-icon" data-tooltip="L_двери = G_двери / ρ_дыма (ρ = 0.61 кг/м³)"></span></h4>
                <div class="value">${r.per_door_m3h.toLocaleString('ru-RU')} <span class="unit">м³/ч</span></div>
            </div>
            <div class="result-box best">
                <h4>Общий расход (дымоудаление) <span class="info-icon" data-tooltip="L_общ = L_двери × n_дверей"></span></h4>
                <div class="value">${r.volume_flow_m3h.toLocaleString('ru-RU')} <span class="unit">м³/ч</span></div>
            </div>
        `;
    } catch (e) {
        if (!isAutoCalc) alert(e.message);
        else console.error(e.message);
    } finally {
        isAutoCalc = false;
    }
}

async function calcPressurization(isAuto = false) {
    isAutoCalc = isAuto;

    const width = getVal('pr_door_width', 'Ширина двери');
    const height = getVal('pr_door_height', 'Высота двери');
    const floors = getVal('pr_num_floors', 'Количество этажей');

    if ([width, height, floors].includes(null)) {
        isAutoCalc = false;
        return;
    }

    document.getElementById('pr-results').style.display = 'block';
    document.getElementById('pr-dashboard').innerHTML = '<p>Расчёт...</p>';

    const data = { door_width: width, door_height: height, num_floors: floors };

    try {
        const resp = await fetch('/api/smoke/pressurization', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!resp.ok) throw new Error('Ошибка сервера');
        const r = await resp.json();

        document.getElementById('pr-dashboard').innerHTML = `
            <div class="result-box">
                <h4>Открытая дверь <span class="info-icon" data-tooltip="L_откр = v × F_двери × 3600 (v = 1.2 м/с)"></span></h4>
                <div class="value">${r.open_door_flow_m3h.toLocaleString('ru-RU')} <span class="unit">м³/ч</span></div>
            </div>
            <div class="result-box">
                <h4>Утечки (закрытые) <span class="info-icon" data-tooltip="L_ут = 150 м³/ч × (n_этажей - 1)"></span></h4>
                <div class="value">${r.closed_doors_flow_m3h.toLocaleString('ru-RU')} <span class="unit">м³/ч</span></div>
            </div>
            <div class="result-box best">
                <h4>Требуемый подпор <span class="info-icon" data-tooltip="L_подпор = L_откр + L_ут"></span></h4>
                <div class="value">${r.total_flow_m3h.toLocaleString('ru-RU')} <span class="unit">м³/ч</span></div>
            </div>
        `;
    } catch (e) {
        if (!isAutoCalc) alert(e.message);
        else console.error(e.message);
    } finally {
        isAutoCalc = false;
    }
}