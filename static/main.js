let currentHeatData = null;
let lastData = { vent: null, heat: null, gas: null };
let lastResp = { vent: null, heat: null, gas: null };

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
    if (el.dataset.initial === undefined) return;
    if (el.value !== el.dataset.initial) el.classList.add('edited-field');
    else el.classList.remove('edited-field');
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(viewId + '-view');
    if (target) target.classList.add('active');
    if (viewId === 'bim' && typeof loadProjects === 'function') loadProjects();
}

window.addEventListener('load', () => {
    captureInitialValues();

    // 1. Восстановление данных
    const savedData = JSON.parse(localStorage.getItem('calc_saved_data') || '{}');
    for (let id in savedData) {
        const el = document.getElementById(id);
        if (!el) continue;

        if (el.type === 'checkbox') {
            el.checked = savedData[id] === true || savedData[id] === 'true';
        } else if (id !== 'vent_sections') {
            el.value = savedData[id];
            updateFieldStyle(el);
        }
    }

    // 2. Синхронизация габаритов
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

                            const saved = JSON.parse(localStorage.getItem('calc_saved_data') || '{}');
                            saved[other.id] = other.value;
                            localStorage.setItem('calc_saved_data', JSON.stringify(saved));
                        }
                    });
                });
            });
        });
    }

    // 3. Пересчет объема газа
    const g_len = document.getElementById('g_length');
    const g_wid = document.getElementById('g_width');
    const g_hei = document.getElementById('g_room_height');
    const g_vol = document.getElementById('g_room_volume');

    function updateGasVolume() {
        if (!g_len || !g_wid || !g_hei || !g_vol) return;
        const l = parseFloat(g_len.value) || 0;
        const w = parseFloat(g_wid.value) || 0;
        const h = parseFloat(g_hei.value) || 0;
        const vol = l * w * h;
        if (vol > 0) g_vol.value = vol.toFixed(1);
    }

    if (g_len) g_len.addEventListener('input', updateGasVolume);
    if (g_wid) g_wid.addEventListener('input', updateGasVolume);
    if (g_hei) g_hei.addEventListener('input', updateGasVolume);
    updateGasVolume();
});

document.addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        if (e.target.readOnly) return;

        const savedData = JSON.parse(localStorage.getItem('calc_saved_data') || '{}');

        if (e.target.type === 'checkbox') {
            savedData[e.target.id] = e.target.checked;
        } else {
            savedData[e.target.id] = e.target.value;
            updateFieldStyle(e.target);
        }
        localStorage.setItem('calc_saved_data', JSON.stringify(savedData));
    }
});

function clearAll() {
    if (confirm("Сбросить все поля к заводским значениям?")) {
        localStorage.removeItem('calc_saved_data');
        window.history.replaceState({}, document.title, window.location.pathname);

        document.querySelectorAll('input, select').forEach(el => {
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

        ['vent-results', 'heat-results', 'gas-results'].forEach(id => {
            const el = document.getElementById(id); if(el) el.style.display = 'none';
        });

        ['v-dashboard', 'h-dashboard', 'g-dashboard', 'v-catalog', 'h-catalog', 'g-alerts', 'g-city-info'].forEach(id => {
            const el = document.getElementById(id); if(el) el.innerHTML = '';
        });

        const gSafetyCard = document.getElementById('g-safety-card');
        if (gSafetyCard) gSafetyCard.style.display = 'none';

        ['v_gsop', 'h_gsop', 'g_gsop', 'bim_gsop'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });

        document.querySelectorAll('select.sync-city').forEach(el => { el.value = ''; });

        const g_len = document.getElementById('g_length');
        const g_wid = document.getElementById('g_width');
        const g_hei = document.getElementById('g_room_height');
        const g_vol = document.getElementById('g_room_volume');
        if (g_len && g_wid && g_hei && g_vol) {
            g_vol.value = (parseFloat(g_len.value) * parseFloat(g_wid.value) * parseFloat(g_hei.value)).toFixed(1);
        }

        lastData = { vent: null, heat: null, gas: null };
        lastResp = { vent: null, heat: null, gas: null };
        currentHeatData = null;
    }
}

function shareLink() {
    const savedData = localStorage.getItem('calc_saved_data') || '{}';
    const encoded = btoa(encodeURIComponent(savedData));
    const url = `${window.location.origin}/?data=${encoded}`;
    navigator.clipboard.writeText(url).then(() => alert("Ссылка скопирована!"));
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