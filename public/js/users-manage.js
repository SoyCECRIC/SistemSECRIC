// users-manage.js
document.addEventListener('DOMContentLoaded', () => {
    loadTableData('/users', 'users-table');

    // Manejar envío del formulario del modal de edición
    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = {};
        formData.forEach((value, key) => {
            if (value) body[key] = value; // Solo incluir campos no vacíos
        });

        const message = document.getElementById('edit-message');
        try {
            const res = await fetch(`/users/edit/${body.userId}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Error del servidor' }));
                throw new Error(errorData.error || 'Error al guardar cambios');
            }

            message.classList.remove('alert-danger', 'd-none');
            message.classList.add('alert-success');
            message.textContent = 'Usuario actualizado exitosamente';
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
                loadTableData('/users', 'users-table');
            }, 2000);
        } catch (err) {
            console.error('Error guardando usuario:', err);
            message.classList.remove('alert-success', 'd-none');
            message.classList.add('alert-danger');
            message.textContent = err.message || 'Error del servidor. Intenta de nuevo más tarde.';
        }
    });

    // Manejar envío del formulario del modal de creación
    document.getElementById('createUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = {};
        formData.forEach((value, key) => {
            if (value) body[key] = value; // Solo incluir campos no vacíos
        });

        const message = document.getElementById('create-message');
        try {
            const res = await fetch('/users/create', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Error del servidor' }));
                throw new Error(errorData.error || 'Error al crear usuario');
            }

            message.classList.remove('alert-danger', 'd-none');
            message.classList.add('alert-success');
            message.textContent = 'Usuario creado exitosamente';
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('createUserModal')).hide();
                loadTableData('/users', 'users-table');
            }, 2000);
        } catch (err) {
            console.error('Error creando usuario:', err);
            message.classList.remove('alert-success', 'd-none');
            message.classList.add('alert-danger');
            message.textContent = err.message || 'Error del servidor. Intenta de nuevo más tarde.';
        }
    });

    // Generar contraseña aleatoria
    document.getElementById('generatePasswordBtn').addEventListener('click', () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        document.getElementById('createPassword').value = password;
    });

    // Confirmar eliminación
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        const userId = document.getElementById('deleteUserId').value;
        try {
            const res = await fetch(`/users/delete/${userId}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({action: 'delete'}) // Puedes enviar un body vacío o con un campo como { action: 'delete' }
            });

            if (res.ok) {
                bootstrap.Modal.getInstance(document.getElementById('deleteUserModal')).hide();
                loadTableData('/users', 'users-table');
                alert('Usuario eliminado exitosamente');
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Error al eliminar usuario');
            }
        } catch (err) {
            console.error('Error eliminando usuario:', err);
            alert('Error del servidor');
        }
    });
});

// Función auxiliar para cargar datos en tablas
async function loadTableData(endpoint, tableId) {
    try {
        const res = await fetch(endpoint, { 
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!res.ok) throw new Error('Error al cargar datos');
        
        let data = await res.json();
        // Filtrar superadmins para no mostrarlos en la tabla
        const filteredData = data.filter(user => user.role !== 'superadmin');
        
        const tbody = document.getElementById(tableId);
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (filteredData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100%" class="text-center">No hay datos disponibles</td></tr>';
            return;
        }
        
        // Renderizar según el tipo de tabla
        if (tableId === 'users-table') {
            renderUsersTable(filteredData, tbody);
        }
    } catch (err) {
        console.error('Error cargando datos:', err);
        const tbody = document.getElementById(tableId);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="100%" class="text-center text-danger">Error al cargar datos</td></tr>';
        }
    }
}

function renderUsersTable(users, tbody) {
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.name || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td><span class="badge bg-${getRoleBadgeColor(user.role)}">${getRoleText(user.role)}</span></td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editUser('${user._id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getRoleBadgeColor(role) {
    const colors = {
        teacher: 'info',
        admin: 'warning',
        superadmin: 'danger'
    };
    return colors[role] || 'secondary';
}

function getRoleText(role) {
    const texts = {
        teacher: 'Docente',
        admin: 'Administrador',
        superadmin: 'Super Admin'
    };
    return texts[role] || role;
}

// Funciones globales para acciones de tablas
window.editUser = async function(userId) {
    try {
        const res = await fetch(`/users/edit/${userId}`, { credentials: 'include' });
        const user = await res.json();
        
        document.getElementById('userId').value = user._id;
        document.getElementById('name').value = user.name;
        document.getElementById('email').value = user.email;
        document.getElementById('role').value = user.role;
        document.getElementById('password').value = '';
        
        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
    } catch (err) {
        console.error('Error cargando usuario:', err);
        alert('Error al cargar datos del usuario');
    }
};

window.deleteUser = function(userId) {
    document.getElementById('deleteUserId').value = userId;
    const modal = new bootstrap.Modal(document.getElementById('deleteUserModal'));
    modal.show();
};