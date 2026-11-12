function renderUnplacedRooms() {
    const list = document.getElementById('unplaced-rooms-list');
    if (!list) return;
    list.innerHTML = '';

    // Ищем комнаты, которые еще не на плане
    const unplaced = appRooms.filter(r => r.isPlaced === false);

    if (unplaced.length === 0) {
        list.innerHTML = '<p style="color: #94a3b8; font-size: 13px; text-align: center;">Все комнаты установлены</p>';
        return;
    }

    unplaced.forEach(room => {
        const item = document.createElement('div');
        item.draggable = true;
        item.dataset.id = room.id;
        item.style = "padding: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; cursor: grab; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; user-select: none;";
        item.innerHTML = `
            <span style="font-weight: 600; color: #1e293b; font-size: 13px;">${room.name}</span>
            <span style="font-size: 11px; color: #64748b; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${room.width}×${room.length}</span>
        `;

        // Начало перетаскивания
        item.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', room.id);
            item.style.opacity = '0.5';
        };
        item.ondragend = () => {
            item.style.opacity = '1';
        };

        // Клик по элементу выделяет его в калькуляторе
        item.onclick = () => {
            if (typeof selectPlanRoom === 'function') {
                selectPlanRoom(room.id);
            }
        };

        list.appendChild(item);
    });
}

// Инициализация зоны сброса
function initUnplacedDropZone() {
    const canvas = document.getElementById('plan-canvas'); // Серая область
    const inner = document.getElementById('plan-inner');   // Слой с сеткой

    if (!canvas || !inner) return;

    // Разрешаем сброс
    canvas.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    // Обрабатываем сброс
    canvas.ondrop = (e) => {
        e.preventDefault();

        const roomId = parseInt(e.dataTransfer.getData('text/plain'));
        const room = appRooms.find(r => parseInt(r.id) === roomId);

        if (!room) return;

        // Получаем координаты внутреннего слоя на экране
        const innerRect = inner.getBoundingClientRect();

        // Вычисляем минимальные координаты (как в renderPlan)
        let minX = Infinity, minY = Infinity;
        appRooms.forEach(r => {
            if (r.isPlaced !== false) {
                if (r.x < minX) minX = r.x;
                if (r.y < minY) minY = r.y;
            }
        });
        minX = Math.min(minX, 0);
        minY = Math.min(minY, 0);

        // Переводим пиксели клика в метры
        const dropX = (e.clientX - innerRect.left) / PLAN_SCALE;
        const dropY = (e.clientY - innerRect.top) / PLAN_SCALE;

        // Ставим комнату так, чтобы курсор был в её центре
        room.x = Math.max(0, dropX + minX - room.width / 2);
        room.y = Math.max(0, dropY + minY - room.length / 2);
        room.isPlaced = true;

        saveRoomsToStorage();

        if (typeof renderPlan === 'function') {
            renderPlan();
        }
    };
}