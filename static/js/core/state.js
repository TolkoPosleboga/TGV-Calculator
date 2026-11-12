let appFloors = [];
let activeFloorId = null;
let appRooms = [];
let activeRoomId = null;

function isGlobalField(id) {
    if (id === 'global_city') return true; // <-- ДОБАВИЛИ
    if (id.endsWith('_city') || id.endsWith('_t_out') || id.endsWith('_gsop')) return true;
    if (id.match(/ac_t_out_[xpt]/) || id.match(/ac_hum_out_[xpt]/) || id.match(/ac_I_out_[xpt]/)) return true;
    if (id.match(/ac_t_sup_[xpt]/) || id.match(/ac_t_exh_[xpt]/) || id.match(/ac_I_exh_[xpt]/)) return true;
    return false;
}

function initRoomManager() {
    let savedFloors = localStorage.getItem('calc_floors');
    let savedActiveFloorId = localStorage.getItem('active_floor_id');
    let savedActiveId = localStorage.getItem('active_room_id');

    try {
        if (savedFloors) appFloors = JSON.parse(savedFloors);
    } catch (e) { appFloors = []; }

    // Если массива нет, он пуст или содержит мусор — создаем чистый проект
    if (!appFloors || !Array.isArray(appFloors) || appFloors.length === 0) {
        appFloors = [{
            id: Date.now(),
            name: '1 этаж',
            rooms: [{
                id: Date.now() + 1,
                name: 'Помещение 1',
                width: 6, length: 4, x: 0, y: 0,
                windows: [], doors: [], isPlaced: true,
                data: { v_width: 6, v_length: 4, v_height: 3.0, h_wall_area: 60, ac_area: 24 },
                supply: 0, exhaust: 0
            }]
        }];
        activeFloorId = appFloors[0].id;
        activeRoomId = appFloors[0].rooms[0].id;
        saveRoomsToStorage();
        console.log("Создан первый этаж по умолчанию.");
    } else {
        // Чистим ID и координаты от возможного мусора
        appFloors.forEach(f => {
            f.id = parseInt(f.id);
            if (f.rooms) {
                f.rooms.forEach(r => {
                    r.id = parseInt(r.id);
                    r.x = isNaN(parseFloat(r.x)) ? 0 : parseFloat(r.x);
                    r.y = isNaN(parseFloat(r.y)) ? 0 : parseFloat(r.y);
                    if (r.isPlaced === undefined) r.isPlaced = true;
                });
            }
        });

        let targetFloorId = parseInt(savedActiveFloorId);
        let activeFloor = appFloors.find(f => f.id === targetFloorId);
        if (!activeFloor) activeFloor = appFloors[0];
        activeFloorId = activeFloor.id;

        // Если этаж есть, но он пустой (нет комнат) — создаем комнату
        if (!activeFloor.rooms || activeFloor.rooms.length === 0) {
            activeFloor.rooms = [{
                id: Date.now(),
                name: 'Помещение 1',
                width: 6, length: 4, x: 0, y: 0,
                windows: [], doors: [], isPlaced: true,
                data: { v_width: 6, v_length: 4, v_height: 3.0, h_wall_area: 60, ac_area: 24 },
                supply: 0, exhaust: 0
            }];
        }

        syncAppRooms();

        let targetRoomId = parseInt(savedActiveId);
        if (!appRooms.find(r => r.id === targetRoomId)) activeRoomId = appRooms[0].id;
        else activeRoomId = targetRoomId;
    }

    saveRoomsToStorage();
    renderFloorTabs();
    renderRoomSelector();
    updateRoomTitle();
    loadActiveRoomData();
}

function syncAppRooms() {
    const activeFloor = appFloors.find(f => parseInt(f.id) === parseInt(activeFloorId));
    if (activeFloor && activeFloor.rooms) {
        appRooms = activeFloor.rooms;
        appRooms.forEach(r => {
            if (!r.windows) r.windows = [];
            if (!r.doors) r.doors = [];
            if (!r.data) r.data = {};
            r.id = parseInt(r.id);
            r.x = isNaN(parseFloat(r.x)) ? 0 : parseFloat(r.x);
            r.y = isNaN(parseFloat(r.y)) ? 0 : parseFloat(r.y);
            if (r.isPlaced === undefined) r.isPlaced = true;
        });
    } else {
        appRooms = [];
    }
}

function saveRoomsToStorage() {
    localStorage.setItem('calc_floors', JSON.stringify(appFloors));
    localStorage.setItem('active_floor_id', activeFloorId);
    localStorage.setItem('active_room_id', activeRoomId);
}

// ВАЖНО: Запускаем инициализацию после загрузки всех скриптов
window.addEventListener('load', () => {
    setTimeout(initRoomManager, 100);
});