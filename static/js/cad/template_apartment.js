function loadFloorTemplate() {
    if (!confirm("Создать шаблон этажа? Текущие комнаты будут удалены.")) return;

    if (typeof saveActiveRoomData === 'function') saveActiveRoomData();

    const activeFloor = appFloors.find(f => parseInt(f.id) === parseInt(activeFloorId));
    if (!activeFloor) { alert("Сначала создайте этаж!"); return; }

    const floorMatch = activeFloor.name.match(/\d+/);
    const floorNum = floorMatch ? parseInt(floorMatch[0]) : 1;

    const rooms = [
        { name: "KÖK/VARDAGSRUM", width: 9.8, length: 5.0, x: 0, y: 7.0, type: "living", order: 1,
          windows: [{ side: 'top', offset: 1.5, width: 1.5 }, { side: 'top', offset: 6.5, width: 1.5 }, { side: 'left', offset: 2.0, width: 1.5 }],
          doors: [{ side: 'bottom', offset: 6.5, width: 0.9 }] },
        { name: "SOVRUM", width: 4.5, length: 4.5, x: 0, y: 0, type: "living", order: 2,
          windows: [{ side: 'left', offset: 1.5, width: 1.5 }, { side: 'bottom', offset: 1.5, width: 1.5 }],
          doors: [{ side: 'right', offset: 1.5, width: 0.9 }] },
        { name: "ENTRÉ", width: 2.5, length: 3.0, x: 4.5, y: 0, type: "corridor", order: 3,
          doors: [{ side: 'bottom', offset: 0.75, width: 1.0 }, { side: 'top', offset: 0.75, width: 0.9 }] },
        { name: "TVÄTT", width: 2.8, length: 3.0, x: 7.0, y: 0, type: "bathroom", order: 4,
          doors: [{ side: 'top', offset: 0.75, width: 0.8 }] },
        { name: "HALL", width: 5.3, length: 2.0, x: 4.5, y: 3.0, type: "corridor", order: 5,
          doors: [{ side: 'left', offset: 1.0, width: 0.9 }, { side: 'bottom', offset: 0.5, width: 0.9 }, { side: 'top', offset: 1.5, width: 0.9 }] },
        { name: "Stairs", width: 2.0, length: 2.0, x: 4.5, y: 5.0, type: "stairwell", order: 6,
          doors: [{ side: 'bottom', offset: 0.4, width: 1.2, type: 'passage' }] },
        { name: "WC/D", width: 3.3, length: 2.0, x: 6.5, y: 5.0, type: "bathroom", order: 7,
          doors: [{ side: 'bottom', offset: 1.5, width: 0.8 }] },
        { name: "F/K", width: 1.3, length: 2.0, x: 8.5, y: 5.0, type: "corridor", order: 8,
          doors: [{ side: 'bottom', offset: 0.3, width: 0.7 }] },
        { name: "U/M", width: 1.3, length: 2.0, x: 8.5, y: 7.0, type: "corridor", order: 9,
          doors: [{ side: 'bottom', offset: 0.3, width: 0.7 }] },
        { name: "KÖK/VARDAGSRUM", width: 9.8, length: 5.0, x: 10.2, y: 7.0, type: "living", order: 11,
          windows: [{ side: 'top', offset: 1.5, width: 1.5 }, { side: 'top', offset: 6.5, width: 1.5 }, { side: 'right', offset: 2.0, width: 1.5 }],
          doors: [{ side: 'bottom', offset: 2.4, width: 0.9 }] },
        { name: "SOVRUM", width: 4.5, length: 4.5, x: 15.5, y: 0, type: "living", order: 12,
          windows: [{ side: 'right', offset: 1.5, width: 1.5 }, { side: 'bottom', offset: 1.5, width: 1.5 }],
          doors: [{ side: 'left', offset: 1.5, width: 0.9 }] },
        { name: "ENTRÉ", width: 2.5, length: 3.0, x: 13.0, y: 0, type: "corridor", order: 13,
          doors: [{ side: 'bottom', offset: 0.75, width: 1.0 }, { side: 'top', offset: 0.75, width: 0.9 }] },
        { name: "TVÄTT", width: 2.8, length: 3.0, x: 10.2, y: 0, type: "bathroom", order: 14,
          doors: [{ side: 'top', offset: 1.25, width: 0.8 }] },
        { name: "HALL", width: 5.3, length: 2.0, x: 10.2, y: 3.0, type: "corridor", order: 15,
          doors: [{ side: 'right', offset: 1.0, width: 0.9 }, { side: 'bottom', offset: 0.5, width: 0.9 }, { side: 'top', offset: 1.5, width: 0.9 }] },
        { name: "Stairs", width: 2.0, length: 2.0, x: 13.5, y: 5.0, type: "stairwell", order: 16,
          doors: [{ side: 'bottom', offset: 0.4, width: 1.2, type: 'passage' }] },
        { name: "WC/D", width: 3.3, length: 2.0, x: 10.2, y: 5.0, type: "bathroom", order: 17,
          doors: [{ side: 'bottom', offset: 1.5, width: 0.8 }] },
        { name: "F/K", width: 1.3, length: 2.0, x: 10.2, y: 5.0, type: "corridor", order: 18,
          doors: [{ side: 'bottom', offset: 0.3, width: 0.7 }] },
        { name: "U/M", width: 1.3, length: 2.0, x: 10.2, y: 7.0, type: "corridor", order: 19,
          doors: [{ side: 'bottom', offset: 0.3, width: 0.7 }] }
    ];

    const sortedRooms = rooms.sort((a, b) => a.order - b.order);
    let roomCounter = 1;

    const finalRooms = sortedRooms.map((r, index) => {
        const w = r.width; const l = r.length;
        const windows = r.windows || []; const doors = r.doors || []; const h = 3.0;
        windows.forEach(win => win.id = Date.now() + Math.random());
        doors.forEach(door => door.id = Date.now() + Math.random());

        const winArea = windows.length * 2.25;
        const doorArea = doors.length * 1.89;
        const perimeter = 2 * (w + l);
        const wallArea = Math.max(0, (perimeter * h) - winArea - doorArea);

        let roomName = r.name;
        if (r.type === "living") {
            const roomNum = String(roomCounter).padStart(2, '0');
            roomName = `${floorNum}${roomNum}`;
            roomCounter++;
        }

        return {
            id: Date.now() + index, name: roomName, width: w, length: l, x: r.x, y: r.y,
            isPlaced: true, windows: windows, doors: doors,
            data: {
                v_width: w, v_length: l, v_height: h, v_win_area: parseFloat(winArea.toFixed(2)),
                h_length: l, h_width: w, h_height: h, h_wall_area: parseFloat(wallArea.toFixed(2)), h_win_area: parseFloat(winArea.toFixed(2)),
                ac_area: parseFloat((w * l).toFixed(2)), ac_height: h, ac_window_area: parseFloat(winArea.toFixed(2)),
                v_room_type: r.type, h_room_type: r.type, ac_room_type: r.type
            },
            supply: 0, exhaust: 0
        };
    });

    activeFloor.rooms = finalRooms;
    activeRoomId = finalRooms[0].id;

    saveRoomsToStorage();
    syncAppRooms();
    renderPlan();
    renderRoomSelector();
    updateRoomTitle();
    loadActiveRoomData();

    alert(`Шаблон этажа создан! Пронумеровано жилых комнат: ${roomCounter - 1}.`);
}

function addApartmentTemplate() {
    if (typeof activeFloorId === 'undefined' || !activeFloorId) {
        alert("Сначала создайте этаж!");
        return;
    }

    let maxAptNum = 0;
    appRooms.forEach(room => {
        const match = room.name.match(/\(Кв\.?\s*(\d+)\)/i);
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxAptNum) maxAptNum = num;
        }
    });
    const newAptNum = maxAptNum + 1;

    if (!confirm(`Добавить типовую квартиру №${newAptNum} на текущий этаж?`)) return;

    if (typeof saveActiveRoomData === 'function') saveActiveRoomData();

    const offsetX = (newAptNum - 1) * 12.5;
    const offsetY = 0;

    const apartmentRooms = [
        { baseName: "Спальня 1", type: "living", w: 3.8, l: 4.2, x: 0, y: 0, people: 2, heat: 0.2, moisture: 500, hazard: 0, mpc: 20, isCorner: true },
        { baseName: "Спальня 2", type: "living", w: 3.2, l: 4.0, x: 3.8, y: 0, people: 1, heat: 0.1, moisture: 300, hazard: 0, mpc: 20, isCorner: false },
        { baseName: "Кухня", type: "kitchen", w: 3.0, l: 3.5, x: 7.0, y: 0, people: 1, heat: 0.6, moisture: 1500, hazard: 0, mpc: 20, isCorner: false },
        { baseName: "Санузел", type: "bathroom", w: 2.0, l: 2.5, x: 0, y: 4.2, people: 0, heat: 0.1, moisture: 1200, hazard: 0, mpc: 20, isCorner: false },
        { baseName: "Коридор", type: "corridor", w: 2.0, l: 4.0, x: 2.0, y: 4.2, people: 0, heat: 0.0, moisture: 0, hazard: 0, mpc: 20, isCorner: false },
        { baseName: "Прихожая", type: "corridor", w: 2.0, l: 2.0, x: 4.0, y: 4.2, people: 0, heat: 0.0, moisture: 0, hazard: 0, mpc: 20, isCorner: false }
    ];

    let addedCount = 0;

    apartmentRooms.forEach(r => {
        const winArea = parseFloat((r.w * r.l * 0.15).toFixed(2));
        const wallArea = parseFloat((2 * (r.w + r.l) * 3.0 - winArea).toFixed(2));
        const floorArea = parseFloat((r.w * r.l).toFixed(2));

        const newRoom = {
            id: Date.now() + Math.floor(Math.random() * 10000),
            name: `${r.baseName} (Кв. ${newAptNum})`,
            width: r.w,
            length: r.l,
            x: r.x + offsetX,
            y: r.y + offsetY,
            windows: [],
            doors: [],
            isPlaced: true,
            data: {
                v_width: r.w, v_length: r.l, v_height: 3.0, v_win_area: winArea,
                v_people: r.people, v_heat: r.heat, v_moisture: r.moisture,
                v_hazard: r.hazard, v_mpc: r.mpc, v_t_in: r.type === 'bathroom' ? 24 : 20,
                v_room_type: r.type, v_system_type: 'exhaust',

                h_length: r.l, h_width: r.w, h_height: 3.0,
                h_wall_area: wallArea, h_win_area: winArea, h_floor_area: floorArea,
                h_room_type: r.type, h_t_in: r.type === 'bathroom' ? 24 : 20,

                ac_area: floorArea, ac_height: 3.0, ac_people: r.people, ac_window_area: winArea,
                ac_room_type: r.type, ac_t_in: 24,

                g_length: r.l, g_width: r.w, g_room_height: 3.0,
                v_is_corner: r.isCorner, h_is_corner: r.isCorner, ac_is_corner: r.isCorner
            },
            supply: 0,
            exhaust: 0
        };

        appRooms.push(newRoom);
        addedCount++;
    });

    activeRoomId = appRooms[appRooms.length - addedCount].id;

    const activeFloor = appFloors.find(f => parseInt(f.id) === parseInt(activeFloorId));
    if (activeFloor) activeFloor.rooms = appRooms;

    saveRoomsToStorage();
    renderPlan();
    renderRoomSelector();
    updateRoomTitle();
    loadActiveRoomData();

    alert(`Добавлена квартира №${newAptNum} (${addedCount} комнат).`);
}