// public/js/sidebar.js - Sidebar responsivo con control de roles

document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const sidebarToggle = document.getElementById('sidebarToggle');

    // Toggle sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    // Cerrar sidebar al hacer clic en overlay
    if (overlay) {
        overlay.addEventListener('click', function() {
            closeSidebar();
        });
    }

    // Cerrar sidebar al hacer clic en un enlace (solo en móviles)
    const navLinks = document.querySelectorAll('#sidebar .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // Cerrar sidebar con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });

    // Funciones del sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        sidebar.classList.remove('d-none');
        overlay.classList.toggle('active');
        overlay.classList.toggle('d-none');
        
        // Prevenir scroll del body cuando sidebar está abierto
        if (sidebar.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        overlay.classList.add('d-none');
        document.body.style.overflow = '';
    }

    // Cargar datos del usuario y configurar menú según rol
    loadUserDataAndConfigureMenu();
});

async function loadUserDataAndConfigureMenu() {
    try {
        const res = await fetch('/user', { 
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!res.ok) {
            throw new Error('Error al obtener usuario');
        }
        
        const data = await res.json();
        
        // Actualizar nombre en sidebar
        const sidebarName = document.getElementById('user-name-sidebar');
        if (sidebarName) {
            sidebarName.textContent = data.name || 'Usuario';
        }
        
        // Actualizar imagen en sidebar
        const sidebarImg = document.getElementById('sidebar-user-img');
        if (sidebarImg) {
            if (data.profileImage) {
                sidebarImg.src = data.profileImage;
                sidebarImg.onerror = function() {
                    this.src = '/img/default-profile.png';
                };
            } else {
                sidebarImg.src = '/img/default-profile.png';
            }
        }
        
        // Actualizar nombre en header (si existe)
        const headerName = document.getElementById('user-name');
        if (headerName) {
            headerName.textContent = data.name || 'Usuario';
        }
        
        // Configurar menú según rol
        configureMenuByRole(data.role);
        
        // Añadir clase al body según rol para CSS
        document.body.classList.add(`role-${data.role}`);
        
    } catch (err) {
        console.error('Error cargando datos del usuario:', err);
        // Configurar menú por defecto (teacher) en caso de error
        configureMenuByRole('teacher');
    }
}

function configureMenuByRole(role) {
    const menuItems = {
        teacher: [
            { href: '/dashboard', icon: 'fa-home', text: 'Inicio' },
            { href: '/my-reservations', icon: 'fa-list', text: 'Mis Reservas' },
            { href: '/profile/edit', icon: 'fa-user-edit', text: 'Editar Perfil' }
        ],
        admin: [
            { href: '/dashboard', icon: 'fa-home', text: 'Inicio' },
            { href: '/reserve', icon: 'fa-calendar-plus', text: 'Reservar' },
            { href: '/reservations/manage', icon: 'fa-list', text: 'Administrar Reservas' },
            { href: '/my-reservations', icon: 'fa-list', text: 'Mis Reservas' },
            { href: '/profile/edit', icon: 'fa-user-edit', text: 'Editar Perfil' },
            { href: '/users/manage', icon: 'fa-users', text: 'Administrar Cuentas' },
            { href: '/news/manage', icon: 'fa-newspaper', text: 'Gestionar Noticias' }
        ],
        superadmin: [
            { href: '/dashboard', icon: 'fa-home', text: 'Inicio' },
            { href: '/reserve', icon: 'fa-calendar-plus', text: 'Reservar' },
            { href: '/reservations/manage', icon: 'fa-list', text: 'Administrar Reservas' },
            { href: '/my-reservations', icon: 'fa-list', text: 'Mis Reservas' },
            { href: '/profile/edit', icon: 'fa-user-edit', text: 'Editar Perfil' },
            { href: '/users/manage', icon: 'fa-users', text: 'Administrar Cuentas' },
            { href: '/news/manage', icon: 'fa-newspaper', text: 'Gestionar Noticias' }
        ]
    };

    const sidebar = document.querySelector('#sidebar nav');
    if (!sidebar) return;

    // Obtener los items del menú según el rol
    const items = menuItems[role] || menuItems.teacher;

    // Limpiar el menú actual (excepto el separador y cerrar sesión)
    const navLinks = sidebar.querySelectorAll('.nav-link:not(.mt-auto)');
    navLinks.forEach(link => link.remove());

    const separator = sidebar.querySelector('hr');
    
    // Crear nuevos items del menú
    items.forEach(item => {
        const link = document.createElement('a');
        link.className = 'nav-link text-white d-flex align-items-center mb-2';
        link.href = item.href;
        link.innerHTML = `<i class="fas ${item.icon} me-2"></i> ${item.text}`;
        
        // Marcar como activo si es la página actual
        if (window.location.pathname === item.href) {
            link.classList.add('active');
            link.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }
        
        separator.parentNode.insertBefore(link, separator);
    });
}

// Función auxiliar para cargar datos en tablas (usada en varios archivos)
async function loadTableData(endpoint, tableId) {
    try {
        const res = await fetch(endpoint, { 
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!res.ok) throw new Error('Error al cargar datos');
        
        const data = await res.json();
        const tbody = document.getElementById(tableId);
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100%" class="text-center">No hay datos disponibles</td></tr>';
            return;
        }
        
        // Renderizar según el tipo de tabla
        if (tableId === 'users-table') {
            renderUsersTable(data, tbody);
        } else if (tableId === 'reservations-table') {
            renderReservationsTable(data, tbody);
        } else if (tableId === 'news-table') {
            renderNewsTable(data, tbody);
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

function renderReservationsTable(reservations, tbody) {
    reservations.forEach(res => {
        const tr = document.createElement('tr');
        const statusBadge = getStatusBadge(res.status);
        const teacherName = res.teacherId?.name || 'N/A';
        
        tr.innerHTML = `
            <td>${teacherName}</td>
            <td>${new Date(res.date).toLocaleDateString('es-MX')}</td>
            <td>${res.entryTime}</td>
            <td>${res.exitTime}</td>
            <td class="text-truncate-2">${res.motive || 'N/A'}</td>
            <td>${res.groupGrade || 'N/A'}</td>
            <td>
                <span class="badge ${statusBadge.class}">${statusBadge.text}</span>
                ${getReservationActions(res)}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderNewsTable(news, tbody) {
    news.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${item.image || '/img/default-news.jpg'}" alt="${item.title}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 5px;"></td>
            <td>${item.title || 'N/A'}</td>
            <td class="text-truncate-2">${item.summary || 'N/A'}</td>
            <td>${new Date(item.createdAt).toLocaleDateString('es-MX')}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editNews('${item._id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteNews('${item._id}')">
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

function getStatusBadge(status) {
    const badges = {
        pending: { class: 'bg-warning', text: 'Pendiente' },
        confirmed: { class: 'bg-success', text: 'Confirmada' },
        cancelled: { class: 'bg-danger', text: 'Cancelada' },
        completed: { class: 'bg-secondary', text: 'Finalizada' }
    };
    return badges[status] || { class: 'bg-secondary', text: status };
}

function getReservationActions(reservation) {
    let actions = '';
    
    if (reservation.status === 'pending' || reservation.status === 'confirmed') {
        actions += `
            <button class="btn btn-sm btn-primary" onclick="editReservation('${reservation._id}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="cancelReservation('${reservation._id}')">
                <i class="fas fa-times"></i>
            </button>
        `;
    }
    
    return actions;
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

window.editReservation = function(reservationId) {
    window.location.href = `/reservations/edit/${reservationId}`;
};

window.cancelReservation = async function(reservationId) {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;
    
    try {
        const res = await fetch(`/reservations/cancel/${reservationId}`, {
            method: 'POST',
            credentials: 'include'
        });
        
        if (res.ok) {
            alert('Reserva cancelada exitosamente');
            location.reload();
        } else {
            const error = await res.json();
            alert(error.error || 'Error al cancelar reserva');
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Error del servidor');
    }
};

window.editNews = async function(newsId) {
    try {
        const res = await fetch(`/news/edit/${newsId}`, { credentials: 'include' });
        const news = await res.json();
        
        document.getElementById('newsId').value = news._id;
        document.getElementById('newsTitle').value = news.title;
        document.getElementById('newsSummary').value = news.summary;
        document.getElementById('newsContent').value = news.content;
        document.getElementById('currentNewsImage').src = news.image || '/img/default-news.jpg';
        
        const modal = new bootstrap.Modal(document.getElementById('editNewsModal'));
        modal.show();
    } catch (err) {
        console.error('Error cargando noticia:', err);
        alert('Error al cargar datos de la noticia');
    }
};

window.deleteNews = function(newsId) {
    document.getElementById('deleteNewsId').value = newsId;
    const modal = new bootstrap.Modal(document.getElementById('deleteNewsModal'));
    modal.show();
};

// Función para cargar docentes en select
window.loadTeachersSelect = async function() {
    try {
        const res = await fetch('/teachers', { credentials: 'include' });
        if (!res.ok) throw new Error('Error al obtener docentes');
        
        const teachers = await res.json();
        const select = document.getElementById('teacher');
        
        if (!select) return;
        
        select.innerHTML = '<option value="">Selecciona un docente</option>';
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher._id;
            option.textContent = teacher.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error cargando docentes:', err);
    }
};