function updateRoomBalance(L_max, systemType) {
    const room = appRooms.find(r => r.id === activeRoomId);
    if (!room) return;
    
    if (systemType === 'supply') { room.supply = L_max; room.exhaust = 0; }
    else if (systemType === 'exhaust') { room.exhaust = L_max; room.supply = 0; }
    else if (systemType === 'both') { room.supply = L_max; room.exhaust = L_max; }
    
    saveRoomsToStorage();
}

function renderBalanceTable() {
    const tbody = document.getElementById('balance-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    // Показываем комнаты только текущего этажа (или можно сделать по всем этажам - по желанию)
    appRooms.forEach((room, index) => {
        const supply = room.supply !== undefined ? room.supply : 0;
        const exhaust = room.exhaust !== undefined ? room.exhaust : 0;
        
        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; text-align: center; color: #64748b;">${index + 1}</td>
                <td style="padding: 10px; text-align: left; font-weight: 600; color: #334155;">${room.name}</td>
                <td style="padding: 5px;"><input type="number" class="bal-input-supply" data-id="${room.id}" value="${supply}" min="0" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; text-align: center;"></td>
                <td style="padding: 5px;"><input type="number" class="bal-input-exhaust" data-id="${room.id}" value="${exhaust}" min="0" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; text-align: center;"></td>
            </tr>
        `;
    });

    document.querySelectorAll('.bal-input-supply').forEach(input => {
        input.addEventListener('input', (e) => {
            const id = parseInt(e.target.dataset.id);
            const room = appRooms.find(r => r.id === id);
            if (room) { room.supply = parseFloat(e.target.value) || 0; saveRoomsToStorage(); }
        });
    });
    document.querySelectorAll('.bal-input-exhaust').forEach(input => {
        input.addEventListener('input', (e) => {
            const id = parseInt(e.target.dataset.id);
            const room = appRooms.find(r => r.id === id);
            if (room) { room.exhaust = parseFloat(e.target.value) || 0; saveRoomsToStorage(); }
        });
    });
}

async function calcBalance() {
    if (appRooms.length === 0) return;
    const roomsPayload = appRooms.map(r => ({ name: r.name, supply: r.supply || 0, exhaust: r.exhaust || 0 }));
    document.getElementById('balance-results').style.display = 'block';
    
    try {
        const resp = await fetch('/api/balance/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rooms: roomsPayload }) });
        if (!resp.ok) throw new Error('Ошибка сервера');
        const r = await resp.json();
        const bgColor = r.is_balanced ? '#f0fdf4' : '#fef2f2';
        const borderColor = r.is_balanced ? '#22c55e' : '#ef4444';
        const icon = r.is_balanced ? '✅' : '⚠️';

        document.getElementById('balance-dashboard').innerHTML = `
            <div class="result-box" style="background: #eff6ff; border-color: #bfdbfe;"><h4>Общий приток</h4><div class="value">${r.total_supply} <span class="unit">м³/ч</span></div></div>
            <div class="result-box" style="background: #fdf4ff; border-color: #f0abfc;"><h4>Общая вытяжка</h4><div class="value">${r.total_exhaust} <span class="unit">м³/ч</span></div></div>
            <div class="result-box" style="background: ${bgColor}; border-color: ${borderColor}; grid-column: span 2;">
                <h4 style="color: ${r.is_balanced ? '#166534' : '#991b1b'};">${icon} ${r.status} (Дисбаланс: ${r.imbalance} м³/ч)</h4>
                ${r.warning ? `<div style="font-size: 13px; color: #7f1d1d; margin-top: 5px;">${r.warning}</div>` : ''}
            </div>
        `;
    } catch (e) { alert(e.message); }
}