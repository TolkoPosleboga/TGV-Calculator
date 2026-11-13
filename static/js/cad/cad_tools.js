let currentTool = 'select';

function setTool(tool) {
    currentTool = tool;
    selectedElement = null; // Сбрасываем выбор при смене инструмента

    const labelEl = document.getElementById('current-tool-label');
    if (labelEl) {
        labelEl.textContent = {
            'select': 'Выбор / Движение',
            'name': 'Автонумерация',
            'window': 'Установка окон',
            'door': 'Установка дверей',
            'passage': 'Установка проемов',
            'stairs': 'Создание лестницы'
        }[tool];
    }

    document.querySelectorAll('.tool-btn').forEach(btn => {
        if (btn.id === `tool-${tool}`) {
            btn.style.background = '#eff6ff';
            btn.style.borderColor = '#bfdbfe';
            btn.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.2)';
        } else {
            btn.style.background = '#f8fafc';
            btn.style.borderColor = '#e2e8f0';
            btn.style.boxShadow = 'none';
        }
    });

    const inner = document.getElementById('plan-inner');
    if (inner) {
        inner.style.cursor = tool === 'select' ? 'default' : 'crosshair';
    }

    renderPlan();
}

function handleCanvasClick(e, inner, minX, minY) {
    if (currentTool === 'select') return;

    const rect = inner.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / PLAN_SCALE + minX;
    const clickY = (e.clientY - rect.top) / PLAN_SCALE + minY;

    const roomEl = e.target.closest('.plan-room-box');
    const roomId = roomEl ? parseInt(roomEl.dataset.id) : null;
    const room = roomId ? appRooms.find(r => r.id === roomId) : null;

    // 1. АВТОНУМЕРАЦИЯ
    if (currentTool === 'name') {
        if (!room) return;
        const floorMatch = activeFloor.name.match(/\d+/);
        const floorNum = floorMatch ? parseInt(floorMatch[0]) : 1;

        let maxRoomNum = 0;
        appRooms.forEach(r => {
            if (/^\d{3}$/.test(r.name)) {
                const num = parseInt(r.name.substring(1));
                if (num > maxRoomNum) maxRoomNum = num;
            }
        });

        room.name = `${floorNum}${String(maxRoomNum + 1).padStart(2, '0')}`;
        saveRoomsToStorage();
        renderPlan();
        renderRoomSelector();
        if (activeRoomId === room.id) updateRoomTitle();
        return;
    }

    // 2. ЛЕСТНИЦА
    if (currentTool === 'stairs') {
        if (roomEl) return;
        const w = 3, l = 4;
        const newRoom = {
            id: Date.now(), name: 'ЛК', width: w, length: l,
            x: Math.round(clickX - w/2), y: Math.round(clickY - l/2),
            windows: [], doors: [], isPlaced: true,
            data: {
                v_width: w, v_length: l, v_height: 3.0,
                v_win_area: 0, h_length: l, h_width: w, h_height: 3.0,
                h_wall_area: 2 * (w + l) * 3.0, h_win_area: 0,
                ac_area: w * l, ac_height: 3.0, ac_window_area: 0,
                v_room_type: 'stairwell', h_room_type: 'stairwell', ac_room_type: 'stairwell'
            },
            supply: 0, exhaust: 0
        };
        appRooms.push(newRoom);
        activeRoomId = newRoom.id;
        const activeFloor = appFloors.find(f => parseInt(f.id) === parseInt(activeFloorId));
        if (activeFloor) activeFloor.rooms = appRooms;
        saveRoomsToStorage();
        renderPlan();
        renderRoomSelector();
        updateRoomTitle();
        loadActiveRoomData();
        return;
    }

    // 3. ОКНА, ДВЕРИ, ПРОЕМЫ
    if (currentTool === 'window' || currentTool === 'door' || currentTool === 'passage') {
        if (!room) return;

        const pxX = (clickX - room.x) / room.width;
        const pxY = (clickY - room.y) / room.length;

        const distLeft = pxX, distRight = 1 - pxX, distTop = pxY, distBottom = 1 - pxY;
        const minDist = Math.min(distLeft, distRight, distTop, distBottom);

        let side = 'top';
        let offset = 0;

        let objWidth = 0.9;
        if (currentTool === 'window') objWidth = 1.5;
        if (currentTool === 'passage') objWidth = 1.2;

        if (minDist === distLeft) { side = 'left'; offset = Math.max(0, Math.min(room.length - objWidth, clickY - room.y - objWidth/2)); }
        else if (minDist === distRight) { side = 'right'; offset = Math.max(0, Math.min(room.length - objWidth, clickY - room.y - objWidth/2)); }
        else if (minDist === distTop) { side = 'top'; offset = Math.max(0, Math.min(room.width - objWidth, clickX - room.x - objWidth/2)); }
        else { side = 'bottom'; offset = Math.max(0, Math.min(room.width - objWidth, clickX - room.x - objWidth/2)); }

        // Проверка для проема
        if (currentTool === 'passage') {
            if (typeof isWallShared === 'function' && !isWallShared(room, side, clickX, clickY)) {
                alert("Проем можно установить только на стене, разделяющей две комнаты!");
                return;
            }
        }

        const newElement = {
            id: Date.now(),
            side: side,
            offset: offset,
            width: objWidth,
            height: currentTool === 'window' ? 1.5 : (currentTool === 'door' ? 2.1 : 2.8),
            sill: currentTool === 'window' ? 0.9 : 0
        };

        if (currentTool === 'passage') {
            newElement.type = 'passage';
            room.doors.push(newElement);
        } else if (currentTool === 'window') {
            room.windows.push(newElement);
        } else {
            room.doors.push(newElement);
        }

        const winArea = room.windows.length * 2.25;
        const doorArea = room.doors.length * 1.89;
        const perimeter = 2 * (room.width + room.length);
        const height = parseFloat(room.data?.v_height) || 3.0;
        const wallArea = Math.max(0, (perimeter * height) - winArea - doorArea);

        if (!room.data) room.data = {};
        room.data.v_win_area = winArea;
        room.data.h_win_area = winArea;
        room.data.ac_window_area = winArea;
        room.data.h_wall_area = wallArea;

        saveRoomsToStorage();
        renderPlan();

        if (activeRoomId === room.id) loadActiveRoomData();
    }
}

// Проверка: есть ли соседняя комната за стеной
function isWallShared(room, side, clickX, clickY) {
    const epsilon = 0.2;
    let checkX = clickX, checkY = clickY;

    if (side === 'left') checkX = room.x - epsilon;
    else if (side === 'right') checkX = room.x + room.width + epsilon;
    else if (side === 'top') checkY = room.y - epsilon;
    else if (side === 'bottom') checkY = room.y + room.length + epsilon;

    return appRooms.some(r =>
        r.id !== room.id && r.isPlaced !== false &&
        checkX >= r.x - 0.1 && checkX <= r.x + r.width + 0.1 &&
        checkY >= r.y - 0.1 && checkY <= r.y + r.length + 0.1
    );
}