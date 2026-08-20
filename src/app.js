import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from './middlewares/rateLimit.js';
import errorHandler from './middlewares/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import categoriaRoutes from './modules/categorias/categoria.routes.js';
import productoRoutes from './modules/productos/producto.routes.js';
import proveedorRoutes from './modules/proveedores/proveedor.routes.js';
import usuarioRoutes from './modules/usuarios/usuario.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimit);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'API catalogobulk funcionando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/usuarios', usuarioRoutes);
// app.use('/api/imports', importRoutes); // TODO: activar cuando llegue la fase de BullMQ

app.use(errorHandler);

export default app;