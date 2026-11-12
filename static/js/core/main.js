let currentHeatData = null;
let lastData = { vent: null, heat: null, gas: null, ac: null };
let lastResp = { vent: null, heat: null, gas: null, ac: null };

function captureInitialValues() {
    document.querySelectorAll('input, select').forEach(el => {
        if (el.type === 'checkbox') {
            el.dataset.initialChecked = el.checked;
        } else {
            el.dataset.initial = el.value;
        }
    });
}

function updateFieldStyle(el) {
    if (el.type === 'checkbox') return;
    if (el.id === 'room-selector' || el.id === 'plan-room-selector' || el.id === 'express-floor-selector' || el.id === 'global_city') return;

    if (el.dataset.initial === undefined) return;
    if (el.value !== el.dataset.initial) el.classList.add('edited-field');
    else el.classList.remove('edited-field');
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(viewId + '-view');
    if (target) target.classList.add('active');

    if (viewId === 'bim' && typeof loadProjects === 'function') loadProjects();
    if (viewId === 'balance' && typeof renderBalanceTable === 'function') renderBalanceTable();
    if (viewId === 'plan' && typeof renderPlan === 'function') renderPlan();
}

function applySavedDataToUI() {
    const savedData = JSON.parse(localStorage.getItem('calc_saved_data') || '{}');

    // Сначала сбрасываем поля к дефолтным
    document.querySelectorAll('input:not([type="checkbox"]), select').forEach(el => {
        if (el.dataset.initial !== undefined && el.id !== 'room-selector' && el.id !== 'plan-room-selector' && el.id !== 'express-floor-selector' && el.id !== 'global_city') {
            el.value = el.dataset.initial;
        }
    });

    // Применяем сохраненные данные
    for (let id in savedData) {
        if (id === 'room-selector' || id === 'plan-room-selector' || id === 'express-floor-selector' || id === 'balance_rooms' || id === 'vent_sections' || id === 'global_city') continue;

        const el = document.getElementById(id);
        if (!el) continue;

        if (el.type === 'checkbox') {
            el.checked = savedData[id] === true || savedData[id] === 'true';
            el.dispatchEvent(new Event('change', { bubbles: true })); // <-- ТРИГГЕР ДЛЯ ЧЕКБОКСОВ
        } else {
            el.value = savedData[id];
            updateFieldStyle(el);

            // ТРИГГЕР ДЛЯ СЕЛЕКТОВ (чтобы сработал onchange, например у типа помещения)
            if (el.tagName === 'SELECT') {
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }

    // ВОССТАНАВЛИВАЕМ ГОРОД (новый ключ или старый для совместимости)
    const globalCity = document.getElementById('global_city');
    if (globalCity) {
        const cityVal = savedData['global_city'] || savedData['v_city'];
        if (cityVal) globalCity.value = cityVal;
    }

    if (typeof restoreVentSections === 'function') restoreVentSections();

    const g_len = document.getElementById('g_length');
    if (g_len) g_len.dispatchEvent(new Event('input', { bubbles: true }));
}

window.addEventListener('load', () => {
    captureInitialValues();
    applySavedDataToUI();

    const syncToggle = document.getElementById('syncToggle');
    if (syncToggle) {
        ['sync-length', 'sync-width', 'sync-height'].forEach(cls => {
            const els = document.querySelectorAll('.' + cls);
            els.forEach(el => {
                el.addEventListener('input', (e) => {
                    if (!syncToggle.checked) return;
                    els.forEach(other => {
                        if (other !== e.target) {
                            other.value = e.target.value;
                            updateFieldStyle(other);
                        }
                    });
                });
            });
        });
    }
});

document.addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        if (e.target.readOnly || e.target.id === 'room-selector' || e.target.id === 'plan-room-selector' || e.target.id === 'express-floor-selector' || e.target.id === 'global_city') return;
        updateFieldStyle(e.target);
    }
});

function clearAll() {
    if (confirm("Сбросить все поля текущего помещения к заводским значениям?")) {
        localStorage.removeItem('calc_saved_data');

        document.querySelectorAll('input, select').forEach(el => {
            if (el.id === 'room-selector' || el.id === 'plan-room-selector' || el.id === 'express-floor-selector' || el.id === 'global_city') return;
            if (el.type === 'checkbox') {
                el.checked = (el.id === 'g_has_stove' || el.id === 'syncToggle');
            } else if (el.dataset.initial !== undefined) {
                el.value = el.dataset.initial;
            } else {
                el.selectedIndex = 0;
            }
            el.classList.remove('edited-field');
        });

        const sectionsContainer = document.getElementById('vent-sections-container');
        if (sectionsContainer) {
            sectionsContainer.innerHTML = '';
            if (typeof addVentSection === 'function') addVentSection();
        }

        ['vent-results', 'heat-results', 'gas-results', 'ac-results'].forEach(id => {
            const el = document.getElementById(id); if(el) el.style.display = 'none';
        });

        ['v-dashboard', 'h-dashboard', 'g-dashboard', 'ac-dashboard', 'v-catalog', 'h-catalog', 'g-alerts', 'g-city-info', 'ac-catalog'].forEach(id => {
            const el = document.getElementById(id); if(el) el.innerHTML = '';
        });

        if (typeof saveActiveRoomData === 'function') {
            saveActiveRoomData();
            saveRoomsToStorage();
        }
    }
}

function shareLink() {
    const savedData = localStorage.getItem('calc_saved_data') || '{}';
    const encoded = btoa(encodeURIComponent(savedData));
    const url = `${window.location.origin}/?data=${encoded}`;
    navigator.clipboard.writeText(url).then(() => alert("Ссылка на текущее помещение скопирована!"));
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    const content = document.getElementById('tab-' + tabId);
    const btn = document.getElementById('btn-' + tabId);
    if (content) content.classList.add('active');
    if (btn) btn.classList.add('active');
}

function getVal(id, name) {
    const el = document.getElementById(id);
    if (!el || el.value.trim() === '') {
        alert(`Заполните поле: ${name}`);
        if (el) el.focus();
        return null;
    }
    const val = parseFloat(el.value);
    if (isNaN(val)) {
        alert(`Поле "${name}" должно быть числом.`);
        el.focus();
        return null;
    }
    return val;
}