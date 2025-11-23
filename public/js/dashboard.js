let menuConfigured = false;

// Función para cerrar sesión de forma segura
async function performLogout() {
  try {
    await fetch('/logout', {
      method: 'GET',
      credentials: 'include'
    });
    window.location.replace('/');
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
    window.location.replace('/');
  }
}

// Event listener para el botón de logout
document.addEventListener('DOMContentLoaded', function() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', performLogout);
  }
});

// Carga de datos del usuario y configuración del menú de iconos
document.addEventListener('DOMContentLoaded', async function() {
  try {
    const res = await fetch('/user', { 
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) throw new Error('Error al obtener usuario');
    
    const data = await res.json();
    
    // Actualizar nombre en el mensaje de bienvenida
    const userName = document.getElementById('user-name');
    if (userName) userName.textContent = data.name || 'Usuario';

    // Actualizar foto de perfil
    updateProfileImage(data.profileImage);

    // Configurar menú basado en rol
    if (!menuConfigured) {
      configureMenuByRole(data.role || 'teacher');
      menuConfigured = true;
    }
    
  } catch (err) {
    console.error('Error al cargar usuario:', err);
    
    // Fallback
    const userName = document.getElementById('user-name');
    if (userName) userName.textContent = 'Usuario';
    
    configureMenuByRole('teacher');
    menuConfigured = true;
  }
});

// Función para actualizar la imagen de perfil
function updateProfileImage(profileImage) {
  const container = document.getElementById('profile-image-container');
  if (!container) return;

  if (profileImage) {
    // Si hay imagen, mostrarla
    container.innerHTML = `<img src="${profileImage}" alt="Foto de perfil">`;
  } else {
    // Si no hay imagen, mostrar icono por defecto
    container.innerHTML = `<i class="fas fa-user default-avatar"></i>`;
  }
}

function configureMenuByRole(role) {
  if (menuConfigured) return;
  
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
      { href: '/users/manage', icon: 'fa-users', text: 'Administrar Cuentas' }
    ],
    superadmin: [
      { href: '/dashboard', icon: 'fa-home', text: 'Inicio' },
      { href: '/reserve', icon: 'fa-calendar-plus', text: 'Reservar' },
      { href: '/reservations/manage', icon: 'fa-list', text: 'Administrar Reservas' },
      { href: '/my-reservations', icon: 'fa-list', text: 'Mis Reservas' },
      { href: '/profile/edit', icon: 'fa-user-edit', text: 'Editar Perfil' },
      { href: '/users/manage', icon: 'fa-users', text: 'Administrar Cuentas' }
    ]
  };

  const items = menuItems[role] || menuItems.teacher;
  const menuContainer = document.getElementById('menu-icons');

  if (!menuContainer) return;

  // Limpiar contenedor
  menuContainer.innerHTML = '';

  // Generar tarjetas de iconos para opciones del rol
  items.forEach(item => {
    const col = document.createElement('div');
    col.className = 'col-md-2 col-sm-4 col-6';
    
    const card = document.createElement('a');
    card.href = item.href;
    card.className = 'text-decoration-none';
    
    if (window.location.pathname === item.href) {
      card.classList.add('active-menu-item');
    }
    
    card.innerHTML = `
      <div class="card h-100 shadow-sm text-center p-3">
        <div class="card-body d-flex flex-column align-items-center">
          <i class="fas ${item.icon} fa-3x text-primary mb-3"></i>
          <h6 class="card-title mb-0">${item.text}</h6>
        </div>
      </div>
    `;
    
    col.appendChild(card);
    menuContainer.appendChild(col);
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