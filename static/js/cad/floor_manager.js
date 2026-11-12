function renderFloorTabs() {
    const container = document.getElementById('floor-tabs');
    if (!container) return;
    container.innerHTML = '';

    appFloors.forEach(floor => {
        const tabWrapper = document.createElement('div');
        tabWrapper.style = "display: flex; align-items: stretch; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05);";

        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.style = `margin: 0; padding: 8px 15px; width: auto; font-size: 13px; border-radius: 0; ${floor.id === activeFloorId ? 'background: #3b82f6; color: white;' : 'background: #e2e8f0; color: #1e293b;'}`;
        btn.textContent = floor.name;
        btn.onclick = () => {
            if (floor.id === activeFloorId) return;
            saveActiveRoomData();
            activeFloorId = parseInt(floor.id);
            syncAppRooms();
            activeRoomId = appRooms.length > 0 ? parseInt(appRooms[0].id) : null;
            saveRoomsToStorage();

            renderFloorTabs();
            renderRoomSelector();
            updateRoomTitle();
            loadActiveRoomData();
            renderPlan();
        };
        tabWrapper.appendChild(btn);

        if (appFloors.length > 1) {
            const delBtn = document.createElement('button');
            delBtn.className = 'btn';
            delBtn.style = `margin: 0; padding: 8px 12px; width: auto; border-radius: 0; background: #fef2f2; color: #dc2626; border-left: 1px solid #fecaca; font-size: 12px;`;
            delBtn.innerHTML = '✖';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                deleteFloor(floor.id);
            };
            tabWrapper.appendChild(delBtn);
        }

        container.appendChild(tabWrapper);
    });
}

// Вместо старой логики просто вызываем функцию из нового файла
function addNewFloor() {
    if (typeof copyCurrentFloorToNew === 'function') {
        copyCurrentFloorToNew();
    } else {
        alert("Ошибка: скрипт копирования не загружен!");
    }
}

function deleteFloor(id) {
    if (appFloors.length <= 1) {
        alert("Нельзя удалить единственный этаж!");
        return;
    }

    const floorToDelete = appFloors.find(f => parseInt(f.id) === parseInt(id));
    if (!confirm(`Удалить "${floorToDelete.name}"?`)) return;

    appFloors = appFloors.filter(f => parseInt(f.id) !== parseInt(id));

    if (parseInt(activeFloorId) === parseInt(id)) {
        activeFloorId = parseInt(appFloors[0].id);
        syncAppRooms();
        activeRoomId = appRooms.length > 0 ? parseInt(appRooms[0].id) : null;
        loadActiveRoomData();
    }

    saveRoomsToStorage();
    renderFloorTabs();
    renderRoomSelector();
    updateRoomTitle();
    renderPlan();
}