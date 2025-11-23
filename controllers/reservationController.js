const Reservation = require('../models/Reservation');
const User = require('../models/User');

// Crear reserva (solo admin/superadmin)
exports.createReservation = async (req, res) => {
    try {
        const { teacherId, groupGrade, date, entryTime, exitTime, motive } = req.body;
        const userId = req.user.id;

        // Validar datos
        if (!teacherId || !groupGrade || !date || !entryTime || !exitTime || !motive) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        // Validar que el docente exista
        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.role !== 'teacher') {
            return res.status(400).json({ error: 'Docente no válido' });
        }

        // Validar hora de entrada < hora de salida
        if (entryTime >= exitTime) {
            return res.status(400).json({ error: 'La hora de entrada debe ser anterior a la hora de salida' });
        }

        // Validar fecha no anterior a hoy
        const today = new Date().toISOString().split('T')[0];
        if (date < today) {
            return res.status(400).json({ error: 'La fecha no puede ser anterior a hoy' });
        }

        // Validar horarios permitidos
        const entryTimes = ["07:30", "08:15", "09:00", "09:45", "10:30", "11:15", "12:00", "12:45", "13:30"];
        const exitTimes = ["08:15", "09:00", "09:45", "10:30", "11:15", "12:00", "12:45", "13:30", "14:15"];
        if (!entryTimes.includes(entryTime) || !exitTimes.includes(exitTime)) {
            return res.status(400).json({ error: 'Horario no válido' });
        }

        // Verificar superposición con reservas existentes
        const existing = await Reservation.find({
            date: new Date(date),
        });
        for (let ex of existing) {
            if (entryTime < ex.exitTime && exitTime > ex.entryTime) {
                return res.status(400).json({ error: 'El horario seleccionado se superpone con una reserva existente' });
            }
        }

        // Crear reserva
        const newReservation = new Reservation({
            teacherId,
            groupGrade,
            date: new Date(date),
            entryTime,
            exitTime,
            motive,
            createdBy: userId,
            status: 'pending'
        });

        await newReservation.save();
        res.status(201).json({ message: 'Reserva creada exitosamente' });
    } catch (err) {
        console.error('Error creando reserva:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Ver reservas (para admin/superadmin: todas; para teacher: solo suyas)
exports.getReservations = async (req, res) => {
    try {
        let reservations;
        if (req.user.role === 'teacher') {
            reservations = await Reservation.find({ teacherId: req.user.id }).populate('teacherId', 'name');
        } else {
            reservations = await Reservation.find().populate('teacherId', 'name');
        }
        res.json(reservations);
    } catch (err) {
        console.error('Error obteniendo reservas:', err);
        res.status(500).json({ error: 'Error obteniendo reservas' });
    }
};

// Obtener reservas por fecha
exports.getReservationsByDate = async (req, res) => {
    const { date } = req.query;
    try {
        const reservations = await Reservation.find({ date: new Date(date) }).select('entryTime exitTime');
        res.json(reservations);
    } catch (err) {
        console.error('Error obteniendo reservas por fecha:', err);
        res.status(500).json({ error: 'Error obteniendo reservas' });
    }
};

// Editar reserva (admin/superadmin)
exports.editReservation = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
        await Reservation.findByIdAndUpdate(id, updates);
        res.status(200).json({ message: 'Reserva actualizada exitosamente' });
    } catch (err) {
        console.error('Error editando reserva:', err);
        res.status(500).json({ error: 'Error editando reserva' });
    }
};

// Cancelar reserva (admin/superadmin)
exports.cancelReservation = async (req, res) => {
    const { id } = req.params;
    try {
        const reservation = await Reservation.findById(id);
        if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' });
        if (reservation.status !== 'pending' && reservation.status !== 'confirmed') {
            return res.status(400).json({ error: 'La reserva ya está cancelada o finalizada' });
        }
        reservation.status = 'cancelled';
        await reservation.save();
        res.status(200).json({ message: 'Reserva cancelada exitosamente' });
    } catch (err) {
        console.error('Error cancelando reserva:', err);
        res.status(500).json({ error: 'Error cancelando reserva' });
    }
};

// Confirmar término (admin/superadmin o teacher)
exports.confirmEnd = async (req, res) => {
    const { id } = req.params;
    try {
        const reservation = await Reservation.findById(id);
        if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' });
        if (reservation.status !== 'pending' && reservation.status !== 'confirmed') {
            return res.status(400).json({ error: 'La reserva ya está cancelada o finalizada' });
        }
        if (req.user.role === 'teacher' && reservation.teacherId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }
        reservation.status = 'ended';
        await reservation.save();
        res.status(200).json({ message: 'Reserva finalizada exitosamente' });
    } catch (err) {
        console.error('Error confirmando término:', err);
        res.status(500).json({ error: 'Error confirmando término' });
    }
};

// Editar usuario
exports.editUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, password, role } = req.body;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ error: 'No autorizado para editar superadmins' });
        }
        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = await bcrypt.hash(password, 10);
        if (role && req.user.role === 'superadmin') user.role = role; // Solo superadmin puede cambiar roles
        await user.save();
        res.status(200).json({ message: 'Usuario actualizado exitosamente' });
    } catch (err) {
        console.error('Error editando usuario:', err);
        res.status(500).json({ error: 'Error editando usuario' });
    }
};

// Eliminar usuario
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ error: 'No autorizado para eliminar superadmins' });
        }
        await User.findByIdAndDelete(id);
        res.status(200).json({ message: 'Usuario eliminado exitosamente' });
    } catch (err) {
        console.error('Error eliminando usuario:', err);
        res.status(500).json({ error: 'Error eliminando usuario' });
    }
};