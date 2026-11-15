function populateAnalyticsSelector() {
    const sel = document.getElementById('analytics-room-selector');
    if (!sel) return;

    const currentVal = sel.value;
    sel.innerHTML = '<option value="all">🏢 Всё здание (сумма)</option>';

    if (typeof appFloors !== 'undefined') {
        appFloors.forEach(floor => {
            if (floor.rooms) {
                floor.rooms.forEach(room => {
                    sel.innerHTML += `<option value="${room.id}">${room.name}</option>`;
                });
            }
        });
    }
    sel.value = currentVal || 'all';
}

async function fetchAndRenderAnalytics(roomId = 'all') {
    const payload = [];
    let selectedName = '🏢 Всё здание';

    if (typeof appFloors !== 'undefined') {
        appFloors.forEach(floor => {
            if (floor.rooms) {
                floor.rooms.forEach(room => {
                    // Жесткое сравнение в строках, чтобы не было багов с типами
                    if (roomId === 'all' || String(room.id) === String(roomId)) {
                        payload.push({ id: room.id, name: room.name, data: room.data || {} });
                        if (roomId !== 'all') {
                            selectedName = room.name; // Запоминаем имя выбранной комнаты
                        }
                    }
                });
            }
        });
    }

    if (payload.length === 0) {
        showToast('Нет помещений для отображения аналитики', 'error');
        return;
    }

    try {
        const resp = await fetch('/api/analytics/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rooms: payload })
        });

        if (!resp.ok) throw new Error('Ошибка сервера при аналитике');
        const data = await resp.json();

        // Передаем данные И имя комнаты для подписи
        if (typeof renderAllCharts === 'function') {
            renderAllCharts(data, selectedName);
        }
    } catch (e) {
        console.error(e);
        showToast(e.message, 'error');
    }
}

function onAnalyticsRoomChange(val) {
    fetchAndRenderAnalytics(val);
}

async function syncAnalytics() {
    const btn = document.getElementById('btn-sync-analytics');
    const originalText = btn.innerText;
    btn.innerText = '⏳ Сбор данных...';
    btn.disabled = true;

    populateAnalyticsSelector();
    const currentVal = document.getElementById('analytics-room-selector').value;

    await fetchAndRenderAnalytics(currentVal);

    btn.innerText = originalText;
    btn.disabled = false;
    showToast('Аналитика успешно обновлена', 'success');
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    populateAnalyticsSelector();

    const analyticsView = document.getElementById('analytics-view');
    if (analyticsView) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.classList.contains('active')) {
                    populateAnalyticsSelector();
                    fetchAndRenderAnalytics(document.getElementById('analytics-room-selector').value);
                }
            });
        });
        observer.observe(analyticsView, { attributes: true, attributeFilter: ['class'] });
    }
});