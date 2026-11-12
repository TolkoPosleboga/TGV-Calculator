// Справочник нормативных температур
const BASE_TEMPS = {
    living: 20,
    office: 20,
    kitchen: 19,
    bathroom: 24,
    corridor: 18,
    stairwell: 16,
    server_room: 22,
    smoking: 18,
    industrial_light: 16,
    industrial_heavy: 15,
    sport: 15
};

window.applyNormTemperature = function(prefix) {
    const typeSelect = document.getElementById(`${prefix}_room_type`);
    const tempInput = document.getElementById(`${prefix}_t_in`);
    const cornerCheck = document.getElementById(`${prefix}_is_corner`);

    if (typeSelect && tempInput) {
        const selectedType = typeSelect.value;
        let baseTemp = BASE_TEMPS[selectedType] !== undefined ? BASE_TEMPS[selectedType] : 20;

        // Для коридоров и лестниц угловая комната не так критична, но логику оставим
        if (cornerCheck && cornerCheck.checked) {
            baseTemp += 2;
        }

        tempInput.value = baseTemp;

        const savedData = JSON.parse(localStorage.getItem('calc_saved_data') || '{}');
        savedData[`${prefix}_t_in`] = tempInput.value;
        savedData[`${prefix}_is_corner`] = cornerCheck ? cornerCheck.checked : false;
        localStorage.setItem('calc_saved_data', JSON.stringify(savedData));

        const syncToggle = document.getElementById('syncToggle');
        if (syncToggle && syncToggle.checked && (prefix === 'v' || prefix === 'h')) {
            const otherPrefix = prefix === 'v' ? 'h' : 'v';
            const otherTemp = document.getElementById(`${otherPrefix}_t_in`);
            const otherSelect = document.getElementById(`${otherPrefix}_room_type`);
            const otherCorner = document.getElementById(`${otherPrefix}_is_corner`);

            if (otherTemp) otherTemp.value = baseTemp;
            if (otherSelect) otherSelect.value = selectedType;
            if (otherCorner) otherCorner.checked = cornerCheck.checked;

            savedData[`${otherPrefix}_t_in`] = baseTemp;
            savedData[`${otherPrefix}_room_type`] = selectedType;
            savedData[`${otherPrefix}_is_corner`] = cornerCheck.checked;
            localStorage.setItem('calc_saved_data', JSON.stringify(savedData));
        }
    }
};

window.addEventListener('load', () => {
    const savedData = JSON.parse(localStorage.getItem('calc_saved_data') || '{}');

    ['v', 'h', 'ac'].forEach(prefix => {
        const cornerCheck = document.getElementById(`${prefix}_is_corner`);
        if (cornerCheck && savedData[`${prefix}_is_corner`] !== undefined) {
            cornerCheck.checked = savedData[`${prefix}_is_corner`];
        }
        if (typeof window.applyNormTemperature === 'function') {
            window.applyNormTemperature(prefix);
        }
    });
});