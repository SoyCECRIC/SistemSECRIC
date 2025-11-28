// Esperar a que la página cargue
document.addEventListener('DOMContentLoaded', () => {
    loadNews(); // ← ¡ESTO ES LO QUE FALTABA! Llama la carga al inicio

    // Crear noticia
    document.getElementById('createNewsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const message = document.getElementById('create-message');
        const fileInput = document.getElementById('createMedia');
        
        try {
            const mediaBase64 = await fileToBase64(fileInput.files[0]);

            const payload = {
                title: form.title.value.trim(),
                summary: form.summary.value.trim(),
                content: form.content.value.trim(),
                duration: parseInt(form.duration.value),
                durationType: form.durationType.value
            };

            if (mediaBase64) {
                const mediaType = mediaBase64.startsWith('data:image') ? 'image' : 'video';
                payload.mediaUrl = mediaBase64;
                payload.mediaType = mediaType;
            }

            const res = await fetch('/news/create', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al crear noticia');
            }

            message.classList.remove('d-none', 'alert-danger');
            message.classList.add('alert-success');
            message.textContent = 'Noticia creada exitosamente';

            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('createNewsModal'));
                modal.hide();
                
                // Ocultar mensaje inmediatamente
                message.classList.add('d-none');
                message.classList.remove('alert-success');
                
                form.reset();
                loadNews();
            }, 1500);

            // Ocultar mensaje al cerrar modal (extra)
            document.getElementById('createNewsModal').addEventListener('hidden.bs.modal', () => {
                const message = document.getElementById('create-message');
                message.classList.add('d-none');
                message.classList.remove('alert-success');
            });

        } catch (err) {
            console.error(err);
            message.classList.remove('d-none', 'alert-success');
            message.classList.add('alert-danger');
            message.textContent = err.message;
        }
    });

    // Editar noticia
    document.getElementById('editNewsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const newsId = document.getElementById('editNewsId').value;
        const message = document.getElementById('edit-message');
        const fileInput = form.querySelector('input[type="file"]');

        try {
            const mediaBase64 = await fileToBase64(fileInput.files[0]);

            const payload = {
                title: form.title.value.trim(),
                summary: form.summary.value.trim(),
                content: form.content.value.trim(),
                duration: parseInt(form.duration.value),
                durationType: form.durationType.value
            };

            if (mediaBase64) {
                const mediaType = mediaBase64.startsWith('data:image') ? 'image' : 'video';
                payload.mediaUrl = mediaBase64;
                payload.mediaType = mediaType;
            }

            const res = await fetch(`/news/edit/${newsId}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al actualizar');
            }

            message.classList.remove('d-none', 'alert-danger');
            message.classList.add('alert-success');
            message.textContent = 'Noticia actualizada exitosamente';

            setTimeout(() => {
                // Ocultar mensaje y cerrar modal
                message.classList.add('d-none');
                message.classList.remove('alert-success');
                
                bootstrap.Modal.getInstance(document.getElementById('editNewsModal')).hide();
                loadNews();
            }, 1500);

        } catch (err) {
            console.error(err);
            message.classList.remove('d-none', 'alert-success');
            message.classList.add('alert-danger');
            message.textContent = err.message;
        }
    });

    // Ocultar mensaje al cerrar modal (extra, para cualquier cierre)
    document.getElementById('editNewsModal').addEventListener('hidden.bs.modal', () => {
        const message = document.getElementById('edit-message');
        message.classList.add('d-none');
        message.classList.remove('alert-success', 'alert-danger');
    });

    // Confirmar eliminación (cambiado a POST)
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        const newsId = document.getElementById('deleteNewsId').value;
        
        try {
            const res = await fetch(`/news/delete/${newsId}`, {
                method: 'POST',  // ← Cambiado de DELETE a POST
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete' })  // Body para confirmar
            });

            if (res.ok) {
                bootstrap.Modal.getInstance(document.getElementById('deleteNewsModal')).hide();
                loadNews(); // ← Recarga la tabla después de eliminar
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

// === FUNCIÓN PARA CONVERTIR ARCHIVO A BASE64 (REUTILIZABLE) ===
async function fileToBase64(file) {
    if (!file) return null;
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // ya viene con data:image/... o data:video/...
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function loadNews() {
    try {
        const res = await fetch('/news', { 
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!res.ok) {
            throw new Error(`Error HTTP ${res.status}`);
        }
        
        const news = await res.json();
        const tbody = document.getElementById('news-table');
        
        if (!tbody) {
            console.error('No se encontró el tbody#news-table');
            return;
        }
        
        tbody.innerHTML = ''; // Limpiar
        
        if (!news || news.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No hay noticias creadas</td></tr>';
            return;
        }
        
        news.forEach(item => {
            const tr = document.createElement('tr');
            
            const now = new Date();
            const expiresAt = new Date(item.expiresAt);
            const isExpired = expiresAt < now;
            
            const title = item.title || 'Sin título';
            const summary = item.summary || 'Sin resumen';
            
            tr.innerHTML = `
                <td class="align-middle">${title}</td>
                <td class="align-middle text-truncate" style="max-width: 250px;" title="${summary}">
                    ${summary}
                </td>
                <td class="align-middle text-center">
                    ${new Date(item.createdAt).toLocaleDateString('es-MX')}
                </td>
                <td class="align-middle text-center">
                    ${expiresAt.toLocaleDateString('es-MX')}
                </td>
                <td class="align-middle text-center">
                    <span class="badge ${isExpired ? 'bg-danger' : 'bg-success'} px-3 py-2">
                        ${isExpired ? 'Expirada' : 'Activa'}
                    </span>
                </td>
                <td class="align-middle text-center">
                    <button class="btn btn-sm btn-warning me-1" onclick="editNews('${item._id}')">
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
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">
                Error al cargar noticias: ${err.message}
            </td></tr>`;
        }
    }
}

async function editNews(newsId) {
    try {
        const res = await fetch(`/news/edit/${newsId}`, { credentials: 'include' });
        if (!res.ok) {
            throw new Error('Error al cargar noticia');
        }
        const news = await res.json();
        
        // Llenar campos básicos
        document.getElementById('editNewsId').value = news._id;
        document.getElementById('editTitle').value = news.title || '';
        document.getElementById('editSummary').value = news.summary || '';
        document.getElementById('editContent').value = news.content || '';
        
        // Calcular duración desde expiresAt (mejorado: detecta minutos/horas/días/semanas/meses/años)
        // Calcular duración desde expiresAt (corregido: mantiene tipo original, no convierte)
        const now = new Date();
        const expiresAt = new Date(news.expiresAt);
        const diffMs = expiresAt - now;

        let durationValue, durationType;
        if (diffMs < 0) {  // Expirada: por defecto 1 día
            durationValue = 1;
            durationType = 'days';
        } else {
            // Detectar el tipo más cercano al original (prioriza el más corto para precisión)
            if (diffMs < 60 * 60 * 1000) {  // Minutos
                durationValue = Math.ceil(diffMs / (60 * 1000));
                durationType = 'minutes';
            } else if (diffMs < 24 * 60 * 60 * 1000) {  // Horas
                durationValue = Math.ceil(diffMs / (60 * 60 * 1000));
                durationType = 'hours';
            } else if (diffMs < 7 * 24 * 60 * 60 * 1000) {  // Días
                durationValue = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
                durationType = 'days';
            } else if (diffMs < 30 * 24 * 60 * 60 * 1000) {  // Semanas
                durationValue = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));
                durationType = 'weeks';
            } else if (diffMs < 365 * 24 * 60 * 60 * 1000) {  // Meses
                durationValue = Math.ceil(diffMs / (30 * 24 * 60 * 60 * 1000));
                durationType = 'months';
            } else {  // Años
                durationValue = Math.ceil(diffMs / (365 * 24 * 60 * 60 * 1000));
                durationType = 'years';
            }
        }

        // Mínimo 1 (evita 0)
        if (durationValue < 1) durationValue = 1;

        document.getElementById('editDuration').value = durationValue;
        document.getElementById('editDurationType').value = durationType;
        
        // Mostrar media actual
        const currentMedia = document.getElementById('currentMedia');
        if (news.mediaType === 'image' && news.mediaUrl) {
            currentMedia.innerHTML = `<img src="${news.mediaUrl}" alt="Media actual" style="max-width: 200px; border-radius: 8px;">`;
        } else if (news.mediaType === 'video' && news.mediaUrl) {
            currentMedia.innerHTML = `<video controls style="max-width: 200px;"><source src="${news.mediaUrl}">Tu navegador no soporta video.</video>`;
        } else {
            currentMedia.innerHTML = '<small class="text-muted">Sin imagen o video</small>';
        }
        
        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('editNewsModal'));
        modal.show();
    } catch (err) {
        console.error('Error cargando noticia:', err);
        alert('Error al cargar datos de la noticia: ' + err.message);
    }
};

function deleteNews(newsId) {
    document.getElementById('deleteNewsId').value = newsId;
    const modal = new bootstrap.Modal(document.getElementById('deleteNewsModal'));
    modal.show();
}