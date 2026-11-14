async function downloadImportTemplate() {
    try {
        const response = await fetch('/api/import/template');
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Сервер вернул ${response.status}: ${err}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Шаблон_импорта_помещений.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (e) {
        alert('Не удалось скачать шаблон: ' + e.message);
    }
}

async function importExcelFile(input) {
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    const btn = document.querySelector('button[onclick*="excel-import-input"]');
    const originalText = btn ? btn.innerHTML : 'Импорт';
    if (btn) btn.innerHTML = '⏳ Чтение...';

    try {
        const response = await fetch('/api/import/excel', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Ошибка сервера');
        }

        const roomsData = await response.json();

        if (!confirm(`Найдено помещений: ${roomsData.length}. Заменить текущие комнаты на этом этаже? (ОК - Заменить, Отмена - Отмена)`)) {
            return;
        }

        // Ищем активный этаж с приведением типов (чтобы строка "1" и число 1 совпадали)
        const activeFloor = appFloors.find(f => String(f.id) === String(activeFloorId));

        if (!activeFloor) {
            alert('Ошибка: Активный этаж не найден. Попробуйте обновить страницу.');
            return;
        }

        // Очищаем комнаты ТЕКУЩЕГО этажа
        activeFloor.rooms = [];

        // Создаем комнаты
        roomsData.forEach((room, index) => {
            const newRoom = {
                id: Date.now() + index,
                name: room.name,
                width: room.width,
                length: room.length,
                x: index * room.width, // Встык
                y: 0,
                windows: [],
                doors: [],
                data: {
                    v_length: room.length,
                    v_width: room.width,
                    v_height: room.height,
                    v_people: room.people,
                    v_heat: room.heat_gain_kw,
                    v_moisture: room.moisture_gain_g_h,
                    v_hazard: room.hazard_g_h,
                    v_mpc: room.mpc_mg_m3,
                    h_length: room.length,
                    h_width: room.width,
                    h_height: room.height,
                    ac_area: parseFloat((room.length * room.width).toFixed(2)),
                    ac_height: room.height,
                    ac_people: room.people
                },
                supply: 0,
                exhaust: 0
            };
            activeFloor.rooms.push(newRoom);
        });

        // Делаем первую импортированную комнату активной
        if (activeFloor.rooms.length > 0) {
            activeRoomId = activeFloor.rooms[0].id;
        }

        if (typeof saveRoomsToStorage === 'function') saveRoomsToStorage();
        if (typeof renderRoomSelector === 'function') renderRoomSelector();
        if (typeof updateRoomTitle === 'function') updateRoomTitle();
        if (typeof loadActiveRoomData === 'function') loadActiveRoomData();

        // Если мы на вкладке планировки — перерисуем
        if (document.getElementById('plan-view') && document.getElementById('plan-view').classList.contains('active')) {
            if (typeof renderPlan === 'function') renderPlan();
        }

        alert(`Успешно импортировано помещений: ${roomsData.length}!`);

    } catch (e) {
        alert("Ошибка импорта: " + e.message);
    } finally {
        if (btn) btn.innerHTML = originalText;
        input.value = '';
    }
}