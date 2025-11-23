const User = require('../models/User');

// Obtener usuarios
exports.getUsers = async (req, res) => {
    try {
        let users;
        if (req.user.role === 'superadmin') {
            users = await User.find({}, 'name email role profileImage');
        } else {
            users = await User.find({ role: { $ne: 'superadmin' } }, 'name email role profileImage');
        }
        res.json(users);
    } catch (err) {
        console.error('Error obteniendo usuarios:', err);
        res.status(500).json({ error: 'Error obteniendo usuarios' });
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
        if (password) user.password = password; // Almacenar contraseña como texto plano
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
        if (req.user.id === id) {
            return res.status(403).json({ error: 'No puedes eliminar tu propia cuenta' });
        }
        await User.findByIdAndDelete(id);
        res.status(200).json({ message: 'Usuario eliminado exitosamente' });
    } catch (err) {
        console.error('Error eliminando usuario:', err);
        res.status(500).json({ error: 'Error eliminando usuario' });
    }
};