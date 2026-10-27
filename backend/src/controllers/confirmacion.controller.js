import { confirmarReserva } from '../services/confirmacion.service.js';

const USUARIO_DEMO_ID = 1;

export async function confirmar(req, res) {
  try {
    const resultado = await confirmarReserva(USUARIO_DEMO_ID, req.body);
    return res.status(200).json(resultado);
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status === 500) {
      console.error('Error al confirmar la reserva:', error);
    }
    return res.status(status).json({
      mensaje: status === 500
        ? 'No se pudo confirmar la reserva. Intenta nuevamente.'
        : error.message,
    });
  }
}
