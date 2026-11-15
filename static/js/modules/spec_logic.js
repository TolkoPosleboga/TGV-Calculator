// Глобальная переменная для хранения последней спецификации
window.lastSyncedBOM = [];

function openSpecModal() {
    const modal = document.getElementById('spec-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeSpecModal() {
    const modal = document.getElementById('spec-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

async function syncSpecFromCalculations() {
    const btn = document.getElementById('btn-sync-spec');
    const content = document.getElementById('spec-content');
    const originalText = btn.innerText;

    btn.innerText = '⏳ Сбор данных...';
    btn.disabled = true;
    content.innerHTML = '<p style="text-align:center; color:var(--accent); font-weight:600;">Идет расчет и подбор оборудования по всем комнатам... Пожалуйста, подождите.</p>';

    const payload = [];
    if (typeof appFloors !== 'undefined') {
        appFloors.forEach(floor => {
            if (floor.rooms) {
                floor.rooms.forEach(room => {
                    payload.push({ id: room.id, name: room.name, data: room.data || {} });
                });
            }
        });
    }

    if (payload.length === 0) {
        showToast('Нет помещений для синхронизации.', 'error');
        content.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Добавьте комнаты на плане.</p>';
        btn.innerText = originalText;
        btn.disabled = false;
        return;
    }

    try {
        const resp = await fetch('/api/bom/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rooms: payload })
        });

        if (!resp.ok) throw new Error('Ошибка сервера при сборе спецификации');
        const data = await resp.json();

        if (!data.items || data.items.length === 0) {
            content.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Не удалось автоматически подобрать оборудование. Проверьте, заполнены ли исходные данные.</p>';
            document.getElementById('spec-total-price').textContent = '0 ₽';
            window.lastSyncedBOM = [];
        } else {
            renderSpecTable(data.items);
            window.lastSyncedBOM = data.items; // Сохраняем для экспорта
        }
    } catch (e) {
        content.innerHTML = `<div class="warn-box" style="text-align:center;"><b>Ошибка:</b> ${e.message}</div>`;
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

function renderSpecTable(items) {
    let html = `
        <table class="spec-table">
            <thead>
                <tr>
                    <th>Наименование оборудования</th>
                    <th style="width: 80px; text-align:center;">Кол-во</th>
                    <th style="width: 120px; text-align:right;">Цена</th>
                    <th style="width: 120px; text-align:right;">Сумма</th>
                </tr>
            </thead>
            <tbody>
    `;
    let total = 0;
    items.sort((a, b) => a.name.localeCompare(b.name));

    items.forEach(item => {
        const sum = item.price * item.qty;
        total += sum;
        html += `
            <tr>
                <td>${item.name}</td>
                <td style="text-align:center;" class="spec-qty">${item.qty} шт</td>
                <td style="text-align:right;" class="spec-price">${item.price.toLocaleString('ru-RU')} ₽</td>
                <td style="text-align:right; color:var(--accent); font-weight:bold;" class="spec-price">${sum.toLocaleString('ru-RU')} ₽</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    document.getElementById('spec-content').innerHTML = html;
    document.getElementById('spec-total-price').textContent = total.toLocaleString('ru-RU') + ' ₽';
}

// --- ФУНКЦИИ ЭКСПОРТА ---

async function downloadSpecExcel() {
    if (!window.lastSyncedBOM || window.lastSyncedBOM.length === 0) {
        showToast('Сначала синхронизируйте расчеты!', 'error');
        return;
    }
    const projName = document.getElementById('proj_name')?.value || 'Объект';

    try {
        const resp = await fetch('/api/spec_export/excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_name: projName, items: window.lastSyncedBOM })
        });
        if (!resp.ok) throw new Error('Ошибка генерации Excel');

        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Спецификация_${projName}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToast('Спецификация Excel успешно скачана', 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function downloadSpecPDF() {
    if (!window.lastSyncedBOM || window.lastSyncedBOM.length === 0) {
        showToast('Сначала синхронизируйте расчеты!', 'error');
        return;
    }
    const projName = document.getElementById('proj_name')?.value || 'Объект';

    try {
        const resp = await fetch('/api/spec_export/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_name: projName, items: window.lastSyncedBOM })
        });
        if (!resp.ok) throw new Error('Ошибка генерации PDF');

        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Спецификация_${projName}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToast('Спецификация PDF успешно скачана', 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
}