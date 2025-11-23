const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const routes = require('./routes/index');

const app = express();

connectDB();

// Middleware para parsear JSON y formularios
app.use(express.json()); // JSON
app.use(express.urlencoded({ extended: true })); // Formularios
app.use(cookieParser());

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/', routes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
