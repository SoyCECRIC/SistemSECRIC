document.addEventListener('DOMContentLoaded', () => {
    loadNews();

    // Crear noticia
    document.getElementById('createNewsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const message = document.getElementById('create-message');

        try {
            const res = await fetch('/news/create', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al crear noticia');
            }

            message.classList.remove('alert-danger', 'd-none');
            message.classList.add('alert-success');
            message.textContent = 'Noticia creada exitosamente';
            
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('createNewsModal')).hide();
                e.target.reset();
                loadNews();
            }, 2000);
        } catch (err) {
            console.error('Error creando noticia:', err);
            message.classList.remove('alert-success', 'd-none');
            message.classList.add('alert-danger');
            message.textContent = err.message || 'Error del servidor';
        }
    });

    // Editar noticia
    document.getElementById('editNewsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newsId = document.getElementById('editNewsId').value;
        const formData = new FormData(e.target);
        const message = document.getElementById('edit-message');

        try {
            const res = await fetch(`/news/edit/${newsId}`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al editar noticia');
            }

            message.classList.remove('alert-danger', 'd-none');
            message.classList.add('alert-success');
            message.textContent = 'Noticia actualizada exitosamente';
            
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('editNewsModal')).hide();
                loadNews();
            }, 2000);
        } catch (err) {
            console.error('Error editando noticia:', err);
            message.classList.remove('alert-success', 'd-none');
            message.classList.add('alert-danger');
            message.textContent = err.message || 'Error del servidor';
        }
    });

    // Confirmar eliminación
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        const newsId = document.getElementById('deleteNewsId').value;
        
        try {
            const res = await fetch(`/news/delete/${newsId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (res.ok) {
                bootstrap.Modal.getInstance(document.getElementById('deleteNewsModal')).hide();
                loadNews();
                alert('Noticia eliminada exitosamente');
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Error al eliminar noticia');
            }
        } catch (err) {
            console.error('Error eliminando noticia:', err);
            alert('Error del servidor');
        }
    });
});

async function loadNews() {
    try {
        const res = await fetch('/news', { 
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!res.ok) throw new Error('Error al cargar noticias');
        
        const news = await res.json();
        const tbody = document.getElementById('news-table');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (news.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay noticias disponibles</td></tr>';
            return;
        }
        
        news.forEach(item => {
            const tr = document.createElement('tr');
            const expiresAt = new Date(item.expiresAt);
            const now = new Date();
            const isExpired = expiresAt < now;
            
            tr.innerHTML = `
                <td>${item.title || 'N/A'}</td>
                <td class="text-truncate" style="max-width: 200px;">${item.summary || 'N/A'}</td>
                <td>${new Date(item.createdAt).toLocaleDateString('es-MX')}</td>
                <td>${expiresAt.toLocaleDateString('es-MX')}</td>
                <td>
                    <span class="badge ${isExpired ? 'bg-danger' : 'bg-success'}">
                        ${isExpired ? 'Expirada' : 'Activa'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editNews('${item._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteNews('${item._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (err) {
        console.error('Error cargando noticias:', err);
        const tbody = document.getElementById('news-table');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar noticias</td></tr>';
        }
    }
}

async function editNews(newsId) {
    try {
        const res = await fetch(`/news/edit/${newsId}`, { credentials: 'include' });
        const news = await res.json();
        
        document.getElementById('editNewsId').value = news._id;
        document.getElementById('editTitle').value = news.title;
        document.getElementById('editSummary').value = news.summary;
        document.getElementById('editContent').value = news.content;
        
        // Calcular duración desde expiresAt
        const now = new Date();
        const expiresAt = new Date(news.expiresAt);
        const diffInDays = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
        
        document.getElementById('editDuration').value = diffInDays;
        document.getElementById('editDurationType').value = 'days';
        
        // Mostrar media actual
        const currentMedia = document.getElementById('currentMedia');
        if (news.mediaType === 'image' && news.mediaUrl) {
            currentMedia.innerHTML = `<img src="${news.mediaUrl}" alt="Media actual" style="max-width: 200px; border-radius: 8px;">`;
        } else if (news.mediaType === 'video' && news.mediaUrl) {
            currentMedia.innerHTML = `<video controls style="max-width: 200px;"><source src="${news.mediaUrl}">Tu navegador no soporta video.</video>`;
        } else {
            currentMedia.innerHTML = '<small class="text-muted">Sin imagen o video</small>';
        }
        
        const modal = new bootstrap.Modal(document.getElementById('editNewsModal'));
        modal.show();
    } catch (err) {
        console.error('Error cargando noticia:', err);
        alert('Error al cargar datos de la noticia');
    }
}

function deleteNews(newsId) {
    document.getElementById('deleteNewsId').value = newsId;
    const modal = new bootstrap.Modal(document.getElementById('deleteNewsModal'));
    modal.show();
}