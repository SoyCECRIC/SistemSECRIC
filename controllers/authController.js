// C:\Users\carli\OneDrive\Documentos\Proyectos\Biblio_reservas\controllers\authController.js
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');
const SECRET = 'your_jwt_secret'; // Usa process.env.JWT_SECRET en producción

exports.verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    console.log('No se encontró token');
    return res.redirect('/');
  }
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    console.log('Usuario decodificado:', req.user);
    next();
  } catch (err) {
    console.error('Error verificando token:', err.message);
    res.redirect('/');
  }
};

exports.verifyRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    console.log('Acceso denegado para usuario:', req.user);
    return res.status(403).send('Acceso denegado');
  }
  next();
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB no está conectado');
      return res.redirect('/?error=server');
    }
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuario no encontrado:', email);
      return res.redirect('/?error=invalid');
    }
    if (user.password !== password) {
      console.log('Contraseña incorrecta para:', email, 'Enviada:', password, 'En BD:', user.password);
      return res.redirect('/?error=invalid');
    }
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    console.log('Token generado:', token);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Error en login:', err.message);
    res.redirect('/?error=server');
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
};

exports.editProfile = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB no está conectado');
      return res.status(500).json({ error: 'Error de conexión a la base de datos' });
    }
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('Usuario no encontrado:', req.user.id);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (req.file) {
      if (user.profileImage && user.profileImage !== '/img/default-profile.png') {
        const oldPath = path.join(__dirname, '..', 'public', user.profileImage);
        fs.unlink(oldPath, (err) => {
          if (err) console.error('Error borrando foto anterior:', err.message);
          else console.log('Foto anterior borrada:', user.profileImage);
        });
      }
      user.profileImage = `/img/${req.file.filename}`;
    }

    await user.save();
    res.json({ name: user.name, email: user.email, profileImage: user.profileImage });
  } catch (err) {
    console.error('Error actualizando perfil:', err.message);
    res.status(500).json({ error: 'Error actualizando perfil: ' + err.message });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  try {
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB no está conectado');
      return res.status(500).json({ error: 'Error de conexión a la base de datos' });
    }
    if (!req.user || !req.user.id) {
      console.error('ID de usuario no definido:', req.user);
      return res.status(401).json({ error: 'Sesión inválida' });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('Usuario no encontrado:', req.user.id);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log('Contraseña en BD:', user.password);
    console.log('Contraseña enviada:', currentPassword);

    if (typeof user.password !== 'string' || typeof currentPassword !== 'string') {
      console.error('Tipo de contraseña inválido:', { dbPassword: typeof user.password, sentPassword: typeof currentPassword });
      return res.status(400).json({ error: 'Formato de contraseña inválido' });
    }

    if (user.password !== currentPassword) {
      console.log('Contraseña actual incorrecta. Enviada:', currentPassword, 'En BD:', user.password);
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    if (newPassword !== confirmNewPassword) {
      console.log('Las nuevas contraseñas no coinciden');
      return res.status(400).json({ error: 'Las nuevas contraseñas no coinciden' });
    }

    user.password = newPassword;
    await user.save();
    console.log('Contraseña cambiada exitosamente para:', user.email);
    res.json({ message: 'Contraseña cambiada exitosamente' });
  } catch (err) {
    console.error('Error cambiando contraseña:', err.message);
    res.status(500).json({ error: 'Error cambiando contraseña: ' + err.message });
  }
};