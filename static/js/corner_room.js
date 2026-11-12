// Справочник нормативных температур (дублируем для независимости модуля)
const BASE_TEMPS = {
    living: 20,
    office: 20,
    kitchen: 19,
    bathroom: 24,
    industrial_light: 16,
    industrial_heavy: 15
};

// Переопределяем глобальную функцию, чтобы добавить логику угловых помещений
window.applyNormTemperature = function(prefix) {
    const typeSelect = document.getElementById(`${prefix}_room_type`);
    const tempInput = document.getElementById(`${prefix}_t_in`);
    const cornerCheck = document.getElementById(`${prefix}_is_corner`);

    if (typeSelect && tempInput) {
        const selectedType = typeSelect.value;
        let baseTemp = BASE_TEMPS[selectedType] !== undefined ? BASE_TEMPS[selectedType] : 20;

        // Если галочка "Угловое помещение" стоит — добавляем +2 градуса
        if (cornerCheck && cornerCheck.checked) {
            baseTemp += 2;
        }

        tempInput.value = baseTemp;

        // Сохраняем в память
        const savedData = JSON.parse(localStorage.getItem('calc_saved_data') || '{}');
        savedData[`${prefix}_t_in`] = tempInput.value;
        savedData[`${prefix}_is_corner`] = cornerCheck ? cornerCheck.checked : false;
        localStorage.setItem('calc_saved_data', JSON.stringify(savedData));

        // Синхронизация со второй вкладкой
        const syncToggle = document.getElementById('syncToggle');
        if (syncToggle && syncToggle.checked) {
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

// Восстановление галочек при загрузке страницы
window.addEventListener('load', () => {
    const savedData = JSON.parse(localStorage.getItem('calc_saved_data') || '{}');

    ['v', 'h'].forEach(prefix => {
        const cornerCheck = document.getElementById(`${prefix}_is_corner`);
        if (cornerCheck && savedData[`${prefix}_is_corner`] !== undefined) {
            cornerCheck.checked = savedData[`${prefix}_is_corner`];
        }
        // Пересчитываем температуру с учетом загруженных галочек
        if (typeof window.applyNormTemperature === 'function') {
            window.applyNormTemperature(prefix);
        }
    });
});