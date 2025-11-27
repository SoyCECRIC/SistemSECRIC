document.addEventListener('DOMContentLoaded', function() {
    let confirmAction = null;

    // Cargar datos iniciales del usuario
    fetch('/user', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(res => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (data) {
            document.getElementById('name').value = data.name || '';
            document.getElementById('email').value = data.email || '';
            if (data.profileImage) {
                document.getElementById('profile-image').src = data.profileImage;
                document.getElementById('full-profile-image').src = data.profileImage;
            }
        }
    })
    .catch(err => {
        console.error('Error cargando datos:', err.message);
        alert('Error al cargar los datos del usuario');
    });

    // Vista previa de la foto
    const profileImageInput = document.getElementById('profileImageInput');
    const profileImage = document.getElementById('profile-image');
    profileImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                profileImage.src = event.target.result;
                document.getElementById('full-profile-image').src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Mostrar/ocultar contraseñas
    const togglePasswordButtons = document.querySelectorAll('.password-toggle');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                button.classList.remove('fa-eye');
                button.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                button.classList.remove('fa-eye-slash');
                button.classList.add('fa-eye');
            }
        });
    });

    // Guardar cambios principales con confirmación
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
        confirmModal.show();

        const formData = new FormData();
        formData.append('name', document.getElementById('name').value);
        formData.append('email', document.getElementById('email').value);
        if (profileImageInput.files[0]) {
            formData.append('profileImage', profileImageInput.files[0]);
        }

        confirmAction = async () => {
            try {
                const res = await fetch('/profile/update', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });
                const messageDiv = document.getElementById('profile-message');
                if (res.ok) {
                    messageDiv.classList.remove('d-none', 'alert-danger');
                    messageDiv.classList.add('alert-success');
                    messageDiv.textContent = 'Cambios guardados exitosamente';
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    const errorData = await res.json();
                    messageDiv.classList.remove('d-none', 'alert-success');
                    messageDiv.classList.add('alert-danger');
                    messageDiv.textContent = errorData.error || 'Error al guardar cambios';
                    confirmModal.hide();
                    document.getElementById('changePasswordBtn').focus();
                }
            } catch (err) {
                console.error('Error guardando perfil:', err.message);
                const messageDiv = document.getElementById('profile-message');
                messageDiv.classList.remove('d-none', 'alert-success');
                messageDiv.classList.add('alert-danger');
                messageDiv.textContent = 'Error al guardar cambios: ' + err.message;
                confirmModal.hide();
                document.getElementById('changePasswordBtn').focus();
            }
        };
    });

    // Guardar cambio de contraseña con confirmación
    const changePasswordForm = document.getElementById('changePasswordForm');
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(changePasswordForm);
        const data = Object.fromEntries(formData.entries());

        const currentPassword = (data.currentPassword || '').trim();
        const newPassword = (data.newPassword || '').trim();
        const confirmNewPassword = (data.confirmNewPassword || '').trim();

        console.log('Datos enviados a /profile/change-password:', {
            currentPassword,
            newPassword,
            confirmNewPassword
        });

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            const messageDiv = document.getElementById('password-message');
            messageDiv.classList.remove('d-none', 'alert-success');
            messageDiv.classList.add('alert-danger');
            messageDiv.textContent = 'Todos los campos de contraseña son obligatorios';
            return;
        }

        if (newPassword !== confirmNewPassword) {
            const messageDiv = document.getElementById('password-message');
            messageDiv.classList.remove('d-none', 'alert-success');
            messageDiv.classList.add('alert-danger');
            messageDiv.textContent = 'Las nuevas contraseñas no coinciden';
            return;
        }

        const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
        confirmModal.show();

        confirmAction = async () => {
            try {
                const res = await fetch('/profile/change-password', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword })
                });
                const messageDiv = document.getElementById('password-message');
                if (res.ok) {
                    messageDiv.classList.remove('d-none', 'alert-danger');
                    messageDiv.classList.add('alert-success');
                    messageDiv.textContent = 'Contraseña cambiada exitosamente';
                    setTimeout(() => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                        modal.hide();
                        location.reload();
                    }, 1000);
                } else {
                    const errorData = await res.json();
                    messageDiv.classList.remove('d-none', 'alert-success');
                    messageDiv.classList.add('alert-danger');
                    messageDiv.textContent = errorData.error || 'Error al cambiar contraseña';
                    confirmModal.hide();
                    document.getElementById('changePasswordBtn').focus();
                }
            } catch (err) {
                console.error('Error cambiando contraseña:', err.message);
                const messageDiv = document.getElementById('password-message');
                messageDiv.classList.remove('d-none', 'alert-success');
                messageDiv.classList.add('alert-danger');
                messageDiv.textContent = 'Error al cambiar contraseña: ' + err.message;
                confirmModal.hide();
                document.getElementById('changePasswordBtn').focus();
            }
        };
    });

    // Asignar acción al botón Confirmar
    document.getElementById('confirmSave').addEventListener('click', () => {
        if (confirmAction) confirmAction();
    });

    // Mover foco al cerrar el modal de confirmación
    const confirmModalEl = document.getElementById('confirmModal');
    confirmModalEl.addEventListener('hidden.bs.modal', () => {
        document.getElementById('changePasswordBtn').focus();
    });
});