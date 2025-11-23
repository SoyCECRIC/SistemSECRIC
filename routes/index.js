const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const reservationController = require('../controllers/reservationController');
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const User = require('../models/User');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración de Multer para subir imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/img/');
    },
    filename: (req, file, cb) => {
        if (!file || !file.originalname) {
            return cb(new Error('Archivo inválido o no proporcionado'));
        }
        const userId = req.user ? req.user.id : 'unknown';
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `profile-${userId}-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file || !file.originalname) {
            return cb(new Error('No se proporcionó ningún archivo'));
        }
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes JPG o PNG'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 }
}).single('profileImage');

// Middleware para manejar errores de Multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'El archivo es demasiado grande. El tamaño máximo permitido es 10 MB.' });
    }
    if (err) {
        return res.status(400).json({ error: err.message || 'Error al procesar el archivo' });
    }
    next();
};

// Configuración simple de Nodemailer con Mailtrap
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Esta debe ser la contraseña de aplicación
    }
});

// Verificar configuración
transporter.verify((error, success) => {
    if (error) {
        console.error('Error en la configuración de Nodemailer:', error.message);
    } else {
        console.log('Configuración de Gmail verificada correctamente');
    }
});

// Login
router.get('/', (req, res) => res.sendFile('views/common/login.html', { root: __dirname + '/../' }));
router.post('/login', authController.login);

// Ruta para recuperar contraseña
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'El correo es requerido' });
    }

    // Validar formato del email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Por favor ingresa un correo válido' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'No se encontró un usuario con ese correo electrónico' });
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Credenciales de correo no definidas en .env');
            return res.status(500).json({ error: 'Configuración de correo no disponible' });
        }

        const mailOptions = {
            from: {
                name: 'Sistema Cristóbal Colón',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: '🔐 Recuperación de contraseña - Sistema Cristóbal Colón',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">
                            🔐 Recuperación de Contraseña
                        </h2>
                        
                        <p style="font-size: 16px; color: #34495e; line-height: 1.6;">
                            Hola <strong>${user.name}</strong>,
                        </p>
                        
                        <p style="font-size: 16px; color: #34495e; line-height: 1.6;">
                            Has solicitado recuperar tu contraseña para el sistema Cristóbal Colón.
                        </p>
                        
                        <div style="background-color: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
                            <p style="font-size: 14px; color: #7f8c8d; margin: 0 0 10px 0;">Tu contraseña actual es:</p>
                            <p style="font-size: 24px; font-weight: bold; color: #e74c3c; margin: 0; font-family: monospace;">
                                ${user.password}
                            </p>
                        </div>
                        
                        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                            <p style="font-size: 14px; color: #856404; margin: 0;">
                                ⚠️ <strong>Por seguridad:</strong> Te recomendamos cambiar tu contraseña después de iniciar sesión.
                            </p>
                        </div>
                        
                        <p style="font-size: 14px; color: #7f8c8d; text-align: center; margin-top: 30px;">
                            Si no solicitaste este correo, puedes ignorarlo de manera segura.
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
                        
                        <p style="font-size: 12px; color: #95a5a6; text-align: center; margin: 0;">
                            Sistema de Reservas Cristóbal Colón<br>
                            Este es un correo automático, no respondas a este mensaje.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        
        console.log(`Correo de recuperación enviado a: ${email}`);
        res.status(200).json({ 
            message: 'Se ha enviado un correo con tu contraseña a la dirección proporcionada' 
        });

    } catch (err) {
        console.error('Error enviando correo de recuperación:', err);
        
        if (err.code === 'EAUTH') {
            res.status(500).json({ 
                error: 'Error de autenticación del correo. Verifica la configuración.' 
            });
        } else if (err.code === 'ECONNECTION') {
            res.status(500).json({ 
                error: 'No se pudo conectar al servidor de correo. Intenta más tarde.' 
            });
        } else {
            res.status(500).json({ 
                error: 'Error del servidor al enviar el correo. Intenta más tarde.' 
            });
        }
    }
});

// Dashboard
router.get('/dashboard', authController.verifyToken, (req, res) => {
    if (req.user.role === 'teacher') {
        res.sendFile('views/admin/dashboard.html', { root: __dirname + '/../' });
    } else {
        res.sendFile('views/admin/dashboard.html', { root: __dirname + '/../' });
    }
});

// Editar perfil
router.get('/profile/edit', authController.verifyToken, (req, res) => res.sendFile('views/common/edit-profile.html', { root: __dirname + '/../' }));
router.post('/profile/update', authController.verifyToken, upload, handleMulterError, async (req, res) => {
    try {
        console.log('Procesando /profile/update');
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Actualizar nombre y email
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        // Si hay nueva imagen, convertir a base64
        if (req.file) {
            const fs = require('fs').promises;
            const imagePath = req.file.path;
            
            try {
                // Leer la imagen y convertir a base64
                const imageBuffer = await fs.readFile(imagePath);
                const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
                
                // Guardar en MongoDB
                user.profileImage = base64Image;
                
                // Eliminar archivo temporal del servidor
                await fs.unlink(imagePath);
                console.log('Imagen convertida a base64 y archivo temporal eliminado');
                
            } catch (err) {
                console.error('Error procesando imagen:', err);
                return res.status(500).json({ error: 'Error procesando la imagen' });
            }
        }

        await user.save();
        
        res.json({
            message: 'Perfil actualizado exitosamente',
            profileImage: user.profileImage // Enviamos el base64 completo
        });

    } catch (err) {
        console.error('Error actualizando perfil:', err.message);
        res.status(500).json({ error: err.message || 'Error del servidor' });
    }
});
router.post('/profile/change-password', authController.verifyToken, authController.changePassword);

// Logout
router.get('/logout', authController.logout);

// Reservas (admin/superadmin)
router.get('/reserve', authController.verifyToken, authController.verifyRole(['admin', 'superadmin']), (req, res) => res.sendFile('views/admin/reserve.html', { root: __dirname + '/../' }));
router.post('/reserve/create', authController.verifyToken, authController.verifyRole(['admin', 'superadmin']), reservationController.createReservation);

router.get('/reservations/manage', authController.verifyToken, authController.verifyRole(['admin', 'superadmin']), (req, res) => res.sendFile('views/admin/manage-reservations.html', { root: __dirname + '/../' }));
router.get('/reservations', authController.verifyToken, reservationController.getReservations);
router.get('/reservations/date', authController.verifyToken, reservationController.getReservationsByDate);
router.get('/reservations/edit/:id', authController.verifyToken, authController.verifyRole(['admin', 'superadmin']), async (req, res) => {
    try {
        const reservation = await require('../models/Reservation').findById(req.params.id).populate('teacherId');
        res.json(reservation);
    } catch (err) {
        res.status(500).send('Error obteniendo reserva');
    }
});
router.post('/reservations/edit/:id', authController.verifyToken, authController.verifyRole(['admin', 'superadmin']), reservationController.editReservation);
router.post('/reservations/cancel/:id', authController.verifyToken, authController.verifyRole(['admin', 'superadmin']), reservationController.cancelReservation);
router.post('/reservations/end/:id', authController.verifyToken, reservationController.confirmEnd);

// Mis reservas (teacher)
router.get('/my-reservations', authController.verifyToken, authController.verifyRole(['teacher','superadmin', 'admin']), (req, res) => res.sendFile('views/teacher/my-reservations.html', { root: __dirname + '/../' }));

// Administrar usuarios (superadmin)
router.get('/users/manage', authController.verifyToken, authController.verifyRole(['superadmin', 'admin']), (req, res) => res.sendFile('views/super-admin/manage-users.html', { root: __dirname + '/../' }));
router.get('/users', authController.verifyToken, authController.verifyRole(['superadmin', 'admin']), userController.getUsers);
router.post('/users/edit/:id', authController.verifyToken, authController.verifyRole(['superadmin', 'admin']), userController.editUser);
router.post('/users/delete/:id', authController.verifyToken, authController.verifyRole(['superadmin', 'admin']), userController.deleteUser);

// Obtener datos del usuario
router.get('/user', authController.verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id, 'name email profileImage role');
        
        if (!user) {
            console.error('Usuario no encontrado para ID:', req.user.id);
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        console.log('Usuario encontrado:', user.name, 'Tiene imagen:', !!user.profileImage);

        res.json({
            name: user.name,
            email: user.email,
            profileImage: user.profileImage || null, // Base64 completo o null
            role: user.role
        });

    } catch (err) {
        console.error('Error obteniendo usuario:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Editar usuario (para superadmin)
router.get('/users/edit/:id', authController.verifyToken, authController.verifyRole(['superadmin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id, 'name email role profileImage');
        res.json(user);
    } catch (err) {
        res.status(500).send('Error obteniendo usuario');
    }
});

// Obtener docentes
router.get('/teachers', authController.verifyToken, authController.verifyRole(['admin', 'superadmin']), async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' }, '_id name');
        res.json(teachers);
    } catch (err) {
        console.error('Error obteniendo docentes:', err);
        res.status(500).json({ error: 'Error obteniendo docentes' });
    }
});

// Ruta para crear un nuevo usuario
router.post('/users/create', authController.verifyToken, authController.verifyRole(['admin', 'superadmin']), async (req, res) => {
    console.log('Recibiendo solicitud POST /users/create:', req.body);
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        console.log('Faltan campos requeridos:', { name, email, password, role });
        return res.status(400).json({ error: 'Todos los campos (nombre, correo, contraseña, rol) son requeridos' });
    }

    if (!['teacher', 'admin', 'superadmin'].includes(role)) {
        console.log('Rol inválido:', role);
        return res.status(400).json({ error: 'Rol inválido. Debe ser teacher, admin o superadmin' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('Correo ya registrado:', email);
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Correo inválido:', email);
            return res.status(400).json({ error: 'El correo no tiene un formato válido' });
        }

        if (password.length < 6) {
            console.log('Contraseña demasiado corta:', password.length);
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const newUser = new User({
            name,
            email,
            password,
            role,
            profileImage: null
        });

        await newUser.save();
        console.log('Usuario creado exitosamente:', { name, email, role });
        res.status(201).json({ message: 'Usuario creado exitosamente' });
    } catch (err) {
        console.error('Error creando usuario:', err.message);
        res.status(500).json({ error: 'Error del servidor al crear el usuario' });
    }
});

module.exports = router;