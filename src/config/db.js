import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  try {
    await mongoose.connect(env.DB_URI);

    console.log('MongoDB conectado');
    return mongoose.connection;
  } catch (error) {
    console.error('Error conectando a MongoDB:', error.message);
    throw error;
  }
}
