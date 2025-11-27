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

// === CREAR NOTICIA ===
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
            bootstrap.Modal.getInstance(document.getElementById('createNewsModal')).hide();
            form.reset();
            loadNews();
        }, 1500);

    } catch (err) {
        console.error(err);
        message.classList.remove('d-none', 'alert-success');
        message.classList.add('alert-danger');
        message.textContent = err.message;
    }
});

// === EDITAR NOTICIA (igual, pero con ID) ===
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
        // Si no se subió archivo nuevo → no enviamos mediaUrl → se mantiene la actual

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
        message.textContent = 'Noticia actualizada';

        setTimeout(() => {
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

function deleteNews(newsId) {
    document.getElementById('deleteNewsId').value = newsId;
    const modal = new bootstrap.Modal(document.getElementById('deleteNewsModal'));
    modal.show();
}