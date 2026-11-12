async function importExcelFile(input) {
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    const btn = document.querySelector('button[onclick*="excel-import-input"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Чтение...';

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

        // Очищаем комнаты ТЕКУЩЕГО этажа
        const activeFloor = appFloors.find(f => f.id === activeFloorId);
        if (activeFloor) {
            activeFloor.rooms = [];
        }

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
                    ac_area: room.length * room.width,
                    ac_height: room.height,
                    ac_people: room.people
                },
                supply: 0,
                exhaust: 0
            };
            if (activeFloor) activeFloor.rooms.push(newRoom);
        });

        // Делаем первую импортированную комнату активной
        if (activeFloor && activeFloor.rooms.length > 0) {
            activeRoomId = activeFloor.rooms[0].id;
        }

        saveRoomsToStorage();
        renderRoomSelector();
        updateRoomTitle();
        loadActiveRoomData();

        // Если мы на вкладке планировки — перерисуем
        if (document.getElementById('plan-view').classList.contains('active')) {
            renderPlan();
        }

        alert(`Успешно импортировано помещений: ${roomsData.length}!`);

    } catch (e) {
        alert("Ошибка импорта: " + e.message);
    } finally {
        btn.innerHTML = originalText;
        input.value = '';
    }
}