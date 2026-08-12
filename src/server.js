const app = require('./app');
const { env } = require('./config/env');
const { connectDB } = require('./config/db');

async function startServer() {
  try {
    await connectDB();

    app.listen(env.PORT, () => {
      console.log(`Servidor corriendo en puerto ${env.PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
}

startServer();