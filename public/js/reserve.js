document.addEventListener('DOMContentLoaded', () => {
            loadTeachersSelect();
            populateTimes();

            // Actualizar horarios al cambiar la fecha o la hora de entrada
            document.getElementById('date').addEventListener('change', updateAvailableTimes);
            document.getElementById('entry-time').addEventListener('change', updateExitTimes);
        });

        const allTimes = ["07:30", "08:15", "09:00", "09:45", "10:30", "11:15", "12:00", "12:45", "13:30", "14:15"];
        const entryTimes = ["07:30", "08:15", "09:00", "09:45", "10:30", "11:15", "12:00", "12:45", "13:30"];
        const exitTimes = ["08:15", "09:00", "09:45", "10:30", "11:15", "12:00", "12:45", "13:30", "14:15"];

        function populateTimes() {
            const entrySelect = document.getElementById('entry-time');
            entrySelect.innerHTML = '<option value="">Selecciona hora de entrada</option>';
            entryTimes.forEach(time => {
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                entrySelect.appendChild(option);
            });
            updateExitTimes();
        }

        async function updateAvailableTimes() {
            const date = document.getElementById('date').value;
            const entrySelect = document.getElementById('entry-time');
            const exitSelect = document.getElementById('exit-time');
            entrySelect.innerHTML = '<option value="">Selecciona hora de entrada</option>';
            exitSelect.innerHTML = '<option value="">Selecciona hora de salida</option>';

            let reservedTimes = [];
            if (date) {
                try {
                    const res = await fetch(`/reservations/date?date=${date}`, { credentials: 'include' });
                    if (!res.ok) throw new Error('Error al obtener reservas');
                    const reservations = await res.json();
                    reservedTimes = reservations.map(res => ({
                        entry: res.entryTime,
                        exit: res.exitTime
                    }));
                } catch (err) {
                    console.error('Error obteniendo reservas:', err);
                }
            }

            // Filtrar horarios disponibles para entrada
            entryTimes.forEach(time => {
                let isReserved = reservedTimes.some(res => time >= res.entry && time < res.exit);
                if (!isReserved) {
                    const option = document.createElement('option');
                    option.value = time;
                    option.textContent = time;
                    entrySelect.appendChild(option);
                }
            });

            // Actualizar horas de salida según la entrada seleccionada
            updateExitTimes();
        }

        function updateExitTimes() {
            const entryTime = document.getElementById('entry-time').value;
            const exitSelect = document.getElementById('exit-time');
            const date = document.getElementById('date').value;
            exitSelect.innerHTML = '<option value="">Selecciona hora de salida</option>';

            let reservedTimes = [];
            if (date) {
                try {
                    fetch(`/reservations/date?date=${date}`, { credentials: 'include' })
                        .then(res => res.json())
                        .then(reservations => {
                            reservedTimes = reservations.map(res => ({
                                entry: res.entryTime,
                                exit: res.exitTime
                            }));
                            populateExitTimes(entryTime, reservedTimes);
                        })
                        .catch(err => {
                            console.error('Error obteniendo reservas:', err);
                            populateExitTimes(entryTime, []);
                        });
                } catch (err) {
                    console.error('Error obteniendo reservas:', err);
                    populateExitTimes(entryTime, []);
                }
            } else {
                populateExitTimes(entryTime, []);
            }
        }

        function populateExitTimes(entryTime, reservedTimes) {
            const exitSelect = document.getElementById('exit-time');
            exitSelect.innerHTML = '<option value="">Selecciona hora de salida</option>';

            // Filtrar horas de salida posteriores a la hora de entrada
            const entryIndex = allTimes.indexOf(entryTime);
            const availableExitTimes = entryTime ? exitTimes.filter((time, index) => allTimes.indexOf(time) > entryIndex) : exitTimes;

            availableExitTimes.forEach(time => {
                let isReserved = reservedTimes.some(res => time > res.entry && time <= res.exit);
                if (!isReserved) {
                    const option = document.createElement('option');
                    option.value = time;
                    option.textContent = time;
                    exitSelect.appendChild(option);
                }
            });
        }

        // Poblar select de docentes
        async function loadTeachersSelect() {
            try {
                const res = await fetch('/teachers', { credentials: 'include' });
                if (!res.ok) throw new Error(`Error al obtener docentes: ${res.status}`);
                const teachers = await res.json();
                const select = document.getElementById('teacher');
                select.innerHTML = '<option value="">Selecciona un docente</option>';
                teachers.forEach(teacher => {
                    const option = document.createElement('option');
                    option.value = teacher._id;
                    option.textContent = teacher.name;
                    select.appendChild(option);
                });
            } catch (err) {
                console.error('Error cargando docentes:', err);
                const select = document.getElementById('teacher');
                select.innerHTML = '<option value="">Error al cargar docentes</option>';
            }
        }

        // Guardar reserva
        document.getElementById('reservationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            // Convertir FormData a objeto
            const body = {};
            formData.forEach((value, key) => {
                body[key] = value;
            });

            const message = document.getElementById('reservation-message');

            // Validaciones
            const entryTime = body.entryTime;
            const exitTime = body.exitTime;
            const date = body.date;

            if (entryTime >= exitTime) {
                message.classList.remove('alert-success', 'd-none');
                message.classList.add('alert-danger');
                message.textContent = 'La hora de entrada debe ser anterior a la hora de salida.';
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            if (date < today) {
                message.classList.remove('alert-success', 'd-none');
                message.classList.add('alert-danger');
                message.textContent = 'La fecha no puede ser anterior a hoy.';
                return;
            }

            try {
                const res = await fetch('/reserve/create', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ error: 'Error del servidor' }));
                    throw new Error(errorData.error || `Error: ${res.status}`);
                }

                const data = await res.json();
                message.classList.remove('alert-danger', 'd-none');
                message.classList.add('alert-success');
                message.textContent = data.message || 'Reserva creada exitosamente';
                e.target.reset();
                setTimeout(() => { window.location.href = '/reservations/manage'; }, 2000);
            } catch (err) {
                console.error('Error guardando reserva:', err);
                message.classList.remove('alert-success', 'd-none');
                message.classList.add('alert-danger');
                message.textContent = err.message || 'Error del servidor. Intenta de nuevo más tarde.';
            }
        });