function copyCurrentFloorToNew() {
    try {
        if (typeof saveActiveRoomData === 'function') {
            saveActiveRoomData();
        }

        const name = prompt("Введите название нового этажа:", `${appFloors.length + 1} этаж`);
        if (!name || name.trim() === "") return;

        const currentFloor = appFloors.find(f => parseInt(f.id) === parseInt(activeFloorId));

        if (!currentFloor) {
            alert("Ошибка: текущий этаж не найден!");
            return;
        }

        // Принудительно синхронизируем комнаты перед копированием
        currentFloor.rooms = appRooms;
        let clonedRooms = [];

        if (currentFloor.rooms && currentFloor.rooms.length > 0) {
            clonedRooms = currentFloor.rooms.map(room => {
                // ЖЕЛЕЗОБЕТОННОЕ КОПИРОВАНИЕ ВСЕХ СВОЙСТВ
                const newRoom = {
                    id: Date.now() + Math.floor(Math.random() * 10000),
                    name: room.name,
                    width: room.width || 4,
                    length: room.length || 6,
                    x: room.x !== undefined ? parseFloat(room.x) : 0,
                    y: room.y !== undefined ? parseFloat(room.y) : 0,
                    isPlaced: room.isPlaced !== false, // Если не false, значит на плане
                    supply: room.supply || 0,
                    exhaust: room.exhaust || 0,
                    windows: room.windows ? JSON.parse(JSON.stringify(room.windows)) : [],
                    doors: room.doors ? JSON.parse(JSON.stringify(room.doors)) : [],
                    data: room.data ? JSON.parse(JSON.stringify(room.data)) : {}
                };

                // Генерируем новые ID для окон и дверей
                if (newRoom.windows) newRoom.windows.forEach(w => w.id = Date.now() + Math.floor(Math.random() * 10000));
                if (newRoom.doors) newRoom.doors.forEach(d => d.id = Date.now() + Math.floor(Math.random() * 10000));

                return newRoom;
            });
        } else {
             clonedRooms = [{
                id: Date.now(), name: "Новое помещение", width: 10, length: 15, x: 0, y: 0,
                windows: [], doors: [], isPlaced: true,
                data: { v_length: 15, v_width: 10, v_height: 3.0 }, supply: 0, exhaust: 0
            }];
        }

        const newFloor = { id: Date.now(), name: name.trim(), rooms: clonedRooms };
        appFloors.push(newFloor);

        activeFloorId = parseInt(newFloor.id);
        if (typeof syncAppRooms === 'function') syncAppRooms();
        activeRoomId = appRooms.length > 0 ? parseInt(appRooms[0].id) : null;

        saveRoomsToStorage();

        if (typeof renderFloorTabs === 'function') renderFloorTabs();
        if (typeof renderRoomSelector === 'function') renderRoomSelector();
        if (typeof updateRoomTitle === 'function') updateRoomTitle();
        if (typeof loadActiveRoomData === 'function') loadActiveRoomData();
        if (typeof renderPlan === 'function') renderPlan();

        console.log(`[Система] Этаж "${name}" создан. Скопировано комнат: ${clonedRooms.length}`);

    } catch (e) {
        alert("ОШИБКА КЛОНИРОВАНИЯ: " + e.message);
        console.error(e);
    }
}