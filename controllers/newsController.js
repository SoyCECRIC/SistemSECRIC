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

// Crear noticia
exports.createNews = async (req, res) => {
    try {
        const { title, summary, content, duration, durationType } = req.body;
        const author = req.user.id;
        const expiresAt = calculateExpiryDate(duration, durationType);

        // Validaciones
        if (!title || !summary || !content) {
            return res.status(400).json({ error: 'Título, resumen y contenido son requeridos' });
        }

        const newsData = {
            title,
            summary,
            content,
            author,
            expiresAt
        };

        // Manejar media si se subió (convertir a base64)
        if (req.file) {
            const imageBuffer = req.file.buffer;
            const base64Media = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
            newsData.mediaUrl = base64Media;
            newsData.mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
        }

        const news = new News(newsData);
        await news.save();

        res.status(201).json({ message: 'Noticia creada exitosamente', news });
    } catch (err) {
        console.error('Error creando noticia:', err);
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

// Editar noticia
exports.editNews = async (req, res) => {
    try {
        const { title, summary, content, duration, durationType } = req.body;
        const expiresAt = calculateExpiryDate(duration, durationType);

        // Validaciones
        if (!title || !summary || !content) {
            return res.status(400).json({ error: 'Título, resumen y contenido son requeridos' });
        }

        const updateData = {
            title,
            summary,
            content,
            expiresAt
        };

        // Si hay nuevo media, actualizar a base64 (no eliminar locales)
        if (req.file) {
            const imageBuffer = req.file.buffer;
            const base64Media = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
            updateData.mediaUrl = base64Media;
            updateData.mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
        }

        const news = await News.findByIdAndUpdate(req.params.id, updateData, { new: true })
            .populate('author', 'name');

        res.json(news);
    } catch (err) {
        console.error('Error editando noticia:', err);
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