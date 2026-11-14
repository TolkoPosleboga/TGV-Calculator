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
    let rowCounter = 1;

    appFloors.forEach(floor => {
        if (floor.rooms && floor.rooms.length > 0) {
            tbody.innerHTML += `
                <tr style="background: #f1f5f9; border-top: 2px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">
                    <td colspan="4" style="padding: 10px 15px; font-weight: 700; color: #1e40af; font-size: 14px; text-transform: uppercase;">
                        ${floor.name}
                    </td>
                </tr>
            `;

            floor.rooms.forEach(room => {
                const supply = room.supply !== undefined ? room.supply : 0;
                const exhaust = room.exhaust !== undefined ? room.exhaust : 0;

                tbody.innerHTML += `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px; text-align: center; color: #64748b;">${rowCounter++}</td>
                        <td style="padding: 10px; text-align: left; font-weight: 600; color: #334155; padding-left: 20px;">${room.name}</td>
                        <td style="padding: 5px;">
                            <input type="number" class="bal-input-supply" data-floor-id="${floor.id}" data-room-id="${room.id}" value="${supply}" min="0" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; text-align: center;">
                        </td>
                        <td style="padding: 5px;">
                            <input type="number" class="bal-input-exhaust" data-floor-id="${floor.id}" data-room-id="${room.id}" value="${exhaust}" min="0" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; text-align: center;">
                        </td>
                    </tr>
                `;
            });
        }
    });

    document.querySelectorAll('.bal-input-supply').forEach(input => {
        input.addEventListener('input', (e) => {
            const floorId = parseInt(e.target.dataset.floorId);
            const roomId = parseInt(e.target.dataset.roomId);
            const floor = appFloors.find(f => parseInt(f.id) === floorId);
            if (floor) {
                const room = floor.rooms.find(r => parseInt(r.id) === roomId);
                if (room) { room.supply = parseFloat(e.target.value) || 0; saveRoomsToStorage(); }
            }
        });
    });

    document.querySelectorAll('.bal-input-exhaust').forEach(input => {
        input.addEventListener('input', (e) => {
            const floorId = parseInt(e.target.dataset.floorId);
            const roomId = parseInt(e.target.dataset.roomId);
            const floor = appFloors.find(f => parseInt(f.id) === floorId);
            if (floor) {
                const room = floor.rooms.find(r => parseInt(r.id) === roomId);
                if (room) { room.exhaust = parseFloat(e.target.value) || 0; saveRoomsToStorage(); }
            }
        });
    });
}

async function syncAllRoomBalances() {
    if (typeof saveActiveRoomData === 'function') saveActiveRoomData();

    const payload = [];
    const t_out = parseFloat(document.getElementById('v_t_out')?.value) || -20;

    appFloors.forEach(floor => {
        if (floor.rooms) {
            floor.rooms.forEach(room => {
                const d = room.data || {};
                payload.push({
                    id: room.id,
                    length: parseFloat(d.v_length) || parseFloat(room.length) || 4,
                    width: parseFloat(d.v_width) || parseFloat(room.width) || 6,
                    height: parseFloat(d.v_height) || 3.0,
                    people: parseInt(d.v_people) || 0,
                    heat_gain_kw: parseFloat(d.v_heat) || 0,
                    moisture_gain_g_h: parseFloat(d.v_moisture) || 0,
                    hazard_g_h: parseFloat(d.v_hazard) || 0,
                    mpc_mg_m3: parseFloat(d.v_mpc) || 20,
                    room_type: d.v_room_type || 'office',
                    system_type: d.v_system_type || 'supply',
                    t_inside: parseFloat(d.v_t_in) || 20,
                    t_outside: t_out
                });
            });
        }
    });

    if (payload.length === 0) { alert("Нет помещений."); return; }

    const btn = document.getElementById('sync-balance-btn');
    if (btn) { btn.innerText = 'Синхронизация...'; btn.disabled = true; }

    try {
        const resp = await fetch('/api/balance/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rooms: payload })
        });
        if (!resp.ok) throw new Error('Ошибка сервера');
        const data = await resp.json();

        data.rooms.forEach(syncRoom => {
            appFloors.forEach(floor => {
                if (floor.rooms) {
                    const room = floor.rooms.find(r => r.id === syncRoom.id);
                    if (room) { room.supply = syncRoom.supply; room.exhaust = syncRoom.exhaust; }
                }
            });
        });

        if (typeof saveRoomsToStorage === 'function') saveRoomsToStorage();
        renderBalanceTable();
    } catch (e) {
        alert('Ошибка синхронизации: ' + e.message);
    } finally {
        if (btn) { btn.innerText = 'Синхронизировать со всеми расчетами'; btn.disabled = false; }
    }
}

async function calcBalance() {
    const allRoomsPayload = [];
    appFloors.forEach(floor => {
        if (floor.rooms) {
            floor.rooms.forEach(room => {
                allRoomsPayload.push({
                    name: `${room.name} (${floor.name})`,
                    supply: room.supply || 0,
                    exhaust: room.exhaust || 0
                });
            });
        }
    });

    if (allRoomsPayload.length === 0) { alert("Нет помещений!"); return; }

    document.getElementById('balance-results').style.display = 'block';
    document.getElementById('balance-dashboard').innerHTML = '<p>Расчёт...</p>';

    try {
        const resp = await fetch('/api/balance/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rooms: allRoomsPayload })
        });
        if (!resp.ok) throw new Error('Ошибка сервера');
        const r = await resp.json();
        const bgColor = r.is_balanced ? '#f0fdf4' : '#fef2f2';
        const borderColor = r.is_balanced ? '#22c55e' : '#ef4444';

        document.getElementById('balance-dashboard').innerHTML = `
            <div class="result-box" style="background: #eff6ff; border-color: #bfdbfe;"><h4>Общий приток</h4><div class="value">${r.total_supply} <span class="unit">м³/ч</span></div></div>
            <div class="result-box" style="background: #fdf4ff; border-color: #f0abfc;"><h4>Общая вытяжка</h4><div class="value">${r.total_exhaust} <span class="unit">м³/ч</span></div></div>
            <div class="result-box" style="background: ${bgColor}; border-color: ${borderColor}; grid-column: span 2;">
                <h4 style="color: ${r.is_balanced ? '#166534' : '#991b1b'};">${r.status} (Дисбаланс: ${r.imbalance} м³/ч)</h4>
                ${r.warning ? `<div style="font-size: 13px; color: #7f1d1d; margin-top: 5px;">${r.warning}</div>` : ''}
            </div>
        `;
    } catch (e) {
        document.getElementById('balance-dashboard').innerHTML = `<div class="warn-box" style="grid-column: 1 / -1; margin: 0;"><b>Ошибка:</b> ${e.message}</div>`;
    }
}