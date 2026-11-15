let charts = { vent: null, heat: null, ac: null, gas: null };

function renderAllCharts(data, selectedName = 'Всё здание') {
    if (!data) return;

    // 1. ВЕНТИЛЯЦИЯ
    const ventCtx = document.getElementById('chart-vent');
    if (ventCtx) {
        if (charts.vent) charts.vent.destroy();
        document.getElementById('kpi-vent').innerHTML = `${Math.round(data.vent.max)} <small>м³/ч</small>`;
        // Выводим имя выбранного объекта/комнаты
        document.getElementById('kpi-vent-factor').textContent = `Данные: ${selectedName}`;

        charts.vent = new Chart(ventCtx, {
            type: 'bar',
            data: {
                labels: ['Люди', 'Кратность', 'Тепло', 'Влага', 'ПДК'],
                datasets: [{
                    label: 'Расход',
                    data: [data.vent.people, data.vent.rate, data.vent.heat, data.vent.moist, data.vent.hazard],
                    backgroundColor: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
                    borderRadius: 6
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.parsed.y + ' м³/ч' } } }, scales: { y: { title: { display: true, text: 'м³/ч' } } } }
        });
    }

    // 2. ОТОПЛЕНИЕ
    const heatCtx = document.getElementById('chart-heat');
    if (heatCtx) {
        if (charts.heat) charts.heat.destroy();
        document.getElementById('kpi-heat').innerHTML = `${data.heat.boiler.toFixed(1)} <small>кВт</small>`;
        document.getElementById('kpi-heat-loss').textContent = `Данные: ${selectedName} (${Math.round(data.heat.total_loss).toLocaleString('ru-RU')} Вт)`;

        charts.heat = new Chart(heatCtx, {
            type: 'doughnut',
            data: {
                labels: ['Стены', 'Окна', 'Крыша', 'Пол'],
                datasets: [{
                    data: [data.heat.wall, data.heat.window, data.heat.roof, data.heat.floor],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#64748b'],
                    borderWidth: 0, cutout: '65%'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' }, tooltip: { callbacks: { label: (c) => c.label + ': ' + Math.round(c.parsed).toLocaleString('ru-RU') + ' Вт' } } } }
        });
    }

    // 3. КОНДИЦИОНИРОВАНИЕ
    const acCtx = document.getElementById('chart-ac');
    if (acCtx) {
        if (charts.ac) charts.ac.destroy();
        document.getElementById('kpi-ac').innerHTML = `${(data.ac.max_q / 1000).toFixed(2)} <small>кВт</small>`;
        document.getElementById('kpi-ac-air').textContent = `Данные: ${selectedName} (L_вент: ${Math.round(data.ac.max_l)} м³/ч)`;

        charts.ac = new Chart(acCtx, {
            type: 'bar',
            data: {
                labels: ['ХПГ', 'ППГ', 'ТПГ'],
                datasets: [{ data: [data.ac.xpg, data.ac.ppg, data.ac.tpg], backgroundColor: ['#93c5fd', '#60a5fa', '#3b82f6'], borderRadius: 6 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => Math.round(c.parsed.y).toLocaleString('ru-RU') + ' Вт' } } }, scales: { y: { title: { display: true, text: 'Вт' } } } }
        });
    }

    // 4. ГАЗ
    const gasCtx = document.getElementById('chart-gas');
    if (gasCtx) {
        if (charts.gas) charts.gas.destroy();
        document.getElementById('kpi-gas').innerHTML = `${data.gas.total.toFixed(2)} <small>м³/ч</small>`;
        document.getElementById('kpi-gas-pipe').textContent = `Данные: ${selectedName}`;
        const other = data.gas.total - data.gas.boiler;

        charts.gas = new Chart(gasCtx, {
            type: 'pie',
            data: {
                labels: ['Котлы', 'Плиты/Колонки'],
                datasets: [{ data: [data.gas.boiler, other > 0 ? other : 0], backgroundColor: ['#3b82f6', '#f43f5e'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' }, tooltip: { callbacks: { label: (c) => c.label + ': ' + c.parsed.toFixed(2) + ' м³/ч' } } } }
        });
    }
}