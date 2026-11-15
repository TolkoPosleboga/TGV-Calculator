// --- СИСТЕМА УВЕДОМЛЕНИЙ (TOASTS) ---
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500); // 3.5 секунды висит
}

// ==========================================
// ХИТРОСТЬ: ПЕРЕХВАТ СТАРОГО ALERT()
// ==========================================
// Теперь во ВСЕХ файлах проекта (где остались alert)
// будет вызываться showToast.
window.alert = function(msg) {
    showToast(msg, 'info');
};

// --- ГОРЯЧИЕ КЛАВИШИ ---
document.addEventListener('keydown', (e) => {
    // Ctrl + S (Сохранить)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (typeof saveRoomsToStorage === 'function') {
            saveRoomsToStorage();
            showToast('Данные проекта сохранены в кэш браузера', 'success');
        }
    }

    // Esc (Закрыть модалки/шторку)
    if (e.key === 'Escape') {
        if (typeof closeSpecModal === 'function') closeSpecModal();
        if (typeof closeDrawer === 'function') closeDrawer();
    }
});

// --- ШАПКА ПРОЕКТА ---
function saveProjectMeta() {
    const meta = {
        name: document.getElementById('proj_name')?.value || '',
        customer: document.getElementById('proj_customer')?.value || '',
        engineer: document.getElementById('proj_engineer')?.value || '',
        date: new Date().toLocaleDateString('ru-RU')
    };
    localStorage.setItem('project_meta', JSON.stringify(meta));
    showToast('Данные объекта обновлены', 'success');
}

function loadProjectMeta() {
    const saved = JSON.parse(localStorage.getItem('project_meta') || '{}');
    if (saved.name && document.getElementById('proj_name')) document.getElementById('proj_name').value = saved.name;
    if (saved.customer && document.getElementById('proj_customer')) document.getElementById('proj_customer').value = saved.customer;
    if (saved.engineer && document.getElementById('proj_engineer')) document.getElementById('proj_engineer').value = saved.engineer;

    const dateEl = document.getElementById('proj_date');
    if (dateEl) dateEl.textContent = saved.date || new Date().toLocaleDateString('ru-RU');
}

// Загружаем данные при старте
window.addEventListener('DOMContentLoaded', loadProjectMeta);