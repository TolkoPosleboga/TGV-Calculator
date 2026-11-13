let PLAN_SCALE = 20;
let isDragging = false;
let isResizing = false;
let dragTarget = null;
let dragStartX = 0;
let dragStartY = 0;
let dragRoomStartX = 0;
let dragRoomStartY = 0;
let dragRoomStartW = 0;
let dragRoomStartL = 0;
let selectedElement = null; // { roomId, elementType: 'window'|'door'|'passage', elementId }

function zoomIn() { PLAN_SCALE += 5; renderPlan(); }
function zoomOut() { if (PLAN_SCALE > 10) { PLAN_SCALE -= 5; renderPlan(); } }

function clearCurrentFloor() {
    if (!confirm("Удалить все комнаты на этом этаже?")) return;
    appRooms = [];
    const activeFloor = appFloors.find(f => parseInt(f.id) === parseInt(activeFloorId));
    if (activeFloor) activeFloor.rooms = [];
    activeRoomId = null;
    selectedElement = null;
    saveRoomsToStorage();
    renderPlan();
    renderRoomSelector();
    updateRoomTitle();
    loadActiveRoomData();
}

function createManualRoom() {
    if (!activeFloorId) { alert("Сначала создайте этаж!"); return; }
    const name = prompt("Название комнаты:", `Помещение ${appRooms.length + 1}`);
    if (!name) return;

    let maxX = 0;
    appRooms.forEach(r => {
        if (r.isPlaced && r.width) {
            if (r.x + r.width > maxX) maxX = r.x + r.width;
        }
    });

    const w = 4, l = 4, h = 3.0;
    const newRoom = {
        id: Date.now(), name: name, width: w, length: l,
        x: (appRooms.length === 0 ? 0 : maxX + 1), y: 0,
        windows: [], doors: [], isPlaced: true,
        data: {
            v_width: w, v_length: l, v_height: h,
            v_win_area: 0, h_length: l, h_width: w, h_height: h,
            h_wall_area: 2 * (w + l) * h, h_win_area: 0,
            ac_area: w * l, ac_height: h, ac_window_area: 0
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
}

function updateDimensionsFromInputs() {
    if (!activeRoomId) return;
    const room = appRooms.find(r => r.id === activeRoomId);
    if (!room) return;

    const w = Math.max(1, parseInt(document.getElementById('dim_width').value) || 4);
    const l = Math.max(1, parseInt(document.getElementById('dim_length').value) || 4);

    room.width = w; room.length = l;
    if (!room.data) room.data = {};
    room.data.v_width = w; room.data.v_length = l;

    // Обновляем DOM напрямую
    const roomDiv = document.querySelector(`.plan-room-box[data-id="${room.id}"]`);
    if (roomDiv) {
        roomDiv.style.width = `${w * PLAN_SCALE}px`;
        roomDiv.style.height = `${l * PLAN_SCALE}px`;
        const span = roomDiv.querySelector('span');
        if (span) span.textContent = `${w} × ${l} м`;
    }

    saveRoomsToStorage();
}

function updateElementProperty(prop, value) {
    if (!selectedElement) return;
    const room = appRooms.find(r => r.id === selectedElement.roomId);
    if (!room) return;

    let el;
    if (selectedElement.elementType === 'window') el = room.windows.find(w => w.id === selectedElement.elementId);
    if (selectedElement.elementType === 'door' || selectedElement.elementType === 'passage') el = room.doors.find(d => d.id === selectedElement.elementId);
    if (!el) return;

    el[prop] = parseFloat(value) || 0;
    saveRoomsToStorage();
    renderPlan();
}

function renderElementPropsPanel() {
    const panel = document.getElementById('element-props-panel');
    const content = document.getElementById('element-props-content');
    if (!panel || !content) return;

    if (!selectedElement) { panel.style.display = 'none'; return; }

    const room = appRooms.find(r => r.id === selectedElement.roomId);
    if (!room) { panel.style.display = 'none'; return; }

    let el, typeName;
    if (selectedElement.elementType === 'window') { el = room.windows.find(w => w.id === selectedElement.elementId); typeName = 'Окно'; }
    if (selectedElement.elementType === 'door') { el = room.doors.find(d => d.id === selectedElement.elementId && d.type !== 'passage'); typeName = 'Дверь'; }
    if (selectedElement.elementType === 'passage') { el = room.doors.find(d => d.id === selectedElement.elementId && d.type === 'passage'); typeName = 'Проем'; }

    if (!el) { panel.style.display = 'none'; return; }

    panel.style.display = 'block';

    const isWindow = selectedElement.elementType === 'window';
    const hasSill = isWindow;

    // Значения по умолчанию
    const width = el.width || 0.9;
    const height = el.height || (isWindow ? 1.5 : 2.1);
    const sill = el.sill || 0;
    const offset = el.offset || 0;

    let html = `
        <div style="font-weight: 600; color: #1e293b; text-align: center; margin-bottom: 10px; font-size: 13px;">${typeName}</div>

        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <div style="flex: 1;">
                <label style="font-size: 10px; color: #64748b; font-weight: 600; display: block; margin-bottom: 2px;">Ширина (м)</label>
                <input type="number" step="0.1" min="0.3" value="${width}" style="width: 100%; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; text-align: center;" onchange="updateElementProperty('width', this.value)">
            </div>
            <div style="flex: 1;">
                <label style="font-size: 10px; color: #64748b; font-weight: 600; display: block; margin-bottom: 2px;">Высота (м)</label>
                <input type="number" step="0.1" min="0.3" value="${height}" style="width: 100%; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; text-align: center;" onchange="updateElementProperty('height', this.value)">
            </div>
        </div>
    `;

    if (hasSill) {
        html += `
            <div style="margin-bottom: 8px;">
                <label style="font-size: 10px; color: #64748b; font-weight: 600; display: block; margin-bottom: 2px;">Отступ от пола (м)</label>
                <input type="number" step="0.1" min="0" value="${sill}" style="width: 100%; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; text-align: center;" onchange="updateElementProperty('sill', this.value)">
            </div>
        `;
    }

    html += `
        <div style="margin-bottom: 8px;">
            <label style="font-size: 10px; color: #64748b; font-weight: 600; display: block; margin-bottom: 2px;">Смещение по стене (м)</label>
            <input type="number" step="0.1" min="0" value="${offset}" style="width: 100%; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; text-align: center;" onchange="updateElementProperty('offset', this.value)">
        </div>
        <button onclick="deleteSelectedElement()" style="width: 100%; padding: 6px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">Удалить элемент</button>
    `;

    content.innerHTML = html;
}

function deleteSelectedElement() {
    if (!selectedElement) return;
    const room = appRooms.find(r => r.id === selectedElement.roomId);
    if (!room) return;

    if (selectedElement.elementType === 'window') {
        room.windows = room.windows.filter(w => w.id !== selectedElement.elementId);
    } else {
        room.doors = room.doors.filter(d => d.id !== selectedElement.elementId);
    }

    selectedElement = null;
    saveRoomsToStorage();
    renderPlan();
}

function renderPlan() {
    const inner = document.getElementById('plan-inner');
    if (!inner) return;

    const activeFloor = appFloors.find(f => parseInt(f.id) === parseInt(activeFloorId));
    const floorNameEl = document.getElementById('current-floor-name');
    if (floorNameEl) floorNameEl.textContent = activeFloor ? activeFloor.name : 'Этаж не выбран';

    inner.innerHTML = '';

    if (typeof currentTool !== 'undefined') {
        inner.style.cursor = currentTool === 'select' ? 'default' : 'crosshair';
    }

    const placedRooms = appRooms.filter(r => r.isPlaced !== false);

    if (activeRoomId) {
        const activeRoom = appRooms.find(r => r.id === activeRoomId);
        if (activeRoom) {
            const wInp = document.getElementById('dim_width');
            const lInp = document.getElementById('dim_length');
            if (wInp && document.activeElement !== wInp) wInp.value = activeRoom.width;
            if (lInp && document.activeElement !== lInp) lInp.value = activeRoom.length;
        }
    }

    if (placedRooms.length === 0) {
        inner.innerHTML = '<p style="color: #64748b; padding: 20px; text-align: center; margin-top: 100px;">Помещения не установлены.<br>Создайте комнату кнопкой "+ Комната" или перетащите из правой панели.</p>';
        if (typeof renderUnplacedRooms === 'function') renderUnplacedRooms();
        if (typeof renderFloorTabs === 'function') renderFloorTabs();
        if (typeof initUnplacedDropZone === 'function') initUnplacedDropZone();
        renderElementPropsPanel();
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
        roomDiv.style.border = '1px solid #64748b';
        roomDiv.style.cursor = (typeof currentTool === 'undefined' || currentTool === 'select') ? 'grab' : 'crosshair';
        roomDiv.style.overflow = 'hidden';
        roomDiv.style.display = 'flex';
        roomDiv.style.flexDirection = 'column';
        roomDiv.style.justifyContent = 'center';
        roomDiv.style.alignItems = 'center';
        roomDiv.style.fontSize = Math.max(10, Math.round(PLAN_SCALE * 0.6)) + 'px';
        roomDiv.style.textAlign = 'center';
        roomDiv.style.wordBreak = 'break-word';
        roomDiv.style.userSelect = 'none';

        if (room.id === activeRoomId) {
            roomDiv.style.zIndex = '5';
            roomDiv.style.outline = '2px solid #3b82f6';
            roomDiv.style.outlineOffset = '-2px';
        }

        roomDiv.innerHTML = `
            <strong style="color: #0f172a; z-index: 10; pointer-events: none;">${room.name}</strong>
            <span style="font-size: ${Math.max(8, Math.round(PLAN_SCALE * 0.45))}px; color: #64748b; z-index: 10; pointer-events: none;">${room.width} × ${room.length} м</span>
        `;

        room.windows.forEach(win => {
            const winDiv = document.createElement('div');
            winDiv.style.position = 'absolute';
            winDiv.style.background = '#60a5fa';
            winDiv.style.zIndex = '10';
            if (selectedElement && selectedElement.roomId === room.id && selectedElement.elementType === 'window' && selectedElement.elementId === win.id) {
                winDiv.style.boxShadow = '0 0 0 2px #ef4444';
            }
            const wPx = (win.width || 1.2) * PLAN_SCALE;
            const offsetPx = (win.offset || 0) * PLAN_SCALE;
            if (win.side === 'top') { winDiv.style.top = '0'; winDiv.style.left = `${offsetPx}px`; winDiv.style.width = `${wPx}px`; winDiv.style.height = '4px'; }
            if (win.side === 'bottom') { winDiv.style.bottom = '0'; winDiv.style.left = `${offsetPx}px`; winDiv.style.width = `${wPx}px`; winDiv.style.height = '4px'; }
            if (win.side === 'left') { winDiv.style.left = '0'; winDiv.style.top = `${offsetPx}px`; winDiv.style.height = `${wPx}px`; winDiv.style.width = '4px'; }
            if (win.side === 'right') { winDiv.style.right = '0'; winDiv.style.top = `${offsetPx}px`; winDiv.style.height = `${wPx}px`; winDiv.style.width = '4px'; }

            if (typeof currentTool === 'undefined' || currentTool === 'select') {
                winDiv.style.cursor = 'pointer';
                winDiv.onclick = (e) => {
                    e.stopPropagation();
                    selectedElement = { roomId: room.id, elementType: 'window', elementId: win.id };
                    renderPlan();
                };
            }
            roomDiv.appendChild(winDiv);
        });

        room.doors.filter(d => d.type !== 'passage').forEach(door => {
            const doorDiv = document.createElement('div');
            doorDiv.style.position = 'absolute';
            doorDiv.style.background = '#78350f';
            doorDiv.style.zIndex = '10';
            if (selectedElement && selectedElement.roomId === room.id && selectedElement.elementType === 'door' && selectedElement.elementId === door.id) {
                doorDiv.style.boxShadow = '0 0 0 2px #ef4444';
            }
            const wPx = (door.width || 0.9) * PLAN_SCALE;
            const offsetPx = (door.offset || 0) * PLAN_SCALE;
            if (door.side === 'top') { doorDiv.style.top = '0'; doorDiv.style.left = `${offsetPx}px`; doorDiv.style.width = `${wPx}px`; doorDiv.style.height = '4px'; }
            if (door.side === 'bottom') { doorDiv.style.bottom = '0'; doorDiv.style.left = `${offsetPx}px`; doorDiv.style.width = `${wPx}px`; doorDiv.style.height = '4px'; }
            if (door.side === 'left') { doorDiv.style.left = '0'; doorDiv.style.top = `${offsetPx}px`; doorDiv.style.height = `${wPx}px`; doorDiv.style.width = '4px'; }
            if (door.side === 'right') { doorDiv.style.right = '0'; doorDiv.style.top = `${offsetPx}px`; doorDiv.style.height = `${wPx}px`; doorDiv.style.width = '4px'; }

            if (typeof currentTool === 'undefined' || currentTool === 'select') {
                doorDiv.style.cursor = 'pointer';
                doorDiv.onclick = (e) => {
                    e.stopPropagation();
                    selectedElement = { roomId: room.id, elementType: 'door', elementId: door.id };
                    renderPlan();
                };
            }
            roomDiv.appendChild(doorDiv);
        });

        if (room.id === activeRoomId && (typeof currentTool === 'undefined' || currentTool === 'select')) {
            const resizeHandle = document.createElement('div');
            resizeHandle.style.position = 'absolute';
            resizeHandle.style.right = '0';
            resizeHandle.style.bottom = '0';
            resizeHandle.style.width = '12px';
            resizeHandle.style.height = '12px';
            resizeHandle.style.background = '#10b981';
            resizeHandle.style.cursor = 'nwse-resize';
            resizeHandle.style.zIndex = '30';

            resizeHandle.onmousedown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                isResizing = true;
                dragTarget = roomDiv;
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                dragRoomStartW = room.width;
                dragRoomStartL = room.length;
            };
            roomDiv.appendChild(resizeHandle);

            const createAddBtn = (side, styleStr) => {
                const btn = document.createElement('div');
                btn.style = `position: absolute; ${styleStr} width: 20px; height: 20px; background: #10b981; color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 16px; cursor: pointer; z-index: 30; box-shadow: 0 2px 4px rgba(0,0,0,0.2); line-height: 1;`;
                btn.innerHTML = '+';
                btn.onclick = (e) => {
                    e.stopPropagation();
                    addRoomToSide(room.id, side);
                };
                roomDiv.appendChild(btn);
            };
            createAddBtn('left', 'top: 50%; left: -10px; transform: translateY(-50%);');
            createAddBtn('right', 'top: 50%; right: -10px; transform: translateY(-50%);');
            createAddBtn('top', 'left: 50%; top: -10px; transform: translateX(-50%);');
            createAddBtn('bottom', 'left: 50%; bottom: -10px; transform: translateX(-50%);');
        }

        roomDiv.onmousedown = (e) => {
            if (typeof currentTool !== 'undefined' && currentTool !== 'select') return;
            e.preventDefault();
            e.stopPropagation();

            if (activeRoomId !== room.id) {
                selectPlanRoom(room.id);
                return;
            }

            isDragging = true;
            dragTarget = roomDiv;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragRoomStartX = room.x;
            dragRoomStartY = room.y;
            roomDiv.style.cursor = 'grabbing';
            roomDiv.style.zIndex = '999';
        };

        roomDiv.oncontextmenu = (e) => {
            e.preventDefault();
            if (confirm(`Удалить помещение "${room.name}"?`)) {
                appRooms = appRooms.filter(r => r.id !== room.id);
                const activeFloor = appFloors.find(f => parseInt(f.id) === parseInt(activeFloorId));
                if (activeFloor) activeFloor.rooms = appRooms;

                if (activeRoomId === room.id) {
                    activeRoomId = appRooms.length > 0 ? appRooms[0].id : null;
                    loadActiveRoomData();
                }

                saveRoomsToStorage();
                renderPlan();
                renderRoomSelector();
            }
        };

        inner.appendChild(roomDiv);
    });

    // === ПРОЕМЫ РИСУЕМ ОТДЕЛЬНО ПОВЕРХ ВСЕГО ===
    placedRooms.forEach(room => {
        room.doors.filter(d => d.type === 'passage').forEach(door => {
            const pxX = Math.round((room.x - minX) * PLAN_SCALE);
            const pxY = Math.round((room.y - minY) * PLAN_SCALE);
            const pxW = Math.round(room.width * PLAN_SCALE);
            const pxH = Math.round(room.length * PLAN_SCALE);

            const passageDiv = document.createElement('div');
            passageDiv.style.position = 'absolute';
            passageDiv.style.background = '#e2e8f0';
            passageDiv.style.zIndex = '200';
            passageDiv.style.boxSizing = 'border-box';

            if (selectedElement && selectedElement.roomId === room.id && selectedElement.elementType === 'passage' && selectedElement.elementId === door.id) {
                passageDiv.style.boxShadow = '0 0 0 2px #ef4444';
            }

            const wPx = (door.width || 1.2) * PLAN_SCALE;
            const offsetPx = (door.offset || 0) * PLAN_SCALE;

            // Проем перекрывает 3px с каждой стороны стены, чтобы соединить две комнаты
            if (door.side === 'top') {
                passageDiv.style.left = `${pxX + offsetPx}px`;
                passageDiv.style.top = `${pxY - 3}px`;
                passageDiv.style.width = `${wPx}px`;
                passageDiv.style.height = `6px`;
            }
            if (door.side === 'bottom') {
                passageDiv.style.left = `${pxX + offsetPx}px`;
                passageDiv.style.top = `${pxY + pxH - 3}px`;
                passageDiv.style.width = `${wPx}px`;
                passageDiv.style.height = `6px`;
            }
            if (door.side === 'left') {
                passageDiv.style.left = `${pxX - 3}px`;
                passageDiv.style.top = `${pxY + offsetPx}px`;
                passageDiv.style.width = `6px`;
                passageDiv.style.height = `${wPx}px`;
            }
            if (door.side === 'right') {
                passageDiv.style.left = `${pxX + pxW - 3}px`;
                passageDiv.style.top = `${pxY + offsetPx}px`;
                passageDiv.style.width = `6px`;
                passageDiv.style.height = `${wPx}px`;
            }

            if (typeof currentTool === 'undefined' || currentTool === 'select') {
                passageDiv.style.cursor = 'pointer';
                passageDiv.onclick = (e) => {
                    e.stopPropagation();
                    selectedElement = { roomId: room.id, elementType: 'passage', elementId: door.id };
                    renderPlan();
                };
            }

            inner.appendChild(passageDiv);
        });
    });

    inner.onclick = (e) => {
        // Клик в пустую область — снимаем выбор
        if (!e.target.closest('.plan-room-box') && !selectedElement) {
            // Ничего не делаем
        }

        if (typeof currentTool !== 'undefined' && currentTool === 'select') {
            // Если кликнули не по элементу, снимаем выбор
            if (!e.target.closest('.plan-room-box')) {
                selectedElement = null;
                renderPlan();
            }
            return;
        }
        if (typeof handleCanvasClick === 'function') {
            handleCanvasClick(e, inner, minX, minY);
        }
    };

    document.onmousemove = (e) => {
        if (isResizing && dragTarget) {
            const roomId = parseInt(dragTarget.dataset.id);
            const room = appRooms.find(r => parseInt(r.id) === roomId);
            if (!room) return;

            const dx = (e.clientX - dragStartX) / PLAN_SCALE;
            const dy = (e.clientY - dragStartY) / PLAN_SCALE;

            let newW = Math.max(1, Math.round(dragRoomStartW + dx));
            let newL = Math.max(1, Math.round(dragRoomStartL + dy));

            room.width = newW; room.length = newL;
            if (!room.data) room.data = {};
            room.data.v_width = newW; room.data.v_length = newL;

            dragTarget.style.width = `${newW * PLAN_SCALE}px`;
            dragTarget.style.height = `${newL * PLAN_SCALE}px`;

            const span = dragTarget.querySelector('span');
            if (span) span.textContent = `${newW} × ${newL} м`;

            const wInp = document.getElementById('dim_width');
            const lInp = document.getElementById('dim_length');
            if (wInp && document.activeElement !== wInp) wInp.value = newW;
            if (lInp && document.activeElement !== lInp) lInp.value = newL;

            return;
        }

        if (!isDragging || !dragTarget) return;
        const dx = (e.clientX - dragStartX) / PLAN_SCALE;
        const dy = (e.clientY - dragStartY) / PLAN_SCALE;

        let newX = Math.round(dragRoomStartX + dx);
        let newY = Math.round(dragRoomStartY + dy);

        dragTarget.style.left = `${newX * PLAN_SCALE}px`;
        dragTarget.style.top = `${newY * PLAN_SCALE}px`;
    };

    document.onmouseup = (e) => {
        if (isResizing && dragTarget) {
            isResizing = false;
            dragTarget = null;
            saveRoomsToStorage();
            renderPlan();
            if (typeof loadActiveRoomData === 'function') loadActiveRoomData();
            return;
        }

        if (!isDragging || !dragTarget) return;
        isDragging = false;
        dragTarget.style.cursor = 'grab';

        const dx = (e.clientX - dragStartX) / PLAN_SCALE;
        const dy = (e.clientY - dragStartY) / PLAN_SCALE;

        let newX = dragRoomStartX + dx;
        let newY = dragRoomStartY + dy;

        const movingRoom = appRooms.find(r => r.id === parseInt(dragTarget.dataset.id));
        if (!movingRoom) { dragTarget = null; return; }

        newX = Math.round(newX);
        newY = Math.round(newY);

        const SNAP_DIST = 0.6;
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
    if (typeof renderUnplacedRooms === 'function') renderUnplacedRooms();
    if (typeof initUnplacedDropZone === 'function') initUnplacedDropZone();
    renderElementPropsPanel();
}

function addRoomToSide(baseId, side) {
    const baseRoom = appRooms.find(r => r.id === baseId);
    if (!baseRoom) return;

    const name = prompt("Введите название нового помещения:", `Комната ${appRooms.length + 1}`);
    if (!name || name.trim() === "") return;

    const w = 4, l = 4, h = 3.0;
    let newX = baseRoom.x;
    let newY = baseRoom.y;

    if (side === 'right') newX += baseRoom.width;
    if (side === 'left') newX -= w;
    if (side === 'bottom') newY += baseRoom.length;
    if (side === 'top') newY -= l;

    const newRoom = {
        id: Date.now(), name: name.trim(), width: w, length: l, x: newX, y: newY,
        windows: [], doors: [], isPlaced: true,
        data: {
            v_width: w, v_length: l, v_height: h,
            v_win_area: 0, h_length: l, h_width: w, h_height: h,
            h_wall_area: 2 * (w + l) * h, h_win_area: 0,
            ac_area: w * l, ac_height: h, ac_window_area: 0
        },
        supply: 0, exhaust: 0
    };

    appRooms.push(newRoom);
    activeRoomId = newRoom.id;

    const activeFloor = appFloors.find(f => parseInt(f.id) === parseInt(activeFloorId));
    if (activeFloor) activeFloor.rooms = appRooms;

    saveRoomsToStorage();
    renderRoomSelector();
    updateRoomTitle();
    loadActiveRoomData();
    renderPlan();
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
    selectedElement = null;
    saveRoomsToStorage();
    renderPlanSelector();
    updateRoomTitle();
    loadActiveRoomData();
    renderPlan();
}