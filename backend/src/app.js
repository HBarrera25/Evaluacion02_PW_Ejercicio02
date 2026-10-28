import express from 'express';
import cors from 'cors';
import menuRoutes from './routes/menu.routes.js';
import reservaRoutes from './routes/reserva.routes.js';
import authRoutes, { autenticar, verificarOrigen } from './routes/auth.routes.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(verificarOrigen);
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/reserva', autenticar, reservaRoutes);
app.use((error, req, res, next) => {
  console.error('Error de solicitud:', error.message);
  const status = error.type === 'entity.parse.failed' ? 400 : 500;
  res.status(status).json({ mensaje: status === 400 ? 'El cuerpo JSON no es válido.' : 'No se pudo completar la solicitud.' });
});
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

export default app;
