function copyCurrentFloorToNew() {
    try {
        if (typeof saveActiveRoomData === 'function') saveActiveRoomData();

        const name = prompt("Введите название нового этажа:", `${appFloors.length + 1} этаж`);
        if (!name || name.trim() === "") return;

        const currentFloor = appFloors.find(f => parseInt(f.id) === parseInt(activeFloorId));
        if (!currentFloor) { alert("Ошибка: текущий этаж не найден!"); return; }

        currentFloor.rooms = appRooms;
        let clonedRooms = [];

        if (currentFloor.rooms && currentFloor.rooms.length > 0) {
            clonedRooms = currentFloor.rooms.map(room => {
                const parseNum = (val, def) => {
                    if (val === undefined || val === null || val === '') return def;
                    const parsed = parseFloat(String(val).replace(',', '.'));
                    return isNaN(parsed) ? def : parsed;
                };

                let finalW = parseNum(room.width, 4);
                let finalL = parseNum(room.length, 6);
                let finalH = parseNum(room.data?.v_height, 3.0);

                if (room.data?.v_width) finalW = parseNum(room.data.v_width, finalW);
                if (room.data?.v_length) finalL = parseNum(room.data.v_length, finalL);

                const newRoom = {
                    id: Date.now() + Math.floor(Math.random() * 10000),
                    name: room.name,
                    width: finalW,
                    length: finalL,
                    x: parseNum(room.x, 0),
                    y: parseNum(room.y, 0),
                    isPlaced: room.isPlaced !== false,
                    supply: room.supply || 0,
                    exhaust: room.exhaust || 0,
                    windows: room.windows ? JSON.parse(JSON.stringify(room.windows)) : [],
                    doors: room.doors ? JSON.parse(JSON.stringify(room.doors)) : [],
                    data: room.data ? JSON.parse(JSON.stringify(room.data)) : {}
                };

                newRoom.data.v_width = finalW;
                newRoom.data.v_length = finalL;
                newRoom.data.v_height = finalH;

                newRoom.data.h_width = finalW;
                newRoom.data.h_length = finalL;
                newRoom.data.h_height = finalH;

                newRoom.data.g_width = finalW;
                newRoom.data.g_length = finalL;
                newRoom.data.g_room_height = finalH;

                newRoom.data.ac_area = finalW * finalL;
                newRoom.data.ac_height = finalH;

                newRoom.data.v_room_type = room.data?.v_room_type || 'office';
                newRoom.data.h_room_type = room.data?.h_room_type || newRoom.data.v_room_type;
                newRoom.data.ac_room_type = room.data?.ac_room_type || newRoom.data.v_room_type;

                newRoom.data.v_is_corner = room.data?.v_is_corner || false;
                newRoom.data.h_is_corner = room.data?.h_is_corner || false;
                newRoom.data.ac_is_corner = room.data?.ac_is_corner || false;

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

    } catch (e) {
        alert("ОШИБКА КЛОНИРОВАНИЯ: " + e.message);
    }
}