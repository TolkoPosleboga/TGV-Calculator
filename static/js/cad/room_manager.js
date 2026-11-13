function renderRoomSelector() {
    // 1. Рендер комнат текущего этажа
    const select = document.getElementById('room-selector');
    if (select) {
        select.innerHTML = '';
        if (appRooms.length === 0) {
            select.innerHTML = '<option value="">Нет комнат</option>';
        } else {
            appRooms.forEach(room => {
                const opt = document.createElement('option');
                opt.value = room.id;
                opt.textContent = room.name;
                if (parseInt(room.id) === parseInt(activeRoomId)) opt.selected = true;
                select.appendChild(opt);
            });
        }
    }

    // 2. Рендер этажей в калькуляторе
    const floorSelect = document.getElementById('express-floor-selector');
    if (floorSelect) {
        floorSelect.innerHTML = '';
        if (appFloors.length === 0) {
            floorSelect.innerHTML = '<option value="">Нет этажей</option>';
        } else {
            appFloors.forEach(floor => {
                const opt = document.createElement('option');
                opt.value = floor.id;
                opt.textContent = floor.name;
                if (parseInt(floor.id) === parseInt(activeFloorId)) opt.selected = true;
                floorSelect.appendChild(opt);
            });
        }
    }
}

function updateRoomTitle() {
    const titleEl = document.getElementById('current-room-title');
    if (titleEl) {
        const room = appRooms.find(r => r.id === activeRoomId);
        if (room) titleEl.textContent = `Помещение: ${room.name}`;
        else titleEl.textContent = `Помещение: не выбрано`;
    }
}

function switchRoom(newId) {
    newId = parseInt(newId);
    if (newId === activeRoomId) return;

    // Принудительное сохранение перед переключением
    saveActiveRoomData();

    activeRoomId = newId;
    saveRoomsToStorage();

    updateRoomTitle();
    loadActiveRoomData();

    if (document.getElementById('plan-view').classList.contains('active')) {
        renderPlan();
    }
}

function switchFloorFromExpress(newFloorId) {
    newFloorId = parseInt(newFloorId);
    if (newFloorId === activeFloorId) return;

    saveActiveRoomData();

    activeFloorId = newFloorId;
    syncAppRooms();

    activeRoomId = appRooms.length > 0 ? parseInt(appRooms[0].id) : null;

    saveRoomsToStorage();
    renderRoomSelector();
    updateRoomTitle();
    loadActiveRoomData();

    if (document.getElementById('plan-view').classList.contains('active')) {
        renderPlan();
    }
}

function saveActiveRoomData() {
    const currentRoom = appRooms.find(r => r.id === activeRoomId);
    if (!currentRoom) return;

    const localData = {};
    const globalData = JSON.parse(localStorage.getItem('calc_global_climate') || '{}');

    // Собираем текстовые поля и селекты ПРЯМО ИЗ DOM
    document.querySelectorAll('input:not([type="checkbox"]), select, textarea').forEach(el => {
        if (!el.id) return;

        // Пропускаем системные селекторы управления
        if (el.id === 'room-selector' || el.id === 'plan-room-selector' || el.id === 'express-floor-selector' || el.id === 'global_city') return;

        let val = el.value;
        if (isGlobalField(el.id)) {
            globalData[el.id] = val;
        } else {
            localData[el.id] = val;
        }
    });

    // Собираем чекбоксы
    document.querySelectorAll('input[type="checkbox"]').forEach(el => {
        if (!el.id) return;
        let val = el.checked;
        if (isGlobalField(el.id)) {
            globalData[el.id] = val;
        } else {
            localData[el.id] = val;
        }
    });

    currentRoom.data = localData;

    // Синхронизация габаритов Калькулятор -> CAD
    if (localData.v_width) currentRoom.width = parseFloat(localData.v_width.replace(',', '.')) || 4;
    if (localData.v_length) currentRoom.length = parseFloat(localData.v_length.replace(',', '.')) || 6;

    // Обновляем общее хранилище
    const combinedData = { ...localData, ...globalData };
    localStorage.setItem('calc_saved_data', JSON.stringify(combinedData));
    localStorage.setItem('calc_global_climate', JSON.stringify(globalData));
}

function loadActiveRoomData() {
    const room = appRooms.find(r => r.id === activeRoomId);
    if (!room) return;

    const localData = room.data || {};
    const globalData = JSON.parse(localStorage.getItem('calc_global_climate') || '{}');

    // Объединяем локальные данные комнаты и глобальный климат
    const combinedData = { ...localData, ...globalData };
    localStorage.setItem('calc_saved_data', JSON.stringify(combinedData));

    if (typeof applySavedDataToUI === 'function') {
        applySavedDataToUI();
    }

    // Синхронизация дымоудаления при переключении комнаты
    if (typeof syncSmokeData === 'function') {
        syncSmokeData();
    }

    // Скрываем старые результаты расчетов
    ['vent-results', 'heat-results', 'gas-results', 'ac-results'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function addNewRoom() {
    if (!activeFloorId) {
        alert("Сначала создайте этаж!");
        return;
    }

    const name = prompt("Введите название нового помещения:", `Помещение ${appRooms.length + 1}`);
    if (!name || name.trim() === "") return;

    saveActiveRoomData();

    let maxX = 0;
    appRooms.forEach(r => {
        if (r.isPlaced && r.width) {
            if (r.x + r.width > maxX) maxX = r.x + r.width;
        }
    });

    const w = 4, l = 6, h = 3.0;

    // Создаем новую комнату
    const newRoom = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: name.trim(),
        width: w,
        length: l,
        x: maxX + 2,
        y: 0,
        windows: [],
        doors: [],
        isPlaced: false,
        data: {
            v_width: w, v_length: l, v_height: h,
            v_win_area: 0,
            h_length: l, h_width: w, h_height: h,
            h_wall_area: 2 * (w + l) * h,
            h_win_area: 0,
            ac_area: w * l,
            ac_height: h,
            ac_window_area: 0
        },
        supply: 0,
        exhaust: 0
    };

    appRooms.push(newRoom);
    activeRoomId = newRoom.id;

    // Жесткая привязка к текущему этажу
    const activeFloor = appFloors.find(f => parseInt(f.id) === parseInt(activeFloorId));
    if (activeFloor) {
        activeFloor.rooms = appRooms;
    }

    saveRoomsToStorage();
    renderRoomSelector();
    updateRoomTitle();
    loadActiveRoomData();

    if (document.getElementById('plan-view').classList.contains('active')) {
        renderPlan();
    }
}

function deleteCurrentRoom() {
    if (appRooms.length <= 1) {
        alert("Нельзя удалить единственное помещение на этаже!");
        return;
    }
    if (!confirm("Удалить текущее помещение?")) return;

    appRooms = appRooms.filter(r => r.id !== activeRoomId);

    const activeFloor = appFloors.find(f => parseInt(f.id) === parseInt(activeFloorId));
    if (activeFloor) activeFloor.rooms = appRooms;

    activeRoomId = appRooms.length > 0 ? appRooms[0].id : null;

    saveRoomsToStorage();
    renderRoomSelector();
    updateRoomTitle();
    loadActiveRoomData();

    if (document.getElementById('plan-view').classList.contains('active')) {
        renderPlan();
    }
}

document.addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        if (e.target.readOnly || e.target.id === 'room-selector' || e.target.id === 'plan-room-selector' || e.target.id === 'express-floor-selector') return;
        setTimeout(() => {
            saveActiveRoomData();
            saveRoomsToStorage();
        }, 50);
    }
});