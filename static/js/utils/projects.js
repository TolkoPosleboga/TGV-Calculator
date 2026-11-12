let activeProject = null;

window.addEventListener('load', () => {
    const savedProject = localStorage.getItem('active_project');
    if (savedProject) {
        activeProject = JSON.parse(savedProject);
        updateActiveProjectUI();
    }
});

function updateActiveProjectUI() {
    const bar = document.getElementById('active-project-bar');
    const nameSpan = document.getElementById('active-project-name');
    const saveBtns = document.querySelectorAll('.btn-save-db');
    if (activeProject) {
        if (bar) bar.style.display = 'flex';
        if (nameSpan) nameSpan.textContent = activeProject.name;
        saveBtns.forEach(btn => btn.style.display = 'block');
    } else {
        if (bar) bar.style.display = 'none';
        saveBtns.forEach(btn => btn.style.display = 'none');
    }
}

function clearActiveProject() {
    activeProject = null;
    localStorage.removeItem('active_project');
    updateActiveProjectUI();
}

async function loadProjects() {
    const listContainer = document.getElementById('projects-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<li>Загрузка...</li>';
    try {
        const response = await fetch('/api/projects/');
        if (!response.ok) throw new Error('Ошибка сети');
        const projects = await response.json();

        listContainer.innerHTML = '';
        if (projects.length === 0) {
            listContainer.innerHTML = '<li style="color:#94a3b8; font-size:13px;">Нет проектов</li>';
            return;
        }

        projects.forEach(project => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div style="flex: 1;">
                    <strong>${project.name}</strong>
                    <small>${project.address || ''}</small>
                </div>
                <div style="display: flex;">
                    <button class="btn-view-project" onclick="viewProject(${project.id})">Открыть</button>
                    <button class="btn-select-project" onclick="selectProject(${project.id}, '${project.name.replace(/'/g, "\\'")}')">Выбрать</button>
                    <button class="btn-del-project" onclick="deleteProject(${project.id})">✖</button>
                </div>
            `;
            listContainer.appendChild(li);
        });
    } catch (error) {
        console.error("Ошибка загрузки:", error);
        listContainer.innerHTML = '<li style="color:red">Ошибка загрузки</li>';
    }
}

function selectProject(id, name) {
    activeProject = { id: id, name: name };
    localStorage.setItem('active_project', JSON.stringify(activeProject));
    updateActiveProjectUI();
    alert(`Проект "${name}" выбран как активный.`);
}

async function deleteProject(id) {
    if (!confirm('Удалить проект?')) return;
    try {
        const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        if (response.ok) {
            if (activeProject && activeProject.id === id) clearActiveProject();
            loadProjects();
            document.getElementById('project-details-area').style.display = 'none';
        }
    } catch (error) { alert('Ошибка сети'); }
}

async function uploadIFC() {
    const fileInput = document.getElementById('ifc-file-input');
    const city = document.getElementById('bim_city').value;

    if (!fileInput.files.length) {
        alert('Выберите файл .ifc');
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('city', city); // Передаем город

    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = 'Анализ модели (может занять минуту)...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/ifc/upload', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (response.ok) {
            alert(`Успешно! Создан проект "${result.project_name}". Найдено помещений: ${result.rooms.length}.`);
            fileInput.value = '';
            document.getElementById('file-name-display').innerText = 'Файл не выбран';
            loadProjects();
        } else {
            alert('Ошибка: ' + (result.detail || 'Не удалось обработать файл'));
        }
    } catch (error) {
        alert('Ошибка сети.');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function viewProject(id) {
    const container = document.getElementById('project-details-area');
    if (!container) return;

    container.style.display = 'block';
    container.innerHTML = '<p>Загрузка данных...</p>';

    try {
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) throw new Error('Ошибка загрузки');
        const project = await response.json();

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; font-size: 15px;">${project.name}</h4>
                <button onclick="showSpecification(${project.id})" style="background: #059669; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">📊 Смета</button>
            </div>
            <div style="font-size: 12px;">Найдено комнат: ${project.rooms.length}</div>
            <ul style="margin-top: 10px; padding-left: 15px; font-size: 13px;">
        `;

        project.rooms.slice(0, 5).forEach(room => { // Показываем только первые 5, чтобы не раздувать список
            html += `<li>${room.name} (${room.area} м²)</li>`;
        });
        if (project.rooms.length > 5) html += `<li>... и еще ${project.rooms.length - 5}</li>`;

        html += `</ul><div id="project-spec-area" style="margin-top: 15px; font-size: 13px;"></div>`;
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<p style="color: red;">Ошибка загрузки.</p>';
    }
}

// Заглушка для сметы, чтобы не ломалась кнопка
async function showSpecification(id) {
    const specArea = document.getElementById('project-spec-area');
    specArea.innerHTML = '<p>Формирование сметы...</p>';
    const response = await fetch(`/api/projects/${id}/specification`);
    const spec = await response.json();

    if(spec.lines.length === 0) {
        specArea.innerHTML = '<p>Нет оборудования.</p>';
        return;
    }

    let html = '<table><tr><th>Модуль</th><th>Наименование</th><th>Сумма</th></tr>';
    spec.lines.forEach(l => {
        html += `<tr><td>${l.module}</td><td>${l.name}</td><td>${l.total_price ? l.total_price.toLocaleString('ru-RU') : 0} ₽</td></tr>`;
    });
    html += `<tr style="font-weight:bold; background:#ecfdf5;"><td colspan="2">ИТОГО:</td><td>${spec.total_sum.toLocaleString('ru-RU')} ₽</td></tr></table>`;
    specArea.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('projects-list')) {
        loadProjects();
    }
});