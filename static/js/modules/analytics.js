let charts = {
    vent: null,
    heat: null,
    ac: null,
    gas: null
};

function renderAllCharts() {
    // 1. ВЕНТИЛЯЦИЯ
    const ventCtx = document.getElementById('chart-vent');
    if (ventCtx && lastResp.vent && lastResp.vent.air_exchange) {
        if (charts.vent) charts.vent.destroy();
        const air = lastResp.vent.air_exchange;

        // Заполняем КПИ
        document.getElementById('kpi-vent').innerHTML = `${air.L_max_m3h} <small>м³/ч</small>`;
        document.getElementById('kpi-vent-factor').textContent = `Фактор: ${air.decisive_factor}`;

        charts.vent = new Chart(ventCtx, {
            type: 'bar',
            data: {
                labels: ['Люди', 'Кратность', 'Тепло', 'Влага', 'ПДК'],
                datasets: [{
                    label: 'Расход',
                    data: [air.L_people_m3h, air.L_rate_m3h, air.L_heat_m3h, air.L_moisture_m3h, air.L_hazard_m3h],
                    backgroundColor: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) { return context.parsed.y + ' м³/ч'; }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Расход (м³/ч)' }
                    }
                }
            }
        });
    }

    // 2. ОТОПЛЕНИЕ
    const heatCtx = document.getElementById('chart-heat');
    if (heatCtx && lastResp.heat && lastResp.heat.results) {
        if (charts.heat) charts.heat.destroy();
        const res = lastResp.heat.results;

        // Заполняем КПИ
        document.getElementById('kpi-heat').innerHTML = `${res.boiler_power_kw} <small>кВт</small>`;
        document.getElementById('kpi-heat-loss').textContent = `Общие потери: ${res.total_with_infiltration_w.toLocaleString('ru-RU')} Вт`;

        charts.heat = new Chart(heatCtx, {
            type: 'doughnut',
            data: {
                labels: ['Стены', 'Окна', 'Крыша', 'Пол'],
                datasets: [{
                    data: [res.q_wall_w, res.q_window_w, res.q_roof_w, res.q_floor_w],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#64748b'],
                    borderWidth: 0,
                    cutout: '65%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' },
                    tooltip: {
                        callbacks: {
                            label: function(context) { return context.label + ': ' + context.parsed.toLocaleString('ru-RU') + ' Вт'; }
                        }
                    }
                }
            }
        });
    }

    // 3. КОНДИЦИОНИРОВАНИЕ
    const acCtx = document.getElementById('chart-ac');
    if (acCtx && lastResp.ac && lastResp.ac.results && lastResp.ac.results.table) {
        if (charts.ac) charts.ac.destroy();
        const table = lastResp.ac.results.table;
        const maxQ = lastResp.ac.results.max_q_cond;
        const maxL = lastResp.ac.results.max_air_exchange;

        // Заполняем КПИ
        document.getElementById('kpi-ac').innerHTML = `${(maxQ / 1000).toFixed(2)} <small>кВт</small>`;
        document.getElementById('kpi-ac-air').textContent = `L_вент: ${maxL} м³/ч`;

        charts.ac = new Chart(acCtx, {
            type: 'bar',
            data: {
                labels: ['ХПГ (Холод)', 'ППГ (Переход)', 'ТПГ (Тепло)'],
                datasets: [{
                    label: 'Полное тепло',
                    data: [table[0].q_total, table[1].q_total, table[2].q_total],
                    backgroundColor: ['#93c5fd', '#60a5fa', '#3b82f6'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) { return context.parsed.y.toLocaleString('ru-RU') + ' Вт'; }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Теплопоступления (Вт)' }
                    }
                }
            }
        });
    }

    // 4. ГАЗ
    const gasCtx = document.getElementById('chart-gas');
    if (gasCtx && lastResp.gas && lastResp.gas.results) {
        if (charts.gas) charts.gas.destroy();
        const res = lastResp.gas.results;
        const otherGas = res.v_total - res.v_boiler;

        // Заполняем КПИ
        document.getElementById('kpi-gas').innerHTML = `${res.v_total.toFixed(2)} <small>м³/ч</small>`;
        document.getElementById('kpi-gas-pipe').textContent = `Труба: ${res.pipe}`;

        charts.gas = new Chart(gasCtx, {
            type: 'pie',
            data: {
                labels: ['Котёл', 'Плита/Колонка'],
                datasets: [{
                    data: [res.v_boiler, otherGas > 0 ? otherGas : 0],
                    backgroundColor: ['#3b82f6', '#f43f5e'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' },
                    tooltip: {
                        callbacks: {
                            label: function(context) { return context.label + ': ' + context.parsed + ' м³/ч'; }
                        }
                    }
                }
            }
        });
    }
}

async function syncAnalytics() {
    const btn = document.getElementById('btn-sync-analytics');
    const originalText = btn.innerText;
    btn.innerText = '⏳ Расчет...';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    try {
        await Promise.all([
            typeof calcVent === 'function' ? calcVent(true) : Promise.resolve(),
            typeof calcHeat === 'function' ? calcHeat(true) : Promise.resolve(),
            typeof calcAc === 'function' ? calcAc(true) : Promise.resolve(),
            typeof calcGas === 'function' ? calcGas(true) : Promise.resolve()
        ]);

        renderAllCharts();
        showToast('Данные для графиков обновлены', 'success');
    } catch (e) {
        console.error(e);
        showToast('Ошибка при обновлении графиков', 'error');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
        btn.style.opacity = '1';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const analyticsView = document.getElementById('analytics-view');
    if (analyticsView && analyticsView.classList.contains('active')) {
        renderAllCharts();
    }
});