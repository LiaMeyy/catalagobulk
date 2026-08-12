const mongoose = require('mongoose');
const { env } = require('./env');

async function connectDB() {
  try {
    await mongoose.connect(env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB conectado');
    return mongoose.connection;
  } catch (error) {
    console.error('Error conectando a MongoDB:', error.message);
    throw error;
  }
}

module.exports = { connectDB };
