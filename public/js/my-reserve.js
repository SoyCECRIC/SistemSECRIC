document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    loadUserDataAndConfigureMenu();
    loadTableData('/reservations', 'reservations-table');
});

/* ---------------------- CARGAR DATOS DEL USUARIO ---------------------- */
async function loadUserData() {
    try {
        const res = await fetch('/user', { credentials: 'include' });
        if (!res.ok) throw new Error('Error al obtener usuario');
        
        const data = await res.json();
        const sidebarName = document.getElementById('user-name-sidebar');
        const sidebarImg = document.getElementById('sidebar-user-img');

        if (sidebarName) sidebarName.textContent = data.name || 'Usuario';
        if (sidebarImg) sidebarImg.src = data.profileImage || '/img/default-profile.png';

    } catch (err) {
        console.error('Error cargando datos del usuario:', err);
    }
}

/* ---------------------- CARGAR TABLA DE RESERVAS ---------------------- */
async function loadTableData(url, tableBodyId) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando reservas...</td></tr>';

    try {
        const res = await fetch(url, { credentials: 'include' });
        const reservations = await res.json();

        if (!reservations.length) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay reservas disponibles.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';

        reservations.forEach(resv => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${resv.date ? new Date(resv.date).toLocaleDateString() : '-'}</td>
                <td>${resv.entryTime || '-'}</td>
                <td>${resv.exitTime || '-'}</td>
                <td>${resv.motive || '-'}</td>
                <td>${resv.groupGrade || '-'}</td>
                <td>
                    <span class="badge bg-secondary">${resv.status}</span>
                </td>
            `;

            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error('Error:', err);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error cargando reservas</td></tr>`;
    }
}
