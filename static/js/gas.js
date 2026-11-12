async function calcGas() {
    const boiler_power = getVal('g_boiler_power', 'Мощность котла (кВт)');
    const g_length = getVal('g_length', 'Длина помещения (м)');
    const g_width = getVal('g_width', 'Ширина помещения (м)');
    const g_height = getVal('g_room_height', 'Высота потолков (м)');

    if (boiler_power === null || g_length === null || g_width === null || g_height === null) return;

    const room_volume = g_length * g_width * g_height;
    document.getElementById('g_room_volume').value = room_volume.toFixed(1);

    const chimney_height = getVal('g_chimney_height', 'Высота дымохода (м)');
    const pipe_length = getVal('g_pipe_length', 'Длина трубы (м)');
    const local_zeta = getVal('g_local_zeta', 'Сумма местных сопр. (Σζ)');
    const window_area = getVal('g_window_area', 'Площадь окна (м²)');
    const t_out = getVal('g_t_out', 'Температура снаружи (°C)');

    if (chimney_height === null || pipe_length === null || local_zeta === null || window_area === null || t_out === null) return;

    document.getElementById('gas-results').style.display = 'block';
    document.getElementById('g-dashboard').innerHTML = '<p>Расчёт...</p>';

    const data = { city_id: document.getElementById('g_city')?.value || 'Москва', boiler_power_kw: boiler_power, has_stove: document.getElementById('g_has_stove')?.checked || false, has_water_heater: document.getElementById('g_has_heater')?.checked || false, room_volume, room_height: g_height, combustion_chamber: document.getElementById('g_chamber')?.value || 'closed', chimney_height, pipe_length, local_zeta, window_area };
    lastData.gas = data;

    try {
        const resp = await fetch('/api/gas/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!resp.ok) { const errData = await resp.json(); throw new Error(errData.detail || 'Ошибка сервера'); }
        const r = await resp.json(); lastResp.gas = r;

        const res = r.results; const city = r.city_info;
        const alerts = document.getElementById('g-alerts'); alerts.innerHTML = '';
        if (res.chimney_warning) alerts.innerHTML += `<div class="warn-box">⚠️ <b>Дымоход:</b> ${res.chimney_warning}</div>`;
        if (res.velocity_warning) alerts.innerHTML += `<div class="warn-box">⚠️ <b>Гидравлика:</b> ${res.velocity_warning}</div>`;
        if (res.boiler_room_warnings.length > 0) alerts.innerHTML += `<div class="warn-box">⚠️ <b>Котельная:</b><br>${res.boiler_room_warnings.join('<br>')}</div>`;

        document.getElementById('g-city-info').innerHTML = `<p><b>Оператор:</b> ${city.gas_operator}</p><p><b>Телефон:</b> ${city.gas_phone} | <b>Email:</b> ${city.gas_email}</p><p><b>Сайт:</b> <a href="${city.gas_site}" target="_blank">${city.gas_site}</a></p><p><b>Стоимость подключения:</b> <span style="color:var(--success); font-weight:bold;">${city.connection_cost}</span></p><p style="font-size: 13px; color: var(--muted); margin-top: 10px;">${city.note}</p>`;

        document.getElementById('g-dashboard').innerHTML = `
            <div class="result-box"><h4>Расход газа</h4><div class="value">${res.v_total} <span class="unit">м³/ч</span></div></div>
            <div class="result-box best"><h4>Счётчик</h4><div class="value">${res.meter}</div></div>
            <div class="result-box"><h4>Диаметр трубы</h4><div class="value">${res.pipe}</div></div>
            <div class="result-box"><h4>Скорость газа</h4><div class="value">${res.velocity} <span class="unit">м/с</span></div></div>
            <div class="result-box"><h4>Потери давления</h4><div class="value">${res.p_total} <span class="unit">Па</span></div></div>
            <div class="result-box"><h4>Дымоход</h4><div class="value">${res.d_chimney_mm > 0 ? res.d_chimney_mm : 'Коаксиальный'} <span class="unit">${res.d_chimney_mm > 0 ? 'мм' : ''}</span></div></div>
        `;

        const safetyCard = document.getElementById('g-safety-card');
        const safetyGrid = document.getElementById('g-safety-grid');
        if (res.safety_items && res.safety_items.length > 0) {
            safetyCard.style.display = 'block';
            safetyGrid.innerHTML = res.safety_items.map(s => `<div class="sol-card"><div class="sol-title">${s.model}</div><div class="sol-brand">${s.brand} | ${s.type}</div><div class="sol-price">${s.price_rub.toLocaleString('ru-RU')} ₽</div><a href="${s.url}" target="_blank" class="sol-link">Купить</a></div>`).join('');
        } else { safetyCard.style.display = 'none'; }

        document.getElementById('g-methodology').innerHTML = `
            <div class="formula-block">
                <b>1. Расчет расхода газа на котел:</b><br>
                V_котла = Q_котла / (Q_теплоты_сгорания × η_котла)<br>
                Q_тепл = 9.45 кВт·ч/м³ (теплота сгорания природного газа)<br>
                η = 0.92 (КПД котла 92%)<br>
                V_котла = ${data.boiler_power_kw} / (9.45 × 0.92) = <b>${res.v_boiler} м³/ч</b>
                <span class="norm-ref">СП 62.13330.2011</span>
            </div>
            <div class="formula-block">
                <b>2. Расход газа на плиту и колонку:</b><br>
                Плита 4-конфорочная: 1.2 м³/ч (${data.has_stove ? 'Включена' : 'Отключена'})<br>
                Колонка проточная: 2.5 м³/ч (${data.has_water_heater ? 'Включена' : 'Отключена'})<br>
                <b>Общий расход:</b> V_итог = V_котла + V_плиты + V_колонки = <b>${res.v_total} м³/ч</b>
            </div>
            <div class="formula-block">
                <b>3. Подбор газового счетчика:</b><br>
                Требуемый пропускной способности ≥ ${res.v_total} м³/ч<br>
                Выбран счетчик, ближайший по типоразмеру: <b>${res.meter}</b><br>
                (Диапазон: от минимального до максимального расхода)
            </div>
            <div class="formula-block">
                <b>4. Аэродинамический расчет газопровода (Диаметр):</b><br>
                По допустимой скорости газа (2 м/с) выбран стандартный диаметр: <b>${res.pipe}</b>
            </div>
            <div class="formula-block" style="background: #eff6ff; border-left-color: #2563eb;">
                <b>5. Гидравлический расчет (Скорость и потери):</b><br>
                1. Скорость: v = V / (3600 × F)<br>
                F (площадь трубы) рассчитана по внутреннему диаметру Ду.<br>
                v = ${res.v_total} / (3600 × F) = <b>${res.velocity} м/с</b><br>
                2. Потери на трение: ΔP_тр = λ × (L/d) × (ρv²/2)<br>
                ΔP_тр = ${res.p_friction} Па (λ - коэфф. трения, ρ - плотность газа 0.73 кг/м³)<br>
                3. Потери на местных сопротивлениях: ΔP_мест = Σζ × (ρv²/2)<br>
                ΔP_мест = ${data.local_zeta} × (0.73 × ${res.velocity}² / 2) = <b>${res.p_local} Па</b><br>
                4. <b>Итого потери:</b> ${res.p_friction} + ${res.p_local} = <b>${res.p_total} Па</b>
                <span class="norm-ref">СП 42-101-2003 (Дарси-Вейсбах)</span>
            </div>
            <div class="formula-block">
                <b>6. Проверка дымохода:</b><br>
                Тип камеры сгорания: ${data.combustion_chamber === 'open' ? 'Открытая (естественная тяга)' : 'Закрытая (принудительная)'}<br>
                Высота: ${data.chimney_height} м ${data.chimney_height >= 5 ? '(норма ≥ 5 м)' : '<span style="color:red">(нарушение: < 5 м)</span>'}<br>
                Требуемый диаметр: <b>${res.d_chimney_mm > 0 ? res.d_chimney_mm + ' мм' : 'Коаксиальный'}</b>
                <span class="norm-ref">СП 7.13130.2013</span>
            </div>
            <div class="formula-block" style="background: #fef2f2; border-left-color: #dc2626;">
                <b>7. Проверка помещения котельной:</b><br>
                Объем помещения: ${room_volume.toFixed(1)} м³ (норма > 15 м³) — ${room_volume > 15 ? '✅ Соответствует' : '❌ НЕ соответствует'}<br>
                Остекление: 0.03 м² на 1 м³ объема = ${(room_volume * 0.03).toFixed(2)} м² (по факту ${data.window_area} м²) — ${data.window_area >= room_volume * 0.03 ? '✅ Соответствует' : '❌ НЕ соответствует'}<br>
                <span class="norm-ref">СП 62.13330.2011, п. 6.1.18</span>
            </div>
        `;

        document.getElementById('g-report').textContent = `============================================================\nОТЧЁТ ПО ГАЗОСНАБЖЕНИЮ\n============================================================\nГород: ${city.name}\nОператор: ${city.gas_operator}\nТелефон: ${city.gas_phone}\n\nРАСХОД ГАЗА:\nКотёл: ${res.v_boiler} м³/ч\nОбщий расход: ${res.v_total} м³/ч\n\nГИДРАВЛИКА:\nТруба: ${res.pipe}\nСкорость газа: ${res.velocity} м/с\nПотери давления: ${res.p_total} Па\n\nВЕНТИЛЯЦИЯ И ДЫМОХОД:\nТип камеры: ${data.combustion_chamber === 'open' ? 'Открытая' : 'Закрытая'}\nДиаметр дымохода: ${res.d_chimney_mm > 0 ? res.d_chimney_mm + ' мм' : 'Коаксиальный'}\nВытяжка: ${res.v_exhaust} м³/ч\nПриток: ${res.v_supply} м³/ч`.trim();

        // ИСПРАВЛЕНО: 'gas-results' вместо 'g-results'
        const resContainer = document.getElementById('gas-results');
        if (resContainer) {
            resContainer.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (e) { alert(e.message); }
}