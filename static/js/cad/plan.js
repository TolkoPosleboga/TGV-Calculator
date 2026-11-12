const PLAN_SCALE = 15;
let currentTool = 'select';
let isDragging = false;
let dragTarget = null;
let dragStartX = 0;
let dragStartY = 0;
let dragRoomStartX = 0;
let dragRoomStartY = 0;

function sanitizePlanData() {
    appRooms.forEach((room, index) => {
        if (room.data && room.data.v_width) room.width = parseFloat(room.data.v_width);
        if (room.data && room.data.v_length) room.length = parseFloat(room.data.v_length);
        if (!room.width) room.width = 4;
        if (!room.length) room.length = 6;
        if (!room.windows) room.windows = [];
        if (!room.doors) room.doors = [];
        if (room.isPlaced === undefined) room.isPlaced = true;
    });
}

function setTool(tool) {
    currentTool = tool;
    const labelEl = document.getElementById('current-tool-label');
    if (labelEl) {
        labelEl.textContent = {
            'select': 'Выбор / Движение',
            'window': 'Установка окон',
            'door': 'Установка дверей'
        }[tool];
    }

    ['select', 'window', 'door'].forEach(t => {
        const btn = document.getElementById(`tool-${t}`);
        if (!btn) return;
        if (t === tool) {
            btn.style.background = '#e0f2fe';
            btn.style.color = '#0284c7';
            btn.style.borderColor = '#bae6fd';
            btn.style.fontWeight = 'bold';
        } else {
            btn.style.background = '#f8fafc';
            btn.style.color = '#1e293b';
            btn.style.borderColor = '#e2e8f0';
            btn.style.fontWeight = 'normal';
        }
    });
}

function renderPlan() {
    const inner = document.getElementById('plan-inner');
    if (!inner) return;

    // 1. ОБНОВЛЯЕМ ПЛАШКУ ЭТАЖА
    const activeFloor = appFloors.find(f => parseInt(f.id) === parseInt(activeFloorId));
    const floorNameEl = document.getElementById('current-floor-name');
    if (floorNameEl) {
        floorNameEl.textContent = activeFloor ? activeFloor.name : 'Этаж не выбран';
    }

    sanitizePlanData();
    inner.innerHTML = '';

    // ФИЛЬТР: рисуем только те комнаты, которые установлены на плане
    const placedRooms = appRooms.filter(r => r.isPlaced !== false);

    if (placedRooms.length === 0) {
        inner.innerHTML = '<p style="color: #64748b; padding: 20px; text-align: center; margin-top: 100px;">Помещения не установлены.<br>Перетащите их из правой панели.</p>';
        if (typeof renderUnplacedRooms === 'function') renderUnplacedRooms();
        if (typeof renderFloorTabs === 'function') renderFloorTabs();
        if (typeof initUnplacedDropZone === 'function') initUnplacedDropZone();
        return;
    }

    let minX = Infinity, minY = Infinity;
    placedRooms.forEach(r => {
        if (r.x < minX) minX = r.x;
        if (r.y < minY) minY = r.y;
    });
    minX = Math.min(minX, 0);
    minY = Math.min(minY, 0);

    placedRooms.forEach(room => {
        const pxX = Math.round((room.x - minX) * PLAN_SCALE);
        const pxY = Math.round((room.y - minY) * PLAN_SCALE);
        const pxW = Math.round(room.width * PLAN_SCALE);
        const pxH = Math.round(room.length * PLAN_SCALE);

        const roomDiv = document.createElement('div');
        roomDiv.className = 'plan-room-box';
        roomDiv.dataset.id = room.id;
        roomDiv.style.position = 'absolute';
        roomDiv.style.left = `${pxX}px`;
        roomDiv.style.top = `${pxY}px`;
        roomDiv.style.width = `${pxW}px`;
        roomDiv.style.height = `${pxH}px`;
        roomDiv.style.boxSizing = 'border-box';
        roomDiv.style.background = room.id === activeRoomId ? '#eff6ff' : '#ffffff';
        roomDiv.style.border = '2px solid #94a3b8';
        roomDiv.style.cursor = currentTool === 'select' ? 'grab' : 'crosshair';
        roomDiv.style.overflow = 'hidden';
        roomDiv.style.display = 'flex';
        roomDiv.style.flexDirection = 'column';
        roomDiv.style.justifyContent = 'center';
        roomDiv.style.alignItems = 'center';
        roomDiv.style.fontSize = '12px';
        roomDiv.style.textAlign = 'center';
        roomDiv.style.wordBreak = 'break-word';
        roomDiv.style.userSelect = 'none';

        if (room.id === activeRoomId) {
            roomDiv.style.zIndex = '5';
            roomDiv.style.outline = '3px solid #3b82f6';
            roomDiv.style.outlineOffset = '-3px';
        }

        roomDiv.innerHTML = `
            <strong style="color: #0f172a; z-index: 10; pointer-events: none;">${room.name}</strong>
            <span style="font-size: 10px; color: #64748b; z-index: 10; pointer-events: none;">${room.width} × ${room.length} м</span>
        `;

        room.windows.forEach(win => {
            const winDiv = document.createElement('div');
            winDiv.style.position = 'absolute';
            winDiv.style.background = '#60a5fa';
            winDiv.style.zIndex = '2';
            const wPx = (win.width || 1.2) * PLAN_SCALE;
            const offsetPx = (win.offset || 0) * PLAN_SCALE;
            if (win.side === 'top') { winDiv.style.top = '0'; winDiv.style.left = `${offsetPx}px`; winDiv.style.width = `${wPx}px`; winDiv.style.height = '6px'; }
            if (win.side === 'bottom') { winDiv.style.bottom = '0'; winDiv.style.left = `${offsetPx}px`; winDiv.style.width = `${wPx}px`; winDiv.style.height = '6px'; }
            if (win.side === 'left') { winDiv.style.left = '0'; winDiv.style.top = `${offsetPx}px`; winDiv.style.height = `${wPx}px`; winDiv.style.width = '6px'; }
            if (win.side === 'right') { winDiv.style.right = '0'; winDiv.style.top = `${offsetPx}px`; winDiv.style.height = `${wPx}px`; winDiv.style.width = '6px'; }
            roomDiv.appendChild(winDiv);
        });

        room.doors.forEach(door => {
            const doorDiv = document.createElement('div');
            doorDiv.style.position = 'absolute';
            doorDiv.style.background = '#78350f';
            doorDiv.style.zIndex = '2';
            const wPx = (door.width || 0.9) * PLAN_SCALE;
            const offsetPx = (door.offset || 0) * PLAN_SCALE;
            if (door.side === 'top') { doorDiv.style.top = '0'; doorDiv.style.left = `${offsetPx}px`; doorDiv.style.width = `${wPx}px`; doorDiv.style.height = '6px'; }
            if (door.side === 'bottom') { doorDiv.style.bottom = '0'; doorDiv.style.left = `${offsetPx}px`; doorDiv.style.width = `${wPx}px`; doorDiv.style.height = '6px'; }
            if (door.side === 'left') { doorDiv.style.left = '0'; doorDiv.style.top = `${offsetPx}px`; doorDiv.style.height = `${wPx}px`; doorDiv.style.width = '6px'; }
            if (door.side === 'right') { doorDiv.style.right = '0'; doorDiv.style.top = `${offsetPx}px`; doorDiv.style.height = `${wPx}px`; doorDiv.style.width = '6px'; }
            roomDiv.appendChild(doorDiv);
        });

        roomDiv.onmousedown = (e) => {
            if (currentTool !== 'select') return;
            e.preventDefault();
            e.stopPropagation();

            if (activeRoomId !== room.id) selectPlanRoom(room.id);

            isDragging = true;
            dragTarget = roomDiv;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragRoomStartX = room.x;
            dragRoomStartY = room.y;
            roomDiv.style.cursor = 'grabbing';
            roomDiv.style.zIndex = '999';
        };

        inner.appendChild(roomDiv);
    });

    inner.onclick = (e) => {
        if (e.target.closest('.plan-room-box') && currentTool === 'select') return;

        const rect = inner.getBoundingClientRect();
        const clickX = (e.clientX - rect.left) / PLAN_SCALE + minX;
        const clickY = (e.clientY - rect.top) / PLAN_SCALE + minY;

        if (currentTool === 'window' || currentTool === 'door') {
            const roomEl = e.target.closest('.plan-room-box');
            if (!roomEl) return;

            const roomId = parseInt(roomEl.dataset.id);
            const room = appRooms.find(r => r.id === roomId);
            if (!room) return;

            const pxX = (clickX - room.x) / room.width;
            const pxY = (clickY - room.y) / room.length;

            const distLeft = pxX, distRight = 1 - pxX, distTop = pxY, distBottom = 1 - pxY;
            const minDist = Math.min(distLeft, distRight, distTop, distBottom);

            let side = 'top';
            let offset = 0;
            const objWidth = currentTool === 'window' ? 1.5 : 0.9;

            if (minDist === distLeft) { side = 'left'; offset = Math.max(0, Math.min(room.length - objWidth, clickY - room.y - objWidth/2)); }
            else if (minDist === distRight) { side = 'right'; offset = Math.max(0, Math.min(room.length - objWidth, clickY - room.y - objWidth/2)); }
            else if (minDist === distTop) { side = 'top'; offset = Math.max(0, Math.min(room.width - objWidth, clickX - room.x - objWidth/2)); }
            else { side = 'bottom'; offset = Math.max(0, Math.min(room.width - objWidth, clickX - room.x - objWidth/2)); }

            if (currentTool === 'window') room.windows.push({ id: Date.now(), side: side, offset: offset, width: objWidth });
            else room.doors.push({ id: Date.now(), side: side, offset: offset, width: objWidth });

            const winArea = room.windows.length * 2.25;
            const doorArea = room.doors.length * 1.89;
            const perimeter = 2 * (room.width + room.length);
            const height = parseFloat(room.data.v_height) || 3.0;
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
    };

    document.onmousemove = (e) => {
        if (!isDragging || !dragTarget) return;
        const dx = (e.clientX - dragStartX) / PLAN_SCALE;
        const dy = (e.clientY - dragStartY) / PLAN_SCALE;
        dragTarget.style.left = `${Math.round((dragRoomStartX + dx) * PLAN_SCALE)}px`;
        dragTarget.style.top = `${Math.round((dragRoomStartY + dy) * PLAN_SCALE)}px`;
    };

    document.onmouseup = (e) => {
        if (!isDragging || !dragTarget) return;
        isDragging = false;
        dragTarget.style.cursor = 'grab';

        const dx = (e.clientX - dragStartX) / PLAN_SCALE;
        const dy = (e.clientY - dragStartY) / PLAN_SCALE;

        let newX = dragRoomStartX + dx;
        let newY = dragRoomStartY + dy;

        const movingRoom = appRooms.find(r => r.id === parseInt(dragTarget.dataset.id));
        if (!movingRoom) { dragTarget = null; return; }

        newX = Math.max(0, newX); newY = Math.max(0, newY);
        newX = Math.round(newX * 10) / 10; newY = Math.round(newY * 10) / 10;

        const SNAP_DIST = 0.5;
        placedRooms.forEach(other => {
            if (other.id === movingRoom.id) return;
            if (Math.abs((other.x + other.width) - newX) < SNAP_DIST) newX = other.x + other.width;
            if (Math.abs(other.x - (newX + movingRoom.width)) < SNAP_DIST) newX = other.x - movingRoom.width;
            if (Math.abs((other.y + other.length) - newY) < SNAP_DIST) newY = other.y + other.length;
            if (Math.abs(other.y - (newY + movingRoom.length)) < SNAP_DIST) newY = other.y - movingRoom.length;
        });

        movingRoom.x = newX; movingRoom.y = newY;
        dragTarget = null;
        saveRoomsToStorage();
        renderPlan();
    };

    let maxX = 0, maxY = 0;
    placedRooms.forEach(r => {
        if (r.x + r.width > maxX) maxX = r.x + r.width;
        if (r.y + r.length > maxY) maxY = r.y + r.length;
    });
    inner.style.width = `${Math.round((maxX - minX) * PLAN_SCALE) + 200}px`;
    inner.style.height = `${Math.round((maxY - minY) * PLAN_SCALE) + 200}px`;

    renderPlanSelector();
    if (typeof renderFloorTabs === 'function') renderFloorTabs();

    // ВЫЗОВ DROP ZONE
    if (typeof renderUnplacedRooms === 'function') renderUnplacedRooms();
    if (typeof initUnplacedDropZone === 'function') initUnplacedDropZone();
}

function renderPlanSelector() {
    const select = document.getElementById('plan-room-selector');
    if (!select) return;
    select.innerHTML = '';
    appRooms.forEach(room => {
        const opt = document.createElement('option');
        opt.value = room.id;
        opt.textContent = room.name;
        if (room.id === activeRoomId) opt.selected = true;
        select.appendChild(opt);
    });
}

function selectPlanRoom(id) {
    activeRoomId = id;
    saveRoomsToStorage();
    renderPlanSelector();
    updateRoomTitle();
    loadActiveRoomData();
    renderPlan();
}