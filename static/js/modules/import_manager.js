// static/js/modules/import_manager.js

async function downloadImportTemplate() {
    try {
        // Добавляем параметр, чтобы браузер не кэшировал запрос
        const response = await fetch('/api/import/template?t=' + new Date().getTime());

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Сервер вернул ${response.status}: ${err}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'Шаблон_импорта_помещений.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (e) {
        console.error('Ошибка скачивания шаблона:', e);
        alert('Не удалось скачать шаблон: ' + e.message);
    }
}

async function handleExcelImport(input) {
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/import/excel', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Ошибка сервера при чтении файла');
        }

        const roomsData = await response.json();
        console.log('Полученные комнаты из Excel:', roomsData); // Для отладки

        if (roomsData.length === 0) {
            alert('Файл прочитан, но помещений не найдено.');
            return;
        }

        if (!confirm(`Найдено помещений: ${roomsData.length}. Заменить текущие комнаты на этом этаже?`)) {
            return;
        }

        // Ищем активный этаж. Используем == для приведения типов (на случай если id - строка)
        let activeFloor = appFloors.find(f => f.id == activeFloorId);

        // Если вдруг этаж не найден (глюк состояния), берем первый попавшийся
        if (!activeFloor && appFloors.length > 0) {
            activeFloor = appFloors[0];
            activeFloorId = activeFloor.id;
        }

        if (!activeFloor) {
            alert('Ошибка: На проекте нет ни одного этажа! Сначала создайте этаж.');
            return;
        }

        // Очищаем комнаты
        activeFloor.rooms = [];

        // Создаем новые
        roomsData.forEach((room, index) => {
            // Используем случайный ID, чтобы точно не было дублей
            const newRoom = {
                id: Date.now() + Math.floor(Math.random() * 1000) + index,
                name: room.name,
                width: room.width,
                length: room.length,
                x: index * room.width,
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

        // Делаем первую комнату активной
        if (activeFloor.rooms.length > 0) {
            activeRoomId = activeFloor.rooms[0].id;
        }

        // === ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ===
        if (typeof saveRoomsToStorage === 'function') saveRoomsToStorage();

        // Обновляем селекторы и заголовки
        if (typeof renderRoomSelector === 'function') renderRoomSelector();
        if (typeof updateRoomTitle === 'function') updateRoomTitle();
        if (typeof loadActiveRoomData === 'function') loadActiveRoomData();

        // Обновляем выпадающий список этажей
        const floorSelector = document.getElementById('express-floor-selector');
        if (floorSelector) {
            floorSelector.value = activeFloorId;
        }

        // Перерисовываем план, если мы на нем находимся
        if (document.getElementById('plan-view') && document.getElementById('plan-view').classList.contains('active')) {
            if (typeof renderPlan === 'function') renderPlan();
        }

        alert(`Успешно импортировано помещений: ${roomsData.length}!`);

    } catch (e) {
        console.error('Ошибка импорта:', e);
        alert("Ошибка импорта: " + e.message);
    } finally {
        input.value = ''; // Сбрасываем инпут, чтобы можно было загрузить тот же файл снова
    }
}