let heatChartInstance = null;

function renderHeatChart(wall, window, roof, floor) {
    const wrapper = document.getElementById('heat-chart-wrapper');
    const ctx = document.getElementById('heatLossChart');
    if (!ctx || !wrapper) return;

    wrapper.style.display = 'block';

    // Уничтожаем старый график, чтобы при пересчете не было наложений
    if (heatChartInstance) {
        heatChartInstance.destroy();
    }

    heatChartInstance = new Chart(ctx, {
        type: 'doughnut', // Кольцевая диаграмма
        data: {
            labels: ['Стены', 'Окна', 'Крыша', 'Пол'],
            datasets: [{
                data: [wall, window, roof, floor],
                backgroundColor: [
                    '#3b82f6', // Синий (Стены)
                    '#10b981', // Зеленый (Окна)
                    '#f59e0b', // Оранжевый (Крыша)
                    '#64748b'  // Серый (Пол)
                ],
                borderWidth: 0,
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: { family: 'Inter', size: 12 },
                        color: '#475569'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed.toLocaleString('ru-RU') + ' Вт';
                            }
                            return label;
                        }
                    }
                }
            },
            cutout: '70%' // Делает дырку в центре
        }
    });
}