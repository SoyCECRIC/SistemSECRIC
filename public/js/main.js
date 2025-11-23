document.addEventListener('DOMContentLoaded', async () => {
  // Elementos del DOM
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const mainContent = document.getElementById('main-content');
  const overlay = document.getElementById('overlay');

  if (!sidebar || !sidebarToggle || !overlay || !mainContent) {
    console.error('Elementos del DOM no encontrados');
    return;
  }
  
  async function loadUserData() {
    try {
      const res = await fetch('/user', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al obtener usuario');
      const data = await res.json();
      console.log('Rol del usuario:', data.role);
      document.getElementById('user-name').textContent = data.name || 'Usuario';
      document.getElementById('user-name-sidebar').textContent = data.name || 'Usuario';
      const sidebarImg = document.getElementById('sidebar-user-img');
      if (sidebarImg && data.profileImage) {
                sidebarImg.src = `${data.profileImage}?t=${new Date().getTime()}`;
                console.log('Imagen de perfil asignada:', sidebarImg.src); // Depuración
            } else if (sidebarImg) {
                sidebarImg.src = '/img/default-profile.png?t=' + new Date().getTime();
                console.log('Imagen por defecto asignada:', sidebarImg.src); // Depuración
            }
            document.querySelector('.user-img')?.setAttribute('src', `${data.profileImage || '/img/default-profile.png'}?t=${new Date().getTime()}`)
      return data.role;
    } catch (err) {
console.error('Error cargando datos del usuario:', err);
            const sidebarImg = document.getElementById('sidebar-user-img');
            if (sidebarImg) {
                sidebarImg.src = '/img/default-profile.png?t=' + new Date().getTime();
            }
            return null;
    }
  }
  
  // Función para alternar el sidebar y el overlay con animación
  function toggleSidebar() {
    const isHidden = sidebar.classList.contains('d-none');
    if (isHidden) {
      sidebar.classList.remove('d-none');
      setTimeout(() => sidebar.classList.add('active'), 50);
      overlay.classList.remove('d-none');
      setTimeout(() => overlay.classList.add('active'), 50);
      mainContent.classList.add('hidden');
    } else {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
      setTimeout(() => {
        sidebar.classList.add('d-none');
        overlay.classList.add('d-none');
        mainContent.classList.remove('hidden');
      }, 600);
    }
  }
  
  // Verificar preferencia guardada y forzar menú oculto por defecto
  function checkSidebarPreference() {
    // Forzar el menú a estar oculto por defecto al cargar
    sidebar.classList.add('d-none');
    sidebar.classList.remove('active');
    overlay.classList.add('d-none');
    overlay.classList.remove('active');
    mainContent.classList.remove('hidden');
    
    // Ignorar preferencias previas en localStorage
    localStorage.removeItem('sidebarHidden');
  }
  
  // Event listeners
  sidebarToggle.addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', toggleSidebar);
  
  // Verificar tamaño de pantalla al cargar
  checkSidebarPreference();
  
  // Verificar tamaño de pantalla al redimensionar
  window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) {
      sidebar.classList.add('d-none');
      sidebar.classList.remove('active');
      overlay.classList.add('d-none');
      overlay.classList.remove('active');
      mainContent.classList.remove('hidden');
    } else {
      checkSidebarPreference();
    }
  });
  
  loadUserData();
  loadTableData('/reservations', 'reservations-table');

    // Manejador para el botón de confirmar eliminación
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
        const userId = document.getElementById('deleteUserId').value;
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteUserModal'));
        const editMessage = document.getElementById('edit-message');

        try {
            const res = await fetch(`/users/delete/${userId}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Error del servidor' }));
                throw new Error(errorData.error || 'Error al eliminar usuario');
            }

            deleteModal.hide();
            if (editMessage) {
                editMessage.classList.remove('alert-danger', 'd-none');
                editMessage.classList.add('alert-success');
                editMessage.textContent = 'Usuario eliminado exitosamente';
                setTimeout(() => {
                    editMessage.classList.add('d-none');
                    loadTableData('/users', 'users-table');
                }, 2000);
            } else {
                loadTableData('/users', 'users-table');
            }
        } catch (err) {
            console.error('Error eliminando usuario:', err);
            deleteModal.hide();
            if (editMessage) {
                editMessage.classList.remove('alert-success', 'd-none');
                editMessage.classList.add('alert-danger');
                editMessage.textContent = err.message || 'Error al eliminar usuario';
                setTimeout(() => editMessage.classList.add('d-none'), 3000);
            }
        }
    });
});

// Formatear fecha en UTC para evitar problemas de zona horaria
function formatDateUTC(date) {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
}

async function loadTableData(url, tableBodyId) {
    console.log('Cargando datos desde:', url); 
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) {
        console.error('No se encontró el tbody:', tableBodyId);
        return;
    }

    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando datos...</td></tr>';

    try {
        const userRole = await loadUserData(); // Obtener el rol del usuario actual
        console.log('userRole en loadTableData:', userRole); // Depuración
        const res = await fetch(url, { credentials: 'include' });
        console.log('Status del fetch:', res.status);
        let data = await res.json();
        console.log('Datos obtenidos:', data);

        if (url === '/users' && userRole !== 'superadmin') {
            // Filtrar superadmins para usuarios que no son superadmin
            data = data.filter(user => user.role !== 'superadmin');
        }

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${url === '/users' ? 4 : 7}" class="text-center">No hay datos disponibles.</td></tr>`;
            return;
        }

        tableBody.innerHTML = '';
        if (url === '/reservations') {
            data.forEach(resv => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${resv.teacherId?.name || 'Desconocido'}</td>
                    <td>${resv.date ? formatDateUTC(resv.date) : '-'}</td>
                    <td>${resv.entryTime || '-'}</td>
                    <td>${resv.exitTime || '-'}</td>
                    <td>${resv.motive || '-'}</td>
                    <td>${resv.groupGrade || '-'}</td>
                    <td id="action-${resv._id}">
                        ${resv.status === 'pending' ? `
                            <button class="btn btn-success btn-sm btn-action" onclick="confirmReservation('${resv._id}')">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-danger btn-sm btn-action" onclick="cancelReservation('${resv._id}')">
                                <i class="fas fa-times"></i>
                            </button>` : `<span class="badge bg-secondary">${resv.status}</span>`}
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else if (url === '/users') {
            data.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.name || '-'}</td>
                    <td>${user.email || '-'}</td>
                    <td>${user.role || '-'}</td>
                    <td id="action-${user._id}">
                        <button class="btn btn-primary btn-sm btn-action" onclick="editUser('${user._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm btn-action" onclick="deleteUser('${user._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (err) {
        console.error('Error cargando datos:', err);
        tableBody.innerHTML = `<tr><td colspan="${url === '/users' ? 4 : 7}" class="text-center text-danger">Error cargando datos</td></tr>`;
    }
}

async function editUser(id) {
    try {
        const res = await fetch(`/users/edit/${id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Error al obtener usuario');
        const user = await res.json();
        const form = document.getElementById('editUserForm');
        document.getElementById('userId').value = user._id;
        document.getElementById('name').value = user.name || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('password').value = '';
        document.getElementById('role').value = user.role || 'teacher';
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
    } catch (err) {
        console.error('Error cargando datos del usuario:', err);
        const message = document.getElementById('edit-message');
        if (message) {
            message.classList.remove('alert-success', 'd-none');
            message.classList.add('alert-danger');
            message.textContent = 'Error cargando datos del usuario';
        }
    }
}

function deleteUser(id) {
    document.getElementById('deleteUserId').value = id;
    const modal = new bootstrap.Modal(document.getElementById('deleteUserModal'));
    modal.show();
}

async function confirmReservation(id) {
    try {
        const res = await fetch(`/reservations/end/${id}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Error del servidor' }));
            throw new Error(errorData.error || 'Error al finalizar reserva');
        }
        const actionCell = document.getElementById(`action-${id}`);
        if (actionCell) {
            actionCell.innerHTML = `<span class="badge bg-success">Reserva finalizada</span>`;
        }
        setTimeout(() => loadTableData('/reservations', 'reservations-table'), 2000);
    } catch (err) {
        console.error('Error finalizando reserva:', err);
        const actionCell = document.getElementById(`action-${id}`);
        if (actionCell) {
            actionCell.innerHTML = `<span class="badge bg-danger">${err.message}</span>`;
        }
    }
}

async function cancelReservation(id) {
    try {
        const res = await fetch(`/reservations/cancel/${id}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Error del servidor' }));
            throw new Error(errorData.error || 'Error al cancelar reserva');
        }
        const actionCell = document.getElementById(`action-${id}`);
        if (actionCell) {
            actionCell.innerHTML = `<span class="badge bg-danger">Reserva cancelada</span>`;
        }
        setTimeout(() => loadTableData('/reservations', 'reservations-table'), 2000);
    } catch (err) {
        console.error('Error cancelando reserva:', err);
        const actionCell = document.getElementById(`action-${id}`);
        if (actionCell) {
            actionCell.innerHTML = `<span class="badge bg-danger">${err.message}</span>`;
        }
    }
}