function updateProjectDashboard() {
    const dashboard = document.getElementById('project-dashboard');
    if (!dashboard) return;

    let totalArea = 0;
    let totalRooms = 0;
    let totalAir = 0;
    let totalHeat = 0;

    // Проверяем, есть ли глобальный массив этажей
    if (typeof appFloors !== 'undefined' && appFloors.length > 0) {
        appFloors.forEach(floor => {
            if (floor.rooms) {
                floor.rooms.forEach(room => {
                    totalRooms++;

                    // Считаем площадь
                    let w = parseFloat(room.width) || 0;
                    let l = parseFloat(room.length) || 0;
                    totalArea += (w * l);

                    // Считаем воздух (берем максимум из притока/вытяжки)
                    let sup = parseFloat(room.supply) || 0;
                    let exh = parseFloat(room.exhaust) || 0;
                    totalAir += Math.max(sup, exh);

                    // Считаем тепло (если есть данные в data, или грубая оценка)
                    if (room.data) {
                        if (room.data.v_heat) totalHeat += parseFloat(room.data.v_heat);
                        else if (room.data.h_heat_loss) totalHeat += parseFloat(room.data.h_heat_loss);
                    } else {
                        // Если нет данных, берем грубую оценку (100 Вт на м²)
                        totalHeat += (w * l * 0.1);
                    }
                });
            }
        });
    }

    // Показываем дашборд, если есть комнаты
    if (totalRooms > 0) {
        dashboard.style.display = 'grid';
    } else {
        dashboard.style.display = 'none';
        return;
    }

    // Обновляем DOM
    document.getElementById('dash-total-area').innerHTML = `${totalArea.toFixed(1)} <small>м²</small>`;
    document.getElementById('dash-total-rooms').innerHTML = `${totalRooms} <small>шт</small>`;
    document.getElementById('dash-total-air').innerHTML = `${Math.round(totalAir)} <small>м³/ч</small>`;
    document.getElementById('dash-total-heat').innerHTML = `${totalHeat.toFixed(1)} <small>кВт</small>`;
}

// Запускаем обновление каждые 1.5 секунды (чтобы дашборд всегда был живым)
setInterval(updateProjectDashboard, 1500);

// Обновляем при переключении вкладок
document.addEventListener('click', (e) => {
    if (e.target.closest('.tab-btn') || e.target.closest('.home-card')) {
        setTimeout(updateProjectDashboard, 100);
    }
});