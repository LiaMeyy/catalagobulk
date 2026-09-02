import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import redis from './config/redis.js';
import initSocket from './sockets/index.js';

async function startServer() {
  try {
    await connectDB();
    await redis.ping();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(env.PORT, () => {
      console.log(`Servidor corriendo en puerto ${env.PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
}

startServer();
