let currentHeatData = null;
let lastData = { vent: null, heat: null, gas: null, ac: null };
let lastResp = { vent: null, heat: null, gas: null, ac: null };
let isAutoCalc = false;

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedCalcVent = debounce(() => { if(typeof calcVent === 'function') calcVent(true); }, 600);
const debouncedCalcHeat = debounce(() => { if(typeof calcHeat === 'function') calcHeat(true); }, 600);
const debouncedCalcAc = debounce(() => { if(typeof calcAc === 'function') calcAc(true); }, 600);
const debouncedCalcGas = debounce(() => { if(typeof calcGas === 'function') calcGas(true); }, 600);

const debouncedCalcNaturalVent = debounce(() => { if(typeof calcNaturalVent === 'function') calcNaturalVent(true); }, 600);
const debouncedCalcSmokeExhaust = debounce(() => { if(typeof calcSmokeExhaust === 'function') calcSmokeExhaust(true); }, 600);
const debouncedCalcPressurization = debounce(() => { if(typeof calcPressurization === 'function') calcPressurization(true); }, 600);

const debouncedCalcCondensation = debounce(() => { if(typeof calcCondensation === 'function') calcCondensation(); }, 600);
const debouncedCalcHumidity = debounce(() => { if(typeof calcHumidity === 'function') calcHumidity(); }, 600);

function captureInitialValues() {
    document.querySelectorAll('input, select').forEach(el => {
        if (el.id === 'dim_width' || el.id === 'dim_length') return;
        if (el.type === 'checkbox') {
            el.dataset.initialChecked = el.checked;
        } else {
            el.dataset.initial = el.value;
        }
    });
}

function updateFieldStyle(el) {
    if (el.type === 'checkbox') return;
    if (el.id === 'room-selector' || el.id === 'plan-room-selector' || el.id === 'express-floor-selector' || el.id === 'global_city' || el.id === 'dim_width' || el.id === 'dim_length') return;
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

    document.querySelectorAll('input:not([type="checkbox"]), select').forEach(el => {
        if (el.dataset.initial !== undefined &&
            el.id !== 'room-selector' &&
            el.id !== 'plan-room-selector' &&
            el.id !== 'express-floor-selector' &&
            el.id !== 'global_city' &&
            el.id !== 'dim_width' &&
            el.id !== 'dim_length') {
            el.value = el.dataset.initial;
        }
    });

    for (let id in savedData) {
        if (id === 'room-selector' || id === 'plan-room-selector' || id === 'express-floor-selector' || id === 'global_city' || id === 'balance_rooms' || id === 'vent_sections' || id === 'dim_width' || id === 'dim_length') continue;

        const el = document.getElementById(id);
        if (!el) continue;

        if (el.type === 'checkbox') {
            el.checked = savedData[id] === true || savedData[id] === 'true';
            el.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            el.value = savedData[id];
            updateFieldStyle(el);
            if (el.tagName === 'SELECT') {
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }

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

        const activeTab = document.querySelector('.tab-content.active');
        if (!activeTab) return;

        if (activeTab.id === 'tab-vent') debouncedCalcVent();
        if (activeTab.id === 'tab-heat') debouncedCalcHeat();
        if (activeTab.id === 'tab-ac') debouncedCalcAc();
        if (activeTab.id === 'tab-gas') debouncedCalcGas();

        if (activeTab.id === 'tab-smoke') {
            const id = e.target.id;
            if (['nv_height', 'nv_t_in', 'nv_t_out', 'nv_area', 'nv_zeta'].includes(id)) debouncedCalcNaturalVent();
            if (['se_door_width', 'se_door_height', 'se_num_doors'].includes(id)) debouncedCalcSmokeExhaust();
            if (['pr_door_width', 'pr_door_height', 'pr_num_floors'].includes(id)) debouncedCalcPressurization();
        }

        if (activeTab.id === 'tab-vent-ext') {
            debouncedCalcCondensation();
            debouncedCalcHumidity();
        }
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

        ['v-dashboard', 'h-dashboard', 'g-dashboard', 'ac-dashboard', 'v-catalog', 'h-catalog', 'g-alerts', 'g-city-info', 'ac-catalog', 'nv-results', 'se-results', 'pr-results', 'ext-cond-results', 'humidity-results'].forEach(id => {
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

    if (tabId === 'smoke' && typeof syncSmokeData === 'function') syncSmokeData();
    if (tabId === 'vent-ext' && typeof syncCondensationData === 'function') syncCondensationData();
    if (tabId === 'vent-ext' && typeof syncHumidityData === 'function') syncHumidityData();

    if (tabId === 'vent') debouncedCalcVent();
    if (tabId === 'heat') debouncedCalcHeat();
    if (tabId === 'ac') debouncedCalcAc();
    if (tabId === 'gas') debouncedCalcGas();
    if (tabId === 'vent-ext') {
        debouncedCalcCondensation();
        debouncedCalcHumidity();
    }
}

function getVal(id, name) {
    const el = document.getElementById(id);
    if (!el || el.value.trim() === '') {
        if (!isAutoCalc) alert(`Заполните поле: ${name}`);
        if (el) el.focus();
        return null;
    }

    const cleanVal = el.value.replace(',', '.');
    const val = parseFloat(cleanVal);

    if (isNaN(val)) {
        if (!isAutoCalc) alert(`Поле "${name}" должно быть числом.`);
        el.focus();
        return null;
    }
    return val;
}