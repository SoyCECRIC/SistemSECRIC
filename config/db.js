const mongoose = require('mongoose');
require('dotenv').config({ path: './.env', debug: true }); // Especificar ruta explícita

const connectDB = async () => {
  try {
    console.log('MONGODB_URI:', process.env.MONGODB_URI); // Depuración
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB conectado');
  } catch (err) {
    console.error('Error conectando a MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;