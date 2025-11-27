const News = require('../models/News');
const User = require('../models/User');

// Función auxiliar para calcular fecha de expiración (de tu código)
function calculateExpiryDate(duration, durationType) {
    const now = new Date();
    const durationNum = parseInt(duration);

    switch (durationType) {
        case 'minutes':
            return new Date(now.getTime() + durationNum * 60 * 1000);
        case 'hours':
            return new Date(now.getTime() + durationNum * 60 * 60 * 1000);
        case 'days':
            return new Date(now.getTime() + durationNum * 24 * 60 * 60 * 1000);
        case 'weeks':
            return new Date(now.getTime() + durationNum * 7 * 24 * 60 * 60 * 1000);
        case 'months':
            const monthDate = new Date(now);
            monthDate.setMonth(monthDate.getMonth() + durationNum);
            return monthDate;
        case 'years':
            const yearDate = new Date(now);
            yearDate.setFullYear(yearDate.getFullYear() + durationNum);
            return yearDate;
        default:
            return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Por defecto 1 día
    }
}

// createNews
exports.createNews = async (req, res) => {
    try {
        const { title, summary, content, duration, durationType, mediaUrl, mediaType } = req.body;

        // Calcular fecha de expiración
        const expiresAt = new Date();
        const value = parseInt(duration) || 7;
        if (durationType === 'minutes') expiresAt.setMinutes(expiresAt.getMinutes() + value);
        else if (durationType === 'hours') expiresAt.setHours(expiresAt.getHours() + value);
        else if (durationType === 'days') expiresAt.setDate(expiresAt.getDate() + value);
        else if (durationType === 'weeks') expiresAt.setDate(expiresAt.getDate() + value * 7);
        else if (durationType === 'months') expiresAt.setMonth(expiresAt.getMonth() + value);
        else if (durationType === 'years') expiresAt.setFullYear(expiresAt.getFullYear() + value);

        const news = new News({
            title,
            summary,
            content,
            mediaUrl: mediaUrl || null,
            mediaType: mediaType || null,
            expiresAt,
            createdBy: req.user.id
        });

        await news.save();
        res.json({ message: 'Noticia creada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// editNews
exports.editNews = async (req, res) => {
    try {
        const newsId = req.params.id;
        const updates = { ...req.body };

        // Recalcular expiresAt si cambian duración
        if (updates.duration && updates.durationType) {
            const value = parseInt(updates.duration);
            const expiresAt = new Date();
            // misma lógica que arriba...
            if (updates.durationType === 'days') expiresAt.setDate(expiresAt.getDate() + value);
            // ... resto igual
            updates.expiresAt = expiresAt;
            delete updates.duration;
            delete updates.durationType;
        }

        const news = await News.findByIdAndUpdate(newsId, updates, { new: true });
        if (!news) return res.status(404).json({ error: 'Noticia no encontrada' });

        res.json({ message: 'Noticia actualizada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Obtener noticias activas (para dashboard)
exports.getActiveNews = async (req, res) => {
    try {
        const now = new Date();
        const news = await News.find({ expiresAt: { $gt: now } })
            .populate('author', 'name')
            .sort({ createdAt: -1 })
            .limit(20); // Límite para feed

        res.json(news);
    } catch (err) {
        console.error('Error obteniendo noticias activas:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Obtener todas las noticias (para admin)
exports.getAllNews = async (req, res) => {
    try {
        const news = await News.find()
            .populate('author', 'name')
            .sort({ createdAt: -1 });

        res.json(news);
    } catch (err) {
        console.error('Error obteniendo noticias:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Obtener noticia por ID (para editar)
exports.getNewsById = async (req, res) => {
    try {
        const news = await News.findById(req.params.id).populate('author', 'name');
        if (!news) {
            return res.status(404).json({ error: 'Noticia no encontrada' });
        }
        res.json(news);
    } catch (err) {
        console.error('Error obteniendo noticia:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Eliminar noticia
exports.deleteNews = async (req, res) => {
    try {
        const news = await News.findById(req.params.id);
        if (!news) {
            return res.status(404).json({ error: 'Noticia no encontrada' });
        }

        // No hay media local para eliminar (es base64 en BD)

        await News.findByIdAndDelete(req.params.id);
        res.json({ message: 'Noticia eliminada exitosamente' });
    } catch (err) {
        console.error('Error eliminando noticia:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Limpiar noticias expiradas (versión automatizada)
exports.cleanExpiredNews = async () => {
  try {
    const now = new Date();
    const expiredNews = await News.find({ expiresAt: { $lt: now } });
    
    let deletedCount = 0;
    for (const news of expiredNews) {
      // No hay media local para eliminar (es base64 en BD)
      await News.findByIdAndDelete(news._id);
      deletedCount++;
    }

    console.log(`🧹 Limpieza automática: Eliminadas ${deletedCount} noticias expiradas.`);
    return deletedCount;
  } catch (err) {
    console.error('Error en limpieza automática de noticias:', err);
    return 0;
  }
};

// Versión para ruta manual (con res, si la quieres mantener)
exports.cleanExpiredNewsManual = async (req, res) => {
  const deleted = await exports.cleanExpiredNews();
  res.json({ message: `Eliminadas ${deleted} noticias expiradas` });
};