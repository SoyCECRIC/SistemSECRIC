const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const routes = require('./routes/index');
const cron = require('node-cron');
const app = express();

connectDB();

// Middleware para parsear JSON y formularios
app.use(express.json()); // JSON
app.use(express.urlencoded({ extended: true })); // Formularios
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));           // ← antes era 1mb
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/', routes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

cron.schedule('0 * * * *', async () => {
  await require('./controllers/newsController').cleanExpiredNews();
}, {
  scheduled: true,
  timezone: 'America/Mexico_City' // Ajusta a tu zona horaria
});

console.log('🕐 Cron job iniciado: Limpieza de noticias expiradas cada hora.');