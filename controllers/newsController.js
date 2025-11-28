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
// createNews (retorna news en lugar de res.json)
exports.createNews = async (req) => {  // Sin 'res' como parámetro
    try {
        const { title, summary, content, duration, durationType, mediaUrl, mediaType } = req.body;

        // Validaciones básicas
        if (!title || !summary || !content) {
            throw new Error('Título, resumen y contenido son requeridos');
        }

        // Calcular fecha de expiración
        const expiresAt = calculateExpiryDate(duration, durationType);

        const news = new News({
            title: title.trim(),
            summary: summary.trim(),
            content: content.trim(),
            mediaUrl: mediaUrl || null,
            mediaType: mediaType || null,
            expiresAt,
            author: req.user.id
        });

        await news.save();
        console.log('Noticia creada con ID:', news._id);
        return news;  // ← RETORNA el objeto news para la ruta
    } catch (err) {
        console.error('Error creando noticia:', err);
        throw err;  // Lanza error para que la ruta lo capture
    }
};

// editNews
// editNews (corregida: cálculo completo para todos los tipos de duración)
exports.editNews = async (req, res) => {
    try {
        const newsId = req.params.id;
        const updates = { ...req.body };

        // Recalcular expiresAt si cambian duración (usa función completa para todos los tipos)
        if (updates.duration && updates.durationType) {
            const expiresAt = calculateExpiryDate(updates.duration, updates.durationType);
            updates.expiresAt = expiresAt;
            delete updates.duration;
            delete updates.durationType;
        }

        const news = await News.findByIdAndUpdate(newsId, updates, { new: true });
        if (!news) return res.status(404).json({ error: 'Noticia no encontrada' });

        res.json({ message: 'Noticia actualizada exitosamente' });
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

exports.getAllNews = async (req, res) => {
    try {
        const news = await News.find().sort({ createdAt: -1 });
        res.json(news);
    } catch (err) {
        console.error('Error obteniendo todas las noticias:', err);
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