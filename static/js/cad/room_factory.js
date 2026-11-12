function createRoomObject(name, width, length, x, y, height = 3.0) {
    return {
        id: Date.now() + Math.floor(Math.random() * 10000),
        name: name,
        width: width,
        length: length,
        x: x,
        y: y,
        windows: [],
        doors: [],
        data: {
            v_width: width, v_length: length, v_height: height,
            v_win_area: 0,
            h_length: length, h_width: width, h_height: height,
            h_wall_area: 2 * (width + length) * height,
            h_win_area: 0,
            ac_area: width * length,
            ac_height: height,
            ac_window_area: 0
        },
        supply: 0,
        exhaust: 0
    };
}

function cloneRoomObject(room) {
    // Глубокое копирование
    const newRoom = JSON.parse(JSON.stringify(room));

    // Генерируем новые уникальные ID
    newRoom.id = Date.now() + Math.floor(Math.random() * 10000);

    if (Array.isArray(newRoom.windows)) {
        newRoom.windows.forEach(w => w.id = Date.now() + Math.floor(Math.random() * 10000));
    }
    if (Array.isArray(newRoom.doors)) {
        newRoom.doors.forEach(d => d.id = Date.now() + Math.floor(Math.random() * 10000));
    }

    return newRoom;
}