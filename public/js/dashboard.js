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

// Event listener para el botón de logout (como estaba originalmente)
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

    // Configurar toggle del menú (solo en la foto de perfil)
    setupMenuToggle();
    loadActiveNews();
    
  } catch (err) {
    console.error('Error al cargar usuario:', err);
    
    // Fallback
    const userName = document.getElementById('user-name');
    if (userName) userName.textContent = 'Usuario';
    
    configureMenuByRole('teacher');
    menuConfigured = true;
    setupMenuToggle();
  }
});

// Función para configurar el toggle del menú (solo en perfil)
function setupMenuToggle() {
  const menuSection = document.getElementById('menu-icons-section');
  const profileContainer = document.getElementById('profile-image-container');

  if (profileContainer) {
    profileContainer.addEventListener('click', function() {
      menuSection.classList.toggle('hidden');
    });
  }

  // Configurar listener para el ítem de logout en el menú (si existe)
  document.querySelectorAll('.logout-menu-item').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      performLogout();
    });
  });
}

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
      { href: '/profile/edit', icon: 'fa-user-edit', text: 'Editar Perfil' },
      { href: '/users/manage', icon: 'fa-users', text: 'Administrar Cuentas' },
      { href: '/news/manage', icon: 'fa-newspaper', text: 'Noticias' }
    ],
    superadmin: [
      { href: '/dashboard', icon: 'fa-home', text: 'Inicio' },
      { href: '/reserve', icon: 'fa-calendar-plus', text: 'Reservar' },
      { href: '/reservations/manage', icon: 'fa-list', text: 'Administrar Reservas' },
      { href: '/profile/edit', icon: 'fa-user-edit', text: 'Editar Perfil' },
      { href: '/users/manage', icon: 'fa-users', text: 'Administrar Cuentas' },
      { href: '/news/manage', icon: 'fa-newspaper', text: 'Noticias' }
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
    if (item.isLogout) {
      card.href = '#';
      card.classList.add('logout-menu-item');
    } else {
      card.href = item.href;
      if (window.location.pathname === item.href) {
        card.classList.add('active-menu-item');
      }
    }
    card.className = 'text-decoration-none';
    
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

// Función para cargar noticias activas en el feed (minimalista con expand)
async function loadActiveNews() {
  try {
    const res = await fetch('/news/active', { credentials: 'include' });
    if (!res.ok) throw new Error('Error al cargar noticias');
    
    const news = await res.json();
    const feedContainer = document.getElementById('news-feed');
    
    if (!feedContainer) return;
    
    feedContainer.innerHTML = '';
    
    if (news.length === 0) {
      feedContainer.innerHTML = '<div class="col-12 text-center py-4"><i class="fas fa-newspaper fa-3x text-muted mb-3"></i><p class="text-muted">No hay noticias disponibles</p></div>';
      return;
    }
    
    news.forEach(item => {
      const col = document.createElement('div');
      col.className = 'col-lg-6 col-md-8 col-12'; // 2 columnas en desktop para más compacto
      
      const post = document.createElement('div');
      post.className = 'news-post card shadow-sm border-0 rounded-4 overflow-hidden h-100';
      
      let mediaHtml = '';
      if (item.mediaUrl) {
        if (item.mediaType === 'image') {
          mediaHtml = `<img src="${item.mediaUrl}" class="card-img-top news-small-img" alt="Imagen de noticia">`;
        } else if (item.mediaType === 'video') {
          mediaHtml = `<video class="card-img-top news-small-img" controls muted><source src="${item.mediaUrl}" type="video/mp4">Video no soportado.</video>`;
        }
      } else {
        mediaHtml = '<div class="news-no-media-placeholder"></div>';
      }
      
      post.innerHTML = `
        <div class="card-body p-4">
          <h5 class="card-title fw-bold text-primary mb-3">${item.title}</h5>
          <div class="mb-3">
            <div class="summary-text text-muted small lh-lg">
              ${item.summary || 'Sin resumen disponible'}
            </div>
          </div>
          ${mediaHtml}
          <div class="mt-3">
            <button class="btn btn-outline-primary rounded-pill w-100 leer-mas-btn" data-full-content="${item.content}" data-expanded="false">
              <i class="fas fa-plus me-2"></i>Leer más
            </button>
            <div class="full-content mt-3 collapse" style="display: none;">
              <p class="card-text text-secondary lh-lg">${item.content}</p>
              <button class="btn btn-outline-secondary rounded-pill leer-menos-btn mt-2">
                <i class="fas fa-minus me-2"></i>Leer menos
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Event listener para "Leer más" / "Leer menos"
      const leerMasBtn = post.querySelector('.leer-mas-btn');
      const fullContent = post.querySelector('.full-content');
      const leerMenosBtn = post.querySelector('.leer-menos-btn');
      
      leerMasBtn.addEventListener('click', () => {
        fullContent.style.display = 'block';
        fullContent.classList.add('show');
        leerMasBtn.style.display = 'none';
        leerMenosBtn.style.display = 'block';
      });
      
      leerMenosBtn.addEventListener('click', () => {
        fullContent.classList.remove('show');
        setTimeout(() => fullContent.style.display = 'none', 300); // Espera animación
        leerMasBtn.style.display = 'block';
        leerMenosBtn.style.display = 'none';
      });
      
      col.appendChild(post);
      feedContainer.appendChild(col);
    });
  } catch (err) {
    console.error('Error cargando noticias:', err);
    const feedContainer = document.getElementById('news-feed');
    if (feedContainer) {
      feedContainer.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error al cargar noticias</p></div>';
    }
  }
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

document.addEventListener('DOMContentLoaded', () => {
            loadTableData('/reservations', 'reservations-table');
            // Iniciar verificación de reservas para finalización automática
            startAutoEndCheck();
        });

        async function loadUserData() {
            try {
                const res = await fetch('/user', { credentials: 'include' });
                if (!res.ok) throw new Error('Error al obtener usuario');
                const data = await res.json();
            } catch (err) {
                console.error('Error cargando datos del usuario:', err);
            }
        }

        async function startAutoEndCheck() {
            setInterval(async () => {
                try {
                    const res = await fetch('/reservations', { credentials: 'include' });
                    if (!res.ok) throw new Error('Error al obtener reservas');
                    const reservations = await res.json();
                    const now = new Date();
                    for (const resv of reservations) {
                        if (resv.status === 'pending' || resv.status === 'confirmed') {
                            const [hours, minutes] = resv.exitTime.split(':').map(Number);
                            const endDateTime = new Date(resv.date);
                            endDateTime.setHours(hours, minutes, 0, 0);
                            // Agregar 5 minutos (5 * 60 * 1000 milisegundos)
                            const endPlusFive = new Date(endDateTime.getTime() + 5 * 60 * 1000);
                            if (now >= endPlusFive) {
                                await fetch(`/reservations/end/${resv._id}`, {
                                    method: 'POST',
                                    credentials: 'include',
                                    headers: { 'Content-Type': 'application/json' }
                                });
                            }
                        }
                    }
                    loadTableData('/reservations', 'reservations-table');
                } catch (err) {
                    console.error('Error en verificación automática:', err);
                }
            }, 60000); // Verificar cada minuto
        }

